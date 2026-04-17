import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Verhindert, dass unbehandelte Fehler (Prisma, Bugs) Stacktraces oder interne Texte an Clients senden.
 * HTTP-Fehler (< 500) bleiben bewusst nutzerlesbar (Validierung, Auth).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProd = process.env.NODE_ENV === 'production';

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const body =
        typeof res === 'string'
          ? { statusCode: status, message: res }
          : { statusCode: status, ...(res as object) };

      if (isProd && status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `${request.method} ${request.url} → ${status}`,
          exception instanceof Error ? exception.stack : String(exception),
        );
        response.status(status).json({
          statusCode: status,
          message: 'Interner Serverfehler. Bitte später erneut versuchen.',
        });
        return;
      }

      response.status(status).json(body);
      return;
    }

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: isProd
        ? 'Interner Serverfehler. Bitte später erneut versuchen.'
        : exception instanceof Error
          ? exception.message
          : 'Interner Serverfehler',
    });
  }
}
