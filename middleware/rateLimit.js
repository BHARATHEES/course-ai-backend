/**
 * API Rate Limiting Middleware
 * Prevents abuse by limiting requests per user/IP
 * 
 * Uses express-rate-limit with in-memory store
 * Suitable for mini projects and single-server deployments
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Key generators for rate limiting
 */
const userKeyGenerator = (req) => {
  // If user is authenticated, use userId
  if (req.user && req.user.userId) {
    return `user:${req.user.userId}`;
  }
  // Otherwise fall back to IP using the proper helper
  return ipKeyGenerator(req);
};

/**
 * Handler for when rate limit is exceeded
 */
const handleRateLimitExceeded = (req, res, options) => {
  res.status(options.statusCode).json({
    success: false,
    message: options.message || "Too many requests. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
    statusCode: options.statusCode,
    retryAfter: req.rateLimit.resetTime ? new Date(req.rateLimit.resetTime * 1000) : null,
    details: {
      limit: req.rateLimit.limit,
      current: req.rateLimit.current,
      resetTime: req.rateLimit.resetTime
    }
  });
};

/**
 * Rate Limiter for Course Analysis Endpoint
 * 
 * Limits: 20 requests per hour per user
 * 
 * This prevents abuse of expensive AI analysis operations
 */
export const analyzeRateLimit = rateLimit({
  keyGenerator: userKeyGenerator,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour
  standardHeaders: false, // Don't set `RateLimit-*` headers
  skip: (req) => {
    // Don't rate limit admin users (if needed in future)
    return false;
  },
  message: 'You have exceeded the 20 analysis requests per hour limit. Please try again later.',
  statusCode: 429,
  handler: handleRateLimitExceeded
});

/**
 * Rate Limiter for Login Endpoint
 * 
 * Limits: 5 attempts per 15 minutes per IP
 * 
 * This prevents brute force attacks on login
 */
export const loginRateLimit = rateLimit({
  keyGenerator: ipKeyGenerator,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  standardHeaders: false,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  statusCode: 429,
  handler: handleRateLimitExceeded
});

/**
 * Rate Limiter for Google Auth Endpoint
 * 
 * Limits: 10 attempts per 15 minutes per IP
 * 
 * Less strict than login since Google provides its own protection
 */
export const googleAuthRateLimit = rateLimit({
  keyGenerator: ipKeyGenerator,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  standardHeaders: false,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  statusCode: 429,
  handler: handleRateLimitExceeded
});

/**
 * Rate Limiter for Password Update Endpoint
 * 
 * Limits: 3 attempts per hour per user
 * 
 * Prevents spam and brute force password changes
 */
export const passwordUpdateRateLimit = rateLimit({
  keyGenerator: (req) => {
    // Use email from request as key (not authenticated yet)
    return `email:${req.body?.email || ipKeyGenerator(req)}`;
  },
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  standardHeaders: false,
  message: 'Too many password change attempts. Please try again in 1 hour.',
  statusCode: 429,
  handler: handleRateLimitExceeded
});

/**
 * Rate Limiter for General API Endpoints
 * 
 * Limits: 100 requests per minute per user/IP
 * 
 * Applied globally to catch other abuse patterns
 */
export const generalApiRateLimit = rateLimit({
  keyGenerator: userKeyGenerator,
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: false,
  skip: (req) => {
    // Don't rate limit health check endpoints
    return req.path === '/health' || req.path === '/status';
  },
  handler: handleRateLimitExceeded
});

/**
 * Rate Limiter for Favorite Operations
 * 
 * Limits: 30 requests per hour per user
 */
export const favoritesRateLimit = rateLimit({
  keyGenerator: userKeyGenerator,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 requests per hour
  standardHeaders: false,
  handler: handleRateLimitExceeded
});

/**
 * Rate Limiter for History Operations
 * 
 * Limits: 50 requests per hour per user
 */
export const historyRateLimit = rateLimit({
  keyGenerator: userKeyGenerator,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per hour
  standardHeaders: false,
  handler: handleRateLimitExceeded
});

export default {
  analyzeRateLimit,
  loginRateLimit,
  googleAuthRateLimit,
  passwordUpdateRateLimit,
  generalApiRateLimit,
  favoritesRateLimit,
  historyRateLimit
};
