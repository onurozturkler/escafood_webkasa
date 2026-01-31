import { Router } from 'express';
import { AttachmentsController } from './attachments.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();
const controller = new AttachmentsController();

// All routes require authentication
router.post('/', authMiddleware, (req, res) => controller.create(req, res));
router.get('/:id', authMiddleware, (req, res) => controller.getById(req, res));

export default router;

