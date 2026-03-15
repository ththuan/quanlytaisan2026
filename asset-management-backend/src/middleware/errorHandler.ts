import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: (req as any).user?.id,
  });

  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  // Handle AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    const validationErrors = (err as any).errors || [];
    const errorMessages = validationErrors.map((e: any) => {
      const field = e.path || 'field';
      const msg = e.message || 'is invalid';
      return `${field}: ${msg}`;
    });
    message = errorMessages.length > 0 
      ? `Lỗi xác thực dữ liệu: ${errorMessages.join(', ')}`
      : 'Lỗi xác thực dữ liệu';
    isOperational = true;
  }

  // Handle Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    const field = (err as any).errors?.[0]?.path || 'field';
    message = `Dữ liệu đã tồn tại: ${field} này đã được sử dụng`;
    isOperational = true;
  }

  // Handle Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Tham chiếu không hợp lệ: Dữ liệu liên quan không tồn tại';
    isOperational = true;
  }

  // Handle rate limiting errors (429)
  if (statusCode === 429) {
    message = err.message || 'Quá nhiều yêu cầu. Vui lòng đợi một chút rồi thử lại.';
    isOperational = true;
  }

  // Handle database constraint errors (NOT NULL, etc.)
  if (err.name === 'SequelizeDatabaseError' || (err as any).original?.code) {
    const dbError = err as any;
    const originalError = dbError.original || dbError;
    
    // Check for NOT NULL constraint violation
    if (originalError.code === '23502' || originalError.message?.includes('null value') || originalError.message?.includes('NOT NULL')) {
      statusCode = 400;
      const columnMatch = originalError.message?.match(/column "(\w+)"/i);
      const column = columnMatch ? columnMatch[1] : 'unknown';
      message = `Lỗi dữ liệu: Trường ${column} không được để trống. Vui lòng kiểm tra lại dữ liệu.`;
      isOperational = true;
    }
    // Check for other database errors
    else if (originalError.code) {
      statusCode = 400;
      message = `Lỗi cơ sở dữ liệu: ${originalError.message || 'Dữ liệu không hợp lệ'}`;
      isOperational = true;
    }
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !isOperational) {
    message = 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.';
  }

  // Format error response consistently
  const errorResponse: any = {
    success: false,
    message,
  };

  // Include error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.error = {
      name: err.name,
      message: err.message,
    };
    
    // Include validation errors if available
    if (err instanceof AppError && (err as any).details) {
      errorResponse.details = (err as any).details;
    }
  }

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};
