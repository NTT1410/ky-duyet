import { Router } from 'express';
import { DocumentTypeController } from '../controllers/document-type.controller';

const router = Router();

router.get('/', DocumentTypeController.getAll);

export default router;
