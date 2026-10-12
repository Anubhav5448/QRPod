import sharp from 'sharp';
import { Logger } from '@nestjs/common';

const logger = new Logger('ImageCompressor');

const MAX_DIMENSION = 1200;
const WEBP_QUALITY = 80;

export interface CompressedImage {
  buffer: Buffer;
  mimetype: 'image/webp';
  originalSize: number;
  compressedSize: number;
  ratio: number;
}

/**
 * Compress an image buffer to WebP.
 * - Resizes down to MAX_DIMENSION (preserves aspect ratio, never upscales)
 * - Converts to WebP at WEBP_QUALITY
 * - Strips metadata (EXIF bloat)
 *
 * Returns the compressed buffer + stats for logging.
 */
export async function compressImage(input: Buffer): Promise<CompressedImage> {
  const originalSize = input.length;

  const output = await sharp(input)
    .rotate() // auto-rotate based on EXIF orientation before stripping metadata
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside', // preserve aspect ratio
      withoutEnlargement: true, // never upscale small images
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const ratio = originalSize / output.length;

  logger.log(
    `Compressed ${formatBytes(originalSize)} → ${formatBytes(
      output.length,
    )} (${ratio.toFixed(1)}x)`,
  );

  return {
    buffer: output,
    mimetype: 'image/webp',
    originalSize,
    compressedSize: output.length,
    ratio,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}