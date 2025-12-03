import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { TransactionsService } from './transactions.service';
import {
  createTransactionSchema,
  deleteTransactionSchema,
  transactionQuerySchema,
  updateTransactionSchema,
} from './transactions.validation';
import { getUserId } from '../../config/auth';

const service = new TransactionsService();

function handleError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Validation error', details: error.issues });
  }

  // Prisma errors and other runtime errors should be 500
  if (error instanceof Error) {
    // Log the error for debugging (in production, use proper logging)
    console.error('Transaction error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }

  return res.status(500).json({ message: 'Internal server error' });
}

export class TransactionsController {
  async create(req: Request, res: Response) {
    try {
      const payload = createTransactionSchema.parse(req.body);
      const createdBy = getUserId(req);
      const transaction = await service.createTransaction(payload, createdBy);
      res.status(201).json(transaction);
    } catch (error) {
      handleError(res, error);
    }
  }

  async list(req: Request, res: Response) {
    try {
      const query = transactionQuerySchema.parse(req.query);
      const result = await service.listTransactions(query);
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const payload = updateTransactionSchema.parse(req.body);
      const updatedBy = getUserId(req);
      const transaction = await service.updateTransaction(req.params.id, payload, updatedBy);
      res.json(transaction);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const transaction = await service.getTransactionById(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      res.json(transaction);
    } catch (error) {
      handleError(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const deletedBy = getUserId(req);
      await service.deleteTransaction(req.params.id, deletedBy);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  }
}
