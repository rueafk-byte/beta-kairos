// Leaderboard System - Smart Contract Integration
class Leaderboard {
    constructor(walletConnection) {
        this.walletConnection = walletConnection;
        this.programId = "PLYRrgstry111111111111111111111111111111111";
        this.program = null;
        this.leaderboardData = [];
        this.playerRank = null;
    }

    async initialize() {
        try {
            if (!this.walletConnection || !this.walletConnection.isConnected) {
                console.warn('Wallet not connected, cannot initialize leaderboard');
                return false;
            }

            // Initialize connection to the smart contract
            this.program = new anchor.Program(this.programId, this.walletConnection.connection);
            console.log('✅ Leaderboard initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Leaderboard:', error);
            return false;
        }
    }

    async loadLeaderboard(limit = 50) {
        try {
            if (!this.program) {
                console.warn('Program not available');
                return [];
            }

            // Fetch leaderboard data from blockchain
            const leaderboardAccounts = await this.program.account.playerProfile.all([
                {
                    memcmp: {
                        offset: 8, // Skip discriminator
                        bytes: "1" // Filter for active profiles
                    }
                }
            ]);

            // Sort by total score (descending)
            this.leaderboardData = leaderboardAccounts
                .map(account => ({
                    username: account.account.username,
                    playerAddress: account.publicKey.toString(),
                    level: account.account.level,
                    totalScore: account.account.totalScore,
                    pirateTokens: account.account.pirateTokens,
                    admiralTokens: account.account.admiralTokens,
                    achievements: account.account.achievements,
                    lastLogin: new Date(account.account.lastLogin * 1000).toISOString()
                }))
                .sort((a, b) => b.totalScore - a.totalScore)
                .slice(0, limit);

            console.log('✅ Loaded leaderboard from blockchain:', this.leaderboardData.length, 'players');
            return this.leaderboardData;
        } catch (error) {
            console.error('❌ Failed to load leaderboard:', error);
            return [];
        }
    }

    async getPlayerRank() {
        try {
            if (!this.program || !this.walletConnection.publicKey) {
                return null;
            }

            // Get player profile PDA
            const [playerProfilePda] = anchor.web3.PublicKey.findProgramAddressSync(
                [Buffer.from("player_profile"), this.walletConnection.publicKey.toBuffer()],
                this.program.programId
            );

            // Fetch player profile
            const playerProfile = await this.program.account.playerProfile.fetch(playerProfilePda);
            
            // Get all profiles to calculate rank
            const allProfiles = await this.program.account.playerProfile.all();
            
            // Sort by total score and find player's rank
            const sortedProfiles = allProfiles
                .map(account => ({
                    address: account.publicKey.toString(),
                    totalScore: account.account.totalScore
                }))
                .sort((a, b) => b.totalScore - a.totalScore);

            const playerRank = sortedProfiles.findIndex(profile => 
                profile.address === this.walletConnection.publicKey.toString()
            ) + 1;

            this.playerRank = {
                rank: playerRank,
                totalPlayers: sortedProfiles.length,
                totalScore: playerProfile.totalScore,
                level: playerProfile.level
            };

            console.log('✅ Player rank calculated:', this.playerRank);
            return this.playerRank;
        } catch (error) {
            console.error('❌ Failed to get player rank:', error);
            return null;
        }
    }

    async getTopPlayers(limit = 10) {
        try {
            const leaderboard = await this.loadLeaderboard(limit);
            return leaderboard.slice(0, limit);
        } catch (error) {
            console.error('❌ Failed to get top players:', error);
            return [];
        }
    }

    async getPlayersByLevel(level) {
        try {
            if (!this.program) {
                return [];
            }

            // Fetch players at specific level
            const levelAccounts = await this.program.account.playerProfile.all([
                {
                    memcmp: {
                        offset: 8 + 32 + 20, // Skip discriminator + player + username
                        bytes: level.toString()
                    }
                }
            ]);

            return levelAccounts.map(account => ({
                username: account.account.username,
                playerAddress: account.publicKey.toString(),
                level: account.account.level,
                totalScore: account.account.totalScore,
                pirateTokens: account.account.pirateTokens
            }));
        } catch (error) {
            console.error('❌ Failed to get players by level:', error);
            return [];
        }
    }

