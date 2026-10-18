import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/v1/system/version
 * Trả về thông tin phiên bản ứng dụng Desktop mới nhất & cấu hình hệ thống
 */
router.get('/version', (_req: Request, res: Response) => {
  const currentRelease = {
    version: '1.0.0',
    minRequiredVersion: '1.0.0',
    releaseDate: '2026-10-18',
    releaseNotes: 'Bản phát hành chính thức hệ thống Ký Duyệt Doanh nghiệp: Hỗ trợ tích hợp ký số phần cứng USB Token PKCS#11 trên Windows và Ký tay điện tử.',
    downloadUrl: 'https://github.com/NTT1410/ky-duyet/releases/latest',
    mandatory: false,
  };

  res.status(200).json({
    success: true,
    data: currentRelease,
    message: 'Lấy thông tin phiên bản hệ thống thành công',
  });
});

export default router;
