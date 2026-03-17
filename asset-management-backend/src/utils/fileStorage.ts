import fs from 'fs';
import path from 'path';
import logger from './logger';

/**
 * Utility functions for handling file storage
 */

const STORAGE_BASE_DIR = path.join(__dirname, '../../storage');
export const PUBLIC_STORAGE_DIR = path.join(STORAGE_BASE_DIR, 'public');

/**
 * Check if a stored image file actually exists on disk
 * @param imagePath - Relative path (e.g. "maintenance-requests/14/damage_1.png")
 */
export function imageFileExists(imagePath: string): boolean {
  if (!imagePath) return false;
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  const fullPath = path.join(PUBLIC_STORAGE_DIR, cleanPath);
  return fs.existsSync(fullPath);
}

/**
 * Ensure storage directory exists
 */
export function ensureStorageDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Save base64 image to file system
 * @param base64Image - Base64 encoded image string (with data:image/xxx;base64, prefix)
 * @param maintenanceId - Maintenance request ID
 * @param orderNumber - Order number for the image
 * @returns Relative path to the saved file (e.g., "maintenance-requests/73/damage_1.jpg")
 */
export function saveBase64Image(
  base64Image: string,
  maintenanceId: number,
  orderNumber: number
): string {
  // Safe parsing of base64 string
  if (!base64Image || typeof base64Image !== 'string') {
    throw new Error('Invalid image data provided');
  }

  // Check for the base64 prefix
  const parts = base64Image.split(';base64,');
  if (parts.length !== 2) {
    throw new Error('Invalid base64 image format. Missing ";base64," prefix.');
  }

  const prefix = parts[0]; // e.g., "data:image/png"
  const imageData = parts[1]; // Base64 data

  // Extract extension more robustly
  // Example: "data:image/png" -> "png"
  // Example: "data:image/jpeg;name=test.jpg" -> "jpeg"
  let extension = 'png';
  try {
    const mimeType = prefix.split(':')[1]?.split(';')[0] || 'image/png';
    extension = mimeType.split('/')[1] || 'png';
  } catch (e) {
    logger.warn('⚠️ [fileStorage] Failed to parse extension, defaulting to png', { error: e });
  }

  // Decode base64 to binary
  const buffer = Buffer.from(imageData, 'base64');

  // Create directory structure: storage/public/maintenance-requests/{maintenance_id}/
  const maintenanceDir = path.join(PUBLIC_STORAGE_DIR, 'maintenance-requests', String(maintenanceId));
  ensureStorageDir(maintenanceDir);

  // Generate filename
  const filename = `damage_${orderNumber}.${extension}`;
  const filePath = path.join(maintenanceDir, filename);

  // Write file
  fs.writeFileSync(filePath, buffer);

  // Return relative path (relative to storage/public)
  const relativePath = `maintenance-requests/${maintenanceId}/${filename}`;

  logger.info('✅ Saved image', {
    maintenanceId,
    orderNumber,
    extension,
    filePath,
    relativePath,
    fileSize: buffer.length,
  });

  return relativePath;
}

/**
 * Save an uploaded file buffer to public storage.
 * @param buffer - File contents
 * @param relativeDir - Directory relative to storage/public (e.g. "asset-disposals/123")
 * @param filename - Target filename (e.g. "decision.pdf")
 * @returns Relative path to the saved file (e.g. "asset-disposals/123/decision.pdf")
 */
export function savePublicFile(buffer: Buffer, relativeDir: string, filename: string): string {
  const safeDir = relativeDir.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\.\./g, '');
  const safeFilename = filename.replace(/\\/g, '_').replace(/\//g, '_').replace(/\.\./g, '_');

  const dirPath = path.join(PUBLIC_STORAGE_DIR, safeDir);
  ensureStorageDir(dirPath);

  const filePath = path.join(dirPath, safeFilename);
  fs.writeFileSync(filePath, buffer);

  return `${safeDir}/${safeFilename}`;
}

/**
 * Delete image file from storage
 * @param imagePath - Relative path to the image (e.g., "maintenance-requests/73/damage_1.jpg")
 */
export function deleteImageFile(imagePath: string): void {
  const fullPath = path.join(PUBLIC_STORAGE_DIR, imagePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    logger.info('✅ Deleted image', { fullPath });
  } else {
    logger.warn('⚠️ Image file not found', { fullPath });
  }
}

/**
 * Delete all images for a maintenance request
 * @param maintenanceId - Maintenance request ID
 */
export function deleteMaintenanceImages(maintenanceId: number): void {
  const maintenanceDir = path.join(PUBLIC_STORAGE_DIR, 'maintenance-requests', String(maintenanceId));

  if (fs.existsSync(maintenanceDir)) {
    // Delete all files in the directory
    const files = fs.readdirSync(maintenanceDir);
    files.forEach((file) => {
      const filePath = path.join(maintenanceDir, file);
      fs.unlinkSync(filePath);
    });

    // Remove the directory
    fs.rmdirSync(maintenanceDir);
    logger.info('✅ Deleted maintenance images directory', { maintenanceDir });
  }
}

/**
 * Get URL for an image path (relative nếu không set API_BASE_URL → tránh mixed content khi frontend dùng HTTPS)
 * @param imagePath - Relative path to the image
 * @returns Full URL hoặc relative path /storage/...
 */
export function getImageUrl(imagePath: string): string {
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    return `/storage/${cleanPath}`;
  }
  return `${baseUrl.replace(/\/$/, '')}/storage/${cleanPath}`;
}
