import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { FirebaseAdminService } from '../../infrastructure/firebase/firebase-admin.service';
import { buildPublicBackendUrl } from '../../shared/config/public-backend-url.util';
import { resolveMediaStorageProvider } from '../../shared/config/platform.config';

type UploadCategory = 'avatars' | 'posters';

@Injectable()
export class MediaStorageService {
  constructor(
    private readonly configService: ConfigService,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

  async saveUploadedImage(
    request: Request,
    file: Express.Multer.File,
    category: UploadCategory,
  ): Promise<string> {
    const provider = resolveMediaStorageProvider(this.configService);
    if (provider === 'firebase') {
      return this.saveToFirebase(file, category);
    }
    return this.saveToLocal(request, file);
  }

  private saveToLocal(request: Request, file: Express.Multer.File): string {
    const backendBaseUrl = buildPublicBackendUrl(this.configService, request);
    const fileName = file.filename ?? file.originalname;
    return `${backendBaseUrl}/uploads/${encodeURIComponent(fileName)}`;
  }

  private async saveToFirebase(
    file: Express.Multer.File,
    category: UploadCategory,
  ): Promise<string> {
    const bucket = this.firebaseAdminService.getStorageBucket();
    const extension =
      extname(file.originalname).toLowerCase() ||
      this.mapMimeTypeToExtension(file.mimetype);
    const targetPath = `${category}/${Date.now()}-${randomUUID()}${extension}`;
    const content = file.buffer;
    if (!content) {
      throw new Error('Buffered upload is required for firebase storage');
    }

    const targetFile = bucket.file(targetPath);
    await targetFile.save(content, {
      resumable: false,
      contentType: file.mimetype,
      public: false,
      metadata: {
        cacheControl: 'public,max-age=3600',
      },
    });

    const isPublic = this.readBoolean(
      this.configService.get<string>('FIREBASE_STORAGE_PUBLIC'),
      false,
    );
    if (isPublic) {
      await targetFile.makePublic();
      return `https://storage.googleapis.com/${bucket.name}/${encodeURI(targetPath)}`;
    }

    const [signedUrl] = await targetFile.getSignedUrl({
      action: 'read',
      expires: '01-01-2500',
    });
    return signedUrl;
  }

  private mapMimeTypeToExtension(mimeType: string): string {
    switch (mimeType) {
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      default:
        return '.jpg';
    }
  }

  private readBoolean(raw: string | undefined, fallback: boolean): boolean {
    if (!raw) {
      return fallback;
    }
    return !['false', '0', 'off', 'no'].includes(raw.trim().toLowerCase());
  }
}
