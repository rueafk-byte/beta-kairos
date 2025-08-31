// Web3 Reward System for Kaboom Game
class RewardSystem {
    constructor(walletConnection) {
        this.walletConnection = walletConnection;
        this.achievements = new Map();
        this.dailyRewards = new Map();
        this.weeklyRewards = new Map();
        
        this.initializeRewards();
    }

    initializeRewards() {
        // Initialize achievement tracking
        this.achievements.set('speed_runner', { name: 'Speed Runner', description: 'Complete level under time limit', reward: 50, claimed: false });
        this.achievements.set('perfect_run', { name: 'Perfect Run', description: 'Complete level without taking damage', reward: 100, claimed: false });
        this.achievements.set('collector', { name: 'Collector', description: 'Find all hidden items in level', reward: 75, claimed: false });
        this.achievements.set('chapter_master', { name: 'Chapter Master', description: 'Complete all levels in a chapter', reward: 500, claimed: false });
        this.achievements.set('game_master', { name: 'Game Master', description: 'Complete all 40 levels', reward: 2000, claimed: false });
        this.achievements.set('bomb_master', { name: 'Bomb Master', description: 'Use bombs to defeat 100 enemies', reward: 300, claimed: false });
        this.achievements.set('platform_king', { name: 'Platform King', description: 'Jump 1000 times', reward: 200, claimed: false });
        this.achievements.set('survivor', { name: 'Survivor', description: 'Survive 10 minutes without healing', reward: 150, claimed: false });
        this.achievements.set('boss_slayer', { name: 'Boss Slayer', description: 'Defeat all 5 bosses', reward: 1000, claimed: false });
        this.achievements.set('token_collector', { name: 'Token Collector', description: 'Accumulate 10,000 $PIRATE', reward: 5000, claimed: false });

        // Initialize daily rewards
        this.dailyRewards.set('login', { name: 'Daily Login', reward: 10, claimed: false, lastClaimed: null });
        this.dailyRewards.set('level', { name: 'Daily Level', reward: 50, claimed: false, lastClaimed: null });
        this.dailyRewards.set('boss', { name: 'Daily Boss', reward: 200, claimed: false, lastClaimed: null });
        this.dailyRewards.set('achievement', { name: 'Daily Achievement', reward: 100, claimed: false, lastClaimed: null });

        // Initialize weekly rewards
        this.weeklyRewards.set('streak', { name: 'Weekly Streak', reward: 500, claimed: false, lastClaimed: null });
        this.weeklyRewards.set('progress', { name: 'Weekly Progress', reward: 1000, claimed: false, lastClaimed: null });
        this.weeklyRewards.set('boss_week', { name: 'Weekly Boss', reward: 1500, claimed: false, lastClaimed: null });
        this.weeklyRewards.set('collection', { name: 'Weekly Collection', reward: 2000, claimed: false, lastClaimed: null });
    }

    // Level completion rewards
    getLevelReward(level) {
        if (level >= 1 && level <= 10) {
            return 10 + (level - 1) * 4; // 10, 14, 18, 22, 26, 30, 34, 38, 42, 46
        } else if (level >= 11 && level <= 20) {
            return 60 + (level - 11) * 10; // 60, 70, 80, 90, 100, 110, 120, 130, 140, 150
        } else if (level >= 21 && level <= 30) {
            return 200 + (level - 21) * 33; // 200, 233, 266, 299, 332, 365, 398, 431, 464, 497
        } else if (level >= 31 && level <= 40) {
            return 600 + (level - 31) * 44; // 600, 644, 688, 732, 776, 820, 864, 908, 952, 996
        }
        return 0;
    }

    // Boss battle rewards
    getBossReward(chapter) {
        const rewards = {
            1: 500,
            2: 1000,
            3: 2000,
            4: 3000,
            5: 5000
        };
        return rewards[chapter] || 0;
    }

    // Achievement rewards
    getAchievementReward(achievementId) {
        const achievement = this.achievements.get(achievementId);
        return achievement ? achievement.reward : 0;
    }

    // Daily reward amounts
    getDailyReward(rewardType) {
        const reward = this.dailyRewards.get(rewardType);
        return reward ? reward.reward : 0;
    }

    // Weekly reward amounts
    getWeeklyReward(rewardType) {
        const reward = this.weeklyRewards.get(rewardType);
        return reward ? reward.reward : 0;
    }

    // Check if daily reward can be claimed
    canClaimDailyReward(rewardType) {
        const reward = this.dailyRewards.get(rewardType);
        if (!reward) return false;

        if (!reward.lastClaimed) return true;

        const now = new Date();
        const lastClaimed = new Date(reward.lastClaimed);
        const diffTime = Math.abs(now - lastClaimed);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays >= 1;
    }

    // Check if weekly reward can be claimed
    canClaimWeeklyReward(rewardType) {
        const reward = this.weeklyRewards.get(rewardType);
        if (!reward) return false;

        if (!reward.lastClaimed) return true;

        const now = new Date();
        const lastClaimed = new Date(reward.lastClaimed);
        const diffTime = Math.abs(now - lastClaimed);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays >= 7;
    }

    // Claim level completion reward
    async claimLevelReward(level) {
        const reward = this.getLevelReward(level);
        if (reward > 0) {
            const success = await this.walletConnection.claimReward(level, reward);
            if (success) {
                this.updateRewardUI();
            }
            return success;
        }
        return false;
    }

