import AppError from "../utils/AppError.js";

/**
 * Centralized Error Handling Middleware
 * Should be placed at the END of all route definitions
 * 
 * Usage in index.js:
 * // ... all routes ...
 * app.use(errorHandler);
 */
const errorHandler = (err, req, res, next) => {
  // Ensure error object has required properties
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Log error for monitoring
  logError(err, req);

  // Convert Mongoose validation errors
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map(e => e.message)
      .join(", ");
    
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      statusCode: 422,
      details: message,
      timestamp: new Date()
    });
  }

  // Convert Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      code: "CONFLICT",
      statusCode: 409,
      field,
      timestamp: new Date()
    });
  }

  // Convert Mongoose cast errors (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
      code: "BAD_REQUEST",
      statusCode: 400,
      timestamp: new Date()
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      code: "UNAUTHORIZED",
      statusCode: 401,
      timestamp: new Date()
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token has expired",
      code: "UNAUTHORIZED",
      statusCode: 401,
      timestamp: new Date()
    });
  }

  // Handle AppError instances (custom errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code || err.statusCode,
      statusCode: err.statusCode,
      timestamp: err.timestamp,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
  }

  // Handle generic errors
  const isDevelopment = process.env.NODE_ENV === "development";
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: isDevelopment ? err.message : "An unexpected error occurred",
    code: err.code || (statusCode >= 500 ? "SERVER_ERROR" : "ERROR"),
    statusCode,
    timestamp: new Date(),
    ...(isDevelopment && { 
      stack: err.stack,
      originalError: err.message 
    })
  });
};

/**
 * Log errors for debugging and monitoring
 */
const logError = (err, req) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip;
  const statusCode = err.statusCode || 500;
  const message = err.message;

  // Color codes for console output (for development)
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction) {
    // In production, log to file or monitoring service
    console.error({
      timestamp,
      method,
      url,
      ip,
      statusCode,
      message,
      stack: err.stack,
      code: err.code
    });
  } else {
    // In development, log with colors
    const statusColor = statusCode >= 500 ? "\x1b[31m" : "\x1b[33m"; // Red for 5xx, Yellow for 4xx
    const reset = "\x1b[0m";
    
    console.error(
      `${statusColor}[${timestamp}] ${method} ${url}${reset} - ` +
      `${statusCode} ${message}`
    );
  }
};

/**
 * Async route wrapper to automatically catch errors
 * Usage: app.get("/route", asyncHandler(controllerFunction))
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default errorHandler;
