import { PrismaClient } from '@prisma/client';

// Khởi tạo một Prisma Client duy nhất để dùng chung cho toàn bộ app
export const prisma = new PrismaClient();
