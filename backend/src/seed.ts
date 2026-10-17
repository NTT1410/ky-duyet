import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Tạo Department
  const deptIT = await prisma.department.create({
    data: {
      name: 'Phòng IT',
    }
  });

  const deptAcc = await prisma.department.create({
    data: {
      name: 'Phòng Kế toán',
    }
  });

  // 2. Tạo Users
  const userIT = await prisma.user.create({
    data: {
      id: "11111111-1111-1111-1111-111111111111", // Fix ID để khớp với Frontend
      email: 'dev@company.com',
      passwordHash,
      fullName: 'Nguyễn Văn Dev',
      role: 'EMPLOYEE',
      departmentId: deptIT.id
    }
  });

  const managerIT = await prisma.user.create({
    data: {
      id: "33333333-3333-3333-3333-333333333333",
      email: 'manager.it@company.com',
      passwordHash,
      fullName: 'Trần Sếp IT',
      role: 'MANAGER',
      departmentId: deptIT.id
    }
  });

  const chiefAccountant = await prisma.user.create({
    data: {
      id: "44444444-4444-4444-4444-444444444444",
      email: 'ketoantruong@company.com',
      passwordHash,
      fullName: 'Lê Kế Toán',
      role: 'MANAGER',
      departmentId: deptAcc.id
    }
  });

  // 3. Tạo Workflow Thanh Toán
  const wfThanhToan = await prisma.workflow.create({
    data: {
      name: 'Quy trình Thanh toán công tác phí',
      steps: {
        create: [
          {
            stepOrder: 1,
            stepType: 'SEQUENTIAL',
            approverType: 'SPECIFIC_USER',
            approverReferenceId: managerIT.id // Demo: Fix cứng sếp IT
          },
          {
            stepOrder: 2,
            stepType: 'SEQUENTIAL',
            approverType: 'SPECIFIC_USER',
            approverReferenceId: chiefAccountant.id // Demo: Kế toán trưởng
          }
        ]
      }
    }
  });

  // 4. Tạo Document Type
  await prisma.documentType.create({
    data: {
      id: "22222222-2222-2222-2222-222222222222", // Fix ID để khớp Frontend
      name: 'Đề nghị thanh toán',
      code: 'TTCP',
      defaultWorkflowId: wfThanhToan.id
    }
  });

  console.log('✅ Seeding completed!');
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
