const database = require('../config/database');
const logger = require('../utils/logger');
const cacheManager = require('../utils/cache');
const { v4: uuidv4 } = require('uuid');
const { 
    asyncHandler, 
    NotFoundError, 
    ValidationError, 
    GameError,
    handleDatabaseError 
} = require('../middleware/errorHandler');

class GameController {
    constructor() {
        this.db = database.getDb();
    }

    // Start a new game session
    startSession = asyncHandler(async (req, res) => {
        const { wallet_address, level_started, difficulty_level = 'normal' } = req.body;
        const sessionId = uuidv4();
        const timer = logger.timer(`startSession:${wallet_address}`);

        if (!wallet_address || !level_started) {
            throw new ValidationError('Wallet address and level are required');
        }

        const userAgent = req.get('User-Agent') || '';
        const ipAddress = req.ip;

        const query = `
            INSERT INTO game_sessions 
            (session_id, wallet_address, level_started, difficulty_level, platform, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        try {
            await new Promise((resolve, reject) => {
                this.db.run(query, [
                    sessionId, wallet_address, level_started, difficulty_level, 
                    'web', ipAddress, userAgent
                ], function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            });

            // Cache session data
            const sessionData = {
                session_id: sessionId,
                wallet_address,
                level_started,
                difficulty_level,
                started_at: new Date().toISOString()
            };
            cacheManager.setSession(sessionId, sessionData, 1800); // 30 minutes cache

            // Log game event
            logger.logGameEvent('session_started', wallet_address, {
                session_id: sessionId,
                level_started,
                difficulty_level
            });

            timer.end({ session_created: true });
            res.json({
                success: true,
                message: 'Game session started successfully',
                data: {
                    session_id: sessionId,
                    level_started,
                    difficulty_level,
                    started_at: new Date().toISOString()
                }
            });

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });

    // Update game session progress
    updateSession = asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const { 
            level_completed, score_earned, tokens_earned, enemies_killed, 
            levels_completed, deaths_count, power_ups_collected 
        } = req.body;

        const timer = logger.timer(`updateSession:${sessionId}`);

        // Verify session exists and is active
        const sessionQuery = 'SELECT * FROM game_sessions WHERE session_id = ? AND completion_status = ?';
        
        try {
            const session = await new Promise((resolve, reject) => {
                this.db.get(sessionQuery, [sessionId, 'in_progress'], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!session) {
                throw new NotFoundError('Active game session');
            }

            const updateQuery = `
                UPDATE game_sessions 
                SET level_completed = COALESCE(?, level_completed),
                    score_earned = COALESCE(?, score_earned),
                    tokens_earned = COALESCE(?, tokens_earned),
                    enemies_killed = COALESCE(?, enemies_killed),
                    levels_completed = COALESCE(?, levels_completed),
                    deaths_count = COALESCE(?, deaths_count),
                    power_ups_collected = COALESCE(?, power_ups_collected)
                WHERE session_id = ?
            `;

            await new Promise((resolve, reject) => {
                this.db.run(updateQuery, [
                    level_completed, score_earned, tokens_earned, enemies_killed,
                    levels_completed, deaths_count, power_ups_collected, sessionId
                ], function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });

            // Update cached session data
            const cachedSession = cacheManager.getSession(sessionId);
            if (cachedSession) {
                Object.assign(cachedSession, {
                    level_completed, score_earned, tokens_earned, enemies_killed,
                    levels_completed, deaths_count, power_ups_collected
                });
                cacheManager.setSession(sessionId, cachedSession, 1800);
            }

            // Log game event
            logger.logGameEvent('session_updated', session.wallet_address, {
                session_id: sessionId,
                score_earned,
                enemies_killed,
                levels_completed
            });

            timer.end({ session_updated: true });
            res.json({
                success: true,
                message: 'Game session updated successfully'
            });

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });

    // End game session
    endSession = asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const { completion_status = 'completed' } = req.body;
        const timer = logger.timer(`endSession:${sessionId}`);

        if (!['completed', 'abandoned', 'failed'].includes(completion_status)) {
            throw new ValidationError('Invalid completion status');
        }

        try {
            // Get current session data
            const session = await new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM game_sessions WHERE session_id = ?', [sessionId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!session) {
                throw new NotFoundError('Game session');
            }

            if (session.completion_status !== 'in_progress') {
                throw new GameError('Session already ended', { session_id: sessionId });
            }

            const sessionDuration = Math.floor((Date.now() - new Date(session.session_start).getTime()) / 1000);

            const updateQuery = `
                UPDATE game_sessions 
                SET session_end = CURRENT_TIMESTAMP,
                    completion_status = ?,
                    session_duration_seconds = ?
                WHERE session_id = ?
            `;

            await new Promise((resolve, reject) => {
                this.db.run(updateQuery, [completion_status, sessionDuration, sessionId], function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });

            // Update player statistics if session was completed successfully
            if (completion_status === 'completed' && session.score_earned > 0) {
                await this.updatePlayerStatistics(session.wallet_address, {
                    score_earned: session.score_earned,
                    tokens_earned: session.tokens_earned,
                    enemies_killed: session.enemies_killed,
                    playtime_minutes: Math.floor(sessionDuration / 60),
                    levels_completed: session.levels_completed
                });
            }

            // Clear session cache
            cacheManager.del('sessions', `session:${sessionId}`);

            // Log game event
            logger.logGameEvent('session_ended', session.wallet_address, {
                session_id: sessionId,
                completion_status,
                duration_seconds: sessionDuration,
                final_score: session.score_earned
            });

            timer.end({ session_ended: true, status: completion_status });
            res.json({
                success: true,
                message: 'Game session ended successfully',
                data: {
                    session_id: sessionId,
                    completion_status,
                    duration_seconds: sessionDuration,
                    final_score: session.score_earned || 0
                }
            });

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });

    // Get player's game sessions
    getPlayerSessions = asyncHandler(async (req, res) => {
        const { walletAddress } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status;

        const timer = logger.timer(`getPlayerSessions:${walletAddress}`);

        let whereClause = 'WHERE wallet_address = ?';
        let queryParams = [walletAddress];

        if (status) {
            whereClause += ' AND completion_status = ?';
            queryParams.push(status);
        }

        const query = `
            SELECT session_id, level_started, level_completed, session_start, session_end,
                   score_earned, tokens_earned, enemies_killed, levels_completed,
                   deaths_count, power_ups_collected, session_duration_seconds,
                   completion_status, difficulty_level
            FROM game_sessions 
            ${whereClause}
            ORDER BY session_start DESC
            LIMIT ? OFFSET ?
        `;

        try {
            const sessions = await new Promise((resolve, reject) => {
                this.db.all(query, [...queryParams, limit, offset], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            timer.end({ sessions_count: sessions.length });
            res.json({
                success: true,
                data: {
                    sessions,
                    pagination: { page, limit }
                }
            });

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });

    // Get leaderboards
    getLeaderboards = asyncHandler(async (req, res) => {
        const { type = 'total_score', limit = 100, season = 'current' } = req.query;
        const timer = logger.timer('getLeaderboards');

        // Check cache first
        let leaderboard = cacheManager.getLeaderboard(type, limit);
        
        if (leaderboard) {
            timer.end({ cache_hit: true });
            return res.json({
                success: true,
                data: { leaderboard }
            });
        }

        let query;
        let orderBy;

        switch (type) {
            case 'total_score':
                query = `
                    SELECT wallet_address, username, total_score as score, level,
                           boom_tokens, admiral_tokens, highest_level_reached,
                           ROW_NUMBER() OVER (ORDER BY total_score DESC) as rank
                    FROM players 
                    WHERE is_active = 1 AND total_score > 0
                    ORDER BY total_score DESC
                    LIMIT ?
                `;
                break;
            case 'level':
                query = `
                    SELECT wallet_address, username, level as score, total_score,
                           boom_tokens, admiral_tokens, highest_level_reached,
                           ROW_NUMBER() OVER (ORDER BY level DESC, total_score DESC) as rank
                    FROM players 
                    WHERE is_active = 1
                    ORDER BY level DESC, total_score DESC
                    LIMIT ?
                `;
                break;
            case 'tokens':
                query = `
                    SELECT wallet_address, username, (boom_tokens + admiral_tokens) as score,
                           boom_tokens, admiral_tokens, level, total_score,
                           ROW_NUMBER() OVER (ORDER BY (boom_tokens + admiral_tokens) DESC) as rank
                    FROM players 
                    WHERE is_active = 1 AND (boom_tokens + admiral_tokens) > 0
                    ORDER BY (boom_tokens + admiral_tokens) DESC
                    LIMIT ?
                `;
                break;
            case 'enemies_killed':
                query = `
                    SELECT wallet_address, username, total_enemies_killed as score,
                           level, total_score, boom_tokens, admiral_tokens,
                           ROW_NUMBER() OVER (ORDER BY total_enemies_killed DESC) as rank
                    FROM players 
                    WHERE is_active = 1 AND total_enemies_killed > 0
                    ORDER BY total_enemies_killed DESC
                    LIMIT ?
                `;
                break;
            default:
                throw new ValidationError('Invalid leaderboard type');
        }

        try {
            const results = await new Promise((resolve, reject) => {
                this.db.all(query, [limit], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            leaderboard = {
                type,
                season,
                limit,
                entries: results,
                generated_at: new Date().toISOString()
            };

            // Cache the leaderboard
            cacheManager.setLeaderboard(type, limit, leaderboard, 600); // 10 minutes cache

            timer.end({ cache_hit: false, entries_count: results.length });
            res.json({
                success: true,
                data: { leaderboard }
            });

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });

    // Get achievements
    getAchievements = asyncHandler(async (req, res) => {
        const timer = logger.timer('getAchievements');
        
        // Check cache first
        let achievements = cacheManager.get('achievements', 'all_achievements');
        
        if (achievements) {
            timer.end({ cache_hit: true });
            return res.json({
                success: true,
                data: { achievements }
            });
        }

        const query = `
            SELECT achievement_id, name, description, category, difficulty,
                   reward_tokens, reward_nft_id, unlock_criteria, icon_url,
                   is_secret, created_at
            FROM achievements 
            WHERE is_active = 1
            ORDER BY category, difficulty, name
        `;

        try {
            achievements = await new Promise((resolve, reject) => {
                this.db.all(query, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            // Parse unlock criteria JSON
            achievements = achievements.map(achievement => ({
                ...achievement,
                unlock_criteria: JSON.parse(achievement.unlock_criteria || '{}')
            }));

            // Cache achievements
            cacheManager.set('achievements', 'all_achievements', achievements, 1800); // 30 minutes cache

            timer.end({ cache_hit: false, achievements_count: achievements.length });
            res.json({
                success: true,
                data: { achievements }
            });

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });

    // Get player achievements
    getPlayerAchievements = asyncHandler(async (req, res) => {
        const { walletAddress } = req.params;
        const timer = logger.timer(`getPlayerAchievements:${walletAddress}`);

        // Check cache first
        let playerAchievements = cacheManager.getPlayerAchievements(walletAddress);
        
        if (playerAchievements) {
            timer.end({ cache_hit: true });
            return res.json({
                success: true,
                data: { achievements: playerAchievements }
            });
        }

        const query = `
            SELECT a.achievement_id, a.name, a.description, a.category,
                   a.difficulty, a.reward_tokens, a.reward_nft_id, a.icon_url,
                   pa.unlocked_at, pa.progress_percentage, pa.is_claimed, pa.claimed_at
            FROM achievements a
            LEFT JOIN player_achievements pa ON a.achievement_id = pa.achievement_id 
                AND pa.wallet_address = ?
            WHERE a.is_active = 1
            ORDER BY pa.unlocked_at DESC, a.category, a.name
        `;

        try {
            const results = await new Promise((resolve, reject) => {
                this.db.all(query, [walletAddress], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            playerAchievements = results.map(achievement => ({
                ...achievement,
                is_unlocked: !!achievement.unlocked_at,
                progress_percentage: achievement.progress_percentage || 0
            }));

            // Cache player achievements
            cacheManager.setPlayerAchievements(walletAddress, playerAchievements, 300); // 5 minutes cache

            timer.end({ cache_hit: false, achievements_count: playerAchievements.length });
            res.json({
                success: true,
                data: { achievements: playerAchievements }
            });

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });

    // Unlock achievement for player
    unlockAchievement = asyncHandler(async (req, res) => {
        const { walletAddress, achievementId } = req.params;
        const { progress_percentage = 100 } = req.body;
        const timer = logger.timer(`unlockAchievement:${walletAddress}:${achievementId}`);

        try {
            // Verify achievement exists
            const achievement = await new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM achievements WHERE achievement_id = ? AND is_active = 1', 
                    [achievementId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!achievement) {
                throw new NotFoundError('Achievement');
            }

            // Check if already unlocked
            const existing = await new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM player_achievements WHERE wallet_address = ? AND achievement_id = ?', 
                    [walletAddress, achievementId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (existing) {
                throw new GameError('Achievement already unlocked', { achievement_id: achievementId });
            }

            // Insert achievement unlock
            const unlockQuery = `
                INSERT INTO player_achievements (wallet_address, achievement_id, progress_percentage)
                VALUES (?, ?, ?)
            `;

            await new Promise((resolve, reject) => {
                this.db.run(unlockQuery, [walletAddress, achievementId, progress_percentage], function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            });

            // Invalidate cache
            cacheManager.del('achievements', `achievements:${walletAddress}`);

            // Log achievement unlock
            logger.logGameEvent('achievement_unlocked', walletAddress, {
                achievement_id: achievementId,
                achievement_name: achievement.name,
                reward_tokens: achievement.reward_tokens
            });

            timer.end({ achievement_unlocked: true });
            res.json({
                success: true,
                message: 'Achievement unlocked successfully',
                data: {
                    achievement_id: achievementId,
                    achievement_name: achievement.name,
                    reward_tokens: achievement.reward_tokens,
                    unlocked_at: new Date().toISOString()
                }
            });

        } catch (error) {
            timer.end({ error: true });
            throw handleDatabaseError(error);
        }
    });

    // Helper method to update player statistics
    updatePlayerStatistics = async (walletAddress, stats) => {
        const updateQuery = `
            UPDATE players 
            SET total_score = total_score + ?,
                boom_tokens = boom_tokens + ?,
                total_enemies_killed = total_enemies_killed + ?,
                total_playtime_minutes = total_playtime_minutes + ?,
                last_updated = CURRENT_TIMESTAMP
            WHERE wallet_address = ? AND is_active = 1
        `;

        return new Promise((resolve, reject) => {
            this.db.run(updateQuery, [
                stats.score_earned || 0,
                stats.tokens_earned || 0,
                stats.enemies_killed || 0,
                stats.playtime_minutes || 0,
                walletAddress
            ], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    };
}

module.exports = new GameController();