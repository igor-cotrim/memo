// ─── Base App Error ──────────────────────────────────────────────────────────

export abstract class AppError extends Error {
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// ─── Specific Errors ─────────────────────────────────────────────────────────

export class NotFoundError extends AppError {
  readonly statusCode = 404;

  constructor(resource: string, id?: string) {
    super(id ? `${resource} with id '${id}' not found` : `${resource} not found`);
  }
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;

  constructor(message = 'Unauthorized') {
    super(message);
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;

  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;

  constructor(message = 'Forbidden') {
    super(message);
  }
}
