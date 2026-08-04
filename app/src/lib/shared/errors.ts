// ─── Typed Error Classes ────────────────────────────────────────────────────
// Rule: never throw raw strings; give every error a machine-readable `code`.

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    // Restore prototype chain so `instanceof` works after transpilation
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message = "A database error occurred.", context?: Record<string, unknown>) {
    super(message, "DATABASE_ERROR", 500, context);
    this.name = "DatabaseError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} "${id}" not found` : `${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message, "VALIDATION_ERROR", 422);
    this.name = "ValidationError";
  }
}

// ─── Type Guards ─────────────────────────────────────────────────────────────
// Always narrow with isAppError() in catch blocks before accessing properties.

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

// ─── Legacy Helper ───────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
