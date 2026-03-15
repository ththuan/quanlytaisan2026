import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { ValidationError } from '../utils/errorHandler';

export const validateBody = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail: any) => {
        const field = detail.path.join('.');
        const message = detail.message.replace(/"/g, '');
        return `${field}: ${message}`;
      });
      const errorMessage = `Lỗi xác thực dữ liệu: ${errorMessages.join(', ')}`;
      return next(new ValidationError(errorMessage, error.details));
    }

    // Replace request body with validated value
    req.body = value;
    next();
  };
};

export const validateParams = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errorMessages = error.details.map((detail: any) => {
        const field = detail.path.join('.');
        const message = detail.message.replace(/"/g, '');
        return `${field}: ${message}`;
      });
      const errorMessage = `Lỗi xác thực tham số: ${errorMessages.join(', ')}`;
      return next(new ValidationError(errorMessage, error.details));
    }

    req.params = value;
    next();
  };
};

// Export alias for compatibility
export const validateRequest = validateBody;

export const validateQuery = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      const errorMessages = error.details.map((detail: any) => {
        const field = detail.path.join('.');
        const message = detail.message.replace(/"/g, '');
        return `${field}: ${message}`;
      });
      const errorMessage = `Lỗi xác thực query: ${errorMessages.join(', ')}`;
      return next(new ValidationError(errorMessage, error.details));
    }

    req.query = value;
    next();
  };
};
