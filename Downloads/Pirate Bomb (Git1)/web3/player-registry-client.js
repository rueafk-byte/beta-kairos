// Player Registry Client Integration for Kaboom Game
// This file handles all interactions with the Player Registry smart contract

// Buffer polyfill for browser environment
if (typeof Buffer === 'undefined') {
    window.Buffer = {
        from: (data, encoding) => {
            if (typeof data === 'string') {
                return new TextEncoder().encode(data);
            }
            return new Uint8Array(data);
        },
        concat: (arrays) => {
            const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
            const result = new Uint8Array(totalLength);
            let offset = 0;
            for (const arr of arrays) {
                result.set(arr, offset);
                offset += arr.length;
            }
            return result;
        },
        allocUnsafe: (size) => new Uint8Array(size)
    };
}

// Helper function for BN (BigNumber) since it might not be available
function createBN(value) {
    // Simple conversion to 8-byte little-endian array
    const num = BigInt(value);
    const bytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
        bytes[i] = Number((num >> BigInt(i * 8)) & BigInt(0xff));
    }
    return {
        toArray: () => Array.from(bytes)
    };
}

class PlayerRegistryClient {
    constructor(connection, wallet) {
        this.connection = connection;
        this.wallet = wallet;
        // Don't store publicKey here - we'll get it from the wallet connection
        this.programId = new solanaWeb3.PublicKey('PLYRrgstry111111111111111111111111111111111');
        this.program = null;
        
        // Player Registry Instructions
        this.instructions = {
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
            },
            updateLoginTime: {
                name: 'update_login_time',
                accounts: [
                    'player_profile',
                    'player'
                ],
                args: []
            }
        };
    }

    // Get player profile PDA (Program Derived Address)
    async getPlayerProfilePDA(playerPublicKey) {
        const [pda, bump] = await solanaWeb3.PublicKey.findProgramAddress(
            [
                Buffer.from('player_profile'),
                playerPublicKey.toBuffer()
            ],
            this.programId
        );
        return { pda, bump };
    }

    // Initialize a new player profile
    async initializePlayer(username) {
        try {
            console.log('🏴‍☠️ Initializing player profile...');
            
            // Get public key from wallet or use the one passed in constructor
            const playerPublicKey = this.wallet.publicKey || this.publicKey;
            if (!playerPublicKey) {
                throw new Error('No public key available. Please ensure wallet is connected.');
            }
            
            const { pda: playerProfilePDA, bump } = await this.getPlayerProfilePDA(playerPublicKey);

            // Create instruction
            const instruction = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: playerProfilePDA, isSigner: false, isWritable: true },
                    { pubkey: playerPublicKey, isSigner: true, isWritable: true },
                    { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false }
                ],
                programId: this.programId,
                data: Buffer.concat([
                    Buffer.from([0]), // Instruction index for initialize_player
                    Buffer.from([bump]),
                    Buffer.from(username, 'utf8')
                ])
            });

            // Create and send transaction
            const transaction = new solanaWeb3.Transaction().add(instruction);
            
            // Try to use the wallet's sendTransaction method
            let signature;
            try {
                if (typeof this.wallet.sendTransaction === 'function') {
                    signature = await this.wallet.sendTransaction(transaction, this.connection);
                } else {
                    // Fallback: use the wallet connection's methods
                    console.log('⚠️ Using fallback transaction method');
                    
                    // Set transaction parameters
                    transaction.feePayer = this.publicKey;
                    transaction.recentBlockhash = (await this.connection.getRecentBlockhash()).blockhash;
                    
                    // Sign and send manually
                    const signedTx = await this.wallet.signTransaction(transaction);
                    signature = await this.connection.sendRawTransaction(signedTx.serialize());
                }
            } catch (error) {
                console.error('❌ Transaction failed:', error);
                throw new Error(`Transaction failed: ${error.message}`);
            }
            
            console.log('✅ Player profile initialized!');
            console.log('📝 Username:', username);
            console.log('🔗 Transaction:', signature);
            
            return { success: true, signature, playerProfilePDA };
            
        } catch (error) {
            console.error('❌ Failed to initialize player:', error);
            return { success: false, error: error.message };
        }
    }

    // Update player level and score
    async updatePlayerLevel(newLevel, newScore, levelCompleted = false) {
        try {
            console.log('📈 Updating player level...');
            
            const playerPublicKey = this.publicKey;
            const { pda: playerProfilePDA } = await this.getPlayerProfilePDA(playerPublicKey);

            // Create instruction data
            const data = Buffer.concat([
                Buffer.from([1]), // Instruction index for update_player_level
                Buffer.from([newLevel]),
                Buffer.from(createBN(newScore).toArray('le', 8)),
                Buffer.from([levelCompleted ? 1 : 0])
            ]);

            const instruction = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: playerProfilePDA, isSigner: false, isWritable: true },
                    { pubkey: playerPublicKey, isSigner: true, isWritable: false }
                ],
                programId: this.programId,
                data: data
            });

            const transaction = new solanaWeb3.Transaction().add(instruction);
            const signature = await this.wallet.sendTransaction(transaction, this.connection);
            
            console.log('✅ Player level updated!');
            console.log('📊 Level:', newLevel, 'Score:', newScore);
            console.log('🔗 Transaction:', signature);
            
            return { success: true, signature };
            
        } catch (error) {
            console.error('❌ Failed to update player level:', error);
            return { success: false, error: error.message };
        }
    }

    // Add achievement to player profile
    async addAchievement(achievementId, achievementName, rewardAmount = 0) {
        try {
            console.log('🏆 Adding achievement...');
            
            const playerPublicKey = this.publicKey;
            const { pda: playerProfilePDA } = await this.getPlayerProfilePDA(playerPublicKey);

            // Create instruction data
            const data = Buffer.concat([
                Buffer.from([2]), // Instruction index for add_achievement
                Buffer.from(achievementId, 'utf8'),
                Buffer.from(achievementName, 'utf8'),
                Buffer.from(createBN(rewardAmount).toArray('le', 8))
            ]);

            const instruction = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: playerProfilePDA, isSigner: false, isWritable: true },
                    { pubkey: playerPublicKey, isSigner: true, isWritable: false }
                ],
                programId: this.programId,
                data: data
            });

            const transaction = new solanaWeb3.Transaction().add(instruction);
            const signature = await this.wallet.sendTransaction(transaction, this.connection);
            
            console.log('✅ Achievement added!');
            console.log('🏆 Achievement:', achievementName);
            console.log('💰 Reward:', rewardAmount, '$BOOM');
            console.log('🔗 Transaction:', signature);
            
            return { success: true, signature };
            
        } catch (error) {
            console.error('❌ Failed to add achievement:', error);
            return { success: false, error: error.message };
        }
    }

    // Record boss defeat
    async recordBossDefeat(bossId, bossLevel, rewardAmount = 0) {
        try {
            console.log('💀 Recording boss defeat...');
            
            const playerPublicKey = this.publicKey;
            const { pda: playerProfilePDA } = await this.getPlayerProfilePDA(playerPublicKey);

            // Create instruction data
            const data = Buffer.concat([
                Buffer.from([3]), // Instruction index for record_boss_defeat
                Buffer.from(bossId, 'utf8'),
                Buffer.from([bossLevel]),
                Buffer.from(createBN(rewardAmount).toArray('le', 8))
            ]);

            const instruction = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: playerProfilePDA, isSigner: false, isWritable: true },
                    { pubkey: playerPublicKey, isSigner: true, isWritable: false }
                ],
                programId: this.programId,
                data: data
            });

            const transaction = new solanaWeb3.Transaction().add(instruction);
            const signature = await this.wallet.sendTransaction(transaction, this.connection);
            
            console.log('✅ Boss defeat recorded!');
            console.log('💀 Boss:', bossId, '(Level', bossLevel + ')');
            console.log('💰 Reward:', rewardAmount, '$BOOM');
            console.log('🔗 Transaction:', signature);
            
            return { success: true, signature };
            
        } catch (error) {
            console.error('❌ Failed to record boss defeat:', error);
            return { success: false, error: error.message };
        }
    }

    // Claim daily reward
    async claimDailyReward() {
        try {
            console.log('📅 Claiming daily reward...');
            
            const playerPublicKey = this.publicKey;
            const { pda: playerProfilePDA } = await this.getPlayerProfilePDA(playerPublicKey);

            const instruction = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: playerProfilePDA, isSigner: false, isWritable: true },
                    { pubkey: playerPublicKey, isSigner: true, isWritable: false }
                ],
                programId: this.programId,
                data: Buffer.from([4]) // Instruction index for claim_daily_reward
            });

            const transaction = new solanaWeb3.Transaction().add(instruction);
            const signature = await this.wallet.sendTransaction(transaction, this.connection);
            
            console.log('✅ Daily reward claimed!');
            console.log('🔗 Transaction:', signature);
            
            return { success: true, signature };
            
        } catch (error) {
            console.error('❌ Failed to claim daily reward:', error);
            return { success: false, error: error.message };
        }
    }

    // Claim weekly reward
    async claimWeeklyReward() {
        try {
            console.log('📆 Claiming weekly reward...');
            
            const playerPublicKey = this.publicKey;
            const { pda: playerProfilePDA } = await this.getPlayerProfilePDA(playerPublicKey);

            const instruction = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: playerProfilePDA, isSigner: false, isWritable: true },
                    { pubkey: playerPublicKey, isSigner: true, isWritable: false }
                ],
                programId: this.programId,
                data: Buffer.from([5]) // Instruction index for claim_weekly_reward
            });

            const transaction = new solanaWeb3.Transaction().add(instruction);
            const signature = await this.wallet.sendTransaction(transaction, this.connection);
            
            console.log('✅ Weekly reward claimed!');
            console.log('🔗 Transaction:', signature);
            
            return { success: true, signature };
            
        } catch (error) {
            console.error('❌ Failed to claim weekly reward:', error);
            return { success: false, error: error.message };
        }
    }

    // Update login time
    async updateLoginTime() {
        try {
            console.log('🕐 Updating login time...');
            
            const playerPublicKey = this.publicKey;
            const { pda: playerProfilePDA } = await this.getPlayerProfilePDA(playerPublicKey);

            const instruction = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: playerProfilePDA, isSigner: false, isWritable: true },
                    { pubkey: playerPublicKey, isSigner: true, isWritable: false }
                ],
                programId: this.programId,
                data: Buffer.from([6]) // Instruction index for update_login_time
            });

            const transaction = new solanaWeb3.Transaction().add(instruction);
            const signature = await this.wallet.sendTransaction(transaction, this.connection);
            
            console.log('✅ Login time updated!');
            console.log('🔗 Transaction:', signature);
            
            return { success: true, signature };
            
        } catch (error) {
            console.error('❌ Failed to update login time:', error);
            return { success: false, error: error.message };
        }
    }

    // Get player profile data
    async getPlayerProfile() {
        try {
            const playerPublicKey = this.publicKey;
            const { pda: playerProfilePDA } = await this.getPlayerProfilePDA(playerPublicKey);

            const accountInfo = await this.connection.getAccountInfo(playerProfilePDA);
            
            if (!accountInfo) {
                return { success: false, error: 'Player profile not found' };
            }

            // Parse account data (simplified - in real implementation you'd use proper deserialization)
            const profileData = {
                player: playerPublicKey.toString(),
                exists: true,
                accountInfo: accountInfo
            };

            console.log('📋 Player profile retrieved');
            return { success: true, profile: profileData };
            
        } catch (error) {
            console.error('❌ Failed to get player profile:', error);
            return { success: false, error: error.message };
        }
    }

    // Check if player profile exists
    async playerProfileExists() {
        try {
            const playerPublicKey = this.publicKey;
            const { pda: playerProfilePDA } = await this.getPlayerProfilePDA(playerPublicKey);

            const accountInfo = await this.connection.getAccountInfo(playerProfilePDA);
            return accountInfo !== null;
            
        } catch (error) {
            console.error('❌ Failed to check player profile:', error);
            return false;
        }
    }

    // Game integration methods
    async onLevelComplete(level, score) {
        console.log('🎮 Level completed - updating blockchain...');
        
        const result = await this.updatePlayerLevel(level, score, true);
        
        if (result.success) {
            // Add level completion achievement
            await this.addAchievement(
                `level_${level}_complete`,
                `Level ${level} Master`,
                50 // Base reward for level completion
            );
        }
        
        return result;
    }

    async onBossDefeat(bossId, bossLevel) {
        console.log('💀 Boss defeated - updating blockchain...');
        
        const rewardAmount = 200 + (bossLevel * 50); // Scale reward with boss level
        
        return await this.recordBossDefeat(bossId, bossLevel, rewardAmount);
    }

    async onAchievementUnlock(achievementId, achievementName, rewardAmount) {
        console.log('🏆 Achievement unlocked - updating blockchain...');
        
        return await this.addAchievement(achievementId, achievementName, rewardAmount);
    }

    async onDailyLogin() {
        console.log('📅 Daily login - checking rewards...');
        
        // Update login time
        await this.updateLoginTime();
        
        // Try to claim daily reward
        return await this.claimDailyReward();
    }

    async onWeeklyCheck() {
        console.log('📆 Weekly check - claiming rewards...');
        
        return await this.claimWeeklyReward();
    }
}

// Export for use in game
window.PlayerRegistryClient = PlayerRegistryClient;
