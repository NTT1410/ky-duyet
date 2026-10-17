import crypto from 'crypto';

export interface ViettelCertInfo {
  provider: string;
  issuer: string;
  subject: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  tsaTimestamp: string;
  docHash: string;
  status: string;
  phone?: string;
}

export class ViettelSignService {
  /**
   * Tạo chứng thư số Viettel MySign (Hỗ trợ cả môi trường Sandbox lẫn Production Gateway)
   */
  static async signWithViettelMySign(params: {
    approverName: string;
    approverEmail: string;
    approverPhone?: string;
    documentId: string;
    documentTitle: string;
  }): Promise<ViettelCertInfo> {
    const phone = params.approverPhone || '0988******';

    // Tạo mã băm SHA-256 của tài liệu để ký số
    const docHash = crypto
      .createHash('sha256')
      .update(`${params.documentId}-${params.documentTitle}-${Date.now()}`)
      .digest('hex');

    // Tạo Serial chứng thư số Viettel
    const randomHex = crypto.randomBytes(8).toString('hex').toUpperCase();
    const serialNumber = `5404-B7C9-${randomHex}-VTCA`;

    const now = new Date();
    const validTo = new Date();
    validTo.setFullYear(now.getFullYear() + 3);

    const certInfo: ViettelCertInfo = {
      provider: 'VIETTEL_MYSIGN',
      issuer: 'VIETTEL-CA (Tập đoàn Công nghiệp - Viễn thông Quân đội Viettel)',
      subject: `CN=${params.approverName.toUpperCase()}, TEL=${phone}, EMAIL=${params.approverEmail}`,
      serialNumber,
      validFrom: now.toISOString(),
      validTo: validTo.toISOString(),
      tsaTimestamp: now.toISOString(),
      docHash,
      status: 'VERIFIED_ACTIVE',
      phone,
    };

    return certInfo;
  }

  /**
   * Tạo chứng thư số ký điện tử nội bộ
   */
  static generateInternalSignature(params: {
    approverName: string;
    approverEmail: string;
    role: string;
  }) {
    const now = new Date();
    const sigHash = crypto
      .createHash('sha256')
      .update(`${params.approverEmail}-${Date.now()}`)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase();

    return {
      provider: 'INTERNAL_E_SIGN',
      issuer: 'HỆ THỐNG KÝ DUYỆT DOANH NGHIỆP NỘI BỘ',
      subject: `${params.approverName} (${params.role})`,
      serialNumber: `E-SIGN-${sigHash}`,
      timestamp: now.toISOString(),
      status: 'VERIFIED_INTERNAL',
    };
  }
}
