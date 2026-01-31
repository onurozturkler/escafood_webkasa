export interface AttachmentDto {
  id: string;
  fileName: string;
  mimeType: string;
  imageDataUrl: string; // data:image/jpeg;base64,... format
  createdAt: string;
  createdBy: string | null;
}

export interface CreateAttachmentDto {
  imageDataUrl: string; // data:image/jpeg;base64,... format
  fileName?: string | null;
  type?: string | null; // Optional type hint (e.g., 'POS_SLIP', 'CHEQUE')
}

