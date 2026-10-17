import { Request, Response } from 'express';
import { DocumentService } from '../services/document.service';

export class DocumentController {
  
  /**
   * Tạo văn bản mới (hỗ trợ cả JSON và multipart/form-data upload file)
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      let { title, content, documentTypeId, creatorId, metadata, selectedApproverId } = req.body;

      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch {
          metadata = null;
        }
      }

      // Xử lý danh sách file đính kèm từ Multer (nếu có)
      const files = req.files as Express.Multer.File[] | undefined;
      const attachments = files && files.length > 0 
        ? files.map(file => ({
            fileName: Buffer.from(file.originalname, 'latin1').toString('utf8'), // Decode utf-8 filename
            fileUrl: `/uploads/${file.filename}`
          }))
        : undefined;

      const doc = await DocumentService.createDocument({
        title,
        content: content || '',
        documentTypeId,
        creatorId,
        metadata,
        selectedApproverId: selectedApproverId && selectedApproverId !== 'auto' ? selectedApproverId : undefined,
        attachments
      });

      res.status(201).json({ success: true, data: doc });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Lấy chi tiết 1 văn bản kèm file và lịch sử duyệt
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const doc = await DocumentService.getDocumentById(id);
      res.status(200).json({ success: true, data: doc });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  /**
   * Lấy danh sách văn bản chờ duyệt của 1 người dùng
   */
  static async getPending(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string; 
      const approvals = await DocumentService.getPendingApprovals(userId);
      res.status(200).json({ success: true, data: approvals });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Phê duyệt hoặc từ chối văn bản (Hỗ trợ ký số Viettel MySign & Ký điện tử)
   */
  static async approve(req: Request, res: Response): Promise<void> {
    try {
      const approvalId = req.params.approvalId as string;
      const { userId, action, comment, signType, signatureImage, approverPhone } = req.body;
      const result = await DocumentService.approveDocument({
        approvalId,
        userId,
        action,
        comment,
        signType,
        signatureImage,
        approverPhone
      });
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Lấy danh sách toàn bộ văn bản có hỗ trợ bộ lọc (Ngày, Trạng thái, Từ khóa...)
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { userId, status, search, typeId, fromDate, toDate } = req.query as {
        userId?: string;
        status?: string;
        search?: string;
        typeId?: string;
        fromDate?: string;
        toDate?: string;
      };

      const docs = await DocumentService.getAllDocuments({
        userId,
        status,
        search,
        typeId,
        fromDate,
        toDate
      });

      res.status(200).json({ success: true, data: docs });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
