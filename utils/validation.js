/**
 * Input Validation Utilities
 * Prevents XSS, SQL injection, and invalid data from entering the system
 */

/**
 * Course Name Validation
 * Allows: letters, numbers, spaces, common punctuation, +, #, /
 * Prevents: SQL injection, XSS attacks, extremely long strings
 */
export const validateCourseName = (courseName) => {
  // Check if exists
  if (!courseName) {
    return {
      valid: false,
      error: "Course name is required"
    };
  }

  // Convert to string and trim
  const name = String(courseName).trim();

  // Length checks
  if (name.length === 0) {
    return { valid: false, error: "Course name cannot be empty" };
  }

  if (name.length < 2) {
    return { valid: false, error: "Course name must be at least 2 characters" };
  }

  if (name.length > 200) {
    return { valid: false, error: "Course name must be 200 characters or less" };
  }

  // Only allow alphanumeric, spaces, common punctuation
  // Pattern: letters, numbers, spaces, +, -, /, #, ., &, (, )
  const allowedPattern = /^[a-zA-Z0-9\s\+\-\/\#\.\&\(\)]*$/;
  if (!allowedPattern.test(name)) {
    return {
      valid: false,
      error: "Course name contains invalid characters. Use letters, numbers, and basic punctuation only."
    };
  }

  // Prevent excessive spaces
  if (/\s{2,}/.test(name)) {
    return { valid: false, error: "Too many consecutive spaces. Use single spaces." };
  }

  // Prevent SQL injection attempts
  const sqlKeywords = ["DROP", "DELETE", "INSERT", "UPDATE", "UNION", "SELECT"];
  const upperName = name.toUpperCase();
  for (const keyword of sqlKeywords) {
    if (upperName.includes(keyword)) {
      return { valid: false, error: "Course name contains invalid keywords" };
    }
  }

  return { valid: true, sanitized: name };
};

/**
 * Email Validation
 * Standard email format validation
 */
export const validateEmail = (email) => {
  if (!email) {
    return { valid: false, error: "Email is required" };
  }

  const emailStr = String(email).trim().toLowerCase();

  // Length check
  if (emailStr.length === 0) {
    return { valid: false, error: "Email cannot be empty" };
  }

  if (emailStr.length > 254) {
    return { valid: false, error: "Email is too long" };
  }

  // RFC 5322 simplified regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailStr)) {
    return { valid: false, error: "Invalid email format" };
  }

  // More specific validation
  if (!emailStr.includes("@")) {
    return { valid: false, error: "Email must contain @" };
  }

  const [localPart, domain] = emailStr.split("@");

  if (localPart.length === 0 || localPart.length > 64) {
    return { valid: false, error: "Invalid email local part" };
  }

  if (domain.length === 0 || domain.length > 255) {
    return { valid: false, error: "Invalid email domain" };
  }

  // Domain must have at least one dot and valid TLD
  if (!domain.includes(".")) {
    return { valid: false, error: "Email domain must contain a dot" };
  }

  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];

  if (tld.length < 2) {
    return { valid: false, error: "Email TLD is too short" };
  }

  // Block disposable emails (common patterns)
  const disposableDomains = ["tempmail", "throwaway", "temp", "test"];
  if (disposableDomains.some(d => domain.includes(d))) {
    return { valid: false, error: "Please use a real email address" };
  }

  return { valid: true, sanitized: emailStr };
};

/**
 * Username Validation
 * Alphanumeric, underscores, dashes only
 * 3-30 characters
 */
export const validateUsername = (username) => {
  if (!username) {
    return { valid: false, error: "Username is required" };
  }

  const usernameStr = String(username).trim().toLowerCase();

  if (usernameStr.length === 0) {
    return { valid: false, error: "Username cannot be empty" };
  }

  if (usernameStr.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }

  if (usernameStr.length > 30) {
    return { valid: false, error: "Username must be 30 characters or less" };
  }

  // Allow alphanumeric, underscore, dash only
  const usernameRegex = /^[a-z0-9_-]+$/;
  if (!usernameRegex.test(usernameStr)) {
    return {
      valid: false,
      error: "Username can only contain letters, numbers, underscores, and dashes"
    };
  }

  // Cannot start or end with underscore or dash
  if (usernameStr.startsWith("_") || usernameStr.startsWith("-")) {
    return { valid: false, error: "Username cannot start with underscore or dash" };
  }

  if (usernameStr.endsWith("_") || usernameStr.endsWith("-")) {
    return { valid: false, error: "Username cannot end with underscore or dash" };
  }

  // Reserve admin/system usernames
  const reservedNames = ["admin", "root", "system", "test", "administrator", "moderator"];
  if (reservedNames.includes(usernameStr)) {
    return { valid: false, error: "This username is reserved" };
  }

  return { valid: true, sanitized: usernameStr };
};

