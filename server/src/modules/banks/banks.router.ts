import { Router } from 'express';
import {
  listBanks,
  getBank,
  createBank,
  updateBank,
  deleteBank,
} from './banks.controller';
import {
  createBankSchema,
  updateBankSchema,
} from './banks.validation';
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

/**
 * Routes
 */
router.get('/', listBanks);
router.post('/', validate(createBankSchema), createBank);
router.get('/:id', getBank);
router.put('/:id', validate(updateBankSchema), updateBank);
router.delete('/:id', deleteBank);

export default router;
