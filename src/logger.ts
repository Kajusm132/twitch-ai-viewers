import colors from 'colors';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export class Logger {
  private static instance: Logger;
  private isDebug: boolean;

  private constructor() {
    this.isDebug = process.env.DEBUG === 'true';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
    ).join(' ');

    return `[${timestamp}] [${level}] ${message} ${formattedArgs}`;
  }

  private log(level: LogLevel, message: string, ...args: any[]) {
    const formattedMessage = this.formatMessage(level, message, ...args);
    
    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDebug) {
          console.debug(colors.gray(formattedMessage));
        }
        break;
      case LogLevel.INFO:
        console.log(colors.blue(formattedMessage));
        break;
      case LogLevel.WARN:
        console.warn(colors.yellow(formattedMessage));
        break;
      case LogLevel.ERROR:
        console.error(colors.red(formattedMessage));
        break;
    }
  }

  public debug(message: string, ...args: any[]) {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  public info(message: string, ...args: any[]) {
    this.log(LogLevel.INFO, message, ...args);
  }

  public warn(message: string, ...args: any[]) {
    this.log(LogLevel.WARN, message, ...args);
  }

  public error(message: string, ...args: any[]) {
    this.log(LogLevel.ERROR, message, ...args);
  }
}

export const logger = Logger.getInstance(); 