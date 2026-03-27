import {
  validateCourseName,
  validateEmail,
  validateUsername,
  validatePassword,
  validateAuthFields,
  sanitizeInput
} from "../utils/validation.js";

/**
 * Validation Middleware Factory
 * Creates middleware functions for specific validation scenarios
 */

/**
 * Validate Course Analysis Request
 * Required: courseName (string)
 */
export const validateCourseAnalysis = (req, res, next) => {
  try {
    const { courseName } = req.body;
    console.log("📝 [VALIDATE] Course Analysis validation started for:", courseName);

    const validation = validateCourseName(courseName);
    console.log("📝 [VALIDATE] Validation result:", validation);
    
    if (!validation.valid) {
      console.log("📝 [VALIDATE] ❌ Validation failed:", validation.error);
      return res.status(400).json({
        error: "Invalid course name",
        message: validation.error
      });
    }
    console.log("📝 [VALIDATE] ✅ Validation passed");

    // Sanitize and attach to request
    req.validatedData = {
      courseName: validation.sanitized
    };

    next();
  } catch (err) {
    res.status(400).json({
      error: "Validation error",
      message: err.message
    });
  }
};

/**
 * Validate Login Request
 * Required: identifier (email or username), password
 */
export const validateLoginRequest = (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    // Check identifier exists
    if (!identifier || String(identifier).trim().length === 0) {
      return res.status(400).json({
        error: "Invalid identifier",
        message: "Email or username is required"
      });
    }

    // Check password exists
    if (!password || String(password).length === 0) {
      return res.status(400).json({
        error: "Invalid password",
        message: "Password is required"
      });
    }

    const sanitizedIdentifier = sanitizeInput(String(identifier).trim());

    // Validate password length at least
    if (String(password).length < 6) {
      return res.status(400).json({
        error: "Invalid password",
        message: "Password must be at least 6 characters"
      });
    }

    req.validatedData = {
      identifier: sanitizedIdentifier,
      password: String(password) // Don't sanitize passwords
    };

    next();
  } catch (err) {
    res.status(400).json({
      error: "Validation error",
      message: err.message
    });
  }
};

/**
 * Validate Signup Request
 * Required: email, username, password
 */
export const validateSignupRequest = (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        error: "Invalid email",
        message: emailValidation.error
      });
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({
        error: "Invalid username",
        message: usernameValidation.error
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: "Invalid password",
        message: passwordValidation.error
      });
    }

    req.validatedData = {
      email: emailValidation.sanitized,
      username: usernameValidation.sanitized,
      password: String(password) // Don't sanitize passwords
    };

    next();
  } catch (err) {
    res.status(400).json({
      error: "Validation error",
      message: err.message
    });
  }
};

/**
 * Validate Set Password Request
 * Required: email, username, password
 */
export const validateSetPasswordRequest = (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        error: "Invalid email",
        message: emailValidation.error
      });
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({
        error: "Invalid username",
        message: usernameValidation.error
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: "Invalid password",
        message: passwordValidation.error
      });
    }

    req.validatedData = {
      email: emailValidation.sanitized,
      username: usernameValidation.sanitized,
      password: String(password)
    };

    next();
  } catch (err) {
    res.status(400).json({
      error: "Validation error",
      message: err.message
    });
  }
};

/**
 * Validate Update Password Request
 * Required: email, newPassword
 */
export const validateUpdatePasswordRequest = (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        error: "Invalid email",
        message: emailValidation.error
      });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: "Invalid password",
        message: passwordValidation.error
      });
    }

    req.validatedData = {
      email: emailValidation.sanitized,
      newPassword: String(newPassword)
    };

    next();
  } catch (err) {
    res.status(400).json({
      error: "Validation error",
      message: err.message
    });
  }
};

/**
 * Validate Update Profile Request
 * Required: email, name, username
 */
export const validateUpdateProfileRequest = (req, res, next) => {
  try {
    const { email, name, username } = req.body;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        error: "Invalid email",
        message: emailValidation.error
      });
    }

    // Validate name
    if (!name || String(name).trim().length === 0) {
      return res.status(400).json({
        error: "Invalid name",
        message: "Name is required"
      });
    }

    const sanitizedName = sanitizeInput(String(name).trim());
    if (sanitizedName.length < 2) {
      return res.status(400).json({
        error: "Invalid name",
        message: "Name must be at least 2 characters"
      });
    }

    if (sanitizedName.length > 100) {
      return res.status(400).json({
        error: "Invalid name",
        message: "Name must be 100 characters or less"
      });
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({
        error: "Invalid username",
        message: usernameValidation.error
      });
    }

    req.validatedData = {
      email: emailValidation.sanitized,
      name: sanitizedName,
      username: usernameValidation.sanitized
    };

    next();
  } catch (err) {
    res.status(400).json({
      error: "Validation error",
      message: err.message
    });
  }
};

/**
 * Validate Add Favorite Request
 * Required: userId, courseName
 * Optional: analysisResult, notes
 */
export const validateAddFavoriteRequest = (req, res, next) => {
  try {
    const { userId, courseName, notes } = req.body;

    // Validate userId
    if (!userId || String(userId).trim().length === 0) {
      return res.status(400).json({
        error: "Invalid userId",
        message: "User ID is required"
      });
    }

    // Validate course name
    const courseValidation = validateCourseName(courseName);
    if (!courseValidation.valid) {
      return res.status(400).json({
        error: "Invalid course name",
        message: courseValidation.error
      });
    }

    // Validate notes if provided
    let sanitizedNotes = "";
    if (notes && String(notes).length > 0) {
      sanitizedNotes = sanitizeInput(String(notes).trim());
      if (sanitizedNotes.length > 500) {
        return res.status(400).json({
          error: "Invalid notes",
          message: "Notes must be 500 characters or less"
        });
      }
    }

    req.validatedData = {
      userId: String(userId).trim(),
      courseName: courseValidation.sanitized,
      notes: sanitizedNotes
    };

    next();
  } catch (err) {
    res.status(400).json({
      error: "Validation error",
      message: err.message
    });
  }
};

/**
 * Validate Save Course Analysis Request
 * Required: userId, courseName, analysisResult
 */
export const validateSaveSearchRequest = (req, res, next) => {
  try {
    const { userId, courseName, analysisResult } = req.body;

    // Validate userId
    if (!userId || String(userId).trim().length === 0) {
      return res.status(400).json({
        error: "Invalid userId",
        message: "User ID is required"
      });
    }

    // Validate course name
    const courseValidation = validateCourseName(courseName);
    if (!courseValidation.valid) {
      return res.status(400).json({
        error: "Invalid course name",
        message: courseValidation.error
      });
    }

    req.validatedData = {
      userId: String(userId).trim(),
      courseName: courseValidation.sanitized,
      analysisResult: analysisResult || null
    };

    next();
  } catch (err) {
    res.status(400).json({
      error: "Validation error",
      message: err.message
    });
  }
};

/**
 * Generic Input Sanitizer Middleware
 * Sanitizes all string values in request body
 */
export const sanitizeRequestBody = (req, res, next) => {
  if (!req.body) {
    return next();
  }

  Object.keys(req.body).forEach(key => {
    if (typeof req.body[key] === "string") {
      // Don't sanitize passwords or sensitive fields
      if (!["password", "newPassword", "currentPassword"].includes(key)) {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    }
  });

  next();
};
