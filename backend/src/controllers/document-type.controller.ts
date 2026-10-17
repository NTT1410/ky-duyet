import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export class DocumentTypeController {
  static async getAll(_req: Request, res: Response) {
    try {
      const types = await prisma.documentType.findMany({
        orderBy: { createdAt: 'asc' },
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
      res.status(200).json({ success: true, data: types });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
