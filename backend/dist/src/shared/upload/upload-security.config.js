"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMovieUploadOptions = buildMovieUploadOptions;
exports.buildAvatarUploadOptions = buildAvatarUploadOptions;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const multer_1 = require("multer");
const path_1 = require("path");
const DEFAULT_UPLOADS_DIR = './uploads';
const DEFAULT_MAX_UPLOAD_MB = 10;
const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
function buildMovieUploadOptions() {
    return buildImageUploadOptions('movie');
}
function buildAvatarUploadOptions() {
    return buildImageUploadOptions('avatar');
}
function buildImageUploadOptions(filePrefix) {
    return {
        storage: (0, multer_1.diskStorage)({
            destination: resolveUploadsDirectory(),
            filename: (_req, file, cb) => {
                const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                cb(null, `${filePrefix}-${uniqueSuffix}${(0, path_1.extname)(file.originalname).toLowerCase()}`);
            },
        }),
        limits: {
            fileSize: resolveMaxFileSizeBytes(),
        },
        fileFilter: (_req, file, cb) => {
            const isAllowed = resolveAllowedMimeTypes().includes(file.mimetype);
            if (!isAllowed) {
                cb(new common_1.BadRequestException(`Invalid file type. Allowed: ${resolveAllowedMimeTypes().join(', ')}`), false);
                return;
            }
            cb(null, true);
        },
    };
}
function resolveUploadsDirectory() {
    const configuredDir = process.env.UPLOADS_DIR || DEFAULT_UPLOADS_DIR;
    const absoluteDir = (0, path_1.isAbsolute)(configuredDir)
        ? configuredDir
        : (0, path_1.resolve)(process.cwd(), configuredDir);
    if (!(0, fs_1.existsSync)(absoluteDir)) {
        (0, fs_1.mkdirSync)(absoluteDir, { recursive: true });
    }
    return absoluteDir;
}
function resolveMaxFileSizeBytes() {
    const rawLimit = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB ?? DEFAULT_MAX_UPLOAD_MB);
    const safeLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_MAX_UPLOAD_MB;
    return safeLimit * 1024 * 1024;
}
function resolveAllowedMimeTypes() {
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
//# sourceMappingURL=upload-security.config.js.map