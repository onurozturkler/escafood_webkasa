import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { BanksService } from './banks.service';
import { bankIdParamSchema, bulkSaveBankSchema, createBankSchema, deleteBankSchema, updateBankSchema } from './banks.validation';
import { getUserId } from '../../config/auth';

const service = new BanksService();

function handleError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Validation error', details: error.issues });
  }

  if (error instanceof Error) {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: 'Internal server error' });
}

export class BanksController {
  async list(_req: Request, res: Response) {
    try {
      const banks = await service.getAllBanksWithBalances();
      res.json(banks);
    } catch (error) {
      handleError(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const payload = createBankSchema.parse(req.body);
      const createdBy = getUserId(req);
      const bank = await service.createBank(payload, createdBy);
      res.status(201).json(bank);
    } catch (error) {
      handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const params = bankIdParamSchema.parse(req.params);
      const payload = updateBankSchema.parse(req.body);
      const updatedBy = getUserId(req);
      const bank = await service.updateBank(params.id, payload, updatedBy);
      res.json(bank);
    } catch (error) {
      handleError(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const params = bankIdParamSchema.parse(req.params);
      deleteBankSchema.parse(req.body); // Validate but don't use payload
      const deletedBy = getUserId(req);
      const bank = await service.softDeleteBank(params.id, deletedBy);
      res.json(bank);
    } catch (error) {
      handleError(res, error);
    }
  }

  async bulkSave(req: Request, res: Response) {
    try {
      console.log('BanksController.bulkSave - received body:', JSON.stringify(req.body, null, 2));
      const rawPayload = bulkSaveBankSchema.parse(req.body);
      console.log('BanksController.bulkSave - parsed payload:', JSON.stringify(rawPayload, null, 2));
      // Normalize undefined to null for accountNo and iban
      const payload = rawPayload.map((item) => ({
        id: item.id,
        name: item.name,
        accountNo: item.accountNo ?? null,
        iban: item.iban ?? null,
        openingBalance: item.openingBalance ?? 0,
        isActive: item.isActive ?? true,
      }));
      console.log('BanksController.bulkSave - normalized payload:', JSON.stringify(payload, null, 2));
      const userId = getUserId(req);
      console.log('BanksController.bulkSave - userId:', userId);
      const banks = await service.bulkSaveBanks(payload, userId);
      console.log('BanksController.bulkSave - saved banks:', JSON.stringify(banks, null, 2));
      res.json(banks);
    } catch (error) {
      console.error('BanksController.bulkSave - error:', error);
      handleError(res, error);
    }
  }
}
