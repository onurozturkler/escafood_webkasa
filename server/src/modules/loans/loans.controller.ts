import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { LoansService } from './loans.service';
import {
  createLoanSchema,
  payInstallmentSchema,
  upcomingInstallmentsQuerySchema,
  installmentIdParamSchema,
} from './loans.validation';
import { getUserId } from '../../config/auth';

const service = new LoansService();

function handleError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Validation error', details: error.issues });
  }

  if (error instanceof Error) {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: 'Internal server error' });
}

export class LoansController {
  /**
   * Get upcoming installments
   */
  async getUpcomingInstallments(req: Request, res: Response) {
    try {
      const query = upcomingInstallmentsQuerySchema.parse(req.query);
      const installments = await service.getUpcomingInstallments(query);
      res.json(installments);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Pay an installment
   */
  async payInstallment(req: Request, res: Response) {
    try {
      const params = installmentIdParamSchema.parse(req.params);
      const payload = payInstallmentSchema.parse(req.body);
      const updatedBy = getUserId(req);
      const result = await service.payInstallment(params.id, payload, updatedBy);
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  }
}

