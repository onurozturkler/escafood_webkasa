import { Request, Response } from 'express';
import { BanksService } from './banks.service';
import {
  CreateBankDto,
  UpdateBankDto,
} from './banks.types';
import { getUserId } from '../../config/auth';

const banksService = new BanksService();

export async function listBanks(req: Request, res: Response): Promise<void> {
  try {
    const result = await banksService.listBanks();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to list banks' });
  }
}

export async function getBank(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const bank = await banksService.getBankById(id);
    if (!bank) {
      res.status(404).json({ message: 'Bank not found' });
      return;
    }
    res.json(bank);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get bank' });
  }
}

export async function createBank(req: Request, res: Response): Promise<void> {
  const data = req.body as CreateBankDto;
  const createdBy = getUserId(req);

  try {
    const bank = await banksService.createBank(data, createdBy);
    res.status(201).json(bank);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create bank' });
  }
}

export async function updateBank(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const data = req.body as UpdateBankDto;
  const updatedBy = getUserId(req);

  try {
    const bank = await banksService.updateBank(id, data, updatedBy);
    res.json(bank);
  } catch (error: any) {
    if (error.message === 'Bank not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error.message === 'Cannot update deleted bank') {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Failed to update bank' });
  }
}

export async function deleteBank(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const deletedBy = getUserId(req);

  try {
    await banksService.deleteBank(id, deletedBy);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Bank not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error.message === 'Bank already deleted') {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Failed to delete bank' });
  }
}

