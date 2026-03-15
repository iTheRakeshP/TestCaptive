import * as vscode from 'vscode';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private channel: vscode.OutputChannel;
  private level: LogLevel = LogLevel.INFO;

  constructor() {
    this.channel = vscode.window.createOutputChannel('TestCaptive');
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      this.write('DEBUG', args);
    }
  }

  info(...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      this.write('INFO', args);
    }
  }

  warn(...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      this.write('WARN', args);
    }
  }

  error(...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      this.write('ERROR', args);
    }
  }

  show(): void {
    this.channel.show(true);
  }

  dispose(): void {
    this.channel.dispose();
  }

  private write(level: string, args: any[]): void {
    const timestamp = new Date().toISOString();
    const message = args.map(a =>
      typeof a === 'string' ? a : JSON.stringify(a)
    ).join(' ');
    this.channel.appendLine(`[${timestamp}] [${level}] ${message}`);
  }
}

export const logger = new Logger();
