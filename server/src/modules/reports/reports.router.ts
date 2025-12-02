import { Router } from 'express';
import {
  getKasaDefteri,
  getNakitAkis,
} from './reports.controller';
import {
  kasaDefteriQuerySchema,
  nakitAkisQuerySchema,
} from './reports.validation';
import { z } from 'zod';

const router = Router();

/**
 * Validation middleware for query params
 */
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
router.get('/kasa-defteri', validateQuery(kasaDefteriQuerySchema), getKasaDefteri);
router.get('/nakit-akis', validateQuery(nakitAkisQuerySchema), getNakitAkis);

export default router;

