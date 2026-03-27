import jwt from "jsonwebtoken";

/**
 * Authentication Middleware
 * Verifies JWT token from cookies or Authorization header
 * Attaches user object to req.user if valid
 * Returns 401 if token is invalid or missing
 */
export const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header first, then fall back to cookies
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ 
        message: "Unauthorized: No token provided",
        error: "MISSING_TOKEN"
      });
    }

    // Verify token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured. Set it in .env file.");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ 
        message: "Token expired. Please login again.",
        error: "TOKEN_EXPIRED"
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        message: "Invalid token.",
        error: "INVALID_TOKEN"
      });
    }

    return res.status(401).json({ 
      message: "Authentication failed",
      error: err.message
    });
  }
};

/**
 * Optional Authentication Middleware
 * Does not reject if token is missing, but verifies if present
 */
export const optionalAuth = (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (token) {
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured. Set it in .env file.");
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        userId: decoded.userId,
        email: decoded.email
      };
    }

    next();
  } catch (err) {
    // Skip auth errors for optional auth, just continue without user
    next();
  }
};
