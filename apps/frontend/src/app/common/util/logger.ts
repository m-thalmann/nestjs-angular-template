type LoggerType = keyof Pick<Console, 'error' | 'info' | 'log' | 'warn'>;

export class Logger {
  constructor(private readonly context: string) {}

  log(...message: Array<unknown>): void {
    Logger.write(this.context, 'log', ...message);
  }
  info(...message: Array<unknown>): void {
    Logger.write(this.context, 'info', ...message);
  }
  warn(...message: Array<unknown>): void {
    Logger.write(this.context, 'warn', ...message);
  }
  error(...message: Array<unknown>): void {
    Logger.write(this.context, 'error', ...message);
  }

  static log(context: string, ...message: Array<unknown>): void {
    Logger.write(context, 'log', ...message);
  }
  static info(context: string, ...message: Array<unknown>): void {
    Logger.write(context, 'info', ...message);
  }
  static warn(context: string, ...message: Array<unknown>): void {
    Logger.write(context, 'warn', ...message);
  }
  static error(context: string, ...message: Array<unknown>): void {
    Logger.write(context, 'error', ...message);
  }

  protected static write(context: string, type: LoggerType, ...message: Array<unknown>): void {
    if (Logger.isRunningInTestEnvironment()) {
      // do not log in tests
      return;
    }

    // eslint-disable-next-line no-console
    console[type](`%c ${context} `, `color: white; background: orange; border-radius: 2px`, ...message);
  }

  // TODO: move to a shared util lib
  protected static isRunningInTestEnvironment(): boolean {
    if ('process' in window) {
      return (window.process as unknown as { env: { NODE_ENV: string } }).env.NODE_ENV === 'test';
    }

    return false;
  }
}
