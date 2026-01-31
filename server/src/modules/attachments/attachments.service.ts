import { prisma } from '../../config/prisma';
import { CreateAttachmentDto, AttachmentDto } from './attachments.types';

export class AttachmentsService {
  /**
   * Create a new attachment from base64 image data
   */
  async createAttachment(data: CreateAttachmentDto, createdBy: string): Promise<AttachmentDto> {
    // Extract base64 data (remove data:image/jpeg;base64, prefix if present)
    const base64Data = data.imageDataUrl.includes(',') 
      ? data.imageDataUrl.split(',')[1] 
      : data.imageDataUrl;
    
    // Detect mime type from data URL or default to image/jpeg
    let mimeType = 'image/jpeg';
    if (data.imageDataUrl.startsWith('data:')) {
      const mimeMatch = data.imageDataUrl.match(/data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }
    
    // Generate file name if not provided
    const fileName = data.fileName || `attachment-${Date.now()}.jpg`;
    
    const attachment = await prisma.attachment.create({
      data: {
        fileName: fileName,
        mimeType: mimeType,
        base64Data: base64Data,
        createdBy: createdBy,
      },
    });
    
    return {
      id: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      imageDataUrl: `data:${attachment.mimeType};base64,${attachment.base64Data}`,
      createdAt: attachment.createdAt.toISOString(),
      createdBy: attachment.createdBy,
    };
  }

  /**
   * Get attachment by ID
   */
  async getAttachmentById(id: string): Promise<AttachmentDto | null> {
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: id,
        deletedAt: null,
      },
    });
    
    if (!attachment) {
      return null;
    }
    
    return {
      id: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      imageDataUrl: `data:${attachment.mimeType};base64,${attachment.base64Data}`,
      createdAt: attachment.createdAt.toISOString(),
      createdBy: attachment.createdBy,
    };
  }
}

