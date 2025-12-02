import { Request, Response } from 'express';
import { ReportsService } from './reports.service';
import {
  KasaDefteriQuery,
  NakitAkisQuery,
} from './reports.types';

const reportsService = new ReportsService();

export async function getKasaDefteri(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as KasaDefteriQuery;

  try {
    const result = await reportsService.getKasaDefteri(query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get Kasa Defteri report' });
  }
}

export async function getNakitAkis(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as NakitAkisQuery;

  try {
    const result = await reportsService.getNakitAkis(query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get Nakit Akış report' });
  }
}

