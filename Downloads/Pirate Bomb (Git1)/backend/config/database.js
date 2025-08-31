const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

class Database {
    constructor() {
        this.db = null;
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            const dbPath = path.join(process.cwd(), 'player_data.db');
            
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    this.connectionAttempts++;
                    logger.error('Database connection failed:', err);
                    
                    if (this.connectionAttempts < this.maxConnectionAttempts) {
                        setTimeout(() => this.connect().then(resolve).catch(reject), 1000);
                        return;
                    }
                    reject(err);
                } else {
                    this.isConnected = true;
                    logger.info('Connected to SQLite database successfully');
                    this.initializeTables().then(resolve).catch(reject);
                }
            });

            // Enable foreign keys
            this.db.run('PRAGMA foreign_keys = ON');
            // Enable WAL mode for better concurrency
            this.db.run('PRAGMA journal_mode = WAL');
        });
    }

    async initializeTables() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Enhanced Players table with more game-specific fields
                this.db.run(`CREATE TABLE IF NOT EXISTS players (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_address TEXT UNIQUE NOT NULL,
                    username TEXT,
                    email TEXT,
                    level INTEGER DEFAULT 1,
                    experience_points INTEGER DEFAULT 0,
                    total_score INTEGER DEFAULT 0,
                    boom_tokens INTEGER DEFAULT 0,
                    admiral_tokens INTEGER DEFAULT 0,
                    lives INTEGER DEFAULT 3,
                    current_score INTEGER DEFAULT 0,
                    highest_level_reached INTEGER DEFAULT 1,
                    total_enemies_killed INTEGER DEFAULT 0,
                    total_playtime_minutes INTEGER DEFAULT 0,
                    avatar_nft_id TEXT,
                    skin_collection TEXT DEFAULT '[]',
                    preferred_difficulty TEXT DEFAULT 'normal',
                    is_premium BOOLEAN DEFAULT 0,
                    last_login DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1
                )`);

                // Enhanced Recharge tracking with more flexibility
                this.db.run(`CREATE TABLE IF NOT EXISTS recharge_tracking (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_address TEXT UNIQUE NOT NULL,
                    lives_remaining INTEGER DEFAULT 3,
                    max_lives INTEGER DEFAULT 3,
                    last_recharge_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                    recharge_cooldown_end DATETIME,
                    is_recharging BOOLEAN DEFAULT 0,
                    recharge_tokens_used INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (wallet_address) REFERENCES players(wallet_address)
                )`);

                // Game sessions with detailed tracking
                this.db.run(`CREATE TABLE IF NOT EXISTS game_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT UNIQUE NOT NULL,
                    wallet_address TEXT NOT NULL,
                    level_started INTEGER NOT NULL,
                    level_completed INTEGER,
                    session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
                    session_end DATETIME,
                    score_earned INTEGER DEFAULT 0,
                    tokens_earned INTEGER DEFAULT 0,
                    enemies_killed INTEGER DEFAULT 0,
                    levels_completed INTEGER DEFAULT 0,
                    deaths_count INTEGER DEFAULT 0,
                    power_ups_collected INTEGER DEFAULT 0,
                    session_duration_seconds INTEGER DEFAULT 0,
                    completion_status TEXT DEFAULT 'in_progress',
                    difficulty_level TEXT DEFAULT 'normal',
                    platform TEXT DEFAULT 'web',
                    ip_address TEXT,
                    user_agent TEXT,
                    FOREIGN KEY (wallet_address) REFERENCES players(wallet_address)
                )`);

                // Achievements system
                this.db.run(`CREATE TABLE IF NOT EXISTS achievements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    achievement_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    category TEXT NOT NULL,
                    difficulty TEXT DEFAULT 'normal',
                    reward_tokens INTEGER DEFAULT 0,
                    reward_nft_id TEXT,
                    unlock_criteria TEXT NOT NULL,
                    icon_url TEXT,
                    is_secret BOOLEAN DEFAULT 0,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // Player achievements tracking
                this.db.run(`CREATE TABLE IF NOT EXISTS player_achievements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_address TEXT NOT NULL,
                    achievement_id TEXT NOT NULL,
                    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    progress_percentage INTEGER DEFAULT 100,
                    is_claimed BOOLEAN DEFAULT 0,
                    claimed_at DATETIME,
                    rewards_given TEXT DEFAULT '{}',
                    FOREIGN KEY (wallet_address) REFERENCES players(wallet_address),
                    FOREIGN KEY (achievement_id) REFERENCES achievements(achievement_id),
                    UNIQUE(wallet_address, achievement_id)
                )`);

                // Token transactions with detailed tracking
                this.db.run(`CREATE TABLE IF NOT EXISTS token_transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transaction_id TEXT UNIQUE NOT NULL,
                    wallet_address TEXT NOT NULL,
                    token_type TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    transaction_type TEXT NOT NULL,
                    source TEXT NOT NULL,
                    source_details TEXT DEFAULT '{}',
                    blockchain_tx_hash TEXT,
                    status TEXT DEFAULT 'pending',
                    metadata TEXT DEFAULT '{}',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    completed_at DATETIME,
                    FOREIGN KEY (wallet_address) REFERENCES players(wallet_address)
                )`);

                // NFT inventory system
                this.db.run(`CREATE TABLE IF NOT EXISTS nft_inventory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_address TEXT NOT NULL,
                    nft_id TEXT NOT NULL,
                    nft_type TEXT NOT NULL,
                    nft_name TEXT NOT NULL,
                    nft_description TEXT,
                    rarity TEXT DEFAULT 'common',
                    metadata TEXT DEFAULT '{}',
                    mint_address TEXT,
                    is_equipped BOOLEAN DEFAULT 0,
                    acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    acquired_method TEXT NOT NULL,
                    FOREIGN KEY (wallet_address) REFERENCES players(wallet_address)
                )`);

                // Leaderboards
                this.db.run(`CREATE TABLE IF NOT EXISTS leaderboards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    leaderboard_type TEXT NOT NULL,
                    wallet_address TEXT NOT NULL,
                    username TEXT,
                    score INTEGER NOT NULL,
                    rank_position INTEGER,
                    season TEXT DEFAULT 'current',
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (wallet_address) REFERENCES players(wallet_address)
                )`);

                // Daily challenges
                this.db.run(`CREATE TABLE IF NOT EXISTS daily_challenges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    challenge_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    challenge_type TEXT NOT NULL,
                    target_value INTEGER NOT NULL,
                    reward_tokens INTEGER DEFAULT 0,
                    reward_nft_id TEXT,
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // Player challenge progress
                this.db.run(`CREATE TABLE IF NOT EXISTS player_challenge_progress (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_address TEXT NOT NULL,
                    challenge_id TEXT NOT NULL,
                    current_progress INTEGER DEFAULT 0,
                    is_completed BOOLEAN DEFAULT 0,
                    completed_at DATETIME,
                    is_claimed BOOLEAN DEFAULT 0,
                    claimed_at DATETIME,
                    FOREIGN KEY (wallet_address) REFERENCES players(wallet_address),
                    FOREIGN KEY (challenge_id) REFERENCES daily_challenges(challenge_id),
                    UNIQUE(wallet_address, challenge_id)
                )`);

                // Enhanced admin actions log
                this.db.run(`CREATE TABLE IF NOT EXISTS admin_actions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    admin_id TEXT,
                    admin_ip TEXT,
                    action_type TEXT NOT NULL,
                    target_wallet TEXT,
                    action_details TEXT,
                    request_data TEXT DEFAULT '{}',
                    response_data TEXT DEFAULT '{}',
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    session_id TEXT
                )`);

                // System analytics
                this.db.run(`CREATE TABLE IF NOT EXISTS system_analytics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric_type TEXT NOT NULL,
                    metric_value REAL NOT NULL,
                    metric_metadata TEXT DEFAULT '{}',
                    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    date_bucket DATE DEFAULT (DATE('now'))
                )`);

                // Create indexes for better performance
                this.createIndexes();

                logger.info('Database tables initialized successfully');
                resolve();
            });
        });
    }

    createIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_players_wallet ON players(wallet_address)',
            'CREATE INDEX IF NOT EXISTS idx_players_username ON players(username)',
            'CREATE INDEX IF NOT EXISTS idx_players_total_score ON players(total_score DESC)',
            'CREATE INDEX IF NOT EXISTS idx_players_level ON players(level)',
            'CREATE INDEX IF NOT EXISTS idx_players_last_login ON players(last_login)',
            'CREATE INDEX IF NOT EXISTS idx_game_sessions_wallet ON game_sessions(wallet_address)',
            'CREATE INDEX IF NOT EXISTS idx_game_sessions_start ON game_sessions(session_start)',
            'CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(completion_status)',
            'CREATE INDEX IF NOT EXISTS idx_token_transactions_wallet ON token_transactions(wallet_address)',
            'CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(transaction_type)',
            'CREATE INDEX IF NOT EXISTS idx_token_transactions_created ON token_transactions(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_player_achievements_wallet ON player_achievements(wallet_address)',
            'CREATE INDEX IF NOT EXISTS idx_player_achievements_claimed ON player_achievements(is_claimed)',
            'CREATE INDEX IF NOT EXISTS idx_nft_inventory_wallet ON nft_inventory(wallet_address)',
            'CREATE INDEX IF NOT EXISTS idx_nft_inventory_type ON nft_inventory(nft_type)',
            'CREATE INDEX IF NOT EXISTS idx_leaderboards_type ON leaderboards(leaderboard_type)',
            'CREATE INDEX IF NOT EXISTS idx_leaderboards_score ON leaderboards(score DESC)',
            'CREATE INDEX IF NOT EXISTS idx_daily_challenges_active ON daily_challenges(is_active, start_date, end_date)',
            'CREATE INDEX IF NOT EXISTS idx_analytics_type_date ON system_analytics(metric_type, date_bucket)'
        ];

        indexes.forEach(indexSQL => {
            this.db.run(indexSQL, (err) => {
                if (err) {
                    logger.warn('Index creation warning:', err.message);
                }
            });
        });
    }

    getDb() {
        return this.db;
    }

    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        logger.error('Error closing database:', err);
                        reject(err);
                    } else {
                        this.isConnected = false;
                        logger.info('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // Health check method
    async healthCheck() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected || !this.db) {
                reject(new Error('Database not connected'));
                return;
            }

            this.db.get('SELECT 1 as test', (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ status: 'healthy', timestamp: new Date().toISOString() });
                }
            });
        });
    }
}

// Export singleton instance
const database = new Database();
module.exports = database;