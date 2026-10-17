import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { upload } from '../config/multer';

const router = Router();

// 1. Tạo tờ trình (hỗ trợ đính kèm nhiều file tối đa 10 file)
router.post('/', upload.array('files', 10), DocumentController.create);

// 2. Lấy toàn bộ văn bản (có bộ lọc: ngày tháng, trạng thái, tìm kiếm, phòng ban)
router.get('/', DocumentController.getAll);

// 3. Lấy danh sách cần duyệt của 1 user
router.get('/pending/:userId', DocumentController.getPending);

// 4. Lấy chi tiết 1 văn bản (kèm timeline duyệt và file)
router.get('/:id', DocumentController.getById);

// 5. Phê duyệt / Từ chối tờ trình
router.post('/approve/:approvalId', DocumentController.approve);

export default router;
