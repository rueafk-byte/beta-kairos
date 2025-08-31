
// Player Registry Client Integration
// Generated on: 2025-08-23T08:35:43.725Z

const PLAYER_REGISTRY_CONFIG = {
    programId: 'PLYRrgstry111111111111111111111111111111111',
    cluster: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com'
};

// Player Registry Instructions
const PLAYER_REGISTRY_INSTRUCTIONS = {
    initializePlayer: {
        name: 'initialize_player',
        accounts: [
            'player_profile',
            'player',
            'system_program'
        ],
        args: ['username']
    },
    updatePlayerLevel: {
        name: 'update_player_level',
        accounts: [
            'player_profile',
            'player'
        ],
        args: ['new_level', 'new_score', 'level_completed']
    },
    addAchievement: {
        name: 'add_achievement',
        accounts: [
            'player_profile',
            'player'
        ],
        args: ['achievement_id', 'achievement_name', 'reward_amount']
    },
    recordBossDefeat: {
        name: 'record_boss_defeat',
        accounts: [
            'player_profile',
            'player'
        ],
        args: ['boss_id', 'boss_level', 'reward_amount']
    },
    claimDailyReward: {
        name: 'claim_daily_reward',
        accounts: [
            'player_profile',
            'player'
        ],
        args: []
    },
    claimWeeklyReward: {
        name: 'claim_weekly_reward',
        accounts: [
            'player_profile',
            'player'
        ],
        args: []
    }
};

// Export for use in game
window.PLAYER_REGISTRY_CONFIG = PLAYER_REGISTRY_CONFIG;
window.PLAYER_REGISTRY_INSTRUCTIONS = PLAYER_REGISTRY_INSTRUCTIONS;
