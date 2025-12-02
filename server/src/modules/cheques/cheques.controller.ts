import { Request, Response } from 'express';
import { ChequesService } from './cheques.service';
import {
  CreateChequeDto,
  UpdateChequeDto,
  UpdateChequeStatusDto,
  ChequeListQuery,
} from './cheques.types';
import { getUserId } from '../../config/auth';

const chequesService = new ChequesService();

export async function createCheque(req: Request, res: Response): Promise<void> {
  const data = req.body as CreateChequeDto;
  const createdBy = getUserId(req);

  try {
    const cheque = await chequesService.createCheque(data, createdBy);
    res.status(201).json(cheque);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create cheque' });
  }
}

export async function getCheque(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const cheque = await chequesService.getChequeById(id);
    if (!cheque) {
      res.status(404).json({ message: 'Cheque not found' });
      return;
    }
    res.json(cheque);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get cheque' });
  }
}

export async function updateCheque(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const data = req.body as UpdateChequeDto;
  const updatedBy = getUserId(req);

  try {
    const cheque = await chequesService.updateCheque(id, data, updatedBy);
    res.json(cheque);
  } catch (error: any) {
    if (error.message === 'Cheque not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error.message === 'Cannot update deleted cheque') {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Failed to update cheque' });
  }
}

export async function updateChequeStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const data = req.body as UpdateChequeStatusDto;
  const updatedBy = getUserId(req);

  try {
    const result = await chequesService.updateChequeStatus(id, data, updatedBy);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Cheque not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error.message === 'Cannot update deleted cheque') {
      res.status(400).json({ message: error.message });
      return;
    }
    if (error.message.includes('Invalid status transition')) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Failed to update cheque status' });
  }
}

export async function listCheques(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ChequeListQuery;

  try {
    const result = await chequesService.listCheques(query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to list cheques' });
  }
}

