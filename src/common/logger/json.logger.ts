import { LoggerService } from '@nestjs/common';
import { getRequestId } from './request.context';

/**
 * One-line JSON per log entry: timestamp, level, context, requestId (when
 * inside a request), message and stack. Install with `app.useLogger()`
 * (done automatically by `Log.setup` when `LOG_FORMAT=json`).
 */
export class JsonLogger implements LoggerService {
  log(message: any, context?: string): void {
    this.emit('log', message, undefined, context);
  }

  error(message: any, stackOrContext?: string, context?: string): void {
    // Nest's convention: error(message, stack?, context?) — the second
    // argument is a stack only when a context follows it.
    const stack = context !== undefined ? stackOrContext : undefined;
    const ctx = context ?? (typeof stackOrContext === 'string' ? stackOrContext : undefined);
    this.emit('error', message, stack, ctx);
  }

  warn(message: any, context?: string): void {
    this.emit('warn', message, undefined, context);
  }

  debug?(message: any, context?: string): void {
    this.emit('debug', message, undefined, context);
  }

  verbose?(message: any, context?: string): void {
    this.emit('verbose', message, undefined, context);
  }

  fatal?(message: any, stackOrContext?: string, context?: string): void {
    const stack = context !== undefined ? stackOrContext : undefined;
    const ctx = context ?? (typeof stackOrContext === 'string' ? stackOrContext : undefined);
    this.emit('fatal', message, stack, ctx);
  }

  private emit(
    level: string,
    message: any,
    stack: string | undefined,
    context: string | undefined,
  ): void {
    let text: any;
    if (typeof message === 'string') {
      text = message;
    } else if (message instanceof Error) {
      text = message.message;
      stack = stack || message.stack;
    } else {
      text = message;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context: context || undefined,
      requestId: getRequestId(),
      message: text,
      stack: stack || undefined,
    };

    const line = JSON.stringify(entry);
    if (level === 'error' || level === 'fatal') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }
}
