# 💥 Kaboom: Blockchain Adventure

A 2D platformer PVE game with Solana blockchain integration, featuring token rewards, NFTs, and achievement systems.

## 🎮 Game Overview

Kaboom is a retro-style platformer where players control a bomb-wielding character through 40 levels across 5 unique islands. Complete levels, defeat bosses, and earn blockchain rewards!

### Core Features
- **40 Levels** across 5 themed islands
- **5 Boss Battles** with unique mechanics
- **Web3 Integration** with Solana blockchain
- **Token Rewards** ($BOOM)
- **Achievement System** with NFT rewards
- **Daily/Weekly Challenges** for continuous rewards
- **Character Progression** with upgradable stats

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Phantom Wallet extension (for Web3 features)
- Solana devnet SOL (for testing)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
```bash
   npm run dev
   ```
4. Open `http://localhost:8000` in your browser

### Web3 Setup
1. Install [Phantom Wallet](https://phantom.app/)
2. Create a new wallet or import existing one
3. Switch to Solana Devnet for testing
4. Get some devnet SOL from a faucet
5. Connect your wallet to the game

## 🎯 How to Play

### Controls
- **WASD / Arrow Keys**: Move character
- **Space**: Jump
- **B**: Place bomb
- **P**: Pause game
- **R**: Restart level
- **M**: Toggle music

### Gameplay
1. **Connect Wallet**: Click "Connect Wallet" to enable Web3 features
2. **Complete Levels**: Navigate through levels, defeat enemies, reach the door
3. **Earn Rewards**: Get $BOOM tokens for completing levels and achievements
4. **Upgrade Character**: Use tokens to improve health, speed, jump power, and bomb capacity
5. **Collect NFTs**: Unlock rare NFTs through achievements and boss battles

## 💰 Tokenomics

### $BOOM Token (Primary Game Token)
- **Total Supply**: 1,000,000,000
- **Distribution**:
  - 60% - Game Rewards (600,000,000)
  - 20% - Development Team (200,000,000)
  - 10% - Marketing/Community (100,000,000)
  - 10% - Liquidity Pool (100,000,000)



### Reward Structure
- **Level 1-10**: 10-50 $BOOM per level
- **Level 11-20**: 60-150 $BOOM per level
- **Level 21-30**: 200-500 $BOOM per level
- **Level 31-40**: 600-1000 $BOOM per level
- **Boss Battles**: 500-5000 $BOOM + NFT rewards

## 🏆 Achievement System

### Completion Achievements
- **Speed Runner**: Complete level under time limit (50 $BOOM)
- **Perfect Run**: Complete level without taking damage (100 $BOOM)
- **Collector**: Find all hidden items in level (75 $BOOM)
- **Chapter Master**: Complete all levels in a chapter (500 $BOOM)
- **Game Master**: Complete all 40 levels (2000 $BOOM)

### Challenge Achievements
- **Bomb Master**: Use bombs to defeat 100 enemies (300 $BOOM)
- **Platform King**: Jump 1000 times (200 $BOOM)
- **Survivor**: Survive 10 minutes without healing (150 $BOOM)
- **Boss Slayer**: Defeat all 5 bosses (1000 $BOOM)
- **Token Collector**: Accumulate 10,000 $BOOM (5000 $BOOM)

## 📅 Daily & Weekly Rewards

### Daily Challenges
- **Daily Login**: 10 $BOOM
- **Daily Level**: Complete 1 level (50 $BOOM)
- **Daily Boss**: Defeat any boss (200 $BOOM)
- **Daily Achievement**: Complete any achievement (100 $BOOM)

### Weekly Challenges
- **Weekly Streak**: Play 7 days in a row (500 $BOOM)
- **Weekly Progress**: Complete 10 levels (1000 $BOOM)
- **Weekly Boss**: Defeat 3 bosses (1500 $BOOM)
- **Weekly Collection**: Collect 5 NFTs (2000 $BOOM)

## 🎨 Character Progression

### Base Stats
- **Health**: 100 (upgradable to 200)
- **Speed**: 5 (upgradable to 8)
- **Jump Power**: 15 (upgradable to 20)
- **Bomb Capacity**: 3 (upgradable to 6)
- **Bomb Damage**: 50 (upgradable to 100)

### Upgrade Costs
- **Health**: 100 $BOOM per +10 HP
- **Speed**: 150 $BOOM per +0.5 speed
- **Jump**: 120 $BOOM per +1 jump power
- **Bomb Capacity**: 200 $BOOM per +1 bomb
- **Bomb Damage**: 180 $BOOM per +10 damage

## 🏝️ World Structure

### Island 1: Training Grounds (Levels 1-5)
- Tutorial levels with basic mechanics
- Introduction to enemies and platforming
- First boss: Training Captain

### Island 2: Pirate Cove (Levels 6-12)
- Introduction to advanced enemies
- More complex platforming challenges
- Boss: Pirate Lord

### Island 3: Treasure Island (Levels 13-20)
- Environmental hazards and puzzles
- New enemy types and mechanics
- Boss: Treasure Guardian

### Island 4: Ghost Ship (Levels 21-30)
- Invisible mechanics and ghost enemies
- Advanced platforming challenges
- Boss: Ghost Captain

### Island 5: Final Fortress (Levels 31-40)
- Expert-level challenges
- All mechanics combined
- Final Boss: Ultimate Challenge

## 🔧 Technical Architecture

### Frontend
- **HTML5 Canvas**: Game rendering
- **JavaScript**: Game logic and Web3 integration
- **CSS3**: UI styling and animations

### Web3 Integration
- **Solana Blockchain**: Smart contracts and token management
- **Phantom Wallet**: User wallet connection
- **SPL Tokens**: $BOOM token contract
- **NFTs**: Achievement badges and character skins

### Smart Contracts
- **Player Registry**: Store player data and progress
- **Token Contracts**: $BOOM token contract
- **NFT Contracts**: Character and equipment NFT contracts
- **Reward System**: Automated reward distribution
- **Staking Contracts**: Token staking and reward distribution

## 🛠️ Development

### Project Structure
```
pirate-bomb-web3/
├── index.html              # Main game file
├── game.js                 # Core game logic
├── web3/
│   ├── wallet-connection.js # Solana wallet integration
│   └── reward-system.js    # Token and achievement system
├── Sprites/                # Game assets
├── music/                  # Audio files
└── README.md              # This file
```

### Key Features Implemented
- ✅ Wallet connection with Phantom
- ✅ Token balance display
- ✅ Level completion rewards
- ✅ Achievement system
- ✅ Daily/weekly challenges
- ✅ Character progression
- ✅ NFT integration (placeholder)
- ✅ Staking system (placeholder)

### Upcoming Features
- 🔄 Smart contract deployment
- 🔄 Real token minting
- 🔄 NFT marketplace
- 🔄 Multiplayer features
- 🔄 Mobile app

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Bug Reports

Please report bugs and issues on our GitHub repository.

## 📞 Support

For support and questions:
- Join our Discord community
- Check our documentation
- Open an issue on GitHub

---

**Happy Gaming! 🎮🏴‍☠️**

*Kaboom: Where retro gaming meets blockchain innovation!*
