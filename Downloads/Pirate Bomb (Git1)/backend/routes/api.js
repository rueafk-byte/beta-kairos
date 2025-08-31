const express = require('express');
const router = express.Router();
const database = require('../config/database');
const logger = require('../utils/logger');
const cacheManager = require('../utils/cache');

// Get all players
router.get('/players', async (req, res) => {
    try {
        const db = database.getDb();
        
        // Check cache first
        let players = cacheManager.getPlayers();
        if (players) {
            return res.json({ success: true, data: players });
        }
        
        // Query database
        const query = 'SELECT * FROM players WHERE is_active = 1 ORDER BY total_score DESC';
        
        const playersData = await new Promise((resolve, reject) => {
            db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
        
        // Cache the result
        cacheManager.setPlayers(playersData, 300);
        res.json({ success: true, data: playersData });
        
    } catch (error) {
        logger.error('Error fetching players:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch players',
            data: []
        });
    }
});

// Dashboard stats endpoint
router.get('/dashboard/stats', async (req, res) => {
    try {
        let stats = cacheManager.getGameStats();
        if (stats) {
            return res.json({ success: true, data: stats });
        }
        
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
        res.json({ success: true, data: results });
        
    } catch (error) {
        logger.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
    }
});

module.exports = router;
