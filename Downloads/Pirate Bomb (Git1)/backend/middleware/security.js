const helmet = require('helmet');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const cacheManager = require('../utils/cache');

// Security middleware configurations
const securityMiddleware = {
    // Helmet configuration for security headers
    helmet: helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https:"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https:", "wss:"],
                fontSrc: ["'self'", "https:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }),

    // Rate limiting configurations
    rateLimits: {
        // General API rate limit
        general: rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // limit each IP to 1000 requests per windowMs
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false,
            keyGenerator: (req) => {
                return req.ip + ':' + (req.user?.wallet_address || 'anonymous');
            }
        }),

        // Strict rate limit for authentication endpoints
        auth: rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 10, // limit each IP to 10 login attempts per windowMs
            message: {
                error: 'Too many authentication attempts, please try again later.',
                retryAfter: '15 minutes'
            },
            skipSuccessfulRequests: true
        }),

        // Game session rate limit
        gameSession: rateLimit({
            windowMs: 60 * 1000, // 1 minute
            max: 100, // 100 game actions per minute
            message: {
                error: 'Too many game actions, please slow down.',
                retryAfter: '1 minute'
            },
            keyGenerator: (req) => {
                return req.body?.wallet_address || req.params?.walletAddress || req.ip;
            }
        }),

        // Admin endpoints rate limit
        admin: rateLimit({
            windowMs: 5 * 60 * 1000, // 5 minutes
            max: 50, // 50 admin actions per 5 minutes
            message: {
                error: 'Too many admin actions, please wait.',
                retryAfter: '5 minutes'
            }
        }),

        // Token transaction rate limit
        tokenTransaction: rateLimit({
            windowMs: 60 * 1000, // 1 minute
            max: 10, // 10 token transactions per minute
            message: {
                error: 'Too many token transactions, please wait.',
                retryAfter: '1 minute'
            },
            keyGenerator: (req) => {
                return req.body?.wallet_address || req.params?.walletAddress || req.ip;
            }
        })
    }
};

// Input validation middleware
const validation = {
    // Wallet address validation
    walletAddress: param('walletAddress')
        .isLength({ min: 32, max: 44 })
        .matches(/^[A-Za-z0-9]+$/)
        .withMessage('Invalid wallet address format'),

    // Username validation
    username: body('username')
        .optional()
        .isLength({ min: 3, max: 20 })
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username must be 3-20 characters and contain only letters, numbers, dashes, and underscores'),

    // Score validation
    score: body(['total_score', 'current_score', 'score_earned'])
        .optional()
        .isInt({ min: 0, max: 999999999 })
        .withMessage('Score must be a positive integer'),

    // Level validation
    level: body('level')
        .optional()
        .isInt({ min: 1, max: 40 })
        .withMessage('Level must be between 1 and 40'),

    // Token amount validation
    tokenAmount: body(['boom_tokens', 'admiral_tokens', 'amount'])
        .optional()
        .isInt({ min: 0, max: 999999999 })
        .withMessage('Token amount must be a positive integer'),

    // Lives validation
    lives: body(['lives', 'lives_remaining'])
        .optional()
        .isInt({ min: 0, max: 10 })
        .withMessage('Lives must be between 0 and 10'),

    // Session ID validation
    sessionId: body('session_id')
        .optional()
        .isUUID()
        .withMessage('Invalid session ID format'),

    // Transaction type validation
    transactionType: body('transaction_type')
        .optional()
        .isIn(['earn', 'spend', 'reward', 'purchase', 'transfer', 'mint'])
        .withMessage('Invalid transaction type'),

    // Token type validation
    tokenType: body('token_type')
        .optional()
        .isIn(['BOOM', 'ADMIRAL'])
        .withMessage('Invalid token type'),

    // Pagination validation
    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1, max: 1000 })
            .withMessage('Page must be between 1 and 1000'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
    ],

    // Search validation
    search: query('q')
        .optional()
        .isLength({ min: 1, max: 100 })
        .trim()
        .escape()
        .withMessage('Search query must be 1-100 characters'),

    // Date range validation
    dateRange: [
        query('start_date')
            .optional()
            .isISO8601()
            .withMessage('Invalid start date format'),
        query('end_date')
            .optional()
            .isISO8601()
            .withMessage('Invalid end date format')
    ],

    // Challenge validation
    challengeProgress: body('current_progress')
        .optional()
        .isInt({ min: 0, max: 999999 })
        .withMessage('Progress must be a positive integer'),

    // NFT validation
    nftData: [
        body('nft_id')
            .optional()
            .isLength({ min: 1, max: 100 })
            .withMessage('Invalid NFT ID'),
        body('nft_type')
            .optional()
            .isIn(['skin', 'weapon', 'powerup', 'achievement', 'special'])
            .withMessage('Invalid NFT type')
    ]
};

// Custom validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.security('Validation failed', {
            ip: req.ip,
            endpoint: req.originalUrl,
            errors: errors.array(),
            body: req.body
        });

        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
    // Add custom security headers
    res.setHeader('X-API-Version', '2.0.0');
    res.setHeader('X-Powered-By', 'Pirate-Bomb-Backend');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    next();
};

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
    // Sanitize request body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                // Remove potentially dangerous characters
                req.body[key] = req.body[key]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
            }
        });
    }
    
    next();
};

// IP filtering middleware (can be extended with blacklist/whitelist)
const ipFilter = (req, res, next) => {
    const clientIP = req.ip;
    const userAgent = req.get('User-Agent');
    
    // Log suspicious requests
    if (!userAgent || userAgent.length < 10) {
        logger.security('Suspicious request - missing or short user agent', {
            ip: clientIP,
            userAgent: userAgent,
            endpoint: req.originalUrl
        });
    }
    
    // Check for rapid requests from same IP (basic DoS protection)
    const requestKey = `requests:${clientIP}`;
    const requestCount = cacheManager.getRateLimit(requestKey) || 0;
    
    if (requestCount > 1000) { // More than 1000 requests per hour from same IP
        logger.security('Potential DoS attack detected', {
            ip: clientIP,
            requestCount: requestCount,
            severity: 'critical'
        });
        
        return res.status(429).json({
            error: 'Too many requests from your IP address',
            retryAfter: '1 hour'
        });
    }
    
    cacheManager.incrementRateLimit(requestKey, 3600); // 1 hour TTL
    next();
};

// CORS configuration for production
const corsOptions = {
    origin: function (origin, callback) {
        // In production, specify allowed origins
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8000',
            'https://devkaboom.onrender.com',
            // Add your production domains here
        ];
        
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.security('CORS violation attempt', { 
                origin: origin,
                severity: 'medium'
            });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Security monitoring middleware
const securityMonitor = (req, res, next) => {
    const startTime = Date.now();
    
    // Monitor for security events
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        // Log security-relevant responses
        if (res.statusCode >= 400) {
            logger.security('Security-relevant response', {
                ip: req.ip,
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: res.statusCode,
                duration: duration,
                userAgent: req.get('User-Agent')
            });
        }
        
        // Monitor for slow requests (potential attacks)
        if (duration > 5000) {
            logger.security('Slow request detected', {
                ip: req.ip,
                endpoint: req.originalUrl,
                duration: duration,
                severity: 'medium'
            });
        }
    });
    
    next();
};

module.exports = {
    securityMiddleware,
    validation,
    handleValidationErrors,
    securityHeaders,
    sanitizeRequest,
    ipFilter,
    corsOptions,
    securityMonitor
};