import { Request, Response } from 'express';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionListQuery,
} from './transactions.types';
import { getUserId } from '../../config/auth';

const transactionsService = new TransactionsService();

export async function createTransaction(req: Request, res: Response): Promise<void> {
  const data = req.body as CreateTransactionDto;
  const createdBy = getUserId(req);

  try {
    const transaction = await transactionsService.createTransaction(data, createdBy);
    res.status(201).json(transaction);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create transaction' });
  }
}

export async function getTransaction(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const transaction = await transactionsService.getTransactionById(id);
    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }
    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get transaction' });
  }
}

export async function updateTransaction(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const data = req.body as UpdateTransactionDto;
  const updatedBy = getUserId(req);

  try {
    const transaction = await transactionsService.updateTransaction(id, data, updatedBy);
    res.json(transaction);
  } catch (error: any) {
    if (error.message === 'Transaction not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error.message === 'Cannot update deleted transaction') {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Failed to update transaction' });
  }
}

export async function listTransactions(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as TransactionListQuery;

  try {
    const result = await transactionsService.listTransactions(query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to list transactions' });
  }
}

export async function deleteTransaction(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const deletedBy = getUserId(req);

  try {
    await transactionsService.deleteTransaction(id, deletedBy);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Transaction not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error.message === 'Transaction already deleted') {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Failed to delete transaction' });
  }
}

