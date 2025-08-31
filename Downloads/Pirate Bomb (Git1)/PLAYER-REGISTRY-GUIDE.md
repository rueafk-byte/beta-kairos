# 🏴‍☠️ Player Registry Smart Contract Guide

## 📋 **Overview**

The **Player Registry Smart Contract** is the core blockchain component of the Pirate Bomb Web3 game. It stores all player data on-chain, tracks progress, manages achievements, and handles reward distribution.

## 🏗️ **Contract Features**

### **Core Functionality**
- ✅ **Player Profile Management** - Store player data on-chain
- ✅ **Level & Score Tracking** - Track player progression
- ✅ **Achievement System** - Record and reward achievements
- ✅ **Boss Defeat Tracking** - Record boss battles and rewards
- ✅ **Daily/Weekly Rewards** - Automated reward distribution
- ✅ **Token Management** - Track $PIRATE and $ADMIRAL tokens
- ✅ **Login Tracking** - Monitor player activity

### **Data Storage**
- Player username and profile info
- Current level and score
- Total levels completed
- Boss defeats count
- Achievement list
- Token balances
- Login timestamps
- Streak tracking

## 🎮 **Game Integration**

### **Player Registration**
```javascript
// Initialize new player profile
const playerRegistry = new PlayerRegistryClient(connection, wallet);
const result = await playerRegistry.initializePlayer("PiratePlayer123");
```

### **Level Completion**
```javascript
// Update player level and score
const result = await playerRegistry.onLevelComplete(5, 1500);
// Automatically adds achievement and rewards
```

### **Boss Defeat**
```javascript
// Record boss defeat with rewards
const result = await playerRegistry.onBossDefeat("GhostCaptain", 10);
// Scales rewards based on boss level
```

### **Achievement Unlock**
```javascript
// Add achievement to player profile
const result = await playerRegistry.onAchievementUnlock(
    "speed_runner",
    "Speed Runner",
    100
);
```

### **Daily/Weekly Rewards**
```javascript
// Claim daily reward
const dailyResult = await playerRegistry.onDailyLogin();

// Claim weekly reward
const weeklyResult = await playerRegistry.onWeeklyCheck();
```

## 💰 **Reward System**

### **Level Completion Rewards**
- **Level 1-10**: 15-55 $PIRATE
- **Level 11-20**: 70-160 $PIRATE
- **Level 21-30**: 180-360 $PIRATE
- **Level 31-40**: 400-760 $PIRATE

### **Boss Defeat Rewards**
- **Base Reward**: 200 $PIRATE
- **Level Bonus**: +50 $PIRATE per boss level
- **Example**: Level 10 boss = 700 $PIRATE

### **Daily Rewards**
- **Base Reward**: 25 $PIRATE
- **Streak Bonus**: +5 $PIRATE per day (max 100)
- **Example**: 7-day streak = 60 $PIRATE

### **Weekly Rewards**
- **Base Reward**: 10 $ADMIRAL
- **Level Bonus**: +2 $ADMIRAL per level completed
- **Boss Bonus**: +5 $ADMIRAL per boss defeated
- **Achievement Bonus**: +3 $ADMIRAL per achievement
- **Maximum**: 100 $ADMIRAL per week

## 🔧 **Smart Contract Functions**

### **Player Management**
```rust
// Initialize new player profile
pub fn initialize_player(ctx: Context<InitializePlayer>, username: String) -> Result<()>

// Update player level and score
pub fn update_player_level(ctx: Context<UpdatePlayerLevel>, new_level: u8, new_score: u64, level_completed: bool) -> Result<()>

// Update login time
pub fn update_login_time(ctx: Context<UpdateLoginTime>) -> Result<()>

// Deactivate player account
pub fn deactivate_player(ctx: Context<DeactivatePlayer>) -> Result<()>
```

### **Achievement System**
```rust
// Add achievement to player profile
pub fn add_achievement(ctx: Context<AddAchievement>, achievement_id: String, achievement_name: String, reward_amount: u64) -> Result<()>

// Record boss defeat
pub fn record_boss_defeat(ctx: Context<RecordBossDefeat>, boss_id: String, boss_level: u8, reward_amount: u64) -> Result<()>
```

### **Reward System**
```rust
// Claim daily reward
pub fn claim_daily_reward(ctx: Context<ClaimDailyReward>) -> Result<()>

// Claim weekly reward
pub fn claim_weekly_reward(ctx: Context<ClaimWeeklyReward>) -> Result<()>

// Transfer tokens to player wallet
pub fn transfer_tokens_to_player(ctx: Context<TransferTokens>, amount: u64, token_type: TokenType) -> Result<()>
```

## 📊 **Data Structures**

