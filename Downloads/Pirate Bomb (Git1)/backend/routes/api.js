const express = require('express');
const router = express.Router();

// Import controllers
const playerController = require('../controllers/playerController');
const gameController = require('../controllers/gameController');

// Import middleware
const { validation, handleValidationErrors } = require('../middleware/security');
const { securityMiddleware } = require('../middleware/security');

// Player routes
router.get('/players', 
    validation.pagination,
    handleValidationErrors,
    securityMiddleware.rateLimits.general,
    playerController.getPlayers
);

router.get('/players/search',
    validation.search,
    validation.pagination,
    handleValidationErrors,
    securityMiddleware.rateLimits.general,
    playerController.searchPlayers
);

router.get('/players/:walletAddress',
    validation.walletAddress,
    handleValidationErrors,
    securityMiddleware.rateLimits.general,
    playerController.getPlayer
);

router.get('/players/:walletAddress/stats',
    validation.walletAddress,
    handleValidationErrors,
    securityMiddleware.rateLimits.general,
    playerController.getPlayerStats
);

router.get('/players/:walletAddress/export',
    validation.walletAddress,
    handleValidationErrors,
    securityMiddleware.rateLimits.admin,
    playerController.exportPlayerData
);

router.post('/players',
    validation.walletAddress,
    validation.username,
    validation.level,
    validation.score,
    validation.tokenAmount,
    validation.lives,
    handleValidationErrors,
    securityMiddleware.rateLimits.general,
    playerController.createOrUpdatePlayer
);

router.put('/players/:walletAddress/progress',
    validation.walletAddress,
    validation.level,
    validation.score,
    validation.tokenAmount,
    validation.lives,
    handleValidationErrors,
    securityMiddleware.rateLimits.gameSession,
    playerController.updateProgress
);

router.delete('/players/:walletAddress',
    validation.walletAddress,
    handleValidationErrors,
    securityMiddleware.rateLimits.admin,
    playerController.deletePlayer
);

router.post('/players/:walletAddress/reset',
    validation.walletAddress,
    handleValidationErrors,
    securityMiddleware.rateLimits.admin,
    playerController.resetProgress
);

// Game session routes
router.post('/game/sessions',
    validation.walletAddress,
    validation.level,
    handleValidationErrors,
    securityMiddleware.rateLimits.gameSession,
    gameController.startSession
);

router.put('/game/sessions/:sessionId',
    validation.sessionId,
    validation.score,
    validation.tokenAmount,
    handleValidationErrors,
    securityMiddleware.rateLimits.gameSession,
    gameController.updateSession
);

router.post('/game/sessions/:sessionId/end',
    validation.sessionId,
    handleValidationErrors,
    securityMiddleware.rateLimits.gameSession,
    gameController.endSession
);

router.get('/game/sessions/:walletAddress',
    validation.walletAddress,
    validation.pagination,
    handleValidationErrors,
    securityMiddleware.rateLimits.general,
    gameController.getPlayerSessions
);

// Leaderboard routes
router.get('/game/leaderboards',
    handleValidationErrors,
    securityMiddleware.rateLimits.general,
    gameController.getLeaderboards
);

// Achievement routes
router.get('/game/achievements',
    handleValidationErrors,
    securityMiddleware.rateLimits.general,
    gameController.getAchievements
);

router.get('/game/achievements/:walletAddress',
    validation.walletAddress,
    handleValidationErrors,
    securityMiddleware.rateLimits.general,
    gameController.getPlayerAchievements
);

router.post('/game/achievements/:walletAddress/:achievementId',
    validation.walletAddress,
    validation.challengeProgress,
    handleValidationErrors,
    securityMiddleware.rateLimits.general,
    gameController.unlockAchievement
);

module.exports = router;