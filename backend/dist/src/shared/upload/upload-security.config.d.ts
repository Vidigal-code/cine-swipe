export declare function buildMovieUploadOptions(): {
    storage: import("multer").StorageEngine;
    limits: {
        fileSize: number;
    };
    fileFilter: (_req: unknown, file: Express.Multer.File, cb: FileFilterCb) => void;
};
export declare function buildAvatarUploadOptions(): {
    storage: import("multer").StorageEngine;
    limits: {
        fileSize: number;
    };
    fileFilter: (_req: unknown, file: Express.Multer.File, cb: FileFilterCb) => void;
};
type FileFilterCb = (error: Error | null, acceptFile: boolean) => void;
export {};
