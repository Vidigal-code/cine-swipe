import { Logger } from '@nestjs/common';

const DISABLED_VALUES = new Set(['false', '0', 'off', 'no']);
const DEFAULT_LOGGER_ENABLED = true;
const DEFAULT_LOG_CONTEXT = 'Application';

export class ApiLogger {
  static log(message: string, context = DEFAULT_LOG_CONTEXT): void {
    if (!this.isEnabled()) {
      return;
    }
    Logger.log(message, context);
  }

  static warn(message: string, context = DEFAULT_LOG_CONTEXT): void {
    if (!this.isEnabled()) {
      return;
    }
    Logger.warn(message, context);
  }

  static error(message: string, context = DEFAULT_LOG_CONTEXT): void {
    if (!this.isEnabled()) {
      return;
    }
    Logger.error(message, context);
  }

  static debug(message: string, context = DEFAULT_LOG_CONTEXT): void {
    if (!this.isEnabled()) {
      return;
    }
    Logger.debug(message, context);
  }

  private static isEnabled(): boolean {
    const rawValue = process.env.APP_LOGGER_ENABLED;
    if (!rawValue) {
      return DEFAULT_LOGGER_ENABLED;
    }

    return !DISABLED_VALUES.has(rawValue.trim().toLowerCase());
  }
}
