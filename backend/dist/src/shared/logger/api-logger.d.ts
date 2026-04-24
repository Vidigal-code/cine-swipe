export declare class ApiLogger {
    static log(message: string, context?: string): void;
    static warn(message: string, context?: string): void;
    static error(message: string, context?: string): void;
    static debug(message: string, context?: string): void;
    private static isEnabled;
}
