const logger = require('../utils/logger');

// Custom error classes
class AppError extends Error {
    constructor(message, statusCode, errorCode = null) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, details = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}

class DatabaseError extends AppError {
    constructor(message, originalError = null) {
        super(message, 500, 'DATABASE_ERROR');
        this.originalError = originalError;
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Forbidden access') {
        super(message, 403, 'FORBIDDEN');
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
    }
}

class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
    }
}

class BlockchainError extends AppError {
    constructor(message, transactionHash = null) {
        super(message, 502, 'BLOCKCHAIN_ERROR');
        this.transactionHash = transactionHash;
    }
}

class GameError extends AppError {
    constructor(message, gameContext = {}) {
        super(message, 400, 'GAME_ERROR');
        this.gameContext = gameContext;
    }
}

// Error response formatter
const formatErrorResponse = (error, req) => {
    const response = {
        success: false,
        error: {
            message: error.message,
            code: error.errorCode || 'INTERNAL_ERROR',
            timestamp: new Date().toISOString(),
            requestId: req.id || generateRequestId()
        }
    };

    // Add specific error details based on error type
    if (error instanceof ValidationError && error.details) {
        response.error.details = error.details;
    }

    if (error instanceof BlockchainError && error.transactionHash) {
        response.error.transactionHash = error.transactionHash;
    }

    if (error instanceof GameError && error.gameContext) {
        response.error.gameContext = error.gameContext;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development' && error.stack) {
        response.error.stack = error.stack;
    }

    return response;
};

// Generate unique request ID
const generateRequestId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Request ID middleware
const addRequestId = (req, res, next) => {
    req.id = generateRequestId();
    res.setHeader('X-Request-ID', req.id);
    next();
};

// Async error handler wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Main error handling middleware
const errorHandler = (error, req, res, next) => {
    let err = { ...error };
    err.message = error.message;

    // Log error details
    const errorContext = {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        params: req.params,
        query: req.query
    };

    // Log based on error severity
    if (err.statusCode && err.statusCode < 500) {
        logger.warn('Client Error', { 
            error: err.message, 
            statusCode: err.statusCode,
            ...errorContext 
        });
    } else {
        logger.error('Server Error', { 
            error: err.message, 
            stack: err.stack,
            statusCode: err.statusCode || 500,
            ...errorContext 
        });
    }

    // Handle specific error types
    if (error.name === 'CastError') {
        const message = 'Invalid data format';
        err = new ValidationError(message);
    }

    if (error.code === 'SQLITE_CONSTRAINT') {
        const message = 'Database constraint violation';
        err = new ConflictError(message);
    }

    if (error.code === 'SQLITE_BUSY') {
        const message = 'Database is busy, please try again';
        err = new DatabaseError(message);
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        const message = 'External service unavailable';
        err = new AppError(message, 503, 'SERVICE_UNAVAILABLE');
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        err = new ValidationError('Invalid JSON format');
    }

    // Default error response
    if (!err.statusCode) {
        err = new AppError('Internal server error', 500, 'INTERNAL_ERROR');
    }

    const response = formatErrorResponse(err, req);
    res.status(err.statusCode).json(response);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
    const message = `Route ${req.originalUrl} not found`;
    const error = new NotFoundError(message);
    next(error);
};

// Uncaught exception handler
const handleUncaughtException = () => {
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', {
            error: error.message,
            stack: error.stack,
            severity: 'critical'
        });
        
        // Graceful shutdown
        process.exit(1);
    });
};

// Unhandled promise rejection handler
const handleUnhandledRejection = () => {
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Promise Rejection:', {
            reason: reason,
            promise: promise,
            severity: 'critical'
        });
        
        // Graceful shutdown
        process.exit(1);
    });
};

// Database error handler
const handleDatabaseError = (error) => {
    logger.error('Database Error:', {
        error: error.message,
        code: error.code,
        errno: error.errno,
        stack: error.stack
    });

    // Return appropriate error based on SQLite error codes
    switch (error.code) {
        case 'SQLITE_CONSTRAINT_UNIQUE':
            return new ConflictError('Duplicate entry found');
        case 'SQLITE_CONSTRAINT_FOREIGNKEY':
            return new ValidationError('Invalid reference to related data');
        case 'SQLITE_CONSTRAINT_NOTNULL':
            return new ValidationError('Required field is missing');
        case 'SQLITE_BUSY':
            return new DatabaseError('Database is busy, please try again later');
        case 'SQLITE_LOCKED':
            return new DatabaseError('Database is locked, please try again later');
        default:
            return new DatabaseError('Database operation failed');
    }
};

// Game-specific error handler
const handleGameError = (error, gameContext = {}) => {
    const gameError = new GameError(error.message, gameContext);
    
    logger.game('Game Error', {
        error: error.message,
        gameContext: gameContext,
        severity: 'medium'
    });
    
    return gameError;
};

// Blockchain error handler
const handleBlockchainError = (error, transactionHash = null) => {
    const blockchainError = new BlockchainError(error.message, transactionHash);
    
    logger.blockchain('Blockchain Error', {
        error: error.message,
        transactionHash: transactionHash,
        severity: 'high'
    });
    
    return blockchainError;
};

// Error reporting middleware for monitoring
const errorReporter = (error, req, res, next) => {
    // Here you could integrate with error reporting services like Sentry, Bugsnag, etc.
    
    // For now, we'll just log to our system
    if (error.statusCode >= 500) {
        logger.error('Error Report', {
            error: error.message,
            stack: error.stack,
            requestId: req.id,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
            severity: 'high'
        });
    }
    
    next(error);
};

module.exports = {
    // Error classes
    AppError,
    ValidationError,
    DatabaseError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    RateLimitError,
    BlockchainError,
    GameError,
    
    // Middleware
    errorHandler,
    notFoundHandler,
    addRequestId,
    asyncHandler,
    errorReporter,
    
    // Error handlers
    handleDatabaseError,
    handleGameError,
    handleBlockchainError,
    handleUncaughtException,
    handleUnhandledRejection,
    
    // Utilities
    formatErrorResponse
};