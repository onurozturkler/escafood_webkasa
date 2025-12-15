import { Router } from 'express';
import { DashboardController } from './dashboard.controller';

const router = Router();
const controller = new DashboardController();

router.get('/summary', controller.getSummary.bind(controller));

export default router;

