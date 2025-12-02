import { Router } from 'express';
import {
  createTransaction,
  getTransaction,
  updateTransaction,
  listTransactions,
  deleteTransaction,
} from './transactions.controller';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionListQuerySchema,
} from './transactions.validation';
import { z } from 'zod';

const router = Router();

/**
 * Validation middleware
 */
function validate(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }
      next(error);
    }
  };
}

function validateQuery(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Routes
 */
router.get('/', validateQuery(transactionListQuerySchema), listTransactions);
router.post('/', validate(createTransactionSchema), createTransaction);
router.get('/:id', getTransaction);
router.put('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
