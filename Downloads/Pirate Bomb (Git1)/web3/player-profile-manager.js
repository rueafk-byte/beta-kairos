// Player Profile Manager - Smart Contract Integration
class PlayerProfileManager {
    constructor(walletConnection) {
        this.walletConnection = walletConnection;
        this.programId = "PLYRrgstry111111111111111111111111111111111";
        this.program = null;
        this.playerProfile = null;
    }

    async initialize() {
        try {
            if (!this.walletConnection || !this.walletConnection.isConnected) {
                console.warn('Wallet not connected, cannot initialize profile manager');
                return false;
            }

            // For now, use localStorage as primary storage until blockchain is fully set up
            console.log('✅ Player Profile Manager initialized (localStorage mode)');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Player Profile Manager:', error);
            return false;
        }
    }

    async loadPlayerProfile() {
        try {
            if (!this.walletConnection.publicKey) {
                console.warn('Wallet not available');
                return null;
            }

            // Load from localStorage for now
            const profileKey = `playerProfile_${this.walletConnection.publicKey.toString()}`;
            const savedProfile = localStorage.getItem(profileKey);
            
            if (savedProfile) {
                this.playerProfile = JSON.parse(savedProfile);
                console.log('✅ Loaded player profile from localStorage:', this.playerProfile);
                return this.playerProfile;
            } else {
                console.log('⚠️ No existing player profile found');
                return null;
            }
        } catch (error) {
            console.warn('⚠️ Error loading player profile:', error);
            return null;
        }
    }

    async createPlayerProfile(username) {
        try {
            if (!this.walletConnection.publicKey) {
                throw new Error('Wallet not available');
            }

            // Create new player profile in localStorage
            const newProfile = {
                username: username,
                playerAddress: this.walletConnection.publicKey.toString(),
                level: 1,
                score: 0,
                totalScore: 0,
                pirateTokens: 0,
                admiralTokens: 0,
                achievements: [],
                lastLogin: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save to localStorage
            const profileKey = `playerProfile_${this.walletConnection.publicKey.toString()}`;
            localStorage.setItem(profileKey, JSON.stringify(newProfile));
            
            this.playerProfile = newProfile;
            console.log('✅ Player profile created in localStorage:', newProfile);
            
            return { success: true, signature: 'localStorage_tx' };
        } catch (error) {
            console.error('❌ Failed to create player profile:', error);
            return { success: false, error: error.message };
        }
    }

    async updatePlayerLevel(level, score) {
        try {
            if (!this.walletConnection.publicKey) {
                throw new Error('Wallet not available');
            }

            // Update player profile in localStorage
            if (!this.playerProfile) {
                await this.loadPlayerProfile();
            }

            if (this.playerProfile) {
                this.playerProfile.level = level;
                this.playerProfile.totalScore = score;
                this.playerProfile.updatedAt = new Date().toISOString();
                
                // Calculate tokens (10% of total score)
                this.playerProfile.pirateTokens = Math.floor(score * 0.10);

                // Save to localStorage
                const profileKey = `playerProfile_${this.walletConnection.publicKey.toString()}`;
                localStorage.setItem(profileKey, JSON.stringify(this.playerProfile));

                console.log('✅ Player level updated in localStorage:', this.playerProfile);
                return { success: true, signature: 'localStorage_tx' };
            } else {
                throw new Error('No player profile found');
            }
        } catch (error) {
            console.error('❌ Failed to update player level:', error);
            return { success: false, error: error.message };
        }
    }

    async addAchievement(achievement) {
        try {
            if (!this.program || !this.walletConnection.publicKey) {
                throw new Error('Program or wallet not available');
            }

            // Get player profile PDA
            const [playerProfilePda] = anchor.web3.PublicKey.findProgramAddressSync(
                [Buffer.from("player_profile"), this.walletConnection.publicKey.toBuffer()],
                this.program.programId
            );

            // Add achievement on blockchain
            const tx = await this.program.methods
                .addAchievement(achievement)
                .accounts({
                    playerProfile: playerProfilePda,
                    player: this.walletConnection.publicKey,
                })
                .rpc();

            console.log('✅ Achievement added on blockchain:', tx);
            
            // Reload profile to get updated data
            await this.loadPlayerProfile();
            return { success: true, signature: tx };
        } catch (error) {
            console.error('❌ Failed to add achievement:', error);
            return { success: false, error: error.message };
        }
    }

    async claimDailyReward() {
        try {
            if (!this.program || !this.walletConnection.publicKey) {
                throw new Error('Program or wallet not available');
            }

            // Get player profile PDA
            const [playerProfilePda] = anchor.web3.PublicKey.findProgramAddressSync(
                [Buffer.from("player_profile"), this.walletConnection.publicKey.toBuffer()],
                this.program.programId
            );

            // Claim daily reward on blockchain
            const tx = await this.program.methods
                .claimDailyReward()
                .accounts({
                    playerProfile: playerProfilePda,
                    player: this.walletConnection.publicKey,
                })
                .rpc();

            console.log('✅ Daily reward claimed on blockchain:', tx);
            
            // Reload profile to get updated data
            await this.loadPlayerProfile();
            return { success: true, signature: tx };
        } catch (error) {
            console.error('❌ Failed to claim daily reward:', error);
            return { success: false, error: error.message };
        }
    }

    async claimWeeklyReward() {
        try {
            if (!this.program || !this.walletConnection.publicKey) {
                throw new Error('Program or wallet not available');
            }

            // Get player profile PDA
            const [playerProfilePda] = anchor.web3.PublicKey.findProgramAddressSync(
                [Buffer.from("player_profile"), this.walletConnection.publicKey.toBuffer()],
                this.program.programId
            );

            // Claim weekly reward on blockchain
            const tx = await this.program.methods
                .claimWeeklyReward()
                .accounts({
                    playerProfile: playerProfilePda,
                    player: this.walletConnection.publicKey,
                })
                .rpc();

            console.log('✅ Weekly reward claimed on blockchain:', tx);
            
            // Reload profile to get updated data
            await this.loadPlayerProfile();
            return { success: true, signature: tx };
        } catch (error) {
            console.error('❌ Failed to claim weekly reward:', error);
            return { success: false, error: error.message };
        }
    }

    getPlayerProfile() {
        return this.playerProfile;
    }

    isProfileLoaded() {
        return this.playerProfile !== null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerProfileManager;
}
