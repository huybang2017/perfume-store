import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { MSG } from '../i18n/messages.en';

function resolveExceptionMessage(exception: HttpException): string {
  const res = exception.getResponse();

  if (typeof res === 'string') {
    return res;
  }

  const raw = (res as Record<string, unknown>).message ?? exception.message;

  if (Array.isArray(raw)) {
    return raw.map(String).join(', ');
  }

  return typeof raw === 'string' ? raw : String(raw);
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = MSG.INTERNAL;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = resolveExceptionMessage(exception);
    } else if (process.env.NODE_ENV !== 'production') {
      const err = exception as { message?: string; cause?: { message?: string } };
      message =
        err.cause?.message ??
        err.message ??
        message;
    }

    if (process.env.NODE_ENV !== 'production') {
      this.logger.error(exception);
    } else {
      this.logger.warn(`[${status}] ${message}`);
    }

    response.status(status).json({
      success: false,
      message,
      data: null,
    });
  }
}
