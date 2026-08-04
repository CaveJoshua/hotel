import { Router } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { asyncH, ApiError } from '../middleware/errors.js';
import { authenticate } from '../middleware/auth.js';

const r = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// POST /api/upload/image - Anti-Backdoor Secure Image Upload
r.post('/upload/image', authenticate, asyncH(async (req, res) => {
  const { image_data, filename: originalName } = req.body || {};

  if (!image_data || typeof image_data !== 'string') {
    throw new ApiError(400, 'Image payload required in base64 data URL format');
  }

  // Anti-Backdoor: Extract and validate MIME type
  const match = image_data.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
  if (!match) {
    throw new ApiError(400, 'Invalid image format or prohibited file extension');
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const safeExt = ALLOWED_MIME_TYPES[mimeType];

  if (!safeExt) {
    throw new ApiError(400, 'Prohibited image type');
  }

  // Anti-Backdoor: Generate cryptographically unique safe filename, avoiding path traversal & dangerous extensions
  const uniqueId = crypto.randomUUID();
  const safeFilename = `img_${uniqueId}_${Date.now()}.${safeExt}`;
  const targetPath = path.join(uploadDir, safeFilename);

  // Prevent Directory Traversal Attack
  if (!targetPath.startsWith(uploadDir)) {
    throw new ApiError(403, 'Forbidden file path');
  }

  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > 5 * 1024 * 1024) {
    throw new ApiError(400, 'Image exceeds maximum allowable size (5MB)');
  }

  await fs.promises.writeFile(targetPath, buffer);

  res.status(201).json({
    success: true,
    url: `/uploads/${safeFilename}`,
    filename: safeFilename,
    original_name: path.basename(String(originalName || '')),
  });
}));

export default r;