/**
 * Password Validation
 * Minimum 8 characters
 * At least one uppercase, one lowercase, one number
 * Optional: one special character for extra strength
 */
export const validatePassword = (password, strict = false) => {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }

  const passwordStr = String(password);

  if (passwordStr.length === 0) {
    return { valid: false, error: "Password cannot be empty" };
  }

  // Minimum length
  const minLength = strict ? 12 : 8;
  if (passwordStr.length < minLength) {
    return {
      valid: false,
      error: `Password must be at least ${minLength} characters`
    };
  }

  // Maximum length (prevent extremely long strings)
  if (passwordStr.length > 128) {
    return { valid: false, error: "Password is too long (max 128 characters)" };
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(passwordStr)) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }

  // At least one lowercase letter
  if (!/[a-z]/.test(passwordStr)) {
    return { valid: false, error: "Password must contain at least one lowercase letter" };
  }

  // At least one number
  if (!/\d/.test(passwordStr)) {
    return { valid: false, error: "Password must contain at least one number" };
  }

  // Strict mode: require special character
  if (strict && !/[!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`~]/.test(passwordStr)) {
    return {
      valid: false,
      error: "Password must contain at least one special character"
    };
  }

  // Prevent common weak passwords
  const commonPasswords = [
    "password123",
    "123456789",
    "qwerty123",
    "abc123456",
    "password1"
  ];
  const lowerPassword = passwordStr.toLowerCase();
  if (commonPasswords.some(p => lowerPassword.includes(p))) {
    return { valid: false, error: "Password is too commonly used. Choose something more unique." };
  }

  return {
    valid: true,
    strength: calculatePasswordStrength(passwordStr)
  };
};

/**
 * Calculate password strength (0-4)
 * 0: Weak, 1: Fair, 2: Good, 3: Strong, 4: Very Strong
 */
const calculatePasswordStrength = (password) => {
  let strength = 0;

  // Length bonus
  if (password.length >= 12) strength += 1;
  if (password.length >= 16) strength += 1;

  // Character variety bonus
  if (/[a-z]/.test(password)) strength += 0.5;
  if (/[A-Z]/.test(password)) strength += 0.5;
  if (/\d/.test(password)) strength += 0.5;
  if (/[!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`~]/.test(password)) strength += 1;

  return Math.min(4, Math.floor(strength));
};

/**
 * URL/Slug Validation
 * For categories, tags, etc.
 */
export const validateSlug = (slug) => {
  if (!slug) {
    return { valid: false, error: "Slug is required" };
  }

  const slugStr = String(slug).trim().toLowerCase();

  if (slugStr.length === 0) {
    return { valid: false, error: "Slug cannot be empty" };
  }

  if (slugStr.length > 100) {
    return { valid: false, error: "Slug must be 100 characters or less" };
  }

  // Slugs should be alphanumeric with hyphens only
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slugStr)) {
    return {
      valid: false,
      error: "Slug can only contain lowercase letters, numbers, and hyphens"
    };
  }

  // Cannot start or end with hyphen
  if (slugStr.startsWith("-") || slugStr.endsWith("-")) {
    return { valid: false, error: "Slug cannot start or end with hyphen" };
  }

  return { valid: true, sanitized: slugStr };
};

/**
 * Number Validation (for ratings, scores, etc.)
 */
export const validateNumber = (value, min = 0, max = 100) => {
  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, error: "Must be a valid number" };
  }

  if (num < min) {
    return { valid: false, error: `Must be at least ${min}` };
  }

  if (num > max) {
    return { valid: false, error: `Must not exceed ${max}` };
  }

  return { valid: true, sanitized: num };
};

/**
 * Sanitize Input
 * Removes potentially harmful characters/scripts
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") {
    return String(input);
  }

  return input
    .trim()
    // Remove script tags
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    // Remove HTML tags
    .replace(/<[^>]+>/g, "")
    // Escape HTML special characters
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

/**
 * Validate All Auth Fields
 * Convenience function for login/signup validation
 */
export const validateAuthFields = (fields) => {
  const errors = {};

  if (fields.email) {
    const emailValidation = validateEmail(fields.email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.error;
    }
  }

  if (fields.username) {
    const usernameValidation = validateUsername(fields.username);
    if (!usernameValidation.valid) {
      errors.username = usernameValidation.error;
    }
  }

  if (fields.password) {
    const passwordValidation = validatePassword(fields.password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};
