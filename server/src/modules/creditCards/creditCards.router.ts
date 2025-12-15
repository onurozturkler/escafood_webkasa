import { Router } from 'express';
import {
  listCreditCards,
  getCreditCard,
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  createExpense,
  createPayment,
  bulkSave,
} from './creditCards.controller';
import {
  createCreditCardSchema,
  updateCreditCardSchema,
  createExpenseSchema,
  createPaymentSchema,
} from './creditCards.validation';
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
          errors: error.issues,
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
router.get('/', listCreditCards);
router.post('/', validate(createCreditCardSchema), createCreditCard);
router.post('/bulk-save', bulkSave);
router.get('/:id', getCreditCard);
router.put('/:id', validate(updateCreditCardSchema), updateCreditCard);
router.delete('/:id', deleteCreditCard);
router.post('/expense', validate(createExpenseSchema), createExpense);
router.post('/payment', validate(createPaymentSchema), createPayment);

export default router;

