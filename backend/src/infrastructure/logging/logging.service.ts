import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  AUDIT = 'AUDIT',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class LoggingService {
  private readonly logDir = path.join(process.cwd(), 'logs');

  constructor() {
    this.ensureLogDirectoryExists();
  }

  private ensureLogDirectoryExists() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeLog(entry: LogEntry, fileName: string) {
    const logFile = path.join(this.logDir, fileName);
    const logLine = JSON.stringify(entry) + '\n';
    
    fs.appendFileSync(logFile, logLine, { encoding: 'utf-8' });
  }

  log(message: string, context?: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
      metadata,
    };
    
    this.writeLog(entry, 'application.log');
  }

  error(message: string, error?: Error, context?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
      metadata: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };
    
    this.writeLog(entry, 'errors.log');
  }

  audit(action: string, userId: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.AUDIT,
      message: action,
      userId,
      metadata,
    };
    
    this.writeLog(entry, 'audit.log');
  }

  warn(message: string, context?: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context,
      metadata,
    };
    
    this.writeLog(entry, 'application.log');
  }

  debug(message: string, context?: string, metadata?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        message,
        context,
        metadata,
      };
      
      this.writeLog(entry, 'debug.log');
    }
  }
}
