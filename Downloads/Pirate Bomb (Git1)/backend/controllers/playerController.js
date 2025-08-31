const database = require('../config/database');
const logger = require('../utils/logger');
const cacheManager = require('../utils/cache');
const { 
    asyncHandler, 
    NotFoundError, 
    ValidationError, 
    DatabaseError,
    handleDatabaseError 
} = require('../middleware/errorHandler');

class PlayerController {
    constructor() {
        this.db = database.getDb();
    }

    // Get all players with pagination and filtering
    getPlayers = asyncHandler(async (req, res) => {
        const timer = logger.timer('getPlayers');
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'total_score';
        const sortOrder = req.query.sortOrder || 'DESC';
        const isActive = req.query.active !== 'false';

        // Try to get from cache first
        const cacheKey = `players:${page}:${limit}:${sortBy}:${sortOrder}:${isActive}`;
        let cachedData = cacheManager.getAPIResponse('players', cacheKey);
        
        if (cachedData) {
            timer.end({ cache_hit: true });
            return res.json(cachedData);
        }

        const query = `
            SELECT 
                id, wallet_address, username, level, total_score, 
                boom_tokens, admiral_tokens, lives, highest_level_reached,
                total_enemies_killed, total_playtime_minutes, avatar_nft_id,
                is_premium, last_login, created_at
            FROM players 
            WHERE is_active = ?
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `;

        const countQuery = 'SELECT COUNT(*) as total FROM players WHERE is_active = ?';

        try {
            const [players, countResult] = await Promise.all([
                new Promise((resolve, reject) => {
                    this.db.all(query, [isActive, limit, offset], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                }),
                new Promise((resolve, reject) => {
                    this.db.get(countQuery, [isActive], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                })
            ]);

            const response = {
                success: true,
                data: {
                    players,
                    pagination: {
                        page,
                        limit,
                        total: countResult.total,
                        totalPages: Math.ceil(countResult.total / limit),
                        hasNext: page < Math.ceil(countResult.total / limit),
                        hasPrev: page > 1
                    }
                }
            };

            // Cache the response
            cacheManager.setAPIResponse('players', cacheKey, response, 300); // 5 minutes cache

            timer.end({ cache_hit: false, players_count: players.length });
            res.json(response);

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });

    // Get player by wallet address
    getPlayer = asyncHandler(async (req, res) => {
        const { walletAddress } = req.params;
        const timer = logger.timer(`getPlayer:${walletAddress}`);

        // Check cache first
        let player = cacheManager.getPlayer(walletAddress);
        
        if (player) {
            timer.end({ cache_hit: true });
            return res.json({
                success: true,
                data: { player }
            });
        }

        const query = `
            SELECT 
                id, wallet_address, username, email, level, experience_points,
                total_score, boom_tokens, admiral_tokens, lives, current_score,
                highest_level_reached, total_enemies_killed, total_playtime_minutes,
                avatar_nft_id, skin_collection, preferred_difficulty, is_premium,
                last_login, last_updated, created_at
            FROM players 
            WHERE wallet_address = ? AND is_active = 1
        `;

        try {
            player = await new Promise((resolve, reject) => {
                this.db.get(query, [walletAddress], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!player) {
                throw new NotFoundError('Player');
            }

            // Parse JSON fields
            if (player.skin_collection) {
                try {
                    player.skin_collection = JSON.parse(player.skin_collection);
                } catch (e) {
                    player.skin_collection = [];
                }
            }

            // Cache the player data
            cacheManager.setPlayer(walletAddress, player, 300); // 5 minutes cache

            timer.end({ cache_hit: false });
            res.json({
                success: true,
                data: { player }
            });

        } catch (error) {
            timer.end({ error: true });
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw handleDatabaseError(error);
        }
    });

    // Create or update player
    createOrUpdatePlayer = asyncHandler(async (req, res) => {
        const { 
            wallet_address, username, email, level, experience_points,
            total_score, boom_tokens, admiral_tokens, lives, current_score,
            highest_level_reached, total_enemies_killed, total_playtime_minutes,
            avatar_nft_id, skin_collection, preferred_difficulty, is_premium
        } = req.body;

        const timer = logger.timer(`createOrUpdatePlayer:${wallet_address}`);

        // Validate required fields
        if (!wallet_address) {
            throw new ValidationError('Wallet address is required');
        }

        // Prepare skin collection JSON
        const skinCollectionJson = skin_collection ? JSON.stringify(skin_collection) : '[]';

        const query = `
            INSERT OR REPLACE INTO players 
            (wallet_address, username, email, level, experience_points, total_score, 
             boom_tokens, admiral_tokens, lives, current_score, highest_level_reached,
             total_enemies_killed, total_playtime_minutes, avatar_nft_id, skin_collection,
             preferred_difficulty, is_premium, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        try {
            const result = await new Promise((resolve, reject) => {
                this.db.run(query, [
                    wallet_address, username, email, level || 1, experience_points || 0,
                    total_score || 0, boom_tokens || 0, admiral_tokens || 0, lives || 3,
                    current_score || 0, highest_level_reached || 1, total_enemies_killed || 0,
                    total_playtime_minutes || 0, avatar_nft_id, skinCollectionJson,
                    preferred_difficulty || 'normal', is_premium || 0
                ], function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, changes: this.changes });
                });
            });

            // Invalidate cache
            cacheManager.invalidatePlayer(wallet_address);
            cacheManager.invalidateLeaderboards();

            // Log player creation/update
            logger.logGameEvent(
                result.changes > 0 ? 'player_updated' : 'player_created',
                wallet_address,
                { level, total_score, boom_tokens }
            );

            timer.end({ operation: result.changes > 0 ? 'update' : 'create' });
            res.json({
                success: true,
                message: result.changes > 0 ? 'Player updated successfully' : 'Player created successfully',
                data: {
                    id: result.id,
                    wallet_address
                }
            });

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });

    // Update player progress
    updateProgress = asyncHandler(async (req, res) => {
        const { walletAddress } = req.params;
        const { 
            level, experience_points, total_score, boom_tokens, admiral_tokens,
            lives, current_score, highest_level_reached, total_enemies_killed,
            total_playtime_minutes
        } = req.body;

        const timer = logger.timer(`updateProgress:${walletAddress}`);

        // First, verify player exists
        const playerExists = await new Promise((resolve, reject) => {
            this.db.get('SELECT id FROM players WHERE wallet_address = ? AND is_active = 1', 
                [walletAddress], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!playerExists) {
            throw new NotFoundError('Player');
        }

        const query = `
            UPDATE players 
            SET level = COALESCE(?, level),
                experience_points = COALESCE(?, experience_points),
                total_score = COALESCE(?, total_score),
                boom_tokens = COALESCE(?, boom_tokens),
                admiral_tokens = COALESCE(?, admiral_tokens),
                lives = COALESCE(?, lives),
                current_score = COALESCE(?, current_score),
                highest_level_reached = COALESCE(?, highest_level_reached),
                total_enemies_killed = COALESCE(?, total_enemies_killed),
                total_playtime_minutes = COALESCE(?, total_playtime_minutes),
                last_updated = CURRENT_TIMESTAMP
            WHERE wallet_address = ? AND is_active = 1
        `;

        try {
            const result = await new Promise((resolve, reject) => {
                this.db.run(query, [
                    level, experience_points, total_score, boom_tokens, admiral_tokens,
                    lives, current_score, highest_level_reached, total_enemies_killed,
                    total_playtime_minutes, walletAddress
                ], function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });

            if (result === 0) {
                throw new NotFoundError('Player');
            }

            // Invalidate cache
            cacheManager.invalidatePlayer(walletAddress);
            cacheManager.invalidateLeaderboards();

            // Log progress update
            logger.logGameEvent('progress_updated', walletAddress, {
                level, total_score, boom_tokens, total_enemies_killed
            });

            timer.end({ changes: result });
            res.json({
                success: true,
                message: 'Player progress updated successfully'
            });

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });

    // Delete player (soft delete)
    deletePlayer = asyncHandler(async (req, res) => {
        const { walletAddress } = req.params;
        const adminIP = req.ip;
        const timer = logger.timer(`deletePlayer:${walletAddress}`);

        try {
            const result = await new Promise((resolve, reject) => {
                this.db.run(
                    'UPDATE players SET is_active = 0, last_updated = CURRENT_TIMESTAMP WHERE wallet_address = ?', 
                    [walletAddress], 
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.changes);
                    }
                );
            });

            if (result === 0) {
                throw new NotFoundError('Player');
            }

            // Log admin action
            const adminLogQuery = `
                INSERT INTO admin_actions (admin_ip, action_type, target_wallet, action_details)
                VALUES (?, ?, ?, ?)
            `;
            
            await new Promise((resolve, reject) => {
                this.db.run(adminLogQuery, [
                    adminIP, 'DELETE_PLAYER', walletAddress, 'Player profile soft deleted'
                ], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // Invalidate cache
            cacheManager.invalidatePlayer(walletAddress);
            cacheManager.invalidateLeaderboards();

            // Log security event
            logger.logSecurityEvent('player_deleted', {
                admin_ip: adminIP,
                target_wallet: walletAddress,
                severity: 'medium'
            });

            timer.end({ deleted: true });
            res.json({
                success: true,
                message: 'Player deleted successfully'
            });

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });

    // Reset player progress
    resetProgress = asyncHandler(async (req, res) => {
        const { walletAddress } = req.params;
        const adminIP = req.ip;
        const timer = logger.timer(`resetProgress:${walletAddress}`);

        try {
            const result = await new Promise((resolve, reject) => {
                this.db.run(`
                    UPDATE players 
                    SET level = 1, experience_points = 0, total_score = 0, 
                        boom_tokens = 0, admiral_tokens = 0, lives = 3, 
                        current_score = 0, highest_level_reached = 1, 
                        total_enemies_killed = 0, total_playtime_minutes = 0,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE wallet_address = ? AND is_active = 1
                `, [walletAddress], function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });

            if (result === 0) {
                throw new NotFoundError('Player');
            }

            // Log admin action
            const adminLogQuery = `
                INSERT INTO admin_actions (admin_ip, action_type, target_wallet, action_details)
                VALUES (?, ?, ?, ?)
            `;
            
            await new Promise((resolve, reject) => {
                this.db.run(adminLogQuery, [
                    adminIP, 'RESET_PLAYER', walletAddress, 'Player progress reset to defaults'
                ], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // Invalidate cache
            cacheManager.invalidatePlayer(walletAddress);
            cacheManager.invalidateLeaderboards();

            // Log security event
            logger.logSecurityEvent('player_reset', {
                admin_ip: adminIP,
                target_wallet: walletAddress,
                severity: 'medium'
            });

            timer.end({ reset: true });
            res.json({
                success: true,
                message: 'Player progress reset successfully'
            });

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });

    // Search players
    searchPlayers = asyncHandler(async (req, res) => {
        const { q: searchTerm } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        if (!searchTerm || searchTerm.length < 2) {
            throw new ValidationError('Search term must be at least 2 characters');
        }

        const timer = logger.timer('searchPlayers');
        const searchPattern = `%${searchTerm}%`;

        const query = `
            SELECT id, wallet_address, username, level, total_score, 
                   boom_tokens, admiral_tokens, last_login, created_at
            FROM players 
            WHERE is_active = 1 AND (
                wallet_address LIKE ? OR 
                username LIKE ?
            )
            ORDER BY total_score DESC
            LIMIT ? OFFSET ?
        `;

        try {
            const players = await new Promise((resolve, reject) => {
                this.db.all(query, [searchPattern, searchPattern, limit, offset], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            timer.end({ results_count: players.length });
            res.json({
                success: true,
                data: {
                    players,
                    searchTerm,
                    pagination: { page, limit }
                }
            });

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });

    // Export player data
    exportPlayerData = asyncHandler(async (req, res) => {
        const { walletAddress } = req.params;
        const timer = logger.timer(`exportPlayerData:${walletAddress}`);

        const query = `
            SELECT * FROM players 
            WHERE wallet_address = ? AND is_active = 1
        `;

        try {
            const player = await new Promise((resolve, reject) => {
                this.db.get(query, [walletAddress], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!player) {
                throw new NotFoundError('Player');
            }

            // Parse JSON fields for export
            if (player.skin_collection) {
                try {
                    player.skin_collection = JSON.parse(player.skin_collection);
                } catch (e) {
                    player.skin_collection = [];
                }
            }

            const filename = `player_${walletAddress.slice(0, 8)}_${Date.now()}.json`;
            
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            timer.end({ exported: true });
            res.json({
                success: true,
                data: { player },
                exported_at: new Date().toISOString(),
                filename
            });

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });

    // Get player statistics
    getPlayerStats = asyncHandler(async (req, res) => {
        const { walletAddress } = req.params;
        const timer = logger.timer(`getPlayerStats:${walletAddress}`);

        // Check cache first
        const cacheKey = `stats:${walletAddress}`;
        let stats = cacheManager.get('statistics', cacheKey);
        
        if (stats) {
            timer.end({ cache_hit: true });
            return res.json({
                success: true,
                data: { stats }
            });
        }

        const queries = {
            player: 'SELECT * FROM players WHERE wallet_address = ? AND is_active = 1',
            sessions: `
                SELECT COUNT(*) as total_sessions, 
                       SUM(session_duration_seconds) as total_playtime,
                       AVG(session_duration_seconds) as avg_session_duration,
                       SUM(score_earned) as total_score_from_sessions,
                       SUM(enemies_killed) as total_enemies_from_sessions
                FROM game_sessions 
                WHERE wallet_address = ? AND completion_status = 'completed'
            `,
            achievements: `
                SELECT COUNT(*) as total_achievements,
                       COUNT(CASE WHEN is_claimed = 1 THEN 1 END) as claimed_achievements
                FROM player_achievements 
                WHERE wallet_address = ?
            `,
            tokens: `
                SELECT 
                    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_earned,
                    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_spent,
                    COUNT(*) as total_transactions
                FROM token_transactions 
                WHERE wallet_address = ? AND status = 'completed'
            `
        };

        try {
            const [player, sessionStats, achievementStats, tokenStats] = await Promise.all([
                new Promise((resolve, reject) => {
                    this.db.get(queries.player, [walletAddress], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                }),
                new Promise((resolve, reject) => {
                    this.db.get(queries.sessions, [walletAddress], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                }),
                new Promise((resolve, reject) => {
                    this.db.get(queries.achievements, [walletAddress], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                }),
                new Promise((resolve, reject) => {
                    this.db.get(queries.tokens, [walletAddress], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                })
            ]);

            if (!player) {
                throw new NotFoundError('Player');
            }

            stats = {
                player: {
                    level: player.level,
                    experience_points: player.experience_points,
                    total_score: player.total_score,
                    boom_tokens: player.boom_tokens,
                    admiral_tokens: player.admiral_tokens,
                    highest_level_reached: player.highest_level_reached,
                    total_enemies_killed: player.total_enemies_killed,
                    total_playtime_minutes: player.total_playtime_minutes,
                    is_premium: player.is_premium,
                    account_age_days: Math.floor((Date.now() - new Date(player.created_at).getTime()) / (1000 * 60 * 60 * 24))
                },
                sessions: {
                    total_sessions: sessionStats.total_sessions || 0,
                    total_playtime_seconds: sessionStats.total_playtime || 0,
                    avg_session_duration_seconds: sessionStats.avg_session_duration || 0,
                    total_score_from_sessions: sessionStats.total_score_from_sessions || 0,
                    total_enemies_from_sessions: sessionStats.total_enemies_from_sessions || 0
                },
                achievements: {
                    total_achievements: achievementStats.total_achievements || 0,
                    claimed_achievements: achievementStats.claimed_achievements || 0,
                    achievement_completion_rate: achievementStats.total_achievements > 0 
                        ? ((achievementStats.claimed_achievements / achievementStats.total_achievements) * 100).toFixed(2) + '%'
                        : '0%'
                },
                tokens: {
                    total_earned: tokenStats.total_earned || 0,
                    total_spent: tokenStats.total_spent || 0,
                    net_tokens: (tokenStats.total_earned || 0) - (tokenStats.total_spent || 0),
                    total_transactions: tokenStats.total_transactions || 0
                }
            };

            // Cache the stats
            cacheManager.set('statistics', cacheKey, stats, 600); // 10 minutes cache

            timer.end({ cache_hit: false });
            res.json({
                success: true,
                data: { stats }
            });

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });
}

module.exports = new PlayerController();