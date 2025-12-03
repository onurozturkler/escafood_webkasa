import { Router } from 'express';
import { LoansController } from './loans.controller';
import { createLoanSchema, payInstallmentSchema, upcomingInstallmentsQuerySchema, installmentIdParamSchema } from './loans.validation';
import { z } from 'zod';

const router = Router();
const controller = new LoansController();

function validate(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', details: error.issues });
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
        return res.status(400).json({ message: 'Validation error', details: error.issues });
      }
      next(error);
    }
  };
}

function validateParams(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', details: error.issues });
      }
      next(error);
    }
  };
}

// GET /api/loans/upcoming-installments?bankId=&from=&to=
router.get('/upcoming-installments', validateQuery(upcomingInstallmentsQuerySchema), (req, res) =>
  controller.getUpcomingInstallments(req, res)
);

// POST /api/loans/installments/:id/pay
router.post('/installments/:id/pay', validateParams(installmentIdParamSchema), validate(payInstallmentSchema), (req, res) =>
  controller.payInstallment(req, res)
);

export default router;

