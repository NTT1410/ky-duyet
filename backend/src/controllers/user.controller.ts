import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export class UserController {
  static async getAll(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          department: { select: { name: true } }
        },
        orderBy: { fullName: 'asc' }
      });
      res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
