import { Type } from '@angular/core';
import { ObjectValues } from '@shared/common';

export const LoggerType = {
  Log: 'log',
  Info: 'info',
  Warn: 'warn',
  Error: 'error',
} as const;

export type LoggerType = ObjectValues<typeof LoggerType>;

export class Logger {
  constructor(public readonly scope: string) {}

  write(type: LoggerType, ...message: Array<unknown>): void {
    // eslint-disable-next-line no-console
    console[type](`%c ${this.scope} `, `color: white; background: darkCyan; border-radius: 2px`, ...message);
  }

  log(...message: Array<unknown>): void {
    this.write(LoggerType.Log, ...message);
  }
  info(...message: Array<unknown>): void {
    this.write(LoggerType.Info, ...message);
  }
  warn(...message: Array<unknown>): void {
    this.write(LoggerType.Warn, ...message);
  }
  error(...message: Array<unknown>): void {
    this.write(LoggerType.Error, ...message);
  }

  static create(module: Type<unknown>): Logger {
    let moduleName = module.name;

    if (moduleName.startsWith('_')) {
      moduleName = moduleName.substring(1);
    }

    return new Logger(moduleName);
  }
}
