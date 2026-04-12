import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Domain-layer exception. Services throw this instead of raw NestJS
 * exceptions so error codes are stable across API versions and consumers can
 * switch-case on them.
 */
export class BusinessException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    statusCode: HttpStatus,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(
      {
        errorCode,
        message,
        statusCode,
        metadata: metadata ?? undefined,
      },
      statusCode,
    );
  }
}
