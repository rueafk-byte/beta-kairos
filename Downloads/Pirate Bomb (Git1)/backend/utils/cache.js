const NodeCache = require('node-cache');
const logger = require('./logger');

class CacheManager {
    constructor() {
        // Different cache instances for different data types with specific TTL
        this.caches = {
            // Player data cache - 5 minutes TTL
            players: new NodeCache({ 
                stdTTL: 300, 
                checkperiod: 60,
                useClones: false,
                maxKeys: 10000
            }),
            
            // Leaderboard cache - 10 minutes TTL
            leaderboards: new NodeCache({ 
                stdTTL: 600, 
                checkperiod: 120,
                useClones: false,
                maxKeys: 100
            }),
            
            // Game statistics cache - 15 minutes TTL
            statistics: new NodeCache({ 
                stdTTL: 900, 
                checkperiod: 180,
                useClones: false,
                maxKeys: 200
            }),
            
            // Achievement data cache - 30 minutes TTL
            achievements: new NodeCache({ 
                stdTTL: 1800, 
                checkperiod: 300,
                useClones: false,
                maxKeys: 1000
            }),
            
            // Session data cache - 3 minutes TTL
            sessions: new NodeCache({ 
                stdTTL: 180, 
                checkperiod: 30,
                useClones: false,
                maxKeys: 5000
            }),
            
            // API response cache - 2 minutes TTL
            api: new NodeCache({ 
                stdTTL: 120, 
                checkperiod: 30,
                useClones: false,
                maxKeys: 2000
            }),
            
            // Blockchain data cache - 20 minutes TTL
            blockchain: new NodeCache({ 
                stdTTL: 1200, 
                checkperiod: 240,
                useClones: false,
                maxKeys: 500
            }),

            // Rate limiting cache - 1 hour TTL
            rateLimit: new NodeCache({ 
                stdTTL: 3600, 
                checkperiod: 600,
                useClones: false,
                maxKeys: 50000
            })
        };

        this.hitStats = {};
        this.setupEventHandlers();
        this.setupStatsTracking();
    }

    setupEventHandlers() {
        // Setup event listeners for all caches
        Object.keys(this.caches).forEach(cacheType => {
            const cache = this.caches[cacheType];
            
            cache.on('set', (key, value) => {
                logger.debug(`Cache SET: ${cacheType}:${key}`);
            });
            
            cache.on('get', (key, value) => {
                this.recordHit(cacheType, 'hit');
            });
            
            cache.on('expired', (key, value) => {
                logger.debug(`Cache EXPIRED: ${cacheType}:${key}`);
            });
            
            cache.on('del', (key, value) => {
                logger.debug(`Cache DELETE: ${cacheType}:${key}`);
            });
            
            cache.on('flush', () => {
                logger.info(`Cache FLUSH: ${cacheType}`);
            });
        });
    }

    setupStatsTracking() {
        // Initialize hit stats for all cache types
        Object.keys(this.caches).forEach(cacheType => {
            this.hitStats[cacheType] = {
                hits: 0,
                misses: 0,
                sets: 0,
                deletes: 0,
                flushes: 0
            };
        });
    }

    recordHit(cacheType, type) {
        if (this.hitStats[cacheType]) {
            this.hitStats[cacheType][type]++;
        }
    }

    // Generic cache operations
    get(cacheType, key) {
        if (!this.caches[cacheType]) {
            logger.warn(`Invalid cache type: ${cacheType}`);
            return null;
        }

        const value = this.caches[cacheType].get(key);
        if (value === undefined) {
            this.recordHit(cacheType, 'misses');
            return null;
        }
        
        this.recordHit(cacheType, 'hits');
        return value;
    }

    set(cacheType, key, value, ttl = null) {
        if (!this.caches[cacheType]) {
            logger.warn(`Invalid cache type: ${cacheType}`);
            return false;
        }

        const success = ttl 
            ? this.caches[cacheType].set(key, value, ttl)
            : this.caches[cacheType].set(key, value);
        
        if (success) {
            this.recordHit(cacheType, 'sets');
        }
        
        return success;
    }

    del(cacheType, key) {
        if (!this.caches[cacheType]) {
            logger.warn(`Invalid cache type: ${cacheType}`);
            return 0;
        }

        const deleted = this.caches[cacheType].del(key);
        if (deleted > 0) {
            this.recordHit(cacheType, 'deletes');
        }
        
        return deleted;
    }

    // Specialized cache methods for common operations

    // Player data caching
    getPlayer(walletAddress) {
        return this.get('players', `player:${walletAddress}`);
    }

    setPlayer(walletAddress, playerData, ttl = null) {
        return this.set('players', `player:${walletAddress}`, playerData, ttl);
    }

    invalidatePlayer(walletAddress) {
        return this.del('players', `player:${walletAddress}`);
    }

    // Leaderboard caching
    getLeaderboard(type, limit = 100) {
        return this.get('leaderboards', `leaderboard:${type}:${limit}`);
    }

