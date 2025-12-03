import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { ReportsService } from './reports.service';
import {
  KasaDefteriQuery,
  NakitAkisQuery,
} from './reports.types';
import { kasaDefteriQuerySchema, nakitAkisQuerySchema } from './reports.validation';

const reportsService = new ReportsService();

function handleError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Validation error', details: error.issues });
  }

  // Prisma errors and other runtime errors should be 500
  if (error instanceof Error) {
    // Log the error for debugging (in production, use proper logging)
    console.error('Report error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }

  return res.status(500).json({ message: 'Internal server error' });
}

export async function getKasaDefteri(req: Request, res: Response): Promise<void> {
  try {
    const query = kasaDefteriQuerySchema.parse(req.query) as KasaDefteriQuery;
    const result = await reportsService.getKasaDefteri(query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

export async function getNakitAkis(req: Request, res: Response): Promise<void> {
  try {
    const query = nakitAkisQuerySchema.parse(req.query) as NakitAkisQuery;
    const result = await reportsService.getNakitAkis(query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

