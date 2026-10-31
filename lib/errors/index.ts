export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized: Caller is not permitted to perform this action.") {
    super(message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Forbidden: Insufficient permissions for this organization.") {
    super(message, "FORBIDDEN");
  }
}

export class TaskNotFoundError extends DomainError {
  constructor(message = "Task not found or access denied.") {
    super(message, "TASK_NOT_FOUND");
  }
}

export class InvalidAssigneeError extends DomainError {
  constructor(message = "Invalid assignee: Assignee must be an active member of the same organization.") {
    super(message, "INVALID_ASSIGNEE");
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, public readonly issues?: unknown) {
    super(message, "VALIDATION_ERROR");
  }
}

export class NoMembershipsError extends DomainError {
  constructor(message = "User does not belong to any active organizations.") {
    super(message, "NO_MEMBERSHIPS");
  }
}

export class ConflictError extends DomainError {
  constructor(message = "Conflict: The requested operation conflicts with an existing resource.") {
    super(message, "CONFLICT");
  }
}