    setLeaderboard(type, limit, data, ttl = null) {
        return this.set('leaderboards', `leaderboard:${type}:${limit}`, data, ttl);
    }

    invalidateLeaderboards() {
        this.caches.leaderboards.flushAll();
        this.recordHit('leaderboards', 'flushes');
    }

    // Game statistics caching
    getGameStats() {
        return this.get('statistics', 'game_stats');
    }

    setGameStats(stats, ttl = null) {
        return this.set('statistics', 'game_stats', stats, ttl);
    }

    // Achievement caching
    getPlayerAchievements(walletAddress) {
        return this.get('achievements', `achievements:${walletAddress}`);
    }

    setPlayerAchievements(walletAddress, achievements, ttl = null) {
        return this.set('achievements', `achievements:${walletAddress}`, achievements, ttl);
    }

    // Session caching
    getSession(sessionId) {
        return this.get('sessions', `session:${sessionId}`);
    }

    setSession(sessionId, sessionData, ttl = null) {
        return this.set('sessions', `session:${sessionId}`, sessionData, ttl);
    }

    // API response caching
    getAPIResponse(endpoint, params = '') {
        const key = `api:${endpoint}:${params}`;
        return this.get('api', key);
    }

    setAPIResponse(endpoint, params, response, ttl = null) {
        const key = `api:${endpoint}:${params}`;
        return this.set('api', key, response, ttl);
    }

    // Blockchain data caching
    getBlockchainData(key) {
        return this.get('blockchain', `blockchain:${key}`);
    }

    setBlockchainData(key, data, ttl = null) {
        return this.set('blockchain', `blockchain:${key}`, data, ttl);
    }

    // Rate limiting
    getRateLimit(identifier) {
        return this.get('rateLimit', `rate:${identifier}`);
    }

    setRateLimit(identifier, count, ttl = null) {
        return this.set('rateLimit', `rate:${identifier}`, count, ttl);
    }

    incrementRateLimit(identifier, ttl = 3600) {
        const current = this.getRateLimit(identifier) || 0;
        return this.setRateLimit(identifier, current + 1, ttl);
    }

    // Cache invalidation patterns
    invalidatePattern(cacheType, pattern) {
        if (!this.caches[cacheType]) return;

        const keys = this.caches[cacheType].keys();
        const matchingKeys = keys.filter(key => key.includes(pattern));
        
        matchingKeys.forEach(key => {
            this.caches[cacheType].del(key);
        });

        if (matchingKeys.length > 0) {
            logger.info(`Invalidated ${matchingKeys.length} cache entries matching pattern: ${pattern}`);
        }
    }

    // Cache warming - preload commonly accessed data
    async warmCache(cacheType, dataLoader) {
        try {
            logger.info(`Warming cache: ${cacheType}`);
            const data = await dataLoader();
            
            if (Array.isArray(data)) {
                data.forEach(item => {
                    if (item.key && item.value) {
                        this.set(cacheType, item.key, item.value);
                    }
                });
            }
            
            logger.info(`Cache warming completed for: ${cacheType}`);
        } catch (error) {
            logger.error(`Cache warming failed for ${cacheType}:`, error);
        }
    }

    // Get cache statistics
    getStats() {
        const stats = {};
        
        Object.keys(this.caches).forEach(cacheType => {
            const cache = this.caches[cacheType];
            stats[cacheType] = {
                keys: cache.keys().length,
                stats: cache.getStats(),
                hitStats: this.hitStats[cacheType],
                hitRate: this.hitStats[cacheType].hits > 0 
                    ? (this.hitStats[cacheType].hits / (this.hitStats[cacheType].hits + this.hitStats[cacheType].misses) * 100).toFixed(2) + '%'
                    : '0%'
            };
        });
        
        return stats;
    }

    // Memory usage information
    getMemoryUsage() {
        const usage = {};
        
        Object.keys(this.caches).forEach(cacheType => {
            const cache = this.caches[cacheType];
            usage[cacheType] = {
                keys: cache.keys().length,
                size: JSON.stringify(cache.keys()).length // Approximate size
            };
        });
        
        return usage;
    }

    // Health check
    healthCheck() {
        const stats = this.getStats();
        const memoryUsage = this.getMemoryUsage();
        
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            totalCaches: Object.keys(this.caches).length,
            stats,
            memoryUsage
        };
    }

    // Cleanup and maintenance
    cleanup() {
        Object.keys(this.caches).forEach(cacheType => {
            this.caches[cacheType].flushAll();
            this.recordHit(cacheType, 'flushes');
        });
        
        // Reset hit stats
        this.setupStatsTracking();
        logger.info('Cache cleanup completed');
    }

    // Graceful shutdown
    shutdown() {
        Object.keys(this.caches).forEach(cacheType => {
            this.caches[cacheType].close();
        });
        logger.info('Cache manager shutdown completed');
    }
}

// Export singleton instance
const cacheManager = new CacheManager();
module.exports = cacheManager;