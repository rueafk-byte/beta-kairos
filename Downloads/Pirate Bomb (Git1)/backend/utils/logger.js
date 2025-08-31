const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
    })
);

// Create transports
const transports = [
    // Console transport
    new winston.transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        format: consoleFormat,
        handleExceptions: true
    }),

    // General application logs
    new DailyRotateFile({
        filename: path.join(logsDir, 'app-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        level: 'info',
        format: logFormat,
        handleExceptions: true
    }),

    // Error logs
    new DailyRotateFile({
        filename: path.join(logsDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
        format: logFormat,
        handleExceptions: true,
        handleRejections: true
    }),

    // Game-specific logs
    new DailyRotateFile({
        filename: path.join(logsDir, 'game-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        level: 'info',
        format: logFormat
    }),

    // Security logs
    new DailyRotateFile({
        filename: path.join(logsDir, 'security-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'warn',
        format: logFormat
    }),

    // API access logs
    new DailyRotateFile({
        filename: path.join(logsDir, 'api-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '50m',
        maxFiles: '7d',
        level: 'info',
        format: logFormat
    })
];

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exitOnError: false
});

// Custom logging methods for different contexts
logger.game = (message, meta = {}) => {
    logger.info(message, { ...meta, context: 'GAME' });
};

logger.security = (message, meta = {}) => {
    logger.warn(message, { ...meta, context: 'SECURITY' });
};

logger.api = (message, meta = {}) => {
    logger.info(message, { ...meta, context: 'API' });
};

logger.database = (message, meta = {}) => {
    logger.info(message, { ...meta, context: 'DATABASE' });
};

logger.blockchain = (message, meta = {}) => {
    logger.info(message, { ...meta, context: 'BLOCKCHAIN' });
};

logger.performance = (message, meta = {}) => {
    logger.info(message, { ...meta, context: 'PERFORMANCE' });
};

// Request logging middleware for Morgan
logger.getHTTPLogStream = () => {
    return {
        write: (message) => {
            logger.api(message.trim());
        }
    };
};

// Performance timing utility
logger.timer = (label) => {
    const start = Date.now();
    return {
        end: (meta = {}) => {
            const duration = Date.now() - start;
            logger.performance(`${label} completed`, { 
                ...meta, 
                duration_ms: duration,
                duration_readable: `${duration}ms`
            });
            return duration;
        }
    };
};

// Error logging with context
logger.logError = (error, context = {}) => {
    logger.error('Application Error', {
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name
        },
        ...context
    });
};

// Game event logging
logger.logGameEvent = (event, playerWallet, data = {}) => {
    logger.game(`Game Event: ${event}`, {
        player_wallet: playerWallet,
        event_type: event,
        event_data: data,
        timestamp: new Date().toISOString()
    });
};

// Security event logging
logger.logSecurityEvent = (event, details = {}) => {
    logger.security(`Security Event: ${event}`, {
        security_event: event,
        details,
        timestamp: new Date().toISOString(),
        severity: details.severity || 'medium'
    });
};

// Token transaction logging
logger.logTokenTransaction = (wallet, type, amount, details = {}) => {
    logger.blockchain('Token Transaction', {
        wallet_address: wallet,
        transaction_type: type,
        token_amount: amount,
        transaction_details: details,
        timestamp: new Date().toISOString()
    });
};

// API call logging with performance
logger.logAPICall = (method, endpoint, statusCode, duration, userAgent = '', ip = '') => {
    logger.api('API Call', {
        http_method: method,
        endpoint,
        status_code: statusCode,
        response_time_ms: duration,
        user_agent: userAgent,
        ip_address: ip,
        timestamp: new Date().toISOString()
    });
};

// Startup logging
logger.startup = (message, meta = {}) => {
    logger.info(`🚀 ${message}`, { ...meta, context: 'STARTUP' });
};

// Shutdown logging
logger.shutdown = (message, meta = {}) => {
    logger.info(`🛑 ${message}`, { ...meta, context: 'SHUTDOWN' });
};

module.exports = logger;