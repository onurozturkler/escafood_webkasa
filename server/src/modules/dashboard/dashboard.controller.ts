import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

const service = new DashboardService();

export class DashboardController {
  async getSummary(_req: Request, res: Response) {
    try {
      const summary = await service.getSummary();
      res.json(summary);
    } catch (error) {
      console.error('Dashboard summary error:', error);
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

