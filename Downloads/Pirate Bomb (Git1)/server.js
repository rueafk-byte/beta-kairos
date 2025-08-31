// Enhanced Pirate Bomb Backend Server v2.0
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

// Import custom modules
const database = require('./backend/config/database');
const logger = require('./backend/utils/logger');
const cacheManager = require('./backend/utils/cache');

// Import middleware
const { securityMiddleware, corsOptions, securityHeaders, sanitizeRequest, ipFilter, securityMonitor } = require('./backend/middleware/security');
const { errorHandler, notFoundHandler, addRequestId, errorReporter, handleUncaughtException, handleUnhandledRejection } = require('./backend/middleware/errorHandler');

// Import routes with error handling
let apiRoutes;
try {
    apiRoutes = require('./backend/routes/api');
} catch (error) {
    console.warn('API routes not found, using fallback routes');
    apiRoutes = require('express').Router();
    
    // Add basic fallback routes
    apiRoutes.get('/players', (req, res) => {
        res.json({ success: true, data: [] });
    });
    
    apiRoutes.get('/dashboard/stats', (req, res) => {
        res.json({ success: true, data: { totalPlayers: { count: 0 }, totalTokens: { total: 0 }, totalScore: { total: 0 }, topPlayer: null } });
    });
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Setup global error handlers
handleUncaughtException();
handleUnhandledRejection();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Core middleware stack
app.use(addRequestId);
app.use(securityHeaders);
app.use(securityMiddleware.helmet);
app.use(ipFilter);
app.use(securityMonitor);
app.use(compression());

// CORS configuration
if (NODE_ENV === 'production') {
    app.use(cors(corsOptions));
} else {
    app.use(cors());
}

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeRequest);

// Logging middleware
app.use(morgan('combined', { stream: logger.getHTTPLogStream() }));

// Rate limiting middleware
app.use('/api/', securityMiddleware.rateLimits.general);

// Static file serving
app.use(express.static('.', {
    maxAge: NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
    lastModified: true
}));

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const dbHealth = await database.healthCheck();
        const cacheHealth = cacheManager.healthCheck();
        
        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            environment: NODE_ENV,
            services: { database: dbHealth, cache: cacheHealth },
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Metrics endpoint
app.get('/api/metrics', securityMiddleware.rateLimits.admin, (req, res) => {
    const cacheStats = cacheManager.getStats();
    const memoryUsage = process.memoryUsage();
    
    res.json({
        success: true,
        data: {
            cache: cacheStats,
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
            },
            uptime: { seconds: process.uptime() },
            environment: NODE_ENV,
            version: '2.0.0'
        }
    });
});

// Legacy endpoints for backward compatibility
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        let stats = cacheManager.getGameStats();
        if (stats) return res.json(stats);

        const db = database.getDb();
        const queries = {
            totalPlayers: 'SELECT COUNT(*) as count FROM players WHERE is_active = 1',
            totalTokens: 'SELECT SUM(boom_tokens + admiral_tokens) as total FROM players WHERE is_active = 1',
            totalScore: 'SELECT SUM(total_score) as total FROM players WHERE is_active = 1',
            topPlayer: 'SELECT username, total_score FROM players WHERE is_active = 1 ORDER BY total_score DESC LIMIT 1'
        };
        
        const results = {};
        const promises = Object.keys(queries).map(key => 
            new Promise((resolve) => {
                db.get(queries[key], [], (err, row) => {
                    resolve({ [key]: err ? null : row });
                });
            })
        );
        
        const queryResults = await Promise.all(promises);
        queryResults.forEach(result => Object.assign(results, result));
        
        cacheManager.setGameStats(results, 600);
        res.json(results);
        
    } catch (error) {
        logger.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Legacy recharge endpoints
app.get('/api/recharge/:walletAddress', async (req, res) => {
    const { walletAddress } = req.params;
    const db = database.getDb();
    
    try {
        const row = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM recharge_tracking WHERE wallet_address = ?', [walletAddress], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        
        if (row) {
            const now = new Date();
            const cooldownEnd = new Date(row.recharge_cooldown_end);
            const isRecharging = now < cooldownEnd;
            const timeRemaining = isRecharging ? Math.max(0, cooldownEnd - now) : 0;
            
            res.json({
                wallet_address: row.wallet_address,
                lives_remaining: row.lives_remaining,
                is_recharging: isRecharging,
                time_remaining_ms: timeRemaining,
                can_play: !isRecharging && row.lives_remaining > 0
            });
        } else {
            res.json({
                wallet_address: walletAddress,
                lives_remaining: 3,
                is_recharging: false,
                time_remaining_ms: 0,
                can_play: true
            });
        }
    } catch (error) {
        logger.error('Recharge status error:', error);
        res.status(500).json({ error: 'Failed to get recharge status' });
    }
});

// Error handling middleware
app.use(errorReporter);
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize and start server
async function startServer() {
    try {
        await database.connect();
        logger.startup('Database connected successfully');
        
        const server = app.listen(PORT, () => {
            logger.startup(`🎮 Enhanced Pirate Bomb Backend v2.0 running on port ${PORT}`);
            logger.startup(`🌍 Environment: ${NODE_ENV}`);
            logger.startup(`📊 Admin Dashboard: http://localhost:${PORT}/admin-dashboard.html`);
            logger.startup(`🎯 Game: http://localhost:${PORT}/`);
            logger.startup(`💊 Health Check: http://localhost:${PORT}/api/health`);
        });
        
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger.shutdown(`Received ${signal}, shutting down gracefully...`);
            server.close(async () => {
                try {
                    await database.close();
                    cacheManager.shutdown();
                    logger.shutdown('✅ Graceful shutdown completed');
                    process.exit(0);
                } catch (error) {
                    logger.error('Shutdown error:', error);
                    process.exit(1);
                }
            });
        };
        
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();