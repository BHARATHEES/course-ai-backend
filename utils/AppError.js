/**
 * Custom Application Error Class
 * Extends native Error with status code and other metadata
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date();
    
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Convert error to JSON format for API response
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      code: this.code || this.statusCode,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === "development" && { stack: this.stack })
    };
  }

  /**
   * Predefined error factory methods
   */
  static badRequest(message) {
    return new AppError(message, 400, "BAD_REQUEST");
  }

  static unauthorized(message = "Unauthorized access") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "Access denied") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static notFound(resource = "Resource") {
    return new AppError(`${resource} not found`, 404, "NOT_FOUND");
  }

  static conflict(message) {
    return new AppError(message, 409, "CONFLICT");
  }

  static validation(message) {
    return new AppError(message, 422, "VALIDATION_ERROR");
  }

  static serverError(message = "Internal server error") {
    return new AppError(message, 500, "SERVER_ERROR");
  }

  static serviceUnavailable(message = "Service temporarily unavailable") {
    return new AppError(message, 503, "SERVICE_UNAVAILABLE");
  }
}

export default AppError;
