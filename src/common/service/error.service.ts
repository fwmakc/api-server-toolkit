import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

const PG_ERROR_MAP: Record<string, new (msg: string) => Error> = {
  '23505': ConflictException, // unique_violation
  '23503': ConflictException, // foreign_key_violation
  '23502': BadRequestException, // not_null_violation
  '23514': BadRequestException, // check_violation
  '22P02': BadRequestException, // invalid_text_representation
  '42P01': InternalServerErrorException, // undefined_table
  '42703': InternalServerErrorException, // undefined_column
  '08006': ServiceUnavailableException, // connection_failure
  '08001': ServiceUnavailableException, // sqlclient_unable_to_establish_sqlconnection
  '40001': ServiceUnavailableException, // serialization_failure (deadlock)
  '40P01': ServiceUnavailableException, // deadlock_detected
  '57014': ServiceUnavailableException, // query_canceled (timeout)
  '57P03': ServiceUnavailableException, // cannot_connect_now
};

const SAFE_MESSAGES: Record<string, string> = {
  ConflictException: 'Resource already exists or has conflicting references',
  BadRequestException: 'Invalid request data',
  ServiceUnavailableException: 'Service temporarily unavailable',
  InternalServerErrorException: 'Internal server error',
};

const logger = new Logger('Database');

export function throwDbError(e: unknown): never {
  const err = e as Record<string, unknown>;
  const pgCode = err?.code as string | undefined;
  const detail = (err?.detail || err?.message || '') as string;

  logger.error(`DB error [${pgCode || 'unknown'}]: ${detail}`, (e as Error)?.stack);

  if (pgCode && PG_ERROR_MAP[pgCode]) {
    const ExceptionClass = PG_ERROR_MAP[pgCode];
    const safeMsg = SAFE_MESSAGES[ExceptionClass.name] || 'Request failed';
    throw new ExceptionClass(safeMsg);
  }

  if (e instanceof BadRequestException ||
      e instanceof NotFoundException ||
      e instanceof ForbiddenException ||
      e instanceof UnauthorizedException ||
      e instanceof ConflictException) {
    throw e;
  }

  if (err?.message && typeof err.message === 'string') {
    throw new InternalServerErrorException('Internal server error');
  }

  throw new InternalServerErrorException('Internal server error');
}
