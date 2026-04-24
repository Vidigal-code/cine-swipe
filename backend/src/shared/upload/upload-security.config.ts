import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage, memoryStorage } from 'multer';
import { extname, isAbsolute, resolve } from 'path';

const DEFAULT_UPLOADS_DIR = './uploads';
const DEFAULT_MAX_UPLOAD_MB = 10;
const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function buildMovieUploadOptions() {
  return buildImageUploadOptions('movie');
}

export function buildAvatarUploadOptions() {
  return buildImageUploadOptions('avatar');
}

function buildImageUploadOptions(filePrefix: string) {
  return {
    storage: resolveStorage(filePrefix),
    limits: {
      fileSize: resolveMaxFileSizeBytes(),
    },
    fileFilter: (
      _req: unknown,
      file: Express.Multer.File,
      cb: FileFilterCb,
    ) => {
      const validationError = validateFile(file);
      if (validationError) {
        cb(new BadRequestException(validationError), false);
        return;
      }
      cb(null, true);
    },
  };
}

type FileFilterCb = (error: Error | null, acceptFile: boolean) => void;

function resolveStorage(filePrefix: string) {
  const provider = (process.env.MEDIA_STORAGE_PROVIDER || 'local')
    .trim()
    .toLowerCase();
  if (provider === 'firebase') {
    return memoryStorage();
  }
  return diskStorage({
    destination: resolveUploadsDirectory(),
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(
        null,
        `${filePrefix}-${uniqueSuffix}${extname(file.originalname).toLowerCase()}`,
      );
    },
  });
}

function resolveUploadsDirectory(): string {
  const configuredDir = process.env.UPLOADS_DIR || DEFAULT_UPLOADS_DIR;
  const absoluteDir = isAbsolute(configuredDir)
    ? configuredDir
    : resolve(process.cwd(), configuredDir);
  if (!existsSync(absoluteDir)) {
    mkdirSync(absoluteDir, { recursive: true });
  }
  return absoluteDir;
}

function resolveMaxFileSizeBytes(): number {
  const rawLimit = Number(
    process.env.UPLOAD_MAX_FILE_SIZE_MB ?? DEFAULT_MAX_UPLOAD_MB,
  );
  const safeLimit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? rawLimit
      : DEFAULT_MAX_UPLOAD_MB;
  return safeLimit * 1024 * 1024;
}

function resolveAllowedMimeTypes(): string[] {
  const configured = process.env.UPLOAD_ALLOWED_MIME_TYPES;
  if (!configured) {
    return DEFAULT_ALLOWED_MIME_TYPES;
  }

  const parsed = configured
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_MIME_TYPES;
}

function validateFile(file: Express.Multer.File): string | null {
  const allowedMimeTypes = resolveAllowedMimeTypes();
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return `Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`;
  }
  const extension = extname(file.originalname).toLowerCase();
  if (!isExtensionAllowedForMime(file.mimetype, extension)) {
    return 'File extension does not match the provided mime type.';
  }
  return null;
}

function isExtensionAllowedForMime(
  mimeType: string,
  extension: string,
): boolean {
  const mapping: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  };
  const allowedExtensions = mapping[mimeType];
  if (!allowedExtensions) {
    return false;
  }
  return allowedExtensions.includes(extension);
}