    async getAchievementLeaderboard() {
        try {
            if (!this.program) {
                return [];
            }

            // Fetch all profiles
            const allProfiles = await this.program.account.playerProfile.all();
            
            // Sort by achievement count
            return allProfiles
                .map(account => ({
                    username: account.account.username,
                    playerAddress: account.publicKey.toString(),
                    achievementCount: account.account.achievementCount,
                    achievements: account.account.achievements,
                    level: account.account.level
                }))
                .sort((a, b) => b.achievementCount - a.achievementCount)
                .slice(0, 20);
        } catch (error) {
            console.error('❌ Failed to get achievement leaderboard:', error);
            return [];
        }
    }

    async getTokenLeaderboard(tokenType = 'pirate') {
        try {
            if (!this.program) {
                return [];
            }

            // Fetch all profiles
            const allProfiles = await this.program.account.playerProfile.all();
            
            // Sort by token balance
            return allProfiles
                .map(account => ({
                    username: account.account.username,
                    playerAddress: account.publicKey.toString(),
                    pirateTokens: account.account.pirateTokens,
                    admiralTokens: account.account.admiralTokens,
                    level: account.account.level
                }))
                .sort((a, b) => {
                    if (tokenType === 'pirate') {
                        return b.pirateTokens - a.pirateTokens;
                    } else {
                        return b.admiralTokens - a.admiralTokens;
                    }
                })
                .slice(0, 20);
        } catch (error) {
            console.error('❌ Failed to get token leaderboard:', error);
            return [];
        }
    }

    renderLeaderboard(containerId = 'leaderboard') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('Leaderboard container not found');
            return;
        }

        if (this.leaderboardData.length === 0) {
            container.innerHTML = '<p>No leaderboard data available</p>';
            return;
        }

        let html = `
            <div class="leaderboard-header">
                <h3>🏆 Top Players</h3>
                <div class="leaderboard-tabs">
                    <button class="tab-btn active" onclick="switchLeaderboardTab('score')">Score</button>
                    <button class="tab-btn" onclick="switchLeaderboardTab('level')">Level</button>
                    <button class="tab-btn" onclick="switchLeaderboardTab('tokens')">Tokens</button>
                </div>
            </div>
            <div class="leaderboard-content">
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Level</th>
                            <th>Score</th>
                            <th>Tokens</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.leaderboardData.forEach((player, index) => {
            const isCurrentPlayer = player.playerAddress === this.walletConnection.publicKey?.toString();
            const rowClass = isCurrentPlayer ? 'current-player' : '';
            
            html += `
                <tr class="${rowClass}">
                    <td>${index + 1}</td>
                    <td>${player.username}</td>
                    <td>${player.level}</td>
                    <td>${player.totalScore.toLocaleString()}</td>
                    <td>${player.pirateTokens} 🏴‍☠️</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }

    renderPlayerRank(containerId = 'playerRank') {
        const container = document.getElementById(containerId);
        if (!container || !this.playerRank) {
            return;
        }

        const html = `
            <div class="player-rank">
                <h4>Your Ranking</h4>
                <div class="rank-info">
                    <div class="rank-number">#${this.playerRank.rank}</div>
                    <div class="rank-details">
                        <p>Out of ${this.playerRank.totalPlayers} players</p>
                        <p>Total Score: ${this.playerRank.totalScore.toLocaleString()}</p>
                        <p>Level: ${this.playerRank.level}</p>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    getLeaderboardData() {
        return this.leaderboardData;
    }

    getPlayerRankData() {
        return this.playerRank;
    }
}

// Global function for tab switching
window.switchLeaderboardTab = function(tab) {
    // Implementation for switching between different leaderboard views
    console.log('Switching to tab:', tab);
    // This would be implemented based on your UI needs
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Leaderboard;
}
