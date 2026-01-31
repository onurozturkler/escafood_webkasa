import { z } from 'zod';

// Maximum base64 size: ~5MB image (base64 is ~33% larger than binary)
// 5MB * 1.33 = ~6.65MB base64 string
const MAX_BASE64_SIZE = 7 * 1024 * 1024; // 7MB in bytes

export const createAttachmentSchema = z.object({
  imageDataUrl: z
    .string()
    .min(1, 'Görsel verisi gereklidir')
    .refine(
      (val) => {
        // Check if it's a valid data URL
        if (!val.startsWith('data:')) {
          return false;
        }
        // Extract base64 part and check size
        const base64Part = val.includes(',') ? val.split(',')[1] : '';
        // Base64 string length in bytes (each char is 1 byte, but base64 encoding increases size)
        const sizeBytes = base64Part.length * 0.75; // Approximate binary size
        return sizeBytes <= MAX_BASE64_SIZE;
      },
      {
        message: `Görsel çok büyük. Maksimum boyut: ${Math.round(MAX_BASE64_SIZE / 1024 / 1024)}MB`,
      }
    ),
  fileName: z.string().max(255).nullable().optional(),
  type: z.string().max(50).nullable().optional(),
});