### **PlayerProfile Account**
```rust
pub struct PlayerProfile {
    pub player: Pubkey,                    // Player's wallet address
    pub username: String,                  // Player's username
    pub level: u8,                         // Current level (1-40)
    pub score: u64,                        // Current score
    pub total_score: u64,                  // Lifetime total score
    pub pirate_tokens: u64,                // $PIRATE token balance
    pub admiral_tokens: u64,               // $ADMIRAL token balance
    pub total_levels_completed: u32,       // Total levels completed
    pub total_bosses_defeated: u32,        // Total bosses defeated
    pub achievements: Vec<String>,         // List of achievement IDs
    pub achievement_count: u32,            // Total achievements
    pub last_daily_claim: i64,             // Last daily reward claim time
    pub last_weekly_claim: i64,            // Last weekly reward claim time
    pub created_at: i64,                   // Account creation time
    pub updated_at: i64,                   // Last update time
    pub is_active: bool,                   // Account status
    pub streak_days: u32,                  // Daily login streak
    pub last_login: i64,                   // Last login time
}
```

## 🚀 **Deployment**

### **Prerequisites**
- Solana CLI installed
- Devnet SOL for testing
- Anchor framework setup

### **Deployment Steps**
```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Or use the deployment script
node deploy/player-registry-deploy.js
```

### **Configuration**
- **Program ID**: `PLYRrgstry111111111111111111111111111111111`
- **Cluster**: Devnet (for testing)
- **RPC URL**: `https://api.devnet.solana.com`

## 🔗 **Integration with Game**

### **1. Include Client Script**
```html
<script src="web3/player-registry-client.js"></script>
```

### **2. Initialize Client**
```javascript
// In wallet connection success
const playerRegistry = new PlayerRegistryClient(connection, wallet);

// Check if player profile exists
const profileExists = await playerRegistry.playerProfileExists();

if (!profileExists) {
    // Create new player profile
    await playerRegistry.initializePlayer("PlayerName");
}
```

### **3. Game Event Integration**
```javascript
// Level completion
game.onLevelComplete = async (level, score) => {
    const result = await playerRegistry.onLevelComplete(level, score);
    if (result.success) {
        console.log('✅ Level data saved to blockchain!');
    }
};

// Boss defeat
game.onBossDefeat = async (bossId, bossLevel) => {
    const result = await playerRegistry.onBossDefeat(bossId, bossLevel);
    if (result.success) {
        console.log('💀 Boss defeat recorded!');
    }
};

// Achievement unlock
game.onAchievementUnlock = async (achievementId, achievementName, reward) => {
    const result = await playerRegistry.onAchievementUnlock(achievementId, achievementName, reward);
    if (result.success) {
        console.log('🏆 Achievement saved to blockchain!');
    }
};
```

## 🛡️ **Security Features**

### **Access Control**
- Only player can update their own profile
- Validated level progression
- Duplicate achievement prevention
- Rate limiting on rewards

### **Data Validation**
- Username length validation (3-20 characters)
- Level range validation (1-40)
- Score progression validation
- Achievement data validation

### **Error Handling**
- Comprehensive error codes
- Graceful failure handling
- Transaction rollback on errors

## 📈 **Performance Optimization**

### **Gas Optimization**
- Efficient data structures
- Minimal account updates
- Batch operations where possible

### **Storage Optimization**
- Compressed data storage
- Efficient string handling
- Optimized account space usage

## 🔍 **Monitoring & Analytics**

### **Player Metrics**
- Total registered players
- Active player count
- Average level progression
- Token distribution patterns

### **Game Analytics**
- Level completion rates
- Boss defeat statistics
- Achievement unlock rates
- Reward distribution data

## 🚀 **Future Enhancements**

### **Planned Features**
- NFT integration for achievements
- Social features (friends, leaderboards)
- Tournament system
- Cross-chain compatibility
- Mobile app integration

### **Scalability Improvements**
- Sharding for high player counts
- Off-chain data storage
- Layer 2 solutions
- Multi-chain deployment

## 📞 **Support & Documentation**

### **Resources**
- **Contract Address**: `PLYRrgstry111111111111111111111111111111111`
- **Explorer**: [Solana Explorer](https://explorer.solana.com)
- **Documentation**: This guide
- **Support**: GitHub Issues

### **Testing**
- **Devnet Testing**: Full functionality testing
- **Integration Testing**: Game integration testing
- **Security Testing**: Vulnerability assessment
- **Performance Testing**: Load testing

---

## 🎉 **Ready to Deploy!**

The Player Registry smart contract is ready for deployment and integration with your Pirate Bomb Web3 game. It provides a robust foundation for storing player data on-chain and managing the game's reward economy.

**Next Steps:**
1. Deploy to devnet for testing
2. Integrate with the game
3. Test all functionality
4. Deploy to mainnet for production

**🏴‍☠️ Happy coding! 💣⚡**
