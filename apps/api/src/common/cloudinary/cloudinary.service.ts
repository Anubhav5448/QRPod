import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  type UploadApiResponse,
} from 'cloudinary';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private config: ConfigService) {}

  onModuleInit() {
    cloudinary.config({
      cloud_name: this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
    this.logger.log('☁️  Cloudinary configured');
  }

  /**
   * Upload a buffer to Cloudinary.
   * Returns the secure URL + public_id for later deletion.
   */
  /**
   * Upload a buffer to Cloudinary.
   * Assumes the buffer is already optimized (compressed WebP from sharp).
   * Returns the secure URL + public_id for later deletion.
   */
  async uploadImage(params: {
    buffer: Buffer;
    folder: string;
    publicId?: string;
  }): Promise<{ url: string; publicId: string }> {
    const { buffer, folder, publicId } = params;

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          // No transformation — buffer is pre-compressed WebP from sharp
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            this.logger.error('Cloudinary upload failed', error);
            return reject(error ?? new Error('Upload failed'));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );

      upload.end(buffer);
    });
  }

  /**
   * Delete an image by public_id.
   * Silent on failure — used for cleanup, not critical path.
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      this.logger.warn(`Failed to delete Cloudinary image: ${publicId}`, err);
    }
  }
}