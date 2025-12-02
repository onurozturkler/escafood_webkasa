import { Router } from 'express';
import {
  createCheque,
  getCheque,
  updateCheque,
  updateChequeStatus,
  listCheques,
} from './cheques.controller';
import {
  createChequeSchema,
  updateChequeSchema,
  updateChequeStatusSchema,
  chequeListQuerySchema,
} from './cheques.validation';
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
router.get('/', validateQuery(chequeListQuerySchema), listCheques);
router.post('/', validate(createChequeSchema), createCheque);
router.get('/:id', getCheque);
router.put('/:id', validate(updateChequeSchema), updateCheque);
router.put('/:id/status', validate(updateChequeStatusSchema), updateChequeStatus);

export default router;

