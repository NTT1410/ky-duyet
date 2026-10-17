import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: { department: true }
      });

      if (!user) {
        res.status(401).json({ success: false, message: 'Sai thông tin đăng nhập' });
        return;
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Sai thông tin đăng nhập' });
        return;
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email, fullName: user.fullName },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          department: user.department?.name
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
  }

  static async me(req: Request, res: Response): Promise<void> {
    // Để gọi lấy thông tin user hiện tại từ Token
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, fullName: true, role: true, department: true }
      });

      res.status(200).json({ success: true, user });
    } catch (error) {
      res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    }
  }
}
