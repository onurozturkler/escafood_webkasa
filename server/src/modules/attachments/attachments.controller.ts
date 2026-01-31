import { Request, Response } from 'express';
import { AttachmentsService } from './attachments.service';
import { createAttachmentSchema } from './attachments.validation';
import { z } from 'zod';

const attachmentsService = new AttachmentsService();

function handleError(res: Response, error: unknown) {
  if (error instanceof z.ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: error.issues,
    });
    return;
  }
  
  if (error instanceof Error) {
    console.error('AttachmentsController error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
    return;
  }
  
  res.status(500).json({
    error: 'Unknown error',
  });
}

export class AttachmentsController {
  /**
   * POST /api/attachments
   * Create a new attachment from image data
   */
  async create(req: Request, res: Response) {
    try {
      const authReq = req as any;
      const userId = authReq.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const validated = createAttachmentSchema.parse(req.body);
      const attachment = await attachmentsService.createAttachment(validated, userId);
      res.status(201).json(attachment);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * GET /api/attachments/:id
   * Get attachment by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: 'Attachment ID is required' });
        return;
      }
      
      const attachment = await attachmentsService.getAttachmentById(id);
      if (!attachment) {
        res.status(404).json({ error: 'Attachment not found' });
        return;
      }
      
      res.json(attachment);
    } catch (error) {
      handleError(res, error);
    }
  }
}

