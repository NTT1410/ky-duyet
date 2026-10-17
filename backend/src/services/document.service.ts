import { prisma } from '../config/prisma';

export interface CreateDocumentInput {
  title: string;
  content: string;
  creatorId: string;
  documentTypeId: string;
  metadata?: any;
  selectedApproverId?: string;
  attachments?: Array<{ fileName: string; fileUrl: string }>;
}

export interface GetAllDocumentsFilter {
  userId?: string;
  status?: string;
  search?: string;
  typeId?: string;
  fromDate?: string;
  toDate?: string;
}

export class DocumentService {
  /**
   * 1. Tạo mới tờ trình / văn bản
   */
  static async createDocument(data: CreateDocumentInput) {
    const docType = await prisma.documentType.findUnique({
      where: { id: data.documentTypeId },
      include: {
        defaultWorkflow: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!docType) throw new Error('Loại văn bản không tồn tại');

    // Tạo văn bản
    const document = await prisma.document.create({
      data: {
        title: data.title,
        content: data.content,
        creatorId: data.creatorId,
        documentTypeId: data.documentTypeId,
        metadata: data.metadata || null,
        status: 'PENDING',
        currentStepOrder: 1,
        attachments: data.attachments && data.attachments.length > 0 ? {
          create: data.attachments.map(att => ({
            fileName: att.fileName,
            fileUrl: att.fileUrl
          }))
        } : undefined
      },
      include: {
        attachments: true
      }
    });

    // Tạo lượt duyệt đầu tiên
    if (data.selectedApproverId) {
      // 1. Chỉ định đích danh
      await prisma.approval.create({
        data: {
          documentId: document.id,
          approverId: data.selectedApproverId,
          action: 'PENDING'
        }
      });
    } else if (docType.defaultWorkflow && docType.defaultWorkflow.steps.length > 0) {
      // 2. Theo quy trình mặc định (Bước 1)
      const firstStep = docType.defaultWorkflow.steps[0];
      if (firstStep && firstStep.approverReferenceId) {
        await prisma.approval.create({
          data: {
            documentId: document.id,
            approverId: firstStep.approverReferenceId,
            stepId: firstStep.id,
            action: 'PENDING'
          }
        });
      }
    }

    return document;
  }

  /**
   * 2. Lấy danh sách văn bản ĐANG CHỜ TÔI DUYỆT
   */
  static async getPendingApprovals(userId: string) {
    return prisma.approval.findMany({
      where: {
        approverId: userId,
        action: 'PENDING',
      },
      include: {
        document: {
          include: {
            creator: { select: { fullName: true, email: true } },
            documentType: { select: { name: true, code: true } },
            attachments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * 3. Thực hiện Ký / Duyệt / Từ chối (Chuẩn Multi-step Workflow Engine & Chữ ký số Viettel MySign)
   */
  static async approveDocument(params: {
    approvalId: string;
    userId: string;
    action: 'APPROVED' | 'REJECTED';
    comment?: string;
    signType?: 'INTERNAL' | 'VIETTEL_MYSIGN' | 'USB_TOKEN';
    signatureImage?: string;
    approverPhone?: string;
    tokenProvider?: string;
    tokenSerial?: string;
    tokenPin?: string;
  }) {
    const { approvalId, userId, action, comment, signType, signatureImage, approverPhone, tokenProvider, tokenSerial, tokenPin } = params;

    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        document: {
          include: {
            documentType: {
              include: {
                defaultWorkflow: {
                  include: {
                    steps: {
                      orderBy: { stepOrder: 'asc' }
                    }
                  }
                }
              }
            }
          }
        },
        step: true
      }
    });

    if (!approval || approval.approverId !== userId) {
      throw new Error('Yêu cầu không tồn tại hoặc bạn không có quyền duyệt!');
    }

    if (approval.action !== 'PENDING') {
      throw new Error('Yêu cầu này đã được xử lý trước đó!');
    }

    const approver = await prisma.user.findUnique({
      where: { id: userId },
      include: { department: true }
    });

    let certInfo: any = null;
    if (action === 'APPROVED') {
      const { ViettelSignService } = await import('./viettel-sign.service');
      if (signType === 'USB_TOKEN') {
        certInfo = await ViettelSignService.signWithUsbToken({
          approverName: approver?.fullName || 'Người duyệt',
          approverEmail: approver?.email || '',
          documentId: approval.documentId,
          documentTitle: approval.document.title,
          tokenProvider,
          tokenSerial,
          tokenPin,
        });
      } else if (signType === 'VIETTEL_MYSIGN') {
        certInfo = await ViettelSignService.signWithViettelMySign({
          approverName: approver?.fullName || 'Người duyệt',
          approverEmail: approver?.email || '',
          approverPhone,
          documentId: approval.documentId,
          documentTitle: approval.document.title
        });
      } else {
        certInfo = ViettelSignService.generateInternalSignature({
          approverName: approver?.fullName || 'Người duyệt',
          approverEmail: approver?.email || '',
          role: approver?.role || 'EMPLOYEE'
        });
      }
    }

    // Cập nhật phê duyệt hiện tại
    await prisma.approval.update({
      where: { id: approvalId },
      data: {
        action,
        comment: comment || (action === 'APPROVED' ? 'Đã phê duyệt' : 'Đã từ chối'),
        signType: signType || 'INTERNAL',
        certInfo: certInfo || undefined,
        signatureImage: signatureImage || undefined
      }
    });

    // Nếu từ chối -> dừng quy trình ngay
    if (action === 'REJECTED') {
      await prisma.document.update({
        where: { id: approval.documentId },
        data: { status: 'REJECTED' }
      });
      return { message: 'Đã từ chối văn bản thành công!', status: 'REJECTED' };
    }

    // Nếu duyệt (APPROVED): Kiểm tra xem có bước tiếp theo không
    const workflow = approval.document.documentType?.defaultWorkflow;
    const currentStepOrder = approval.document.currentStepOrder;

    if (workflow && workflow.steps && workflow.steps.length > 0) {
      // Tìm bước tiếp theo: stepOrder > currentStepOrder
      const nextStep = workflow.steps.find(s => s.stepOrder > currentStepOrder);

      if (nextStep && nextStep.approverReferenceId) {
        // Có bước tiếp theo -> Chuyển giao sang người duyệt kế tiếp
        await prisma.document.update({
          where: { id: approval.documentId },
          data: {
            currentStepOrder: nextStep.stepOrder,
            status: 'PENDING'
          }
        });

        await prisma.approval.create({
          data: {
            documentId: approval.documentId,
            approverId: nextStep.approverReferenceId,
            stepId: nextStep.id,
            action: 'PENDING'
          }
        });

        return {
          message: `Đã phê duyệt bước ${currentStepOrder}! Đã tự động chuyển tiếp sang bước ${nextStep.stepOrder}.`,
          status: 'PENDING',
          nextStepOrder: nextStep.stepOrder
        };
      }
    }

    // Nếu không còn bước nào tiếp theo (hoặc duyệt ad-hoc) -> Hoàn tất!
    await prisma.document.update({
      where: { id: approval.documentId },
      data: { status: 'COMPLETED' }
    });

    return {
      message: 'Toàn bộ quy trình phê duyệt đã hoàn tất thành công!',
      status: 'COMPLETED'
    };
  }

  /**
   * 4. Lấy chi tiết 1 văn bản (bao gồm timeline phê duyệt & file đính kèm)
   */
  static async getDocumentById(id: string) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            department: { select: { id: true, name: true } }
          }
        },
        documentType: {
          include: {
            defaultWorkflow: {
              include: {
                steps: {
                  orderBy: { stepOrder: 'asc' }
                }
              }
            }
          }
        },
        attachments: true,
        approvals: {
          orderBy: { createdAt: 'asc' },
          include: {
            approver: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                department: { select: { name: true } }
              }
            },
            step: true
          }
        }
      }
    });

    if (!document) throw new Error('Không tìm thấy văn bản');
    return document;
  }

  /**
   * 5. Lấy danh sách văn bản có hỗ trợ bộ lọc (Ngày, Trạng thái, Tìm kiếm)
   */
  static async getAllDocuments(filter: GetAllDocumentsFilter = {}) {
    const where: any = {};

    if (filter.userId) {
      where.creatorId = filter.userId;
    }

    if (filter.status && filter.status !== 'ALL') {
      where.status = filter.status;
    }

    if (filter.typeId && filter.typeId !== 'ALL') {
      where.documentTypeId = filter.typeId;
    }

    if (filter.search && filter.search.trim() !== '') {
      where.OR = [
        { title: { contains: filter.search.trim(), mode: 'insensitive' } },
        { content: { contains: filter.search.trim(), mode: 'insensitive' } }
      ];
    }

    // Lọc theo ngày tạo (hỗ trợ lọc chính xác ngày hoặc khoảng ngày)
    if (filter.fromDate || filter.toDate) {
      where.createdAt = {};
      if (filter.fromDate) {
        const start = new Date(filter.fromDate);
        start.setHours(0, 0, 0, 0);
        where.createdAt.gte = start;
      }
      if (filter.toDate) {
        const end = new Date(filter.toDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    return prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { fullName: true, email: true } },
        documentType: { select: { name: true, code: true } },
        attachments: true,
        approvals: {
          select: {
            id: true,
            action: true,
            comment: true,
            approver: { select: { fullName: true } }
          }
        }
      }
    });
  }
}