    // Claim boss battle reward
    async claimBossReward(chapter) {
        const reward = this.getBossReward(chapter);
        if (reward > 0) {
            const success = await this.walletConnection.claimReward(`Boss ${chapter}`, reward);
            if (success) {
                this.updateRewardUI();
            }
            return success;
        }
        return false;
    }

    // Claim achievement reward
    async claimAchievementReward(achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (achievement && !achievement.claimed) {
            const success = await this.walletConnection.claimReward(achievement.name, achievement.reward);
            if (success) {
                achievement.claimed = true;
                this.updateRewardUI();
            }
            return success;
        }
        return false;
    }

    // Claim daily reward
    async claimDailyReward(rewardType) {
        if (!this.canClaimDailyReward(rewardType)) {
            this.walletConnection.showError('Daily reward not available yet');
            return false;
        }

        const reward = this.dailyRewards.get(rewardType);
        if (reward) {
            const success = await this.walletConnection.claimReward(reward.name, reward.reward);
            if (success) {
                reward.claimed = true;
                reward.lastClaimed = new Date().toISOString();
                this.updateRewardUI();
            }
            return success;
        }
        return false;
    }

    // Claim weekly reward
    async claimWeeklyReward(rewardType) {
        if (!this.canClaimWeeklyReward(rewardType)) {
            this.walletConnection.showError('Weekly reward not available yet');
            return false;
        }

        const reward = this.weeklyRewards.get(rewardType);
        if (reward) {
            const success = await this.walletConnection.claimReward(reward.name, reward.reward);
            if (success) {
                reward.claimed = true;
                reward.lastClaimed = new Date().toISOString();
                this.updateRewardUI();
            }
            return success;
        }
        return false;
    }

    // Update reward UI
    updateRewardUI() {
        // Update achievement display
        this.updateAchievementUI();
        
        // Update daily/weekly reward display
        this.updateDailyWeeklyUI();
    }

    // Update achievement UI
    updateAchievementUI() {
        const achievementContainer = document.getElementById('achievementContainer');
        if (!achievementContainer) return;

        achievementContainer.innerHTML = '';
        
        this.achievements.forEach((achievement, id) => {
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement ${achievement.claimed ? 'claimed' : 'unclaimed'}`;
            achievementElement.innerHTML = `
                <h4>${achievement.name}</h4>
                <p>${achievement.description}</p>
                <p>Reward: ${achievement.reward} $PIRATE</p>
                ${achievement.claimed ? '<span class="claimed-badge">✓ Claimed</span>' : '<button onclick="rewardSystem.claimAchievementReward(\'' + id + '\')">Claim</button>'}
            `;
            achievementContainer.appendChild(achievementElement);
        });
    }

    // Update daily/weekly reward UI
    updateDailyWeeklyUI() {
        const dailyContainer = document.getElementById('dailyRewardContainer');
        const weeklyContainer = document.getElementById('weeklyRewardContainer');

        if (dailyContainer) {
            dailyContainer.innerHTML = '';
            this.dailyRewards.forEach((reward, type) => {
                const canClaim = this.canClaimDailyReward(type);
                const rewardElement = document.createElement('div');
                rewardElement.className = `reward ${canClaim ? 'available' : 'unavailable'}`;
                rewardElement.innerHTML = `
                    <h4>${reward.name}</h4>
                    <p>Reward: ${reward.reward} $PIRATE</p>
                    ${canClaim ? '<button onclick="rewardSystem.claimDailyReward(\'' + type + '\')">Claim</button>' : '<span class="cooldown">Available tomorrow</span>'}
                `;
                dailyContainer.appendChild(rewardElement);
            });
        }

        if (weeklyContainer) {
            weeklyContainer.innerHTML = '';
            this.weeklyRewards.forEach((reward, type) => {
                const canClaim = this.canClaimWeeklyReward(type);
                const rewardElement = document.createElement('div');
                rewardElement.className = `reward ${canClaim ? 'available' : 'unavailable'}`;
                rewardElement.innerHTML = `
                    <h4>${reward.name}</h4>
                    <p>Reward: ${reward.reward} $PIRATE</p>
                    ${canClaim ? '<button onclick="rewardSystem.claimWeeklyReward(\'' + type + '\')">Claim</button>' : '<span class="cooldown">Available next week</span>'}
                `;
                weeklyContainer.appendChild(rewardElement);
            });
        }
    }

    // Get all achievements
    getAchievements() {
        return this.achievements;
    }

    // Get all daily rewards
    getDailyRewards() {
        return this.dailyRewards;
    }

    // Get all weekly rewards
    getWeeklyRewards() {
        return this.weeklyRewards;
    }

    // Check if achievement is unlocked
    isAchievementUnlocked(achievementId) {
        const achievement = this.achievements.get(achievementId);
        return achievement ? achievement.claimed : false;
    }

    // Unlock achievement (called by game logic)
    unlockAchievement(achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (achievement && !achievement.claimed) {
            achievement.claimed = true;
            this.updateRewardUI();
            this.walletConnection.showSuccess(`Achievement unlocked: ${achievement.name}!`);
        }
    }
}

// Export for use in other modules
window.RewardSystem = RewardSystem;
