/**
 * Input Validation Middleware
 * 
 * Provides validation helpers for request data (body, query, params).
 * Enforces length limits, required fields, and data types.
 * 
 * @see FR-011: Input validation requirements
 * @see Constitution Principle III - Data Integrity
 */

const { AppError } = require('./errorHandler');

/**
 * Validation rules for common fields
 */
const VALIDATION_RULES = {
  item: {
    name: { type: 'string', required: true, maxLength: 100, minLength: 1 },
    description: { type: 'string', required: false, maxLength: 500 },
    category: { type: 'string', required: true, maxLength: 50, minLength: 1 },
    status: { type: 'enum', required: true, values: ['Available', 'Lent', 'Maintenance'] },
  },
  user: {
    name: { type: 'string', required: true, maxLength: 100, minLength: 1 },
    email: { type: 'email', required: true, maxLength: 255 },
    role: { type: 'string', required: false, maxLength: 50 },
  },
  lendingLog: {
    itemId: { type: 'uuid', required: true },
    userId: { type: 'uuid', required: true },
    conditionNotes: { type: 'string', required: false, maxLength: 500 },
  },
};

/**
 * Validate email format
 * 
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 * 
 * @param {string} uuid - UUID string
 * @returns {boolean} True if valid
 */
function isValidUuid(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate a single field against a rule
 * 
 * @param {string} fieldName - Field name
 * @param {*} value - Field value
 * @param {Object} rule - Validation rule
 * @returns {Object|null} Error object or null if valid
 */
function validateField(fieldName, value, rule) {
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      code: 'REQUIRED_FIELD',
    };
  }
  
  // Skip further validation if optional and not provided
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return null;
  }
  
  // Type validation
  if (rule.type === 'string' && typeof value !== 'string') {
    return {
      field: fieldName,
      message: `${fieldName} must be a string`,
      code: 'INVALID_TYPE',
    };
  }
  
  if (rule.type === 'number' && typeof value !== 'number') {
    return {
      field: fieldName,
      message: `${fieldName} must be a number`,
      code: 'INVALID_TYPE',
    };
  }
  
  if (rule.type === 'boolean' && typeof value !== 'boolean') {
    return {
      field: fieldName,
      message: `${fieldName} must be a boolean`,
      code: 'INVALID_TYPE',
    };
  }
  
  // Email validation
  if (rule.type === 'email' && !isValidEmail(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid email address`,
      code: 'INVALID_EMAIL',
    };
  }
  
  // UUID validation
  if (rule.type === 'uuid' && !isValidUuid(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid UUID`,
      code: 'INVALID_UUID',
    };
  }
  
  // Enum validation
  if (rule.type === 'enum' && !rule.values.includes(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be one of: ${rule.values.join(', ')}`,
      code: 'INVALID_ENUM',
      allowedValues: rule.values,
    };
  }
  
  // Length validation for strings
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${rule.minLength} characters`,
        code: 'TOO_SHORT',
      };
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      return {
        field: fieldName,
        message: `${fieldName} must not exceed ${rule.maxLength} characters`,
        code: 'TOO_LONG',
      };
    }
  }
  
  // Range validation for numbers
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${rule.min}`,
        code: 'TOO_SMALL',
      };
    }
    
    if (rule.max !== undefined && value > rule.max) {
      return {
        field: fieldName,
        message: `${fieldName} must not exceed ${rule.max}`,
        code: 'TOO_LARGE',
      };
    }
  }
  
  return null;
}

/**
 * Validate data against a schema
 * 
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} { isValid: boolean, errors: Array }
 */
function validate(data, schema) {
  const errors = [];
  
  for (const fieldName in schema) {
    if (Object.prototype.hasOwnProperty.call(schema, fieldName)) {
      const rule = schema[fieldName];
      const value = data[fieldName];
      
      const error = validateField(fieldName, value, rule);
      if (error) {
        errors.push(error);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create validation middleware for a specific schema
 * 
 * @param {string} schemaName - Name of predefined schema
 * @param {string} source - Data source: 'body' | 'query' | 'params'
 * @returns {Function} Express middleware
 */
function validateSchema(schemaName, source = 'body') {
  return (req, res, next) => {
    const schema = VALIDATION_RULES[schemaName];
    
    if (!schema) {
      return next(
        new AppError(`Unknown validation schema: ${schemaName}`, 500, 'INVALID_SCHEMA'),
      );
    }
    
    const data = req[source];
    const result = validate(data, schema);
    
    if (!result.isValid) {
      return next(
        new AppError('Validation failed', 400, 'VALIDATION_ERROR', {
          errors: result.errors,
        }),
      );
    }
    
    next();
  };
}

/**
 * Create custom validation middleware
 * 
 * @param {Object} schema - Custom validation schema
 * @param {string} source - Data source: 'body' | 'query' | 'params'
 * @returns {Function} Express middleware
 */
function validateCustom(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    const result = validate(data, schema);
    
    if (!result.isValid) {
      return next(
        new AppError('Validation failed', 400, 'VALIDATION_ERROR', {
          errors: result.errors,
        }),
      );
    }
    
    next();
  };
}

/**
 * Sanitize input by trimming whitespace and removing null bytes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function sanitizeInput(req, res, next) {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove null bytes and trim whitespace
      return value.replace(/\0/g, '').trim();
    }
    if (typeof value === 'object' && value !== null) {
      return sanitizeObject(value);
    }
    return value;
  };
  
  const sanitizeObject = (obj) => {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeValue(obj[key]);
      }
    }
    return sanitized;
  };
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
}

module.exports = {
  validate,
  validateSchema,
  validateCustom,
  validateField,
  sanitizeInput,
  VALIDATION_RULES,
};
