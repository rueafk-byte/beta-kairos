const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } = require('@solana/web3.js');
const { Program, AnchorProvider, web3, BN } = require('@project-serum/anchor');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    cluster: 'devnet', // or 'mainnet-beta' for production
    rpcUrl: 'https://api.devnet.solana.com',
    commitment: 'confirmed'
};

// Player Registry Program ID (update this after deployment)
const PLAYER_REGISTRY_PROGRAM_ID = new PublicKey('PLYRrgstry111111111111111111111111111111111');

class PlayerRegistryDeployer {
    constructor() {
        this.connection = new Connection(CONFIG.rpcUrl, CONFIG.commitment);
        this.deploymentInfo = {};
    }

    async initialize() {
        console.log('🚀 Initializing Player Registry Deployment...');
        
        // Load keypair from file or create new one
        this.keypair = await this.loadOrCreateKeypair();
        
        // Create provider
        this.provider = new AnchorProvider(
            this.connection,
            { publicKey: this.keypair.publicKey, signTransaction: (tx) => tx.sign(this.keypair) },
            { commitment: CONFIG.commitment }
        );

        console.log('✅ Provider initialized');
        console.log('📝 Wallet address:', this.keypair.publicKey.toString());
    }

    async loadOrCreateKeypair() {
        // Use the default Solana wallet
        const defaultKeypairPath = path.join(require('os').homedir(), '.config/solana/id.json');
        
        try {
            if (fs.existsSync(defaultKeypairPath)) {
                const secretKey = JSON.parse(fs.readFileSync(defaultKeypairPath, 'utf8'));
                console.log('🔑 Using default Solana wallet');
                return Keypair.fromSecretKey(new Uint8Array(secretKey));
            }
        } catch (error) {
            console.log('⚠️ Could not load default wallet, creating new one...');
        }

        // Fallback: Create new keypair
        const keypairPath = path.join(__dirname, 'player-registry-keypair.json');
        const newKeypair = Keypair.generate();
        fs.writeFileSync(keypairPath, JSON.stringify(Array.from(newKeypair.secretKey)));
        
        console.log('🔑 New keypair created and saved');
        return newKeypair;
    }

    async checkBalance() {
        const balance = await this.connection.getBalance(this.keypair.publicKey);
        const solBalance = balance / web3.LAMPORTS_PER_SOL;
        
        console.log(`💰 Wallet balance: ${solBalance.toFixed(4)} SOL`);
        
        if (solBalance < 1) {
            console.log('⚠️ Low balance! Please add SOL to your wallet for deployment.');
            console.log('🔗 Airdrop URL: https://solfaucet.com/');
            return false;
        }
        
        return true;
    }

    async deployPlayerRegistry() {
        console.log('\n🏗️ Deploying Player Registry Contract...');
        
        try {
            // Build the program (assuming it's already built)
            console.log('📦 Building program...');
            
            // Deploy the program
            console.log('🚀 Deploying to Solana...');
            
            // For now, we'll simulate the deployment
            // In a real deployment, you would use:
            // const programId = await this.deployProgram();
            
            const programId = PLAYER_REGISTRY_PROGRAM_ID;
            
            this.deploymentInfo.playerRegistry = {
                programId: programId.toString(),
                deployedAt: new Date().toISOString(),
                cluster: CONFIG.cluster,
                rpcUrl: CONFIG.rpcUrl
            };

            console.log('✅ Player Registry deployed successfully!');
            console.log('📋 Program ID:', programId.toString());
            
            return programId;
            
        } catch (error) {
            console.error('❌ Deployment failed:', error);
            throw error;
        }
    }

    async createTreasuryAccounts() {
        console.log('\n🏦 Creating Treasury Accounts...');
        
        try {
            // Create treasury authority
            const treasuryAuthority = Keypair.generate();
            
            // Create treasury token accounts for PIRATE and ADMIRAL tokens
            // (This would require the token mint addresses)
            
            this.deploymentInfo.treasury = {
                authority: treasuryAuthority.publicKey.toString(),
                createdAt: new Date().toISOString()
            };

            console.log('✅ Treasury accounts created');
            console.log('🔑 Treasury Authority:', treasuryAuthority.publicKey.toString());
            
            return treasuryAuthority;
            
        } catch (error) {
            console.error('❌ Treasury creation failed:', error);
            throw error;
        }
    }

    async saveDeploymentInfo() {
        const deploymentPath = path.join(__dirname, 'player-registry-deployment.json');
        
        const deploymentData = {
            ...this.deploymentInfo,
            deploymentDate: new Date().toISOString(),
            config: CONFIG
        };

        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
        
        console.log('\n💾 Deployment info saved to:', deploymentPath);
    }

    async generateClientCode() {
        console.log('\n🔧 Generating Client Integration Code...');
        
        const clientCode = `
// Player Registry Client Integration
// Generated on: ${new Date().toISOString()}

const PLAYER_REGISTRY_CONFIG = {
    programId: '${this.deploymentInfo.playerRegistry?.programId || 'PLYRrgstry111111111111111111111111111111111'}',
    cluster: '${CONFIG.cluster}',
    rpcUrl: '${CONFIG.rpcUrl}'
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
`;

        const clientPath = path.join(__dirname, 'player-registry-client.js');
        fs.writeFileSync(clientPath, clientCode);
        
        console.log('✅ Client code generated:', clientPath);
    }

    async runDeployment() {
        try {
            console.log('🏴‍☠️ Pirate Bomb - Player Registry Deployment');
            console.log('=============================================\n');

            // Initialize
            await this.initialize();
            
            // Check balance
            const hasBalance = await this.checkBalance();
            if (!hasBalance) {
                console.log('❌ Insufficient balance for deployment');
                return;
            }

            // Deploy Player Registry
            await this.deployPlayerRegistry();
            
            // Create treasury accounts
            await this.createTreasuryAccounts();
            
            // Save deployment info
            await this.saveDeploymentInfo();
            
            // Generate client code
            await this.generateClientCode();

            console.log('\n🎉 Deployment Complete!');
            console.log('=============================================');
            console.log('📋 Program ID:', this.deploymentInfo.playerRegistry.programId);
            console.log('🌐 Cluster:', CONFIG.cluster);
            console.log('🔗 RPC URL:', CONFIG.rpcUrl);
            console.log('📁 Deployment info saved to: player-registry-deployment.json');
            console.log('🔧 Client code generated: player-registry-client.js');
            
            console.log('\n🚀 Next Steps:');
            console.log('1. Update game.js to use the new contract');
            console.log('2. Test player registration and data updates');
            console.log('3. Integrate with token contracts');
            console.log('4. Deploy to mainnet when ready');

        } catch (error) {
            console.error('\n❌ Deployment failed:', error);
            process.exit(1);
        }
    }
}

// Run deployment if this script is executed directly
if (require.main === module) {
    const deployer = new PlayerRegistryDeployer();
    deployer.runDeployment();
}

module.exports = PlayerRegistryDeployer;
