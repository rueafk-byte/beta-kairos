/*
Kaboom - Web Version (Sprite-based)
- Loads frames directly from `Sprites/`
- Animates Player, Enemies (5 types), and Bombs
- Keeps original game logic states
*/

// ---------------------------
// Asset Loader
// ---------------------------
class AssetLoader {
	constructor() {
		this.assets = {
			player: {},
			enemies: {},
			objects: {}
		};
	}

	// Load consecutive frames 1.png..N.png from a folder
	async loadFrames(folderPath, frameCount) {
		const frames = [];
		for (let i = 1; i <= frameCount; i += 1) {
			const src = encodeURI(`${folderPath}/${i}.png`);
			const img = await this.loadImage(src);
			frames.push(img);
		}
		return frames;
	}

	loadImage(src) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
			img.src = src;
		});
	}

	// Player manifest
	getPlayerManifest() {
		const base = 'Sprites/1-Player-Bomb Guy';
		return {
			'1-Idle': 26,
			'2-Run': 14,
			'3-Jump Anticipation': 1,
			'4-Jump': 4,
			'5-Fall': 2,
			'6-Ground': 3,
			'7-Hit': 8,
			'8-Dead Hit': 6,
			'9-Dead Ground': 4,
			'10-Door In': 16,
			'11-Door Out': 16,
			_base: base
		};
	}

	// Enemies manifest (based on scanned counts)
	getEnemiesManifest() {
		return {
			'Bald Pirate': {
				base: 'Sprites/2-Enemy-Bald Pirate',
				'1-Idle': 34,
				'2-Run': 14,
				'3-Jump Anticipation': 1,
				'4-Jump': 4,
				'5-Fall': 2,
				'6-Ground': 3,
				'7-Attack': 12,
				'8-Hit': 8,
				'9-Dead Hit': 6,
				'10-Dead Ground': 4
			},
			'Cucumber': {
				base: 'Sprites/3-Enemy-Cucumber',
				'1-Idle': 36,
				'2-Run': 12,
				'3-Jump Anticipation': 1,
				'4-Jump': 4,
				'5-Fall': 2,
				'6-Ground': 3,
				'7-Attack': 11,
				'8-Blow the wick': 11,
				'9-Hit': 8,
				'10-Dead Hit': 6,
				'11-Dead Ground': 4
			},
			'Big Guy': {
				base: 'Sprites/4-Enemy-Big Guy',
				'1-Idle': 38,
				'2-Run': 16,
				'3-Jump Anticipation': 1,
				'4-Jump': 4,
				'5-Fall': 2,
				'6-Ground': 3,
				'7-Attack': 11,
				'8-Pick (Bomb)': 8,
				'9-Idle (Bomb)': 1,
				'10-Run (Bomb)': 16,
				'11-Throw (Bomb)': 11,
				'12-Hit': 8,
				'13-Dead Hit': 6,
				'14-Dead Ground': 4
			},
			'Captain': {
				base: 'Sprites/5-Enemy-Captain',
				'1-Idle': 32,
				'2-Run': 14,
				'3-Jump Anticipation': 1,
				'4-Jump': 4,
				'5-Fall': 2,
				'6-Ground': 3,
				'7-Attack': 7,
				'8-Scare Run': 12,
				'9-Hit': 8,
				'10-Dead Hit': 6,
				'11-Dead Ground': 4
			},
			'Whale': {
				base: 'Sprites/6-Enemy-Whale',
				'1-Idle': 44,
				'2-Run': 14,
				'3-Jump Anticipation': 1,
				'4-Jump': 4,
				'5-Fall': 2,
				'6-Ground': 3,
				'7-Attack': 11,
				'8-Swalow (Bomb)': 10,
				'9-Hit': 7,
				'10-Dead Hit': 6,
				'11-Dead Ground': 4
			}
		};
	}

	getObjectsManifest() {
		return {
			base: 'Sprites/7-Objects',
			bomb: {
				'1-Bomb Off': 1,
				'2-Bomb On': 10,
				'3-Explotion': 9,
				base: 'Sprites/7-Objects/1-BOMB'
			},
			door: {
				'1-Closed': 1,
				'2-Opening': 5,
				'3-Closing': 5,
				base: 'Sprites/7-Objects/2-Door'
			},
			tiles: {
				'1': 1,
				'2': 1,
				'3': 1,
				'4': 1,
				'5': 1,
				'6': 1,
				'7': 1,
				'8': 1,
				base: 'Sprites/8-Tile-Sets/Variations'
			}
		};
	}

	async loadAll(onProgress) {
		let loaded = 0;
		const addProgress = (total) => {
			loaded += 1;
			if (onProgress) onProgress(loaded, total);
		};

		// Enhanced loading - load all assets with timeout
		const totalSteps = 50; // Increased count for more sprites
		
		try {
			// Load only essential player animations with timeout
		const playerManifest = this.getPlayerManifest();
			this.assets.player = {};
			
			// Load only the most important player animations
			const essentialPlayerAnims = ['1-Idle', '2-Run', '4-Jump', '5-Fall', '7-Hit', '8-Dead Hit', '9-Dead Ground'];
			for (const anim of essentialPlayerAnims) {
				if (playerManifest[anim]) {
					try {
						console.log(`Loading player animation: ${anim} with ${playerManifest[anim]} frames from ${playerManifest._base}/${anim}`);
						const frames = await Promise.race([
							this.loadFrames(`${playerManifest._base}/${anim}`, playerManifest[anim]),
							new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
						]);
						console.log(`Successfully loaded ${anim}: ${frames.length} frames`);
						this.assets.player[anim] = frames;
					} catch (error) {
						console.warn(`Failed to load player animation ${anim}:`, error);
						this.assets.player[anim] = [];
					}
				} else {
					console.warn(`Player animation ${anim} not found in manifest`);
				}
				addProgress(totalSteps);
			}

			// Load all enemy animations
			const enemiesManifest = this.getEnemiesManifest();
			this.assets.enemies = {};
			
			// Load all enemy types
			const enemyTypes = ['Bald Pirate', 'Cucumber', 'Big Guy', 'Captain', 'Whale'];
			for (const enemyName of enemyTypes) {
				if (enemiesManifest[enemyName]) {
			this.assets.enemies[enemyName] = {};
					const essentialEnemyAnims = ['1-Idle', '2-Run', '4-Jump', '5-Fall', '7-Attack', '8-Hit', '9-Hit', '10-Dead Hit', '11-Dead Ground', '12-Hit', '13-Dead Hit', '14-Dead Ground'];
					for (const anim of essentialEnemyAnims) {
						if (enemiesManifest[enemyName][anim]) {
							try {
								const frames = await Promise.race([
									this.loadFrames(`${enemiesManifest[enemyName].base}/${anim}`, enemiesManifest[enemyName][anim]),
									new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
								]);
				this.assets.enemies[enemyName][anim] = frames;
								console.log(`Loaded ${enemyName} ${anim}: ${frames.length} frames`);
							} catch (error) {
								console.warn(`Failed to load enemy animation ${enemyName} ${anim}:`, error);
								this.assets.enemies[enemyName][anim] = [];
							}
						}
				addProgress(totalSteps);
					}
			}
		}

		// Load bomb animations
			this.assets.objects = {};
		this.assets.objects['1-BOMB'] = {};
			const bombAnims = ['1-Bomb Off', '2-Bomb On', '3-Explotion'];
			for (const anim of bombAnims) {
				try {
					const bombFrames = await Promise.race([
						this.loadFrames(`Sprites/7-Objects/1-BOMB/${anim}`, this.getObjectsManifest().bomb[anim]),
						new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
					]);
					this.assets.objects['1-BOMB'][anim] = bombFrames;
					console.log(`Loaded bomb ${anim}: ${bombFrames.length} frames`);
				} catch (error) {
					console.warn(`Failed to load bomb animation ${anim}:`, error);
					this.assets.objects['1-BOMB'][anim] = [];
				}
			addProgress(totalSteps);
		}

		// Load door animations
		this.assets.objects['2-Door'] = {};
			const doorAnims = ['1-Closed', '2-Opening', '3-Closing'];
			for (const anim of doorAnims) {
				try {
					const doorFrames = await Promise.race([
						this.loadFrames(`Sprites/7-Objects/2-Door/${anim}`, this.getObjectsManifest().door[anim]),
						new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
					]);
					this.assets.objects['2-Door'][anim] = doorFrames;
					console.log(`Loaded door ${anim}: ${doorFrames.length} frames`);
				} catch (error) {
					console.warn(`Failed to load door animation ${anim}:`, error);
					this.assets.objects['2-Door'][anim] = [];
				}
			addProgress(totalSteps);
		}

			// Load tile sprites - using blocks.png, block2.png, and block3.png for different levels
		this.assets.objects['tiles'] = {};
		
		// Load background images for different levels
		this.assets.backgrounds = {};
		
		// Load blocks.png (for level 1)
		try {
			const blocksImg = await Promise.race([
				this.loadImage('Sprites/8-Tile-Sets/blocks.png'),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
			]);
			this.assets.objects['tiles']['blocks'] = blocksImg ? [blocksImg] : [];
			console.log('Loaded blocks.png tile set');
		} catch (error) {
			console.warn('Failed to load blocks.png:', error);
			this.assets.objects['tiles']['blocks'] = [];
		}
		
		// Load block2.png (for level 2)
		try {
			const block2Img = await Promise.race([
				this.loadImage('Sprites/8-Tile-Sets/block2.png'),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
			]);
			this.assets.objects['tiles']['block2'] = block2Img ? [block2Img] : [];
			console.log('Loaded block2.png tile set');
		} catch (error) {
			console.warn('Failed to load block2.png:', error);
			this.assets.objects['tiles']['block2'] = [];
		}
		
		// Load block3.png (for level 3+)
				try {
			const block3Img = await Promise.race([
				this.loadImage('Sprites/8-Tile-Sets/block3.png'),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
			]);
			this.assets.objects['tiles']['block3'] = block3Img ? [block3Img] : [];
			console.log('Loaded block3.png tile set');
		} catch (error) {
			console.warn('Failed to load block3.png:', error);
			this.assets.objects['tiles']['block3'] = [];
		}
		
		// Load block4.png (for level 4)
		try {
			const block4Img = await Promise.race([
				this.loadImage('Sprites/8-Tile-Sets/block4.png'),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
			]);
			this.assets.objects['tiles']['block4'] = block4Img ? [block4Img] : [];
			console.log('Loaded block4.png tile set');
		} catch (error) {
			console.warn('Failed to load block4.png:', error);
			this.assets.objects['tiles']['block4'] = [];
		}
		
		// Load block5.png (for level 5)
		try {
			const block5Img = await Promise.race([
				this.loadImage('Sprites/8-Tile-Sets/block5.png'),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
			]);
			this.assets.objects['tiles']['block5'] = block5Img ? [block5Img] : [];
			console.log('Loaded block5.png tile set');
		} catch (error) {
			console.warn('Failed to load block5.png:', error);
			this.assets.objects['tiles']['block5'] = [];
		}
		
		// Load block6.png (for level 6)
		try {
			const block6Img = await Promise.race([
				this.loadImage('Sprites/8-Tile-Sets/block6.png'),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
			]);
			this.assets.objects['tiles']['block6'] = block6Img ? [block6Img] : [];
			console.log('✅ Loaded block6.png tile set for level 6');
		} catch (error) {
			console.warn('❌ Failed to load block6.png:', error);
			this.assets.objects['tiles']['block6'] = [];
		}
		
		// Load background images
		try {
			const bgblocksImg = await Promise.race([
				this.loadImage('Sprites/8-Tile-Sets/bgblocks.png'),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
			]);
			this.assets.backgrounds['bgblocks'] = bgblocksImg;
			console.log('Loaded bgblocks.png background');
		} catch (error) {
			console.warn('Failed to load bgblocks.png:', error);
			this.assets.backgrounds['bgblocks'] = null;
		}
		
		try {
			const bgblock2Img = await Promise.race([
				this.loadImage('Sprites/8-Tile-Sets/bgblock2.png'),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
			]);
			this.assets.backgrounds['bgblock2'] = bgblock2Img;
			console.log('Loaded bgblock2.png background');
		} catch (error) {
			console.warn('Failed to load bgblock2.png:', error);
			this.assets.backgrounds['bgblock2'] = null;
		}
		
		try {
			const bgblock3Img = await Promise.race([
				this.loadImage('Sprites/8-Tile-Sets/bgblock3.png'),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
			]);
			this.assets.backgrounds['bgblock3'] = bgblock3Img;
			console.log('Loaded bgblock3.png background');
		} catch (error) {
			console.warn('Failed to load bgblock3.png:', error);
			this.assets.backgrounds['bgblock3'] = null;
		}
		
		try {
			const bgblock4Img = await Promise.race([
				this.loadImage('Sprites/8-Tile-Sets/bgblock4.png'),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
			]);
			this.assets.backgrounds['bgblock4'] = bgblock4Img;
			console.log('Loaded bgblock4.png background');
		} catch (error) {
			console.warn('Failed to load bgblock4.png:', error);
			this.assets.backgrounds['bgblock4'] = null;
		}
		
		try {
			const bgblock5Img = await Promise.race([
				this.loadImage('Sprites/8-Tile-Sets/bgblock5.png'),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
			]);
			this.assets.backgrounds['bgblock5'] = bgblock5Img;
			console.log('Loaded bgblock5.png background');
		} catch (error) {
			console.warn('Failed to load bgblock5.png:', error);
			this.assets.backgrounds['bgblock5'] = null;
		}
		
		try {
			const bgblock6Img = await Promise.race([
				this.loadImage('Sprites/8-Tile-Sets/bgblock6.png'),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
			]);
			this.assets.backgrounds['bgblock6'] = bgblock6Img;
			console.log('✅ Loaded bgblock6.png background for level 6');
		} catch (error) {
			console.warn('❌ Failed to load bgblock6.png:', error);
			this.assets.backgrounds['bgblock6'] = null;
		}
		
		addProgress(totalSteps);

		// Load shield image for potions
		try {
			console.log('Loading shield image for potions...');
			this.assets.shield = await this.loadImage('Sprites/emojis/shield.png');
			console.log('Shield image loaded successfully');
		} catch (error) {
			console.warn('Failed to load shield image:', error);
			this.assets.shield = null;
		}
		addProgress(totalSteps);

		} catch (error) {
			console.error('Error during asset loading:', error);
		}

		// Force 100% at the end
		if (onProgress) onProgress(totalSteps, totalSteps);
		return this.assets;
	}
}

// ---------------------------
// Game Core
// ---------------------------
class PirateBombGame {
	constructor() {
		this.canvas = document.getElementById('gameCanvas');
		if (!this.canvas) {
			console.error('Canvas element not found! Make sure the HTML has <canvas id="gameCanvas">');
			throw new Error('Canvas element not found! Make sure the HTML has <canvas id="gameCanvas">');
		}
		this.ctx = this.canvas.getContext('2d');
		this.width = this.canvas.width;
		this.height = this.canvas.height;
		
		// Safety wrapper to prevent missing method errors
		this.safeCall = (methodName, ...args) => {
			if (typeof this[methodName] === 'function') {
				try {
					return this[methodName](...args);
				} catch (error) {
					console.warn(`Method ${methodName} threw an error:`, error);
					return null;
				}
			} else {
				console.warn(`Method ${methodName} does not exist, skipping call`);
				return null;
			}
		};
		
		// Performance optimizations
		this.ctx.imageSmoothingEnabled = false; // Disable image smoothing for pixel art
		this.ctx.imageSmoothingQuality = 'low';

		this.assets = null; // filled after loading
		this.soundManager = soundManager; // reference to global sound manager

		this.gameState = {
			currentScore: 0,
			totalScore: 0,
			level: 1,
			lives: 3,
			gameOver: false,
			paused: false
		};
		
		// Debug: Log initial game state
		console.log('🔍 Initial game state level:', this.gameState.level);

		this.player = null;
		this.enemies = [];
		this.bombs = [];
		this.thrownBombs = []; // Array for bombs thrown by Big Guy enemies
		this.potions = []; // Array for collectible potions
		this.potionSpawnTimer = 0; // Timer for dynamic potion spawning
		this.lastHealthCheck = 100; // Track player's last health for spawning logic
		this.platforms = [];
		this.door = null;
		this.worldWidth = 2400; // dynamic; recomputed from platforms
		this.worldHeight = this.canvas.height; // fixed for now
		this.levelTransitionTimer = 0; // ms; >0 means transitioning

		this.camera = { x: 0, y: 0 };
		this.keys = {};
		this.lastTime = 0;

		this.setupInput();
		this.boot();
	}

	// Get player's wallet address - needed for database operations
	getPlayerWalletAddress() {
		return window.walletConnection && window.walletConnection.publicKey ? 
			window.walletConnection.publicKey.toString() : null;
	}

	// Handle player death with recharge system
	async handlePlayerDeath() {
		try {
			console.log('💀 Player death detected - handling with recharge system');
			
			// Update game state
			this.gameState.lives = Math.max(0, this.gameState.lives - 1);
			console.log(`💀 Lives remaining: ${this.gameState.lives}`);
			
			// Update recharge system if available
			if (window.rechargeManager) {
				const newLives = await window.rechargeManager.onPlayerDeath();
				console.log(`🔋 Recharge system updated - lives: ${newLives}`);
				
				// Sync game state with recharge system
				this.gameState.lives = newLives;
				
				// If no lives remaining, show game over
				if (newLives === 0) {
					console.log('🔋 No lives remaining - showing game over screen');
					this.showGameOver();
				}
			} else {
				console.warn('⚠️ RechargeManager not available - using fallback death handling');
				// Fallback: show game over if no lives
				if (this.gameState.lives === 0) {
					this.showGameOver();
				}
			}
			
			// Update UI
			this.updateUI();
			
		} catch (error) {
			console.error('❌ Error handling player death:', error);
			// Fallback: show game over
			this.showGameOver();
		}
	}

	async boot() {
		try {
			console.log('Starting game boot...');
			const loader = new AssetLoader();
			this.assets = await loader.loadAll((loaded, total) => {
				const progress = (loaded / total) * 100;
				document.getElementById('loadingFill').style.width = progress + '%';
				document.getElementById('loadingText').textContent = `Loading sprites... ${Math.round(progress)}%`;
			});

			console.log('Assets loaded, creating player...');
			console.log('Player assets before creating player:', this.assets.player);
			
			// Check if we have real sprites before creating player
			const hasRealSprites = this.assets.player && 
				Object.keys(this.assets.player).length > 0 && 
				this.assets.player['4-Jump'] && 
				this.assets.player['4-Jump'].length > 0;
			
			if (!hasRealSprites) {
				console.warn('No real sprites found, creating fallbacks');
				this.createFallbackSprites();
			} else {
				console.log('Real sprites found, using them');
			}
			
			this.player = new Player(100, 500, this.assets.player);
			
			console.log('Generating level...');
			this.generateLevel();
			this.computeWorldBounds();
			
			// Spawn player from top of screen (classic platformer style)
			this.player.x = 100;
			this.player.y = 100; // Start in visible area for debugging
			this.player.velY = 0; // No initial velocity
			this.player.onGround = false; // Start in air
			this.player.setAnim('1-Idle'); // Idle animation for debugging
			// Spawn invulnerability to avoid instant damage
			this.player.invulnerable = true;
			this.player.invulTimer = 2000;
		console.log('🔍 PLAYER SPAWNED at:', this.player.x, this.player.y);
			
			console.log('Spawning enemies...');
			this.spawnEnemies();
			
			console.log('Spawning potions...');
			this.spawnPotions();
			
			console.log('Hiding loading screen...');
			// Hide loading screen
			document.getElementById('loadingScreen').style.display = 'none';
			
			console.log('Starting game loop...');
			this.gameLoop();
			
			// Load saved progress after game is initialized
			if (window.walletConnection && window.walletConnection.loadPlayerProgress) {
				await window.walletConnection.loadPlayerProgress();
				console.log('🎮 Game state after loading progress:', {
					level: this.gameState.level,
					totalScore: this.gameState.totalScore,
					currentScore: this.gameState.currentScore,
					lives: this.gameState.lives
				});
				
				// Sync game state with recharge system
				if (window.rechargeManager) {
					const rechargeLives = window.rechargeManager.getLivesRemaining();
					this.gameState.lives = rechargeLives;
					console.log(`🔋 Synced game lives with recharge system: ${rechargeLives}`);
				}
				
				// Save initial state to database
				if (window.playerDataManager) {
					const walletAddress = this.getPlayerWalletAddress();
					if (walletAddress) {
						const playerProfile = {
							walletAddress: walletAddress,
							username: `Kaboom_${walletAddress.slice(0, 6)}`,
							level: this.gameState.level,
							totalScore: this.gameState.totalScore,
							boomTokens: Math.floor(this.gameState.totalScore * 0.10),
							lives: this.gameState.lives,
							currentScore: this.gameState.currentScore
						};
						
						window.playerDataManager.savePlayerProfile(playerProfile).then(result => {
							if (result.success) {
								console.log('✅ Initial player data saved to database');
							} else {
								console.warn('⚠️ Failed to save initial data to database:', result.error);
							}
						});
					} else {
						console.log('⏳ Wallet not connected yet, will save initial data when connected');
					}
				}
				
						// Update token display immediately after loading progress
		const playerTokenBalance = document.getElementById('playerTokenBalance');
		if (playerTokenBalance) {
			const currentTokens = Math.floor(this.gameState.totalScore * 0.10);
			playerTokenBalance.textContent = currentTokens;
			console.log(`💰 Progress loaded - Token display updated: ${currentTokens} (from score: ${this.gameState.totalScore})`);
		}
		
		// Sync current game state to database when wallet connects
		if (window.playerRegistry && window.playerRegistry.syncGameStateToDatabase) {
			window.playerRegistry.syncGameStateToDatabase();
		}
				
				// Save current state to database after loading progress
				if (window.playerDataManager) {
					const walletAddress = this.getPlayerWalletAddress();
					if (walletAddress) {
						const playerProfile = {
							walletAddress: walletAddress,
							username: window.playerProfile?.username || `Kaboom_${walletAddress.slice(0, 6)}`,
							level: this.gameState.level,
							totalScore: this.gameState.totalScore,
							boomTokens: Math.floor(this.gameState.totalScore * 0.10),
							lives: this.player.lives,
							currentScore: this.gameState.currentScore
						};
						
						window.playerDataManager.savePlayerProfile(playerProfile).then(result => {
							if (result.success) {
								console.log('✅ Player data synced to database after loading progress');
							} else {
								console.warn('⚠️ Failed to sync to database:', result.error);
							}
						});
					} else {
						console.log('⏳ Wallet not connected yet, will sync when connected');
					}
				}
			}
			
			// Start background music after user interaction (game start)
			if (this.soundManager && this.soundManager.startBackgroundMusic) {
				console.log('Starting background music from game boot...');
				// Start music immediately since user clicked start button
				this.soundManager.startBackgroundMusic();
			}
			
			// Also try global music start function
			if (window.startMusic) {
				console.log('Calling global startMusic function...');
				window.startMusic();
			}
		} catch (error) {
			console.error('Error during game boot:', error);
			// Show error on loading screen
			document.getElementById('loadingText').textContent = `Error: ${error.message}`;
		}
	}

	createFallbackSprites() {
		// Create canvas-based fallback sprites if real sprites failed to load
		const createFallbackSprite = (color, size = 64) => {
			const canvas = document.createElement('canvas');
			canvas.width = size;
			canvas.height = size;
			const ctx = canvas.getContext('2d');
			
			// Draw colored rectangle
			ctx.fillStyle = color;
			ctx.fillRect(0, 0, size, size);
			
			// Add border
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 2;
			ctx.strokeRect(1, 1, size - 2, size - 2);
			
			return canvas;
		};

		const createEnemySprite = (color, size = 64) => {
			const canvas = document.createElement('canvas');
			canvas.width = size;
			canvas.height = size;
			const ctx = canvas.getContext('2d');
			
			// Scale factor for different sizes
			const scale = size / 64;
			
			// Draw enemy body (rounder shape)
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(size/2, size/2, size/2 - 4 * scale, 0, Math.PI * 2);
			ctx.fill();
			
			// Add darker border
			ctx.strokeStyle = '#8B0000';
			ctx.lineWidth = 3 * scale;
			ctx.stroke();
			
			// Add eyes
			ctx.fillStyle = '#FFFFFF';
			ctx.beginPath();
			ctx.arc(size/2 - 12 * scale, size/2 - 8 * scale, 6 * scale, 0, Math.PI * 2);
			ctx.arc(size/2 + 12 * scale, size/2 - 8 * scale, 6 * scale, 0, Math.PI * 2);
			ctx.fill();
			
			// Add pupils
			ctx.fillStyle = '#000000';
			ctx.beginPath();
			ctx.arc(size/2 - 12 * scale, size/2 - 8 * scale, 3 * scale, 0, Math.PI * 2);
			ctx.arc(size/2 + 12 * scale, size/2 - 8 * scale, 3 * scale, 0, Math.PI * 2);
			ctx.fill();
			
			// Add angry eyebrows
			ctx.strokeStyle = '#8B0000';
			ctx.lineWidth = 2 * scale;
			ctx.beginPath();
			ctx.moveTo(size/2 - 18 * scale, size/2 - 16 * scale);
			ctx.lineTo(size/2 - 6 * scale, size/2 - 12 * scale);
			ctx.moveTo(size/2 + 6 * scale, size/2 - 12 * scale);
			ctx.lineTo(size/2 + 18 * scale, size/2 - 16 * scale);
			ctx.stroke();
			
			// Add mouth
			ctx.strokeStyle = '#8B0000';
			ctx.lineWidth = 2 * scale;
			ctx.beginPath();
			ctx.arc(size/2, size/2 + 8 * scale, 8 * scale, 0, Math.PI);
			ctx.stroke();
			
			// Add some details based on enemy type
			if (color === '#32CD32') { // Cucumber - add green details
				ctx.fillStyle = '#228B22';
				ctx.beginPath();
				ctx.arc(size/2, size/2 - 20 * scale, 4 * scale, 0, Math.PI * 2);
				ctx.fill();
			} else if (color === '#8B4513') { // Big Guy - add muscle details
				ctx.fillStyle = '#654321';
				ctx.fillRect(size/2 - 8 * scale, size/2 + 12 * scale, 16 * scale, 4 * scale);
			} else if (color === '#4169E1') { // Captain - add hat
				ctx.fillStyle = '#000080';
				ctx.beginPath();
				ctx.ellipse(size/2, size/2 - 20 * scale, 15 * scale, 6 * scale, 0, 0, Math.PI * 2);
				ctx.fill();
			} else if (color === '#4682B4') { // Whale - add water spout
				ctx.fillStyle = '#87CEEB';
				ctx.beginPath();
				ctx.ellipse(size/2, size/2 - 25 * scale, 8 * scale, 12 * scale, 0, 0, Math.PI * 2);
				ctx.fill();
			}
			
			return canvas;
		};

		const createPlayerSprite = (color, size = 64) => {
			const canvas = document.createElement('canvas');
			canvas.width = size;
			canvas.height = size;
			const ctx = canvas.getContext('2d');
			
			// Draw player body (rounder shape)
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(size/2, size/2, size/2 - 4, 0, Math.PI * 2);
			ctx.fill();
			
			// Add darker border
			ctx.strokeStyle = '#006400';
			ctx.lineWidth = 3;
			ctx.stroke();
			
			// Add eyes
			ctx.fillStyle = '#FFFFFF';
			ctx.beginPath();
			ctx.arc(size/2 - 12, size/2 - 8, 6, 0, Math.PI * 2);
			ctx.arc(size/2 + 12, size/2 - 8, 6, 0, Math.PI * 2);
			ctx.fill();
			
			// Add pupils
			ctx.fillStyle = '#000000';
			ctx.beginPath();
			ctx.arc(size/2 - 12, size/2 - 8, 3, 0, Math.PI * 2);
			ctx.arc(size/2 + 12, size/2 - 8, 3, 0, Math.PI * 2);
			ctx.fill();
			
			// Add friendly eyebrows
			ctx.strokeStyle = '#006400';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(size/2 - 18, size/2 - 16);
			ctx.lineTo(size/2 - 6, size/2 - 14);
			ctx.moveTo(size/2 + 6, size/2 - 14);
			ctx.lineTo(size/2 + 18, size/2 - 16);
			ctx.stroke();
			
			// Add smile
			ctx.strokeStyle = '#006400';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(size/2, size/2 + 4, 6, 0, Math.PI);
			ctx.stroke();
			
			// Add pirate hat
			ctx.fillStyle = '#8B4513';
			ctx.beginPath();
			ctx.ellipse(size/2, size/2 - 20, 20, 8, 0, 0, Math.PI * 2);
			ctx.fill();
			
			// Add hat border
			ctx.strokeStyle = '#654321';
			ctx.lineWidth = 2;
			ctx.stroke();
			
			return canvas;
		};

		// Ensure player sprites exist
		if (!this.assets.player || Object.keys(this.assets.player).length === 0) {
			this.assets.player = {};
		}
		
		// FIX: Only create fallback sprites if real sprites are missing
		const playerSprites = ['1-Idle', '2-Run', '4-Jump', '5-Fall', '7-Hit', '8-Dead Hit', '9-Dead Ground'];
		let needFallbacks = false;
		
		playerSprites.forEach(anim => {
			if (!this.assets.player[anim] || this.assets.player[anim].length === 0) {
				console.warn(`Missing sprites for ${anim}, will create fallbacks`);
				needFallbacks = true;
			} else {
				console.log(`Real sprites found for ${anim}: ${this.assets.player[anim].length} frames`);
			}
		});
		
		// Only create fallbacks if needed
		if (needFallbacks) {
			console.warn('Creating fallback sprites because some animations are missing');
			playerSprites.forEach(anim => {
				if (!this.assets.player[anim] || this.assets.player[anim].length === 0) {
					this.assets.player[anim] = [createPlayerSprite('#00FF00', 64)]; // Green for player
				}
			});
		} else {
			console.log('All player sprites loaded successfully, no fallbacks needed');
		}
		
		console.log('Final player assets check:', Object.keys(this.assets.player).map(key => `${key}: ${this.assets.player[key].length} frames`));

		// Ensure enemy sprites exist
		if (!this.assets.enemies) {
			this.assets.enemies = {};
		}
		if (!this.assets.enemies['Bald Pirate']) {
			this.assets.enemies['Bald Pirate'] = {};
		}
		
		// Create fallback enemy sprites with better designs
		const enemySprites = ['1-Idle', '2-Run', '4-Jump', '5-Fall', '7-Attack', '8-Hit', '9-Hit', '10-Dead Hit', '11-Dead Ground', '12-Hit', '13-Dead Hit', '14-Dead Ground'];
		enemySprites.forEach(anim => {
			if (!this.assets.enemies['Bald Pirate'][anim] || this.assets.enemies['Bald Pirate'][anim].length === 0) {
				this.assets.enemies['Bald Pirate'][anim] = [createEnemySprite('#FF0000', 64)]; // Red for enemies
			}
		});

		// Add other enemy types with different colors and designs
		const otherEnemies = ['Cucumber', 'Big Guy', 'Captain', 'Whale'];
		otherEnemies.forEach(enemyName => {
			if (!this.assets.enemies[enemyName]) {
				this.assets.enemies[enemyName] = {};
			}
			enemySprites.forEach(anim => {
				if (!this.assets.enemies[enemyName][anim] || this.assets.enemies[enemyName][anim].length === 0) {
					let color = '#FF0000';
					let size = 64;
					switch(enemyName) {
						case 'Cucumber': 
							color = '#32CD32'; 
							size = 56; // Smaller
							break;
						case 'Big Guy': 
							color = '#8B4513'; 
							size = 72; // Bigger
							break;
						case 'Captain': 
							color = '#4169E1'; 
							size = 64;
							break;
						case 'Whale': 
							color = '#4682B4'; 
							size = 80; // Biggest
							break;
					}
					this.assets.enemies[enemyName][anim] = [createEnemySprite(color, size)];
				}
			});
		});

		// Ensure object sprites exist
		if (!this.assets.objects) {
			this.assets.objects = {};
		}
		
		// Create fallback bomb sprites
		if (!this.assets.objects['1-BOMB']) {
			this.assets.objects['1-BOMB'] = {};
		}
		if (!this.assets.objects['1-BOMB']['1-Bomb Off'] || this.assets.objects['1-BOMB']['1-Bomb Off'].length === 0) {
			this.assets.objects['1-BOMB']['1-Bomb Off'] = [createBombSprite(64)]; // Better bomb design
		}

		// Create fallback door sprites
		if (!this.assets.objects['2-Door']) {
			this.assets.objects['2-Door'] = {};
		}
		if (!this.assets.objects['2-Door']['1-Closed'] || this.assets.objects['2-Door']['1-Closed'].length === 0) {
			this.assets.objects['2-Door']['1-Closed'] = [createDoorSprite(64)]; // Better door design
		}

		// Create fallback tile sprites
		if (!this.assets.objects['tiles']) {
			this.assets.objects['tiles'] = {};
		}
		if (!this.assets.objects['tiles']['1'] || this.assets.objects['tiles']['1'].length === 0) {
			this.assets.objects['tiles']['1'] = [createFallbackSprite('#8B4513', 64)]; // Brown for tiles
		}

		// Add missing sprite creation functions
		const createBombSprite = (size = 64) => {
			const canvas = document.createElement('canvas');
			canvas.width = size;
			canvas.height = size;
			const ctx = canvas.getContext('2d');
			
			// Scale factor
			const scale = size / 64;
			
			// Draw bomb body (black circle)
			ctx.fillStyle = '#000000';
			ctx.beginPath();
			ctx.arc(size/2, size/2, size/2 - 8 * scale, 0, Math.PI * 2);
			ctx.fill();
			
			// Add bomb highlight
			ctx.fillStyle = '#333333';
			ctx.beginPath();
			ctx.arc(size/2 - 8 * scale, size/2 - 8 * scale, size/4, 0, Math.PI * 2);
			ctx.fill();
			
			// Add fuse
			ctx.strokeStyle = '#8B4513';
			ctx.lineWidth = 4 * scale;
			ctx.beginPath();
			ctx.moveTo(size/2, size/2 - size/2 + 8 * scale);
			ctx.quadraticCurveTo(size/2 + 10 * scale, size/2 - size/2 - 5 * scale, size/2 + 15 * scale, size/2 - size/2 + 5 * scale);
			ctx.stroke();
			
			// Add fuse tip
			ctx.fillStyle = '#FF4500';
			ctx.beginPath();
			ctx.arc(size/2 + 15 * scale, size/2 - size/2 + 5 * scale, 4 * scale, 0, Math.PI * 2);
			ctx.fill();
			
			// Add some sparkle effect
			ctx.fillStyle = '#FFFF00';
			ctx.beginPath();
			ctx.arc(size/2 + 18 * scale, size/2 - size/2 - 8 * scale, 2 * scale, 0, Math.PI * 2);
			ctx.fill();
			
			return canvas;
		};

		const createDoorSprite = (size = 64) => {
			const canvas = document.createElement('canvas');
			canvas.width = size;
			canvas.height = size;
			const ctx = canvas.getContext('2d');
			
			// Scale factor
			const scale = size / 64;
			
			// Draw door frame
			ctx.fillStyle = '#654321';
			ctx.fillRect(0, 0, size, size);
			
			// Draw door
			ctx.fillStyle = '#8B4513';
			ctx.fillRect(4 * scale, 4 * scale, size - 8 * scale, size - 8 * scale);
			
			// Add door panels
			ctx.strokeStyle = '#654321';
			ctx.lineWidth = 2 * scale;
			ctx.strokeRect(8 * scale, 8 * scale, size - 16 * scale, size - 16 * scale);
			ctx.strokeRect(12 * scale, 12 * scale, size - 24 * scale, size - 24 * scale);
			
			// Add door handle
			ctx.fillStyle = '#FFD700';
			ctx.beginPath();
			ctx.arc(size - 12 * scale, size/2, 6 * scale, 0, Math.PI * 2);
			ctx.fill();
			
			// Add door handle border
			ctx.strokeStyle = '#B8860B';
			ctx.lineWidth = 1 * scale;
			ctx.stroke();
			
			// Add some wood grain texture
			ctx.strokeStyle = '#654321';
			ctx.lineWidth = 1 * scale;
			for (let i = 0; i < 3; i++) {
				ctx.beginPath();
				ctx.moveTo(8 * scale, 16 * scale + i * 12 * scale);
				ctx.lineTo(size - 8 * scale, 16 * scale + i * 12 * scale);
				ctx.stroke();
			}
			
			return canvas;
		};

		console.log('Fallback sprites created');
	}

	setupInput() {
		document.addEventListener('keydown', (e) => {
			this.keys[e.code] = true;
			
			// Start music on first key press (user interaction)
			if (this.soundManager && this.soundManager.musicEnabled && !this.soundManager.audioElements[0]?.playing) {
				console.log('🎵 First key press detected, starting music...');
				this.soundManager.startBackgroundMusic();
			}
			switch (e.code) {
				case 'Space': e.preventDefault(); this.player && this.player.jump(); break;
				case 'KeyB': e.preventDefault(); this.player && this.player.placeBomb(this); break;
				case 'KeyP': e.preventDefault(); this.togglePause(); break;
			}
		});
		document.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
	}

	generateLevel() {
		// Fixed room-like layout to match the reference image (basic blocks only)
		this.platforms = [];
		this.worldWidth = this.width; // single-screen room
		this.worldHeight = this.height;
		const floorY = this.height - 64;
		const tileW = 64;
		
		// Floor across screen
		const floorTiles = Math.ceil(this.width / tileW);
		for (let x = 0; x < floorTiles; x += 1) {
			this.platforms.push({ x: x * tileW, y: floorY, width: tileW, height: 64, type: 'ground' });
		}
		
		// Invisible left/right walls to block leaving the room
		this.platforms.push({ x: -10, y: 0, width: 10, height: this.height, type: 'wall' });
		this.platforms.push({ x: this.width, y: 0, width: 10, height: this.height, type: 'wall' });
		
		// Generate platforms procedurally
		this.generatePlatforms(floorY);

		// Place door at bottom-right on floor
		const doorSprites = (this.assets && this.assets.objects && this.assets.objects['2-Door']) || {};
		console.log('Door sprites available:', Object.keys(doorSprites));
		const doorWidth = 64; const doorHeight = 96;
		const doorX = this.width - doorWidth; // flush with right edge
		const doorY = floorY - doorHeight;
		this.door = new Door(doorX, doorY, doorSprites);
		console.log(`Door created at (${doorX}, ${doorY}) for level ${this.gameState.level}`);
		// Add a thin invisible blocker in front of the door; removed when door opens
		this.doorBlock = { x: doorX - 2, y: doorY, width: 4, height: doorHeight, type: 'doorBlock' };
		this.platforms.push(this.doorBlock);
		this.computeWorldBounds();
	}

	computeWorldBounds() {
		// Lock to single-screen room
		this.worldWidth = this.width;
		this.worldHeight = this.height;
	}

	generatePlatforms(floorY) {
		// Professional platform layout - carefully designed for optimal gameplay
		const platformHeight = 64;
		
		// Define a professional platform sequence with precise positioning
		const platformLayout = [
			// Platform 1: Starting platform (easy to reach from ground) - raised slightly
			{ x: 200, y: floorY - 140, width: 128, variant: '2' },
			
			// Platform 2: First jump target (right side)
			{ x: 450, y: floorY - 200, width: 128, variant: '3' },
			
			// Platform 3: Second jump (left side, higher)
			{ x: 250, y: floorY - 280, width: 128, variant: '4' },
			
			// Platform 4: Third jump (right side, even higher)
			{ x: 500, y: floorY - 360, width: 128, variant: '5' },
			
			// Platform 5: Fourth jump (left side, near top)
			{ x: 300, y: floorY - 440, width: 128, variant: '6' },
			
			// Platform 6: Fifth jump (right side, highest)
			{ x: 550, y: floorY - 520, width: 128, variant: '7' },
			
			// NEW PLATFORM - Just one strategic addition
			
			// Platform 7: Small platform near door area (for strategic positioning)
			{ x: 700, y: floorY - 140, width: 128, variant: '1' },
			
			// Platform 8: Platform above the door area platform
			{ x: 800, y: floorY - 280, width: 128, variant: '2' },
			
			// Platform 9: Platform above Platform 8
			{ x: 750, y: floorY - 440, width: 128, variant: '3' }
		];
		
		// Add each platform with professional spacing
		platformLayout.forEach((platform, index) => {
			this.platforms.push({
				x: platform.x,
				y: platform.y,
				width: platform.width,
				height: platformHeight,
				type: 'platform',
				tileVariant: platform.variant
			});
		});
	}
	
	isPositionOccupied(x, y, width, height) {
		// Check if a position overlaps with existing platforms
		for (const platform of this.platforms) {
			if (platform.type === 'platform' || platform.type === 'ground') {
				// Add some padding to prevent platforms from being too close
				const padding = 20;
				if (x < platform.x + platform.width + padding &&
					x + width + padding > platform.x &&
					y < platform.y + platform.height + padding &&
					y + height + padding > platform.y) {
					return true;
				}
			}
		}
		return false;
	}

	spawnEnemies() {
		// Strategic enemy placements with level-based scaling and increased count
		this.enemies = [];
		const tileW = 64;
		const currentLevel = this.gameState.level;
		
		// Base enemies - only spawn if real sprites are available
		// Bald Pirate - Close to player spawn, aggressive chaser
		if (this.assets.enemies['Bald Pirate'] && Object.keys(this.assets.enemies['Bald Pirate']).length > 0) {
			this.enemies.push(new Enemy(3 * tileW, this.worldHeight - 128, 'Bald Pirate', this.assets.enemies['Bald Pirate'], currentLevel));
		}
		
		// Cucumber - Also close to player spawn, fast and agile chaser
		if (this.assets.enemies['Cucumber'] && Object.keys(this.assets.enemies['Cucumber']).length > 0) {
			this.enemies.push(new Enemy(5 * tileW, this.worldHeight - 128, 'Cucumber', this.assets.enemies['Cucumber'], currentLevel));
		}
		
		// Big Guy - Center platform, slower but strong
		if (this.assets.enemies['Big Guy'] && Object.keys(this.assets.enemies['Big Guy']).length > 0) {
			this.enemies.push(new Enemy(Math.floor(this.width / 2) - 16, this.worldHeight - 288, 'Big Guy', this.assets.enemies['Big Guy'], currentLevel));
		}
		
		// Whale - Bottom right, slow but powerful
		if (this.assets.enemies['Whale'] && Object.keys(this.assets.enemies['Whale']).length > 0) {
			this.enemies.push(new Enemy(this.width - 4 * tileW, this.worldHeight - 128, 'Whale', this.assets.enemies['Whale'], currentLevel));
		}
		
		// Captain - Top platform, balanced enemy
		if (this.assets.enemies['Captain'] && Object.keys(this.assets.enemies['Captain']).length > 0) {
			this.enemies.push(new Enemy(this.width - 2.5 * tileW, this.worldHeight - 320, 'Captain', this.assets.enemies['Captain'], currentLevel));
		}
		
		// Additional enemies based on level - only spawn if real sprites are available
		if (currentLevel >= 2) {
			// Extra Bald Pirate on higher platforms
			if (this.assets.enemies['Bald Pirate'] && Object.keys(this.assets.enemies['Bald Pirate']).length > 0) {
				this.enemies.push(new Enemy(7 * tileW, this.worldHeight - 200, 'Bald Pirate', this.assets.enemies['Bald Pirate'], currentLevel));
			}
		}
		
		if (currentLevel >= 3) {
			// Extra Cucumber for more aggressive chasing
			if (this.assets.enemies['Cucumber'] && Object.keys(this.assets.enemies['Cucumber']).length > 0) {
				this.enemies.push(new Enemy(2 * tileW, this.worldHeight - 200, 'Cucumber', this.assets.enemies['Cucumber'], currentLevel));
			}
		}
		
		if (currentLevel >= 4) {
			// Extra Captain for coordinated attacks
			if (this.assets.enemies['Captain'] && Object.keys(this.assets.enemies['Captain']).length > 0) {
				this.enemies.push(new Enemy(Math.floor(this.width / 2) + 100, this.worldHeight - 440, 'Captain', this.assets.enemies['Captain'], currentLevel));
			}
		}
		
		if (currentLevel >= 5) {
			// Extra Big Guy for overwhelming force
			if (this.assets.enemies['Big Guy'] && Object.keys(this.assets.enemies['Big Guy']).length > 0) {
				this.enemies.push(new Enemy(this.width - 6 * tileW, this.worldHeight - 200, 'Big Guy', this.assets.enemies['Big Guy'], currentLevel));
			}
		}
		
		// If no enemies were spawned (sprites not loaded), create a basic enemy for gameplay
		if (this.enemies.length === 0) {
			console.log('No enemy sprites loaded, creating basic enemy for gameplay');
			const basicEnemySprites = {
				'1-Idle': [this.createBasicEnemyCanvas()],
				'2-Run': [this.createBasicEnemyCanvas()],
				'4-Jump': [this.createBasicEnemyCanvas()],
				'5-Fall': [this.createBasicEnemyCanvas()],
				'7-Attack': [this.createBasicEnemyCanvas()],
				'8-Hit': [this.createBasicEnemyCanvas()],
				'9-Hit': [this.createBasicEnemyCanvas()],
				'10-Dead Hit': [this.createBasicEnemyCanvas()],
				'11-Dead Ground': [this.createBasicEnemyCanvas()],
				'12-Hit': [this.createBasicEnemyCanvas()],
				'13-Dead Hit': [this.createBasicEnemyCanvas()],
				'14-Dead Ground': [this.createBasicEnemyCanvas()]
			};
			this.enemies.push(new Enemy(3 * tileW, this.worldHeight - 128, 'Basic Enemy', basicEnemySprites, currentLevel));
		}
		
		console.log(`Level ${currentLevel}: Spawned ${this.enemies.length} enemies with enhanced stats`);
	}
	
	spawnPotions() {
		this.potions = [];
		const currentLevel = this.gameState.level;
		
		// Spawn initial potions based on level difficulty
		if (currentLevel >= 2) {
			// Spawn 1 heart potion on level 2+
			this.spawnDynamicPotion('heart');
			console.log(`Level ${currentLevel}: Spawned 1 initial heart potion`);
		}
		
		if (currentLevel >= 4) {
			// Spawn 1 shield potion on level 4+
			this.spawnDynamicPotion('shield');
			console.log(`Level ${currentLevel}: Spawned 1 initial shield potion`);
		}
		
		console.log(`Level ${currentLevel}: Initial potions spawned based on level difficulty`);
	}
	
	spawnDynamicPotion(type) {
		const currentLevel = this.gameState.level;
		
		// Find a good spawn location on ground blocks/platforms
		let attempts = 0;
		let x, y;
		let validLocation = false;
		
		do {
			// Try to find a random platform or ground block
			const groundPlatforms = this.platforms.filter(p => 
				p.type === 'ground' || p.type === 'platform'
			);
			
			if (groundPlatforms.length > 0) {
				// Pick a random ground platform
				const randomPlatform = groundPlatforms[Math.floor(Math.random() * groundPlatforms.length)];
				
				// Spawn on top of the platform
				x = randomPlatform.x + (Math.random() * (randomPlatform.width - 32)); // 32 is potion width
				y = randomPlatform.y - 32; // Place potion on top of platform
				
				// Check if this location is valid
				if (!this.isLocationOccupied(x, y)) {
					validLocation = true;
				}
			} else {
				// Fallback to ground level if no platforms found
				x = 200 + (Math.random() * (this.width - 400));
				y = this.worldHeight - 64; // Ground level
				validLocation = !this.isLocationOccupied(x, y);
			}
			
			// If still no valid location, try simple ground spawning
			if (!validLocation && attempts >= 10) {
				x = 100 + (Math.random() * (this.width - 200));
				y = this.worldHeight - 80; // Slightly above ground
				validLocation = true; // Force spawn
				console.log(`Force spawning ${type} potion at ground level: (${Math.round(x)}, ${Math.round(y)})`);
			}
			
			attempts++;
		} while (!validLocation && attempts < 10);
		
		// Only create potion if we found a valid location
		if (validLocation) {
			const potion = new Potion(x, y, type);
			this.potions.push(potion);
			console.log(`Dynamic spawn: ${type} potion at (${Math.round(x)}, ${Math.round(y)})`);
			return potion;
		} else {
			console.log(`Failed to find valid location for ${type} potion after ${attempts} attempts`);
			return null;
		}
	}
	
	isLocationOccupied(x, y) {
		// Check if location is too close to player
		if (this.player) {
			const distToPlayer = Math.sqrt((x - this.player.x) ** 2 + (y - this.player.y) ** 2);
			if (distToPlayer < 80) return true; // Reasonable distance from player
		}
		
		// Check if location is too close to enemies
		for (const enemy of this.enemies) {
			const distToEnemy = Math.sqrt((x - enemy.x) ** 2 + (y - enemy.y) ** 2);
			if (distToEnemy < 60) return true; // Reasonable distance from enemies
		}
		
		// Check if location is too close to existing potions
		for (const potion of this.potions) {
			const distToPotion = Math.sqrt((x - potion.x) ** 2 + (y - potion.y) ** 2);
			if (distToPotion < 50) return true; // Reasonable distance from other potions
		}
		
		// Check if location is too close to the door (prevent spawning behind door)
		if (this.door) {
			const doorBounds = this.door.getBounds();
			const distToDoor = Math.sqrt((x - (doorBounds.x + doorBounds.width/2)) ** 2 + (y - (doorBounds.y + doorBounds.height/2)) ** 2);
			if (distToDoor < 120) return true; // Keep potions away from door area
		}
		
		// Check if location is in the right edge area (where door is typically placed)
		if (x > this.width - 150) return true; // Prevent spawning in right edge area
		
		return false;
	}
	
	createFallbackEnemySprites(enemyType) {
		// Create fallback sprites for enemy types
		const sprites = {};
		const essentialAnims = ['1-Idle', '2-Run', '4-Jump', '5-Fall', '7-Attack', '8-Hit', '9-Hit', '10-Dead Hit', '11-Dead Ground', '12-Hit', '13-Dead Hit', '14-Dead Ground'];
		
		// Determine color and size based on enemy type
		let color = '#FF0000';
		let size = 64;
		
		switch(enemyType) {
			case 'Bald Pirate':
				color = '#FF0000';
				size = 64;
				break;
			case 'Cucumber':
				color = '#32CD32';
				size = 56;
				break;
			case 'Big Guy':
				color = '#8B4513';
				size = 72;
				break;
			case 'Captain':
				color = '#4169E1';
				size = 64;
				break;
			case 'Whale':
				color = '#4682B4';
				size = 80;
				break;
		}
		
		// Create canvas for fallback sprite
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d');
		
		// Scale factor
		const scale = size / 64;
		
		// Draw enemy body
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(size/2, size/2, size/2 - 4 * scale, 0, Math.PI * 2);
		ctx.fill();
		
		// Add darker border
		ctx.strokeStyle = '#8B0000';
		ctx.lineWidth = 3 * scale;
		ctx.stroke();
		
		// Add eyes
		ctx.fillStyle = '#FFFFFF';
		ctx.beginPath();
		ctx.arc(size/2 - 12 * scale, size/2 - 8 * scale, 6 * scale, 0, Math.PI * 2);
		ctx.arc(size/2 + 12 * scale, size/2 - 8 * scale, 6 * scale, 0, Math.PI * 2);
		ctx.fill();
		
		// Add pupils
		ctx.fillStyle = '#000000';
		ctx.beginPath();
		ctx.arc(size/2 - 12 * scale, size/2 - 8 * scale, 3 * scale, 0, Math.PI * 2);
		ctx.arc(size/2 + 12 * scale, size/2 - 8 * scale, 3 * scale, 0, Math.PI * 2);
		ctx.fill();
		
		// Add angry eyebrows
		ctx.strokeStyle = '#8B0000';
		ctx.lineWidth = 2 * scale;
		ctx.beginPath();
		ctx.moveTo(size/2 - 18 * scale, size/2 - 16 * scale);
		ctx.lineTo(size/2 - 6 * scale, size/2 - 12 * scale);
		ctx.moveTo(size/2 + 6 * scale, size/2 - 12 * scale);
		ctx.lineTo(size/2 + 18 * scale, size/2 - 16 * scale);
		ctx.stroke();
		
		// Add mouth
		ctx.strokeStyle = '#8B0000';
		ctx.lineWidth = 2 * scale;
		ctx.beginPath();
		ctx.arc(size/2, size/2 + 8 * scale, 8 * scale, 0, Math.PI);
		ctx.stroke();
		
		// Add type-specific details
		if (color === '#32CD32') { // Cucumber
			ctx.fillStyle = '#228B22';
			ctx.beginPath();
			ctx.arc(size/2, size/2 - 20 * scale, 4 * scale, 0, Math.PI * 2);
			ctx.fill();
		} else if (color === '#8B4513') { // Big Guy
			ctx.fillStyle = '#654321';
			ctx.fillRect(size/2 - 8 * scale, size/2 + 12 * scale, 16 * scale, 4 * scale);
		} else if (color === '#4169E1') { // Captain
			ctx.fillStyle = '#000080';
			ctx.beginPath();
			ctx.ellipse(size/2, size/2 - 20 * scale, 15 * scale, 6 * scale, 0, 0, Math.PI * 2);
			ctx.fill();
		} else if (color === '#4682B4') { // Whale
			ctx.fillStyle = '#87CEEB';
			ctx.beginPath();
			ctx.ellipse(size/2, size/2 - 25 * scale, 8 * scale, 12 * scale, 0, 0, Math.PI * 2);
			ctx.fill();
		}
		
		// Create sprite frames for each animation
		for (const anim of essentialAnims) {
			sprites[anim] = [canvas];
		}
		
		return sprites;
	}
	
	createBasicEnemyCanvas() {
		// Create a very simple enemy sprite
		const canvas = document.createElement('canvas');
		canvas.width = 64;
		canvas.height = 64;
		const ctx = canvas.getContext('2d');
		
		// Simple gray rectangle with border
		ctx.fillStyle = '#666666';
		ctx.fillRect(8, 8, 48, 48);
		
		// Border
		ctx.strokeStyle = '#333333';
		ctx.lineWidth = 2;
		ctx.strokeRect(8, 8, 48, 48);
		
		// Simple eyes
		ctx.fillStyle = '#FF0000';
		ctx.fillRect(18, 20, 4, 4);
		ctx.fillRect(42, 20, 4, 4);
		
		return canvas;
	}

	async update(delta) {
		// Comprehensive error prevention wrapper
		try {
			// Periodic profile saving (every 30 seconds)
			if (!this._lastProfileSave || Date.now() - this._lastProfileSave > 30000) {
				if (window.playerRegistry && window.playerProfile && this.gameState.totalScore > 0) {
					window.playerProfile.totalScore = this.gameState.totalScore;
					const newTokens = Math.floor(this.gameState.totalScore * 0.10);
					window.playerProfile.boomTokens = newTokens;
					
					window.playerRegistry.savePlayerProfile(window.playerProfile).then((success) => {
						if (success) {
							console.log(`💾 Periodic profile save: Total Score: ${this.gameState.totalScore}, Tokens: ${newTokens}`);
							// Update token display
							const playerTokenBalance = document.getElementById('playerTokenBalance');
							if (playerTokenBalance) {
								playerTokenBalance.textContent = newTokens;
							}
						}
					}).catch(error => {
						console.error('❌ Error in periodic profile save:', error);
					});
				}
				this._lastProfileSave = Date.now();
			}
			
			// Direct check: If game over screen is visible but player has lives, hide it
			const gameOverScreen = document.getElementById('gameOver');
			if (gameOverScreen && gameOverScreen.style.display === 'block' && this.player && this.player.lives > 0) {
				console.log('DIRECT FIX: Game over screen visible but player has lives! Hiding it...');
				this.gameState.gameOver = false;
				this.safeCall('hideGameOver');
				if (this.player.isDead) {
					this.player.respawn();
				}
			}
		
		// If game is over, don't process anything
		if (this.gameState.gameOver) {
			// Safety check: If game over is triggered but player has lives/health, reset it
			if (this.player && (this.player.lives > 0 || this.player.health > 0)) {
				console.log('SAFETY RESET: Game over triggered but player has lives/health! Resetting game over state...');
				this.gameState.gameOver = false;
				this.hideGameOver();
				if (this.player.isDead) {
					this.player.respawn();
				}
			}
			return;
		}
		
		if (this.gameState.paused || !this.player) return;
		
		// Debug: Log unexpected player state
		if (this.player.isDead && this.player.lives > 0) {
			console.log('UNEXPECTED: Player isDead=true but has lives!', {
				isDead: this.player.isDead,
				lives: this.player.lives,
				health: this.player.health,
				deathTimer: this.player.deathTimer
			});
		}
		
		// Check if player is dead and handle with recharge system
		if (this.player.isDead && this.player.deathTimer > this.player.deathAnimationDuration) {
			console.log('💀 Player death animation completed - handling with recharge system');
			
			// Use the new recharge system to handle player death
			await this.handlePlayerDeath();
		}
		
		// Safety check: if player has lives but health is 0 and not in death animation, respawn
		if (this.player.lives > 0 && this.player.health <= 0 && !this.player.isDead && !this.player.isHit) {
			console.log('SAFETY: Player has lives but health is 0 - forcing respawn');
			this.player.respawn();
		}
		
		// Debug: Log when player state changes unexpectedly
		if (this.player.isDead && this.player.lives > 0 && this.player.health > 0) {
			console.log('CRITICAL ERROR: Player marked as dead but has lives AND health!', {
				isDead: this.player.isDead,
				lives: this.player.lives,
				health: this.player.health,
				deathTimer: this.player.deathTimer
			});
		}
		
		// Additional check: if player has lives but health is 0, something is wrong
		if (this.player.health <= 0 && this.player.lives > 0 && !this.player.isDead) {
			console.log('WARNING: Player has 0 health but lives remaining and not marked as dead! Forcing respawn...');
			this.player.respawn();
		}
		
		// Debug: Log player death state if something seems wrong
		if (this.player.isDead && this.player.lives > 0) {
			console.log('Player marked as dead but has lives remaining:', {
				lives: this.player.lives,
				deathTimer: this.player.deathTimer,
				deathAnimationDuration: this.player.deathAnimationDuration
			});
		}
		
		// Additional debug: Log player state every few seconds (reduced frequency)
		if (this.player && this.player.isDead && (!this._lastDeathDebug || Date.now() - this._lastDeathDebug > 5000)) {
			console.log('Player death state debug:', {
				isDead: this.player.isDead,
				lives: this.player.lives,
				health: this.player.health,
				deathTimer: this.player.deathTimer,
				deathAnimationDuration: this.player.deathAnimationDuration,
				gameOver: this.gameState.gameOver
			});
			this._lastDeathDebug = Date.now();
		}
		this.player.worldWidth = this.worldWidth;
		
		// Debug: Log player position every few seconds
		if (!this._lastPlayerDebug || Date.now() - this._lastPlayerDebug > 2000) {
			console.log('Player position debug:', {
				x: this.player.x,
				y: this.player.y,
				velY: this.player.velY,
				onGround: this.player.onGround,
				isDead: this.player.isDead,
				health: this.player.health,
				lives: this.player.lives
			});
			this._lastPlayerDebug = Date.now();
		}
		
		this.player.update(delta, this.keys, this.platforms);
		// Fix camera to the single-screen room
		this.camera.x = 0;
		this.camera.y = 0;

		// Optimize enemy updates with spatial partitioning
		this.enemies = this.enemies.filter((enemy) => {
			// Skip updates for enemies far from player to improve performance
			const distToPlayer = Math.abs(enemy.x - this.player.x);
			if (distToPlayer > 800) {
				// Only basic physics for far enemies
				enemy.applyPhysics();
				enemy.checkCollisions(this.platforms);
				return enemy.y < this.worldHeight + 400 && enemy.x > -400 && enemy.x < this.worldWidth + 400;
			}
			
			const alive = enemy.update(delta, this.player, this.platforms);
			if (!alive) { 
				this.gameState.currentScore = Math.max(0, this.gameState.currentScore + 100);
				this.gameState.totalScore = Math.max(0, this.gameState.totalScore + 100);
				
				// IMMEDIATELY update token display when score changes
				const playerTokenBalance = document.getElementById('playerTokenBalance');
				if (playerTokenBalance) {
					const currentTokens = Math.floor(this.gameState.totalScore * 0.10);
					playerTokenBalance.textContent = currentTokens;
					console.log(`💰 Enemy killed - Token display updated: ${currentTokens} (from score: ${this.gameState.totalScore})`);
				}
				
				// Save to database immediately when score changes
				console.log('🎯 Attempting to save to database...');
				console.log('playerDataManager exists:', !!window.playerDataManager);
				console.log('walletConnection exists:', !!window.walletConnection);
				
				if (window.playerDataManager) {
					const walletAddress = this.getPlayerWalletAddress();
					console.log('Wallet address:', walletAddress);
					if (walletAddress) {
						const playerProfile = {
							walletAddress: walletAddress,
							username: window.playerProfile?.username || `Kaboom_${walletAddress.slice(0, 6)}`,
							level: this.gameState.level,
							totalScore: this.gameState.totalScore,
							boomTokens: Math.floor(this.gameState.totalScore * 0.10),
							lives: this.player.lives,
							currentScore: this.gameState.currentScore
						};
						
						console.log('📊 Saving player profile:', playerProfile);
						window.playerDataManager.savePlayerProfile(playerProfile).then(result => {
							console.log('📊 Save result:', result);
							if (result.success) {
								console.log('✅ Player data saved to database after enemy kill');
							} else {
								console.warn('⚠️ Failed to save to database:', result.error);
							}
						}).catch(error => {
							console.error('❌ Error saving to database:', error);
						});
					} else {
						console.log('⏳ Wallet not connected yet, will save when connected');
					}
				}
				
				// IMMEDIATELY save to localStorage when score changes
				if (window.walletConnection && window.walletConnection.publicKey) {
					const progress = {
						level: this.gameState.level,
						score: this.gameState.totalScore,
						lives: this.gameState.lives,
						timestamp: Date.now()
					};
					
					const progressKey = `playerProgress_${window.walletConnection.publicKey.toString()}`;
					localStorage.setItem(progressKey, JSON.stringify(progress));
					console.log('💾 Saved enemy death score to localStorage:', progress);
				}
				
				return false; 
			}
			// Cull off-world enemies so they don't block progression
			if (enemy.y > this.worldHeight + 400 || enemy.x < -400 || enemy.x > this.worldWidth + 400) return false;
			
					// More precise collision detection with player - only if enemy is alive
		if (!this.player.invulnerable && !this.player.isHit && !enemy.isDead && !this.player.isDead) {
			// Calculate actual collision area (much smaller than full sprite)
			const playerCollisionBox = {
				x: this.player.x + 25,
				y: this.player.y + 25,
				width: this.player.width - 50,
				height: this.player.height - 50
			};
			
			const enemyCollisionBox = {
				x: enemy.x + 25,
				y: enemy.y + 25,
				width: enemy.width - 50,
				height: enemy.height - 50
			};
			
			// Only damage if there's actual overlap and enemy is alive
			if (this.rectsOverlap(playerCollisionBox, enemyCollisionBox)) {
				this.player.takeDamage(25);
			}
		}
			return true;
		});

		this.bombs = this.bombs.filter((bomb) => {
			bomb.update(delta);
			
			// Remove bombs that were picked up or swallowed
			if (bomb.pickedUp || bomb.swallowed) {
				return false;
			}
			
			if (bomb.exploded) {
				// Damage enemies and player only once when explosion starts
				if (!bomb.hasDamagedEnemies) {
					bomb.hasDamagedEnemies = true;
					const cx = bomb.x + bomb.width / 2;
					const cy = bomb.y + bomb.height / 2;
					
					// Damage enemies
					this.enemies.forEach((enemy) => {
						const inBlast = this.circleHitsRect(cx, cy, bomb.explosionRadius, enemy);
						if (inBlast && !enemy.isDead) {
							enemy.takeDamage(50);
						}
					});
					
					// Damage player if in blast radius
					if (this.player && !this.player.invulnerable && !this.player.isDead) {
						const inBlast = this.circleHitsRect(cx, cy, bomb.explosionRadius, this.player);
						if (inBlast) {
							this.player.takeDamage(30); // Player takes less damage than enemies
						}
					}
				}
				
				// Keep bomb until explosion animation finishes
				return bomb.explosionTimer < bomb.explosionDuration;
			}
			
			return true;
		});

		// Update thrown bombs from Big Guy enemies
		if (this.thrownBombs) {
			this.thrownBombs = this.thrownBombs.filter((thrownBomb) => {
				thrownBomb.update(delta);
				return !thrownBomb.exploded;
			});
		}
		
		// Update potions and check for collection
		this.potions = this.potions.filter((potion) => {
			potion.update(delta);
			
			// Magnet effect - attract potions if player has magnet power-up
			if (this.player && this.player.magnet && this.player.magnetRadius > 0) {
				const playerCenterX = this.player.x + this.player.width / 2;
				const playerCenterY = this.player.y + this.player.height / 2;
				const potionCenterX = potion.x + potion.width / 2;
				const potionCenterY = potion.y + potion.height / 2;
				
				const distance = Math.sqrt((playerCenterX - potionCenterX) ** 2 + (playerCenterY - potionCenterY) ** 2);
				
				if (distance <= this.player.magnetRadius) {
					// Attract potion towards player
					const angle = Math.atan2(playerCenterY - potionCenterY, playerCenterX - potionCenterX);
					const attractionSpeed = 3; // Speed of attraction
					
					potion.x += Math.cos(angle) * attractionSpeed;
					potion.y += Math.sin(angle) * attractionSpeed;
					
					// Add magnetic effect particles (commented out - function not available)
					/*
					if (Math.random() < 0.3) { // 30% chance per frame
						this.addMagneticParticle(potion.x + potion.width/2, potion.y + potion.height/2, playerCenterX, playerCenterY);
					}
					*/
				}
			}
			
			// Check if player collected the potion
			if (potion.checkCollision(this.player)) {
				this.player.collectPotion(potion);
				return false; // Remove collected potion
			}
			
			return true; // Keep uncollected potions
		});
		
		// Balanced potion spawning logic
		this.potionSpawnTimer += delta;
		
		// Check for health-based spawning when player takes damage
		if (this.player && this.player.health < this.lastHealthCheck) {
			const healthPercent = this.player.health / this.player.maxHealth;
			const currentPotions = this.potions.length;
			const heartCount = this.potions.filter(p => p.type === 'heart').length;
			const shieldCount = this.potions.filter(p => p.type === 'shield').length;
			
			// Spawn heart when health is low (below 40%) and no hearts exist
			if (healthPercent < 0.4 && heartCount === 0 && currentPotions < 3) {
				console.log('Spawning heart - player health low:', Math.round(healthPercent * 100) + '%');
				this.spawnDynamicPotion('heart');
				this.potionSpawnTimer = 0;
			}
			
			// Spawn shield when health is very low (below 25%) and no shield exists
			if (healthPercent < 0.25 && shieldCount === 0 && !this.player.hasShield && currentPotions < 3) {
				console.log('Spawning shield - player health very low:', Math.round(healthPercent * 100) + '%');
				this.spawnDynamicPotion('shield');
				this.potionSpawnTimer = 0;
			}
			
			this.lastHealthCheck = this.player.health;
		}
		
		// Periodic spawning every 10 seconds if player needs help
		if (this.potionSpawnTimer > 10000) { // 10 second timer
			const healthPercent = this.player ? this.player.health / this.player.maxHealth : 1;
			const currentPotions = this.potions.length;
			const heartCount = this.potions.filter(p => p.type === 'heart').length;
			const shieldCount = this.potions.filter(p => p.type === 'shield').length;
			
			// Spawn if player health is low and few potions exist
			if (healthPercent < 0.5 && currentPotions < 2) {
				const spawnChance = 0.6; // 60% chance
				if (Math.random() < spawnChance) {
					let type = 'heart';
					// Prefer heart if health is very low, shield if moderately low
					if (healthPercent < 0.3) {
						type = 'heart';
					} else if (healthPercent < 0.5 && !this.player.hasShield) {
						type = 'shield';
					}
					
					// Don't spawn if we already have that type
					if ((type === 'heart' && heartCount === 0) || (type === 'shield' && shieldCount === 0)) {
						console.log('Periodic spawn - player needs help:', Math.round(healthPercent * 100) + '% health, spawning', type);
						this.spawnDynamicPotion(type);
					}
				}
			}
			this.potionSpawnTimer = 0;
		}
		
		// Emergency spawn if player is about to die
		if (this.potionSpawnTimer > 15000 && this.potions.length === 0) {
			const healthPercent = this.player ? this.player.health / this.player.maxHealth : 1;
			if (healthPercent < 0.2) { // When health is extremely low
				console.log('Emergency spawn - player about to die:', Math.round(healthPercent * 100) + '% health');
				this.spawnDynamicPotion('heart');
				this.potionSpawnTimer = 0;
			}
		}

		// Spawn new power-ups based on level and player needs
		if (this.potionSpawnTimer > 8000 && this.potions.length < 2) { // Every 8 seconds
			const currentLevel = this.gameState.level;
			const powerUpTypes = ['speed', 'bomb'];
			
			// Spawn power-ups more frequently on higher levels
			if (currentLevel >= 3 && Math.random() < 0.4) { // 40% chance on level 3+
				const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
				console.log(`Spawning power-up: ${randomType} on level ${currentLevel}`);
				this.spawnDynamicPotion(randomType);
				this.potionSpawnTimer = 0;
			}
		}

		// Handle level completion via door
		if (!this.gameState.gameOver && !this.player.isDead) {
			// Door exists from level start; open when all enemies are cleared
			if (this.door && this.enemies.length === 0 && this.door.canOpen()) {
				console.log(`Opening door - enemies cleared! Level ${this.gameState.level}, Enemies: ${this.enemies.length}`);
				this.door.open();
			}
			if (this.door) {
				this.door.update(delta);
				// Remove door collision blocker when open; restore if closed
				if (this.door.isOpen) {
					if (this.doorBlock) {
						this.platforms = this.platforms.filter(p => p !== this.doorBlock);
						this.doorBlock = null;
					}
				} else if (!this.door.isOpen && !this.doorBlock) {
					// Recreate blocker if needed (e.g., on restart)
					const b = { x: this.door.x - 2, y: this.door.y, width: 4, height: this.door.height, type: 'doorBlock' };
					this.doorBlock = b;
					this.platforms.push(b);
				}
				// Player enters door to advance
				if (this.door.isOpen && this.rectsOverlap(this.player, this.door.getBounds())) {
					console.log(`Player entered door! Advancing from level ${this.gameState.level}`);
					this.nextLevel();
				}
			}
		}
		} catch (error) {
			console.error('Error in update method:', error);
			// Continue game execution even if update fails
		}
	}

	render() {
		// Comprehensive error prevention wrapper for render
		try {
			// console.log('🎨 RENDER CALLED - Game loop is running!'); // Debug logging commented out
			// Continuous fix: Check if game over screen is incorrectly visible
			const gameOverScreen = document.getElementById('gameOver');
			if (gameOverScreen && gameOverScreen.style.display === 'block' && this.player && this.player.lives > 0) {
				console.log('RENDER FIX: Game over screen incorrectly visible during render! Hiding it...');
				this.gameState.gameOver = false;
				this.safeCall('hideGameOver');
			}
		
		// Enhanced pirate-themed background
		this.renderBackground();
		this.ctx.save();
		this.ctx.translate(-this.camera.x, -this.camera.y);

		// Optimize platform rendering - only render visible platforms
		this.platforms.forEach(p => {
			if (p.type !== 'wall' && p.type !== 'doorBlock') {
				// Skip rendering platforms outside camera view
				if (p.x + p.width < this.camera.x - 100 || p.x > this.camera.x + this.width + 100 ||
					p.y + p.height < this.camera.y - 100 || p.y > this.camera.y + this.height + 100) {
					return;
				}
				
				// Use different tile sets based on level
				const tileSprites = this.assets.objects['tiles'];
				const currentLevel = this.gameState.level;
				
				// Choose tile set based on level: blocks.png for level 1, block2.png for level 2, block3.png for level 3, block4.png for level 4, block5.png for level 5, block6.png for level 6+
				let tileSetName;
				if (currentLevel >= 6) {
					tileSetName = 'block6';
				} else if (currentLevel >= 5) {
					tileSetName = 'block5';
				} else if (currentLevel >= 4) {
					tileSetName = 'block4';
				} else if (currentLevel >= 3) {
					tileSetName = 'block3';
				} else if (currentLevel >= 2) {
					tileSetName = 'block2';
				} else {
					tileSetName = 'blocks';
				}
				
				// Debug logging for level 6
				if (currentLevel === 6) {
					console.log(`🎮 Level 6: Using tile set '${tileSetName}'`);
				}
				const tileSet = tileSprites[tileSetName];
				
				if (tileSet && tileSet[0]) {
					const tileImg = tileSet[0];
					
					// Simplified rendering without expensive shadows
					// Tile the platform with 64x64 tiles from the selected tile set
					const tileSize = 64;
					for (let x = 0; x < p.width; x += tileSize) {
						for (let y = 0; y < p.height; y += tileSize) {
							const drawWidth = Math.min(tileSize, p.width - x);
							const drawHeight = Math.min(tileSize, p.height - y);
							this.ctx.drawImage(tileImg, p.x + x, p.y + y, drawWidth, drawHeight);
						}
					}
					
					// Removed border drawing to make blocks seamless
					
				} else {
					// Simplified fallback without gradients or borders
					this.ctx.fillStyle = '#8B4513';
					this.ctx.fillRect(p.x, p.y, p.width, p.height);
				}
			}
		});

		// Optimize entity rendering - only render visible entities
		this.bombs.forEach(b => {
			if (b.x + b.width >= this.camera.x - 100 && b.x <= this.camera.x + this.width + 100 &&
				b.y + b.height >= this.camera.y - 100 && b.y <= this.camera.y + this.height + 100) {
				b.render(this.ctx);
			}
		});
		
		// Render potions
		this.potions.forEach(potion => {
			if (potion.x + potion.width >= this.camera.x - 100 && potion.x <= this.camera.x + this.width + 100 &&
				potion.y + potion.height >= this.camera.y - 100 && potion.y <= this.camera.y + this.height + 100) {
				potion.render(this.ctx);
			}
		});

		// Render magnetic particles
		// this.renderMagneticParticles(this.ctx); // Temporarily disabled for debugging
		
		// Render thrown bombs from Big Guy enemies
		if (this.thrownBombs) {
			this.thrownBombs.forEach(thrownBomb => {
				if (thrownBomb.x + thrownBomb.width >= this.camera.x - 100 && thrownBomb.x <= this.camera.x + this.width + 100 &&
					thrownBomb.y + thrownBomb.height >= this.camera.y - 100 && thrownBomb.y <= this.camera.y + this.height + 100) {
					// Simple bomb rendering for thrown bombs
					this.ctx.save();
					this.ctx.fillStyle = '#FFD700';
					this.ctx.strokeStyle = '#FF8C00';
					this.ctx.lineWidth = 2;
					this.ctx.beginPath();
					this.ctx.arc(thrownBomb.x + thrownBomb.width/2, thrownBomb.y + thrownBomb.height/2, thrownBomb.width/2, 0, Math.PI * 2);
					this.ctx.fill();
					this.ctx.stroke();
					this.ctx.restore();
				}
			});
		}
		
		if (this.door) this.door.render(this.ctx);
		
		// Optimize enemy rendering
		this.enemies.forEach(e => {
			if (e.x + e.width >= this.camera.x - 100 && e.x <= this.camera.x + this.width + 100 &&
				e.y + e.height >= this.camera.y - 100 && e.y <= this.camera.y + this.height + 100) {
				e.render(this.ctx);
			}
		});
		
		// Debug logging commented out for cleaner console
		/*
		console.log('🔍 ABOUT TO RENDER PLAYER - checking if we get here');
		
		console.log('🔍 PLAYER OBJECT CHECK:', {
			playerExists: !!this.player,
			playerType: this.player ? this.player.constructor.name : 'undefined',
			playerX: this.player ? this.player.x : 'N/A',
			playerY: this.player ? this.player.y : 'N/A'
		});
		*/
		
		if (this.player) {
			// Debug: Log player rendering
			if (!this._lastRenderDebug || Date.now() - this._lastRenderDebug > 1000) {
				console.log('🔍 PLAYER DEBUG:', {
					x: this.player.x,
					y: this.player.y,
					width: this.player.width,
					height: this.player.height,
					isDead: this.player.isDead,
					health: this.player.health,
					velY: this.player.velY,
					onGround: this.player.onGround,
					invulnerable: this.player.invulnerable
				});
				this._lastRenderDebug = Date.now();
			}
			// console.log('🎮 RENDERING PLAYER at:', this.player.x, this.player.y); // Debug logging commented out
			this.player.render(this.ctx);
		} else {
			console.error('❌ NO PLAYER OBJECT FOUND!');
		}
		this.ctx.restore();

		// UI (DOM overlay handled in index.html CSS)
		this.safeCall('updateUI');
		} catch (error) {
			console.error('Error in render method:', error);
			// Continue game execution even if render fails
		}
	}

	updateUI() {
		if (!this.player) return;
		
		// Update UI more frequently but still stable
		if (!this._lastUIUpdate || Date.now() - this._lastUIUpdate > 100) { // Update UI max 10 times per second
			try {
				// Cache values once and use them consistently
				const currentHealth = Math.max(0, Math.min(this.player.health, this.player.maxHealth));
				const currentMaxHealth = this.player.maxHealth;
				const currentBombs = Math.max(0, Math.min(this.player.bombsAvailable, this.player.maxBombs));
				const currentMaxBombs = this.player.maxBombs;
				const currentScore = Math.max(0, this.gameState.currentScore);
				const currentLevel = Math.max(1, this.gameState.level);
				const currentLives = Math.max(0, Math.min(this.player.lives, this.player.maxLives));
				const currentMaxLives = this.player.maxLives;
				
				// Update health bar and text
				const healthFill = document.getElementById('healthFill');
				const healthText = document.getElementById('healthText');
				if (healthFill && healthText) {
					const hpPct = currentMaxHealth > 0 ? currentHealth / currentMaxHealth : 0;
					healthFill.style.width = `${Math.max(0, Math.min(1, hpPct)) * 100}%`;
					healthText.textContent = `Health: ${currentHealth}/${currentMaxHealth}`;
				}
				
				// Update bomb icons and text
				const bombs = document.querySelectorAll('.bomb-icon');
				bombs.forEach((el, idx) => { 
					if (el) {
						el.classList.toggle('empty', idx >= currentBombs);
					}
				});
				
				const bombText = document.getElementById('bombText');
				if (bombText) {
					bombText.textContent = `x ${currentBombs}/${currentMaxBombs}`;
				}
				
				// Update score, level, and lives
				const scoreText = document.getElementById('scoreText');
				const totalScoreText = document.getElementById('totalScoreText');
				const levelText = document.getElementById('levelText');
				const livesText = document.getElementById('livesText');
				
				if (scoreText) {
					scoreText.textContent = currentScore;
				}
				
				if (totalScoreText) {
					totalScoreText.textContent = this.gameState.totalScore || 0;
				}
				
				if (levelText) {
					levelText.textContent = `Level: ${currentLevel}`;
				}
				
				if (livesText) {
					livesText.textContent = `Lives: ${currentLives}/${currentMaxLives}`;
				}
				
				// Update Web3 player info if wallet is connected
				if (window.walletConnection) {
					window.walletConnection.updatePlayerInfo();
				}
				
				// Direct token display update
				const playerTokenBalance = document.getElementById('playerTokenBalance');
				if (playerTokenBalance && window.playerProfile) {
					const currentTokens = Math.floor(this.gameState.totalScore * 0.10);
					playerTokenBalance.textContent = currentTokens;
					console.log(`💰 Token display updated: ${currentTokens} (from score: ${this.gameState.totalScore})`);
				}
				
				this._lastUIUpdate = Date.now();
			} catch (error) {
				console.warn('UI update error:', error);
			}
		}
		
		// Show/hide pause screen
		const pauseScreen = document.getElementById('pauseScreen');
		if (pauseScreen) {
			pauseScreen.style.display = this.gameState.paused ? 'block' : 'none';
		}
	}
	
	showGameOver() {
		// Safety check: Don't show game over if player has lives
		if (this.player && this.player.lives > 0) {
			console.log('SAFETY CHECK: Attempting to show game over but player has lives! Cancelling...');
			this.gameState.gameOver = false;
			return;
		}
		
		const gameOverScreen = document.getElementById('gameOver');
		const finalScore = document.getElementById('finalScore');
		if (gameOverScreen && finalScore) {
			finalScore.textContent = `Final Score: ${this.gameState.currentScore} | Total Score: ${this.gameState.totalScore}`;
			gameOverScreen.style.display = 'block';
		}
		
					// Save final player profile when game over
			if (window.playerRegistry && window.playerProfile) {
				window.playerProfile.totalScore = this.gameState.totalScore;
				const newTokens = Math.floor(this.gameState.totalScore * 0.10);
				window.playerProfile.boomTokens = newTokens;
				
				// Save to database via PlayerDataManager
				if (window.playerDataManager) {
					const walletAddress = this.getPlayerWalletAddress();
					if (walletAddress) {
						const playerProfile = {
							walletAddress: walletAddress,
							username: window.playerProfile.username || `Kaboom_${walletAddress.slice(0, 6)}`,
							level: this.gameState.level,
							totalScore: this.gameState.totalScore,
							boomTokens: newTokens,
							lives: this.player.lives,
							currentScore: this.gameState.currentScore
						};
						
						window.playerDataManager.savePlayerProfile(playerProfile).then(result => {
							if (result.success) {
								console.log('✅ Player data saved to database on game over');
							} else {
								console.warn('⚠️ Failed to save to database:', result.error);
							}
						});
					} else {
						console.log('⏳ Wallet not connected, saving to localStorage only');
					}
				}
			
			window.playerRegistry.savePlayerProfile(window.playerProfile).then((success) => {
				if (success) {
					console.log(`💾 Final profile saved on game over! Total Score: ${this.gameState.totalScore}, Tokens: ${newTokens}`);
					// Update token display
					const playerTokenBalance = document.getElementById('playerTokenBalance');
					if (playerTokenBalance) {
						playerTokenBalance.textContent = newTokens;
					}
				} else {
					console.error('❌ Failed to save final player profile');
				}
			}).catch(error => {
				console.error('❌ Error saving final player profile:', error);
			});
		}
		
		// Game over - but don't pause the game automatically
		console.log('Game Over - game continues running');
		// Removed auto-pause: this.gameState.paused = true;
	}
	
	hideGameOver() {
		const gameOverScreen = document.getElementById('gameOver');
		if (gameOverScreen) {
			gameOverScreen.style.display = 'none';
		}
	}

	togglePause() { this.gameState.paused = !this.gameState.paused; }

	gameLoop(t = 0) {
		try {
			// Calculate delta time with better precision
			const delta = t - this.lastTime;
			this.lastTime = t;
			
			// Only update if not paused and delta is reasonable
			if (!this.gameState.paused && delta > 0 && delta < 100) {
				// Use a more stable delta for consistent timing
				const stableDelta = Math.min(delta, 33); // Cap at ~30fps minimum
				this.safeCall('update', stableDelta);
			}
			
			// Always render (even when paused/game over) to show final state
			this.safeCall('render');
			
			// Continue game loop even when game over (for rendering)
			requestAnimationFrame((n) => this.gameLoop(n));
		} catch (error) {
			console.error('Error in game loop:', error);
			// Continue the game loop even if there's an error
			requestAnimationFrame((n) => this.gameLoop(n));
		}
	}
	
	// Reset game to level 1 - public method for debugging/testing
	resetToLevelOne() {
		console.log('🔄 Resetting game to level 1...');
		this.gameState.level = 1;
		this.gameState.currentScore = 0;
		this.gameState.totalScore = 0; // Also reset total score
		this.gameState.lives = 3;
		this.gameState.gameOver = false;
		this.gameState.paused = false;
		
		// Clear existing enemies, bombs, and potions
		this.enemies = [];
		this.bombs = [];
		this.potions = [];
		this.thrownBombs = [];
		
		// Reset player position and state
		if (this.player) {
			this.player.x = 100;
			this.player.y = 100;
			this.player.velX = 0;
			this.player.velY = 0;
			this.player.onGround = false;
			this.player.health = 100;
			this.player.isDead = false;
			this.player.setAnim('1-Idle');
		}
		
		// Regenerate level
		this.generateLevel();
		this.computeWorldBounds();
		this.spawnEnemies();
		this.spawnPotions();
		
		// Update UI
		if (this.updateUI) {
			this.updateUI();
		}
		
		// Clear localStorage saved progress
		if (window.walletConnection && window.walletConnection.publicKey) {
			const progressKey = `playerProgress_${window.walletConnection.publicKey.toString()}`;
			localStorage.removeItem(progressKey);
			console.log('🗑️ Cleared saved progress from localStorage');
		}
		
		console.log('✅ Game reset to level 1 complete');
	}
	
	// Save current progress - public method for debugging/testing
	async saveCurrentProgress() {
		console.log('💾 Saving current progress...');
		
		// Save directly to localStorage first
		if (window.walletConnection && window.walletConnection.publicKey) {
			const progress = {
				level: this.gameState.level,
				score: this.gameState.totalScore,
				lives: this.gameState.lives,
				timestamp: Date.now()
			};
			
			const progressKey = `playerProgress_${window.walletConnection.publicKey.toString()}`;
			localStorage.setItem(progressKey, JSON.stringify(progress));
			console.log('💾 Saved to localStorage:', progress);
		}
		
		// Also try to save via wallet connection
		if (window.walletConnection && window.walletConnection.savePlayerProgress) {
			await window.walletConnection.savePlayerProgress();
			console.log('✅ Progress saved via wallet connection');
		} else {
			console.warn('⚠️ Wallet connection not available for saving');
		}
	}
	
	// Check saved progress - public method for debugging/testing
	checkSavedProgress() {
		console.log('🔍 Checking saved progress...');
		if (window.walletConnection && window.walletConnection.publicKey) {
			const progressKey = `playerProgress_${window.walletConnection.publicKey.toString()}`;
			const savedProgress = localStorage.getItem(progressKey);
			
			if (savedProgress) {
				const progress = JSON.parse(savedProgress);
				console.log('📊 Saved progress found:', progress);
				return progress;
			} else {
				console.log('📊 No saved progress found');
				return null;
			}
		} else {
			console.log('📊 Wallet not connected');
			return null;
		}
	}

	async nextLevel() {
		// Award points for completing level
		const completedLevel = this.gameState.level;
		const levelCompletionPoints = 200; // 200 points for completing a level
		this.gameState.currentScore += levelCompletionPoints;
		this.gameState.totalScore += levelCompletionPoints;
		console.log(`🎮 Level ${completedLevel} completed - +${levelCompletionPoints} points! Current score: ${this.gameState.currentScore}, Total score: ${this.gameState.totalScore}`);
		
		// IMMEDIATELY save to localStorage first
		if (window.walletConnection && window.walletConnection.publicKey) {
			const progress = {
				level: this.gameState.level + 1, // Next level
				score: this.gameState.totalScore, // Total accumulated score
				lives: this.gameState.lives,
				timestamp: Date.now()
			};
			
			const progressKey = `playerProgress_${window.walletConnection.publicKey.toString()}`;
			localStorage.setItem(progressKey, JSON.stringify(progress));
			console.log('💾 IMMEDIATELY saved to localStorage:', progress);
		}
		
		// Update blockchain with new level and score
		if (window.playerProfileManager) {
			try {
				const newLevel = this.gameState.level + 1;
				const updateResult = await window.playerProfileManager.updatePlayerLevel(
					newLevel, 
					this.gameState.totalScore
				);
				
				if (updateResult.success) {
					console.log('✅ Progress saved to blockchain:', updateResult.signature);
					
					// Update local profile with blockchain data
					if (window.playerProfile) {
						window.playerProfile.level = newLevel;
						window.playerProfile.totalScore = this.gameState.totalScore;
					}
					
					// Update UI to reflect new values
					if (window.walletConnection && window.walletConnection.updatePlayerInfo) {
						window.walletConnection.updatePlayerInfo();
					}
					this.updateUI();
					
					// Force update token display immediately
					const playerTokenBalance = document.getElementById('playerTokenBalance');
					if (playerTokenBalance) {
						const currentTokens = Math.floor(this.gameState.totalScore * 0.10);
						playerTokenBalance.textContent = currentTokens;
						console.log(`💰 Level completed - Token display updated: ${currentTokens} (from score: ${this.gameState.totalScore})`);
					}
				} else {
					console.warn('⚠️ Failed to save progress to blockchain:', updateResult.error);
				}
			} catch (error) {
				console.error('❌ Error saving to blockchain:', error);
			}
		}
		
		// Fallback to old system if blockchain fails
		if (window.playerRegistry && window.playerProfile) {
			window.playerProfile.totalScore = this.gameState.totalScore;
			// Calculate new tokens (10% of total score)
			const newTokens = Math.floor(this.gameState.totalScore * 0.10);
			window.playerProfile.boomTokens = newTokens;
			
			// Save profile and wait for completion
			window.playerRegistry.savePlayerProfile(window.playerProfile).then((success) => {
				if (success) {
					console.log(`💰 Profile saved successfully! Updated tokens: ${newTokens} (10% of ${this.gameState.totalScore})`);
					// Update UI to reflect new values
					if (window.walletConnection && window.walletConnection.updatePlayerInfo) {
						window.walletConnection.updatePlayerInfo();
					}
					this.updateUI();
					
					// Force update token display immediately
					const playerTokenBalance = document.getElementById('playerTokenBalance');
					if (playerTokenBalance) {
						playerTokenBalance.textContent = newTokens;
					}
				} else {
					console.error('❌ Failed to save player profile');
				}
			}).catch(error => {
				console.error('❌ Error saving player profile:', error);
			});
		}
		
		// Claim Web3 reward for completing the previous level
		if (window.rewardSystem) {
			window.rewardSystem.claimLevelReward(completedLevel);
		}
		
		// Add level completion achievement (commented out - function not available)
		/*
		if (window.playerRegistry) {
			window.playerRegistry.addAchievement(
				`level_${completedLevel}_complete`,
				`Level ${completedLevel} Master`,
				50
			).then(() => {
										// Refresh UI display
						if (window.playerProfile) {
							console.log('✅ Player profile updated successfully');
						}
			}).catch(error => {
				console.error(`❌ Achievement error: ${error.message}`);
			});
		}
		*/
		
		// Ensure level increment is stable
		const oldLevel = this.gameState.level;
		const newLevel = this.gameState.level + 1;
		this.gameState.level = Math.max(1, newLevel); // Ensure level is never less than 1
		console.log(`🎮 LEVEL PROGRESSION: ${oldLevel} → ${this.gameState.level}`);
		console.log(`ADVANCING TO LEVEL ${this.gameState.level}!`);
		console.log(`Background should change to: ${this.gameState.level >= 6 ? 'Volcanic Lair' : 'Level ' + this.gameState.level} theme`);
		console.log(`Background will change to: ${this.gameState.level >= 6 ? 'Volcanic' : 'Level-specific'}`);
		
		// Debug: Log player state before level transition
		console.log('Player state before level transition:', {
			lives: this.player.lives,
			health: this.player.health,
			isDead: this.player.isDead,
			currentScore: this.gameState.currentScore,
			totalScore: this.gameState.totalScore
		});
		
		// Change background music for new level
		console.log('DEBUG: Checking music change...');
		console.log('this.soundManager exists:', !!this.soundManager);
		console.log('global soundManager exists:', !!window.soundManager);
		console.log('changeMusicForLevel method exists:', !!(this.soundManager && this.soundManager.changeMusicForLevel));
		
		// Restart background music for new level
		console.log(`🎵 Restarting music for level ${this.gameState.level}...`);
		const bgMusic = document.getElementById('backgroundMusic');
		if (bgMusic) {
			bgMusic.currentTime = 0; // Restart from beginning
			bgMusic.play().then(() => {
				console.log('✓ Music restarted for new level!');
			}).catch(error => {
				console.log('Could not restart music:', error);
			});
		}
		
		// Rebuild level and enemies
		this.generateLevel();
		this.computeWorldBounds();
		this.spawnEnemies();
		this.spawnPotions();
		
		// Reset player position and give bombs - spawn from top for level transition
		this.player.x = 100;
		this.player.y = -64; // Start above screen
		this.player.velY = 2; // Gentle fall speed
		this.player.onGround = false; // Start in air
		this.player.setAnim('5-Fall'); // Fall animation
		this.player.bombsAvailable = this.player.maxBombs;
		this.player.isRefillingBombs = false;
		this.player.bombRefillTimer = 0;
		this.player.isDead = false; // Ensure player is not marked as dead
		this.player.deathTimer = 0; // Reset death timer
		this.player.isHit = false; // Reset hit state
		this.player.hitTimer = 0; // Reset hit timer
		this.player.velX = 0; // Reset velocity
		this.player.velY = 0; // Reset velocity
		this.player.onGround = true; // Force ground state for safe spawning
		
		this.bombs = [];
		// Door is now created in generateLevel(), so we don't need to set it to null
		this.levelTransitionTimer = 0;
		
		// Debug: Log player state after level transition
		console.log('Player state after level transition:', {
			lives: this.player.lives,
			health: this.player.health,
			isDead: this.player.isDead,
			currentScore: this.gameState.currentScore,
			totalScore: this.gameState.totalScore
		});
		
		console.log(`Level ${this.gameState.level} setup complete!`);
	}

	rectsOverlap(a, b) {
		return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
	}

	circleHitsRect(cx, cy, r, rect) {
		const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
		const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
		const dx = cx - closestX; const dy = cy - closestY; return (dx * dx + dy * dy) <= r * r;
	}
	
	renderBackground() {
		// Level-based background themes
		const level = this.gameState.level;
		
		// Level 1: Use bgblocks.png background image
		if (level === 1 && this.assets.backgrounds && this.assets.backgrounds['bgblocks']) {
			// Draw the background image, tiling it to cover the entire screen
			const bgImg = this.assets.backgrounds['bgblocks'];
			const imgWidth = bgImg.width;
			const imgHeight = bgImg.height;
			
			// Tile the background image to cover the entire canvas
			for (let x = 0; x < this.width; x += imgWidth) {
				for (let y = 0; y < this.height; y += imgHeight) {
					this.ctx.drawImage(bgImg, x, y);
				}
			}
			return; // Exit early for level 1
		}
		
		// Level 2: Use bgblock2.png background image
		if (level === 2 && this.assets.backgrounds && this.assets.backgrounds['bgblock2']) {
			// Draw the background image, tiling it to cover the entire screen
			const bgImg = this.assets.backgrounds['bgblock2'];
			const imgWidth = bgImg.width;
			const imgHeight = bgImg.height;
			
			// Tile the background image to cover the entire canvas
			for (let x = 0; x < this.width; x += imgWidth) {
				for (let y = 0; y < this.height; y += imgHeight) {
					this.ctx.drawImage(bgImg, x, y);
				}
			}
			return; // Exit early for level 2
		}
		
		// Level 3: Use bgblock3.png background image
		if (level === 3 && this.assets.backgrounds && this.assets.backgrounds['bgblock3']) {
			// Draw the background image, tiling it to cover the entire screen
			const bgImg = this.assets.backgrounds['bgblock3'];
			const imgWidth = bgImg.width;
			const imgHeight = bgImg.height;
			
			// Tile the background image to cover the entire canvas
			for (let x = 0; x < this.width; x += imgWidth) {
				for (let y = 0; y < this.height; y += imgHeight) {
					this.ctx.drawImage(bgImg, x, y);
				}
			}
			return; // Exit early for level 3
		}
		
		// Level 4: Use bgblock4.png background image
		if (level === 4 && this.assets.backgrounds && this.assets.backgrounds['bgblock4']) {
			// Draw the background image, tiling it to cover the entire screen
			const bgImg = this.assets.backgrounds['bgblock4'];
			const imgWidth = bgImg.width;
			const imgHeight = bgImg.height;
			
			// Tile the background image to cover the entire canvas
			for (let x = 0; x < this.width; x += imgWidth) {
				for (let y = 0; y < this.height; y += imgHeight) {
					this.ctx.drawImage(bgImg, x, y);
				}
			}
			return; // Exit early for level 4
		}
		
		// Level 5: Use bgblock5.png background image
		if (level === 5 && this.assets.backgrounds && this.assets.backgrounds['bgblock5']) {
			// Draw the background image, tiling it to cover the entire screen
			const bgImg = this.assets.backgrounds['bgblock5'];
			const imgWidth = bgImg.width;
			const imgHeight = bgImg.height;
			
			// Tile the background image to cover the entire canvas
			for (let x = 0; x < this.width; x += imgWidth) {
				for (let y = 0; y < this.height; y += imgHeight) {
					this.ctx.drawImage(bgImg, x, y);
				}
			}
			return; // Exit early for level 5
		}
		
		// Level 6: Use bgblock6.png background image
		if (level === 6 && this.assets.backgrounds && this.assets.backgrounds['bgblock6']) {
			// Draw the background image, tiling it to cover the entire screen
			const bgImg = this.assets.backgrounds['bgblock6'];
			const imgWidth = bgImg.width;
			const imgHeight = bgImg.height;
			
			console.log(`🎨 Level 6: Using bgblock6.png background (${imgWidth}x${imgHeight})`);
			
			// Tile the background image to cover the entire canvas
			for (let x = 0; x < this.width; x += imgWidth) {
				for (let y = 0; y < this.height; y += imgHeight) {
					this.ctx.drawImage(bgImg, x, y);
				}
			}
			return; // Exit early for level 6
		}
		
		// For other levels, use the original gradient backgrounds
		const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
		
		// Time-based sky color variation for dynamic feel
		const time = Date.now() * 0.001;
		const skyVariation = Math.sin(time * 0.5) * 0.1;
		
		// Different background themes based on level
		switch(level) {
			case 1:
				// Level 1: Morning pirate bay (fallback if image fails to load)
				gradient.addColorStop(0, `hsl(${45 + skyVariation * 15}, 80%, ${75 + skyVariation * 10}%)`); // Golden morning sky
				gradient.addColorStop(0.6, `hsl(${35 + skyVariation * 10}, 70%, ${55 + skyVariation * 8}%)`); // Warm orange
				gradient.addColorStop(0.8, `hsl(${25 + skyVariation * 8}, 60%, ${40 + skyVariation * 5}%)`); // Sandy horizon
				gradient.addColorStop(1, `hsl(${20 + skyVariation * 5}, 50%, 30%)`); // Beach sand
				break;
				
			case 2:
				// Level 2: Afternoon tropical
				gradient.addColorStop(0, `hsl(${210 + skyVariation * 20}, 75%, ${70 + skyVariation * 10}%)`); // Bright blue sky
				gradient.addColorStop(0.6, `hsl(${200 + skyVariation * 15}, 65%, ${50 + skyVariation * 8}%)`); // Ocean blue
				gradient.addColorStop(0.8, `hsl(${180 + skyVariation * 10}, 55%, ${35 + skyVariation * 5}%)`); // Deep sea
				gradient.addColorStop(1, `hsl(${160 + skyVariation * 5}, 45%, 25%)`); // Dark ocean
				break;
				
			case 3:
				// Level 3: Sunset pirate cove
				gradient.addColorStop(0, `hsl(${15 + skyVariation * 20}, 85%, ${65 + skyVariation * 10}%)`); // Sunset orange
				gradient.addColorStop(0.6, `hsl(${25 + skyVariation * 15}, 75%, ${45 + skyVariation * 8}%)`); // Deep orange
				gradient.addColorStop(0.8, `hsl(${35 + skyVariation * 10}, 65%, ${30 + skyVariation * 5}%)`); // Dark orange
				gradient.addColorStop(1, `hsl(${45 + skyVariation * 5}, 55%, 20%)`); // Dark brown
				break;
				
			case 4:
				// Level 4: Night pirate fortress
				gradient.addColorStop(0, `hsl(${250 + skyVariation * 15}, 60%, ${25 + skyVariation * 10}%)`); // Dark blue night
				gradient.addColorStop(0.6, `hsl(${240 + skyVariation * 10}, 50%, ${15 + skyVariation * 8}%)`); // Midnight blue
				gradient.addColorStop(0.8, `hsl(${230 + skyVariation * 8}, 40%, ${10 + skyVariation * 5}%)`); // Deep night
				gradient.addColorStop(1, `hsl(${220 + skyVariation * 5}, 30%, 5%)`); // Almost black
				break;
				
			case 5:
				// Level 5: Stormy seas
				gradient.addColorStop(0, `hsl(${200 + skyVariation * 25}, 80%, ${35 + skyVariation * 10}%)`); // Stormy gray-blue
				gradient.addColorStop(0.6, `hsl(${220 + skyVariation * 20}, 70%, ${25 + skyVariation * 8}%)`); // Dark storm
				gradient.addColorStop(0.8, `hsl(${240 + skyVariation * 15}, 60%, ${15 + skyVariation * 5}%)`); // Thunder clouds
				gradient.addColorStop(1, `hsl(${260 + skyVariation * 10}, 50%, 8%)`); // Dark storm
				break;
				
			default:
				// Level 6+: Volcanic pirate lair
				const volcanicLevel = Math.min(level - 5, 5); // Cap at level 10
				const redIntensity = 10 + volcanicLevel * 5;
				gradient.addColorStop(0, `hsl(${redIntensity + skyVariation * 20}, 85%, ${20 + skyVariation * 10}%)`); // Dark red sky
				gradient.addColorStop(0.6, `hsl(${redIntensity + 10 + skyVariation * 15}, 75%, ${15 + skyVariation * 8}%)`); // Deep red
				gradient.addColorStop(0.8, `hsl(${redIntensity + 20 + skyVariation * 10}, 65%, ${10 + skyVariation * 5}%)`); // Darker red
				gradient.addColorStop(1, `hsl(${redIntensity + 30 + skyVariation * 5}, 55%, 5%)`); // Almost black red
				break;
		}
		
		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0, 0, this.width, this.height);
		
		// Add level-specific atmospheric elements
		this.renderLevelSpecificElements(level);
	}
	
	renderLevelSpecificElements(level) {
		switch(level) {
			case 1:
				// Level 1: Morning pirate bay - peaceful clouds and islands
				this.renderClouds('rgba(255, 255, 255, 0.7)', 0.0005);
				this.renderDistantIslands('rgba(139, 69, 19, 0.3)', 'rgba(34, 139, 34, 0.4)');
				this.renderOceanWaves('rgba(255, 255, 255, 0.4)', 0.003);
				this.renderSeagulls();
				break;
				
			case 2:
				// Level 2: Afternoon tropical - bright clouds and palm trees
				this.renderClouds('rgba(255, 255, 255, 0.8)', 0.0003);
				this.renderDistantIslands('rgba(34, 139, 34, 0.5)', 'rgba(0, 100, 0, 0.6)');
				this.renderOceanWaves('rgba(255, 255, 255, 0.5)', 0.002);
				this.renderPalmTrees();
				break;
				
			case 3:
				// Level 3: Sunset pirate cove - orange clouds and dramatic lighting
				this.renderClouds('rgba(255, 165, 0, 0.6)', 0.0004);
				this.renderDistantIslands('rgba(139, 69, 19, 0.4)', 'rgba(160, 82, 45, 0.5)');
				this.renderOceanWaves('rgba(255, 140, 0, 0.4)', 0.0025);
				this.renderSunsetEffects();
				break;
				
			case 4:
				// Level 4: Night pirate fortress - stars and moon
				this.renderStars();
				this.renderMoon();
				this.renderDistantIslands('rgba(0, 0, 0, 0.4)', 'rgba(25, 25, 112, 0.5)');
				this.renderOceanWaves('rgba(255, 255, 255, 0.2)', 0.001);
				break;
				
			case 5:
				// Level 5: Stormy seas - dark clouds and lightning
				this.renderStormClouds();
				this.renderLightning();
				this.renderDistantIslands('rgba(0, 0, 0, 0.5)', 'rgba(47, 79, 79, 0.6)');
				this.renderOceanWaves('rgba(255, 255, 255, 0.3)', 0.004);
				break;
				
			default:
				// Level 6+: Volcanic pirate lair - ash clouds and lava effects
				this.renderAshClouds();
				this.renderLavaEffects();
				this.renderDistantIslands('rgba(139, 0, 0, 0.5)', 'rgba(128, 0, 0, 0.6)');
				this.renderOceanWaves('rgba(255, 69, 0, 0.4)', 0.0035);
				break;
		}
	}
	
	renderClouds(color = 'rgba(255, 255, 255, 0.6)', speed = 0.0005) {
		// Simple animated clouds
		const time = Date.now() * speed;
		this.ctx.fillStyle = color;
		
		// Cloud 1
		const cloud1X = (time * 20) % (this.width + 200) - 100;
		this.drawCloud(cloud1X, 80, 80, 40);
		
		// Cloud 2
		const cloud2X = (time * 15 + 300) % (this.width + 200) - 100;
		this.drawCloud(cloud2X, 120, 100, 50);
		
		// Cloud 3
		const cloud3X = (time * 25 + 600) % (this.width + 200) - 100;
		this.drawCloud(cloud3X, 60, 70, 35);
	}
	
	drawCloud(x, y, width, height) {
		this.ctx.save();
		this.ctx.globalAlpha = 0.7;
		this.ctx.beginPath();
		
		// Draw cloud as overlapping circles
		const circles = 5;
		for (let i = 0; i < circles; i++) {
			const circleX = x + (i / circles) * width;
			const circleY = y + Math.sin(i * 1.5) * (height * 0.2);
			const radius = height * (0.3 + Math.sin(i * 2) * 0.2);
			
			this.ctx.beginPath();
			this.ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
			this.ctx.fill();
		}
		
		this.ctx.restore();
	}
	
	renderDistantIslands(islandColor = 'rgba(0, 0, 0, 0.2)', treeColor = 'rgba(0, 0, 0, 0.3)') {
		// Distant island silhouettes
		this.ctx.fillStyle = islandColor;
		
		// Island 1
		this.ctx.beginPath();
		this.ctx.moveTo(100, this.height * 0.7);
		this.ctx.lineTo(150, this.height * 0.65);
		this.ctx.lineTo(200, this.height * 0.68);
		this.ctx.lineTo(250, this.height * 0.7);
		this.ctx.lineTo(250, this.height);
		this.ctx.lineTo(100, this.height);
		this.ctx.closePath();
		this.ctx.fill();
		
		// Island 2
		this.ctx.beginPath();
		this.ctx.moveTo(this.width - 300, this.height * 0.72);
		this.ctx.lineTo(this.width - 250, this.height * 0.67);
		this.ctx.lineTo(this.width - 200, this.height * 0.69);
		this.ctx.lineTo(this.width - 150, this.height * 0.72);
		this.ctx.lineTo(this.width - 150, this.height);
		this.ctx.lineTo(this.width - 300, this.height);
		this.ctx.closePath();
		this.ctx.fill();
		
		// Add trees on islands
		this.ctx.fillStyle = treeColor;
		this.drawTree(175, this.height * 0.65, 15);
		this.drawTree(225, this.height * 0.67, 12);
		this.drawTree(this.width - 200, this.height * 0.67, 18);
		this.drawTree(this.width - 180, this.height * 0.69, 14);
	}
	
	renderOceanWaves(waveColor = 'rgba(255, 255, 255, 0.3)', speed = 0.003) {
		// Animated ocean waves at the bottom
		const time = Date.now() * speed;
		this.ctx.strokeStyle = waveColor;
		this.ctx.lineWidth = 2;
		
		// Wave 1
		this.ctx.beginPath();
		for (let x = 0; x <= this.width; x += 10) {
			const y = this.height * 0.85 + Math.sin((x * 0.02) + time) * 8;
			if (x === 0) this.ctx.moveTo(x, y);
			else this.ctx.lineTo(x, y);
		}
		this.ctx.stroke();
		
		// Wave 2
		this.ctx.beginPath();
		this.ctx.strokeStyle = waveColor.replace('0.3', '0.2');
		for (let x = 0; x <= this.width; x += 10) {
			const y = this.height * 0.9 + Math.sin((x * 0.015) + time + 1) * 6;
			if (x === 0) this.ctx.moveTo(x, y);
			else this.ctx.lineTo(x, y);
		}
		this.ctx.stroke();
		
		// Add some sparkles on water
		this.ctx.fillStyle = waveColor.replace('0.3', '0.8');
		for (let i = 0; i < 10; i++) {
			const sparkleX = (time * 50 + i * 100) % this.width;
			const sparkleY = this.height * 0.85 + Math.sin(time + i) * 20;
			const sparkleSize = 1 + Math.sin(time * 3 + i) * 1;
			
			this.ctx.beginPath();
			this.ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
			this.ctx.fill();
		}
	}
	
	// New level-specific background elements
	drawTree(x, y, size) {
		// Simple tree silhouette
		this.ctx.beginPath();
		this.ctx.arc(x, y, size, 0, Math.PI * 2);
		this.ctx.fill();
	}
	
	renderSeagulls() {
		const time = Date.now() * 0.001;
		this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
		
		for (let i = 0; i < 3; i++) {
			const x = (time * 30 + i * 200) % (this.width + 100) - 50;
			const y = 100 + Math.sin(time * 2 + i) * 20;
			this.drawSeagull(x, y);
		}
	}
	
	drawSeagull(x, y) {
		this.ctx.save();
		this.ctx.translate(x, y);
		this.ctx.scale(0.5, 0.5);
		
		// Simple seagull shape
		this.ctx.beginPath();
		this.ctx.moveTo(-10, 0);
		this.ctx.lineTo(-5, -5);
		this.ctx.lineTo(0, 0);
		this.ctx.lineTo(5, -5);
		this.ctx.lineTo(10, 0);
		this.ctx.stroke();
		this.ctx.restore();
	}
	
	renderPalmTrees() {
		this.ctx.fillStyle = 'rgba(34, 139, 34, 0.6)';
		this.drawPalmTree(150, this.height * 0.6, 25);
		this.drawPalmTree(this.width - 100, this.height * 0.65, 30);
	}
	
	drawPalmTree(x, y, size) {
		// Palm tree trunk
		this.ctx.fillStyle = 'rgba(139, 69, 19, 0.8)';
		this.ctx.fillRect(x - 3, y, 6, size);
		
		// Palm leaves
		this.ctx.fillStyle = 'rgba(34, 139, 34, 0.6)';
		for (let i = 0; i < 5; i++) {
			const angle = (i / 5) * Math.PI * 2;
			const leafX = x + Math.cos(angle) * size * 0.3;
			const leafY = y + Math.sin(angle) * size * 0.3;
			this.ctx.beginPath();
			this.ctx.arc(leafX, leafY, size * 0.2, 0, Math.PI * 2);
			this.ctx.fill();
		}
	}
	
	renderSunsetEffects() {
		const time = Date.now() * 0.0005;
		this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
		
		// Sun rays
		for (let i = 0; i < 8; i++) {
			const angle = (i / 8) * Math.PI * 2 + time;
			const x = this.width * 0.8 + Math.cos(angle) * 100;
			const y = 100 + Math.sin(angle) * 100;
			
			this.ctx.beginPath();
			this.ctx.moveTo(this.width * 0.8, 100);
			this.ctx.lineTo(x, y);
			this.ctx.lineWidth = 3;
			this.ctx.stroke();
		}
	}
	
	renderStars() {
		const time = Date.now() * 0.0002;
		this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
		
		for (let i = 0; i < 50; i++) {
			const x = (i * 37) % this.width;
			const y = (i * 73) % (this.height * 0.6);
			const twinkle = Math.sin(time + i) * 0.3 + 0.7;
			
			this.ctx.globalAlpha = twinkle;
			this.ctx.beginPath();
			this.ctx.arc(x, y, 1, 0, Math.PI * 2);
			this.ctx.fill();
		}
		this.ctx.globalAlpha = 1;
	}
	
	renderMoon() {
		this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
		this.ctx.beginPath();
		this.ctx.arc(this.width * 0.8, 120, 30, 0, Math.PI * 2);
		this.ctx.fill();
		
		// Moon craters
		this.ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
		this.ctx.beginPath();
		this.ctx.arc(this.width * 0.8 - 10, 120 - 10, 5, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.beginPath();
		this.ctx.arc(this.width * 0.8 + 15, 120 + 5, 8, 0, Math.PI * 2);
		this.ctx.fill();
	}
	
	renderStormClouds() {
		const time = Date.now() * 0.0003;
		this.ctx.fillStyle = 'rgba(47, 79, 79, 0.8)';
		
		for (let i = 0; i < 5; i++) {
			const x = (time * 15 + i * 150) % (this.width + 200) - 100;
			const y = 80 + Math.sin(time + i) * 20;
			this.drawStormCloud(x, y, 60 + i * 10);
		}
	}
	
	drawStormCloud(x, y, size) {
		this.ctx.beginPath();
		this.ctx.arc(x, y, size, 0, Math.PI * 2);
		this.ctx.arc(x + size * 0.5, y, size * 0.8, 0, Math.PI * 2);
		this.ctx.arc(x - size * 0.5, y, size * 0.8, 0, Math.PI * 2);
		this.ctx.fill();
	}
	
	renderLightning() {
		const time = Date.now() * 0.001;
		if (Math.random() > 0.95) {
			this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
			this.ctx.lineWidth = 3;
			
			this.ctx.beginPath();
			this.ctx.moveTo(Math.random() * this.width, 0);
			this.ctx.lineTo(Math.random() * this.width, this.height * 0.7);
			this.ctx.stroke();
			
			// Flash effect
			setTimeout(() => {
				this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
				this.ctx.fillRect(0, 0, this.width, this.height);
			}, 50);
		}
	}
	
	renderAshClouds() {
		const time = Date.now() * 0.0004;
		this.ctx.fillStyle = 'rgba(128, 128, 128, 0.7)';
		
		for (let i = 0; i < 4; i++) {
			const x = (time * 20 + i * 200) % (this.width + 200) - 100;
			const y = 60 + Math.sin(time * 2 + i) * 15;
			this.drawAshCloud(x, y, 50 + i * 15);
		}
	}
	
	drawAshCloud(x, y, size) {
		this.ctx.beginPath();
		this.ctx.arc(x, y, size, 0, Math.PI * 2);
		this.ctx.arc(x + size * 0.6, y, size * 0.7, 0, Math.PI * 2);
		this.ctx.arc(x - size * 0.6, y, size * 0.7, 0, Math.PI * 2);
		this.ctx.fill();
	}
	
	renderLavaEffects() {
		const time = Date.now() * 0.002;
		this.ctx.fillStyle = 'rgba(255, 69, 0, 0.6)';
		
		// Lava bubbles
		for (let i = 0; i < 8; i++) {
			const x = (time * 40 + i * 80) % this.width;
			const y = this.height * 0.9 + Math.sin(time * 3 + i) * 10;
			const size = 3 + Math.sin(time + i) * 2;
			
			this.ctx.beginPath();
			this.ctx.arc(x, y, size, 0, Math.PI * 2);
			this.ctx.fill();
		}
	}
}

// ---------------------------
// Entities
// ---------------------------
class Potion {
	constructor(x, y, type) {
		this.x = x;
		this.y = y;
		this.width = 32;
		this.height = 32;
		this.type = type; // 'heart', 'shield', 'speed', 'bomb'
		this.collected = false;
		this.bobTimer = 0;
		this.bobSpeed = 0.003;
		this.bobAmount = 5;
		this.originalY = y;
	}

	update(delta) {
		// Gentle bobbing animation
		this.bobTimer += delta * this.bobSpeed;
		this.y = this.originalY + Math.sin(this.bobTimer) * this.bobAmount;
	}

	render(ctx) {
		if (this.collected) return;

		ctx.save();
		
		// Simple potion rendering
		const time = Date.now() * 0.003;
		const glowRadius = 30 + 8 * Math.sin(time * 3);
		
		// Simple glow effect
		const glow = ctx.createRadialGradient(
			this.x + this.width/2, this.y + this.height/2, 0,
			this.x + this.width/2, this.y + this.height/2, glowRadius
		);
		
		if (this.type === 'heart') {
			glow.addColorStop(0, 'rgba(255, 30, 30, 0.5)');
			glow.addColorStop(1, 'rgba(255, 30, 30, 0)');
		} else if (this.type === 'shield') {
			glow.addColorStop(0, 'rgba(30, 120, 255, 0.5)');
			glow.addColorStop(1, 'rgba(30, 120, 255, 0)');
		} else if (this.type === 'speed') {
			glow.addColorStop(0, 'rgba(0, 255, 0, 0.5)');
			glow.addColorStop(1, 'rgba(0, 255, 0, 0)');
		} else if (this.type === 'bomb') {
			glow.addColorStop(0, 'rgba(255, 100, 0, 0.5)');
			glow.addColorStop(1, 'rgba(255, 100, 0, 0)');
		}
		
		// Draw glow
		ctx.fillStyle = glow;
		ctx.fillRect(this.x - glowRadius, this.y - glowRadius, this.width + glowRadius*2, this.height + glowRadius*2);
		
		// Draw simple bottle
		ctx.fillStyle = this.type === 'heart' ? '#ff4444' : 
						this.type === 'shield' ? '#3366cc' : 
						this.type === 'speed' ? '#00cc00' : '#ff6600';
		ctx.fillRect(this.x, this.y, this.width, this.height);
		
		// Draw symbol
		const symbolX = this.x + this.width/2;
		const symbolY = this.y + this.height/2;
		
		ctx.fillStyle = 'white';
		ctx.font = 'bold 20px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		
		if (this.type === 'heart') {
			ctx.fillText('❤️', symbolX, symbolY);
		} else if (this.type === 'shield') {
			ctx.fillText('🛡️', symbolX, symbolY);
		} else if (this.type === 'speed') {
			ctx.fillText('⚡', symbolX, symbolY);
		} else if (this.type === 'bomb') {
			ctx.fillText('💣', symbolX, symbolY);
		}
		
		ctx.restore();
	}

	checkCollision(player) {
		if (this.collected) return false;
		
		// Make potion collection more forgiving - allow passing through
		const potionCenterX = this.x + this.width / 2;
		const potionCenterY = this.y + this.height / 2;
		const playerCenterX = player.x + player.width / 2;
		const playerCenterY = player.y + player.height / 2;
		
		// Check if player center is within potion bounds (more generous collision)
		const distanceX = Math.abs(playerCenterX - potionCenterX);
		const distanceY = Math.abs(playerCenterY - potionCenterY);
		
		// Allow collection if player is close enough to the potion
		return distanceX < this.width * 0.8 && distanceY < this.height * 0.8;
	}
}

// ---------------------------
class Player {
	constructor(x, y, sprites) {
		this.x = x; this.y = y; this.width = 64; this.height = 64;
		this.velX = 0; this.velY = 0; this.speed = 5; this.jumpPower = -15; this.gravity = 0.8;
		this.onGround = false; this.facingRight = true;
		this.health = 100; this.maxHealth = 100; this.bombsAvailable = 3; this.maxBombs = 3; this.bombCooldown = 0;
		this.isRefillingBombs = false; this.bombRefillTimer = 0; // ms remaining until auto-refill
		this.isRunning = false; this.isJumping = false; this.isFalling = false; this.isHit = false; this.hitTimer = 0; this.invulnerable = false; this.invulTimer = 0;
		this.isDead = false; this.deathTimer = 0; this.deathAnimationDuration = 2000; // 2 seconds death animation
		this.lives = 3; this.maxLives = 3; // Lives system
		this.hasShield = false; this.shieldCharges = 0; this.shieldTimer = 0; // Shield power-up system (3 charges within 5 seconds)
		this.anim = { name: '1-Idle', t: 0, speed: 0.08, frame: 0 };
		this.sprites = sprites || {};
		
		// Initialize animation properly after sprites are set
		this.initializeAnimation();
	}
	
	initializeAnimation() {
		// Ensure animation has valid frame index
		const frames = this.sprites[this.anim.name] || [];
		if (frames.length > 0) {
			this.anim.frame = 0; // Start with first frame
		} else {
			// Try to find any available animation
			const availableAnims = Object.keys(this.sprites);
			if (availableAnims.length > 0) {
				const firstAnim = availableAnims[0];
				this.anim.name = firstAnim;
				this.anim.frame = 0;
			}
		}
	}

	update(delta, keys, platforms) {
		// Handle death state - only when truly dead (no lives left)
		if (this.isDead && this.lives <= 0) {
			this.deathTimer += delta;
			// Death animation sequence: Hit -> Dead Ground
			if (this.deathTimer < 500) {
				this.setAnim('7-Hit');
			} else {
				this.setAnim('9-Dead Ground');
			}
			this.stepAnim(delta);
			return; // Stop all other updates when dead
		}
		
		if (this.isHit) { this.hitTimer -= delta; if (this.hitTimer <= 0) { this.isHit = false; this.invulnerable = true; this.invulTimer = 1000; } }
		if (this.invulnerable) { this.invulTimer -= delta; if (this.invulTimer <= 0) this.invulnerable = false; }
		
		// Update shield timer and charges
		if (this.hasShield) {
			this.shieldTimer -= delta;
			
			// Shield expires after 5 seconds or when charges are depleted
			if (this.shieldTimer <= 0 || this.shieldCharges <= 0) {
				this.hasShield = false;
				this.shieldCharges = 0;
				this.shieldTimer = 0;
				console.log('Shield expired or depleted!');
			}
		}

		// Update power-up timers
		if (this.speedBoost) {
			this.speedBoostTimer -= delta;
			if (this.speedBoostTimer <= 0) {
				this.speedBoost = false;
				this.speed = this.originalSpeed || 5;
				console.log('Speed boost expired!');
			}
		}

		if (this.bombUpgrade) {
			this.bombUpgradeTimer -= delta;
			if (this.bombUpgradeTimer <= 0) {
				this.bombUpgrade = false;
				this.bombRadius = this.originalBombRadius || 1;
				console.log('Bomb upgrade expired!');
			}
		}

		// Debug: Log key states every few seconds (commented out for cleaner console)
		/*
		if (!this._lastKeyDebug || Date.now() - this._lastKeyDebug > 2000) {
			console.log('🔑 KEY DEBUG:', {
				ArrowLeft: keys['ArrowLeft'],
				ArrowRight: keys['ArrowRight'],
				KeyA: keys['KeyA'],
				KeyD: keys['KeyD'],
				Space: keys['Space'],
				KeyB: keys['KeyB']
			});
			this._lastKeyDebug = Date.now();
		}
		*/
		
		// input with smooth movement
		let targetVelX = 0;
		if (keys['ArrowLeft'] || keys['KeyA']) { 
			targetVelX = -this.speed; 
			this.facingRight = false; 
			this.isRunning = true; 
		}
		else if (keys['ArrowRight'] || keys['KeyD']) { 
			targetVelX = this.speed; 
			this.facingRight = true; 
			this.isRunning = true; 
		}
		else { 
			this.isRunning = false; 
		}
		
		// Smooth acceleration and deceleration
		const acceleration = 0.2;
		const deceleration = 0.15;
		
		if (targetVelX !== 0) {
			// Accelerate towards target velocity
			if (this.velX < targetVelX) {
				this.velX = Math.min(this.velX + acceleration, targetVelX);
			} else if (this.velX > targetVelX) {
				this.velX = Math.max(this.velX - acceleration, targetVelX);
			}
		} else {
			// Decelerate to stop
			if (this.velX > 0) {
				this.velX = Math.max(0, this.velX - deceleration);
			} else if (this.velX < 0) {
				this.velX = Math.min(0, this.velX + deceleration);
			}
		}

		// physics
		this.velY += this.gravity; 
		
		// Update position with boundary checks
		const newX = this.x + this.velX;
		const newY = this.y + this.velY;
		
		// Debug: Log position changes when moving (commented out for cleaner console)
		/*
		if (this.velX !== 0 && (!this._lastPosDebug || Date.now() - this._lastPosDebug > 1000)) {
			console.log('🎯 POSITION DEBUG:', {
				oldX: this.x,
				newX: newX,
				velX: this.velX,
				oldY: this.y,
				newY: newY,
				velY: this.velY
			});
			this._lastPosDebug = Date.now();
		}
		*/
		
		// Screen boundary checks (fixed single-screen room)
		const rightBound = (this.worldWidth || this.width) - this.width;
		if (newX >= 0 && newX <= rightBound) {
			this.x = newX;
		}
		this.y = newY;
		
		this.isJumping = this.velY < 0; this.isFalling = this.velY > 0;

		// Enhanced collision detection with better ground detection
		this.onGround = false;
		platforms.forEach(p => {
			if (p.type !== 'wall' && p.type !== 'doorBlock') {
				// Check collision
			if (this.x < p.x + p.width && this.x + this.width > p.x && this.y < p.y + p.height && this.y + this.height > p.y) {
					// Landing on top of platform
					if (this.velY >= 0 && this.y < p.y) {
						this.y = p.y - this.height;
						this.velY = 0;
						this.onGround = true;
					}
				}
				
				// Additional check: if player is very close to platform surface, snap to it
				if (this.x < p.x + p.width && this.x + this.width > p.x) {
					const distanceToPlatform = Math.abs((this.y + this.height) - p.y);
					if (distanceToPlatform <= 5 && this.velY >= 0) {
						this.y = p.y - this.height;
						this.velY = 0;
						this.onGround = true;
					}
				}
			}
		});
		
		// Handle wall collisions
		platforms.forEach(p => {
			if (this.x < p.x + p.width && this.x + this.width > p.x && this.y < p.y + p.height && this.y + this.height > p.y) {
				if (this.velX > 0 && this.x < p.x) { this.x = p.x - this.width; }
				else if (this.velX < 0 && this.x > p.x) { this.x = p.x + p.width; }
			}
		});
		
		// Safety check: prevent falling out of the world (only if not invulnerable)
		if (this.y > 800) { // If player falls below screen (ground is at 736, allow small buffer)
			console.log('Player fell out of world! Respawning...');
			this.respawn();
		}

		// cooldown
		if (this.bombCooldown > 0) this.bombCooldown -= delta;
		// auto-refill bombs after 2 seconds when depleted
		if (this.bombsAvailable === 0) {
			if (!this.isRefillingBombs) {
				this.isRefillingBombs = true;
				this.bombRefillTimer = 2000; // ms
			}
		} else if (this.isRefillingBombs) {
			// cancel refill if we somehow regained bombs
			this.isRefillingBombs = false;
			this.bombRefillTimer = 0;
		}
		if (this.isRefillingBombs) {
			this.bombRefillTimer -= delta;
			if (this.bombRefillTimer <= 0) {
				this.bombsAvailable = this.maxBombs;
				this.isRefillingBombs = false;
				this.bombRefillTimer = 0;
			}
		}

		// animation state with smooth transitions
		let next = '1-Idle';
		if (this.isDead) {
			// Death animation handled above
		} else if (this.isHit) next = '7-Hit';
		else if (!this.onGround) next = this.isJumping ? '4-Jump' : '5-Fall';
		else if (this.isRunning) next = '2-Run';
		
		// Smooth animation transition
		if (next !== this.anim.name) {
			const oldAnim = this.anim.name;
			this.setAnim(next);
			
			// Smooth transition effects
			if (oldAnim === '2-Run' && next === '1-Idle') {
				this.anim.t = 0.2; // Start idle from a natural frame
			} else if (oldAnim === '1-Idle' && next === '2-Run') {
				this.anim.t = 0.1; // Start run from beginning
			}
		}
		
		this.stepAnim(delta);
	}

	setAnim(name) { if (name !== this.anim.name) { this.anim = { name, t: 0, speed: 0.08, frame: 0 }; } }
	stepAnim(delta) {
		const frames = this.sprites[this.anim.name] || [];
		if (frames.length === 0) return;
		
		// Smooth animation with frame interpolation
		this.anim.t += delta * this.anim.speed;
		const frameIndex = Math.floor(this.anim.t) % frames.length;
		
		// Ensure frame index is always valid and within bounds
		this.anim.frame = Math.max(0, Math.min(frameIndex, frames.length - 1));
		

	}

	jump() { 
		if (this.onGround && !this.isHit) { 
			this.velY = this.jumpPower; 
			this.onGround = false; 
			this.jumpsAvailable = 1;
			if (game.soundManager) game.soundManager.play('jump');
		}
	}
	collectPotion(potion) {
		if (potion.collected) return;
		
		potion.collected = true;
		
		if (potion.type === 'heart') {
			// Restore health
			this.health = Math.min(this.maxHealth, this.health + 50);
			if (game.soundManager) game.soundManager.play('heal');
		} else if (potion.type === 'shield') {
			// Activate shield with 3 charges within 5 seconds
			this.hasShield = true;
			this.shieldCharges = 3; // 3 charges to resist enemy attacks
			this.shieldTimer = 5000; // 5 seconds duration
			console.log('Shield activated! Charges: 3, Duration: 5 seconds');
			if (game.soundManager) game.soundManager.play('shield');
		} else if (potion.type === 'speed') {
			// Speed boost for 5 seconds
			this.speedBoost = true;
			this.speedBoostTimer = 5000; // 5 seconds
			this.originalSpeed = this.speed;
			this.speed = this.speed * 1.5; // 50% speed increase
			console.log('Speed boost activated! Speed increased by 50% for 5 seconds');
			if (game.soundManager) game.soundManager.play('powerup');
		} else if (potion.type === 'bomb') {
			// Bomb upgrade for 5 seconds
			this.bombUpgrade = true;
			this.bombUpgradeTimer = 5000; // 5 seconds
			this.originalBombRadius = this.bombRadius || 1;
			this.bombRadius = 2; // Double explosion radius
			console.log('Bomb upgrade activated! Explosion radius doubled for 5 seconds');
			if (game.soundManager) game.soundManager.play('powerup');
		}
	}

	placeBomb(game) {
		if (this.bombsAvailable > 0 && this.bombCooldown <= 0 && !this.isHit) {
			this.bombsAvailable -= 1; 
			this.bombCooldown = 500; 
			
			// Find the ground/platform below the player
			let bombY = this.y + this.height; // Start at player's feet
			const bombX = this.x + (this.width / 2) - 32; // Center the bomb
			
			// Check if there's a platform below to place the bomb on
			for (const platform of game.platforms) {
				if (platform.type === 'ground' || platform.type === 'platform') {
					if (bombX >= platform.x && bombX <= platform.x + platform.width) {
						if (this.y + this.height <= platform.y && bombY >= platform.y) {
							bombY = platform.y - 64; // Place bomb on top of platform
							break;
						}
					}
				}
			}
			
			// Create new bomb and add to game
			const newBomb = new Bomb(bombX, bombY, game.assets.objects['1-BOMB']);
			game.bombs.push(newBomb);
			
			// Debug: Log bomb placement
			console.log(`Bomb placed at (${bombX}, ${bombY}) - Fuse: ${newBomb.fuseTimer}ms`);
			
			if (game.soundManager) game.soundManager.play('bomb');
			return true; 
		}
		return false;
	}
	takeDamage(dmg) { 
		if (!this.invulnerable && !this.isDead) { 
			// Check if player has shield charges and time remaining
			if (this.hasShield && this.shieldCharges > 0 && this.shieldTimer > 0) {
				this.shieldCharges--;
				console.log(`Shield absorbed damage! Charges remaining: ${this.shieldCharges}, Time left: ${Math.ceil(this.shieldTimer/1000)}s`);
				
				// If no more charges or time, deactivate shield
				if (this.shieldCharges <= 0 || this.shieldTimer <= 0) {
					this.hasShield = false;
					this.shieldCharges = 0;
					this.shieldTimer = 0;
					console.log('Shield depleted or expired!');
				}
				
				if (game.soundManager) game.soundManager.play('shieldBreak');
				return; // Shield absorbs the damage
			}
			
			const newHealth = Math.max(0, this.health - dmg);
			console.log(`Player took ${dmg} damage. Health: ${this.health} -> ${newHealth}`);
			this.health = newHealth; 
			this.isHit = true; 
			this.hitTimer = 500; 
			if (this.health <= 0) {
			console.log(`=== HEALTH REACHED 0! ===`);
			console.log(`Lives: ${this.lives}, isDead: ${this.isDead}`);
				this.health = 0;
				// Always call die() to decrease lives counter
			console.log(`Calling die() function...`);
				this.die();
			}
			if (game.soundManager) game.soundManager.play('hit');
		} 
	}
	
	die() {
		console.log(`=== DIE() FUNCTION CALLED ===`);
		console.log(`Current state: isDead=${this.isDead}, lives=${this.lives}`);
		
		// Prevent multiple death calls in the same frame
		if (this.isDead) {
			console.log('Player already dead, ignoring additional die() call');
			return;
		}
		
		const previousLives = this.lives;
		this.lives--;
		console.log(`Player died! Lives: ${previousLives} -> ${this.lives}`);
		
		if (this.lives <= 0) {
			// Game over - no more lives
			console.log('=== GAME OVER - NO LIVES LEFT ===');
			this.isDead = true;
			this.deathTimer = 0;
			this.velX = 0;
			this.velY = -8; // Small death jump
			if (game.soundManager) game.soundManager.play('gameOver');
		} else {
			// Respawn immediately with remaining lives
			console.log(`=== RESPAWNING - ${this.lives} LIVES LEFT ===`);
			this.respawn();
		}
	}
	
	respawn() {
		// Reset player state for respawn - WITH SPAWN FROM TOP ANIMATION
		console.log(`=== RESPAWN CALLED! Current lives: ${this.lives} ===`);
		console.log(`Before respawn: health=${this.health}, isDead=${this.isDead}, position=(${this.x}, ${this.y})`);
		
		// Force reset ALL states immediately
		this.health = this.maxHealth;
		this.bombsAvailable = this.maxBombs;
		this.isDead = false;
		this.deathTimer = 0;
		this.isHit = false;
		this.hitTimer = 0;
		this.invulnerable = true; // Make invulnerable during spawn animation
		this.invulTimer = 2000; // 2 seconds invulnerability
		this.velX = 0;
		this.velY = 0;
		this.onGround = false; // Start in air for spawn animation
		
		// Spawn from top of screen (classic platformer style)
		this.x = 100;
		this.y = -64; // Start above screen
		this.velY = 2; // Gentle fall speed
		
		// Set fall animation
		this.setAnim('5-Fall');
		
		console.log(`After respawn: health=${this.health}, isDead=${this.isDead}, position=(${this.x}, ${this.y})`);
		console.log(`=== RESPAWN COMPLETE! ===`);
		
		if (game.soundManager) game.soundManager.play('respawn');
	}

	render(ctx) {
		const frames = this.sprites[this.anim.name] || [];
		
		// Debug: Quick check for jump/death animations (commented out for cleaner console)
		/*
		if (this.anim.name === '4-Jump') {
			const currentSprite = frames[this.anim.frame];
			console.log(`DEBUG 4-Jump DETAILED:`, {
				hasSprites: Object.keys(this.sprites),
				framesLength: frames.length,
				currentFrame: this.anim.frame,
				spriteExists: !!currentSprite,
				spriteType: currentSprite ? currentSprite.constructor.name : 'undefined',
				spriteSrc: currentSprite ? currentSprite.src : 'no src',
				spriteComplete: currentSprite ? currentSprite.complete : 'no complete',
				spriteWidth: currentSprite ? currentSprite.width : 'no width',
				spriteHeight: currentSprite ? currentSprite.height : 'no height',
				// Check if this is a fallback sprite
				isCanvas: currentSprite ? currentSprite.tagName === 'CANVAS' : false,
				hasSrc: currentSprite ? !!currentSprite.src : false,
				srcLength: currentSprite ? currentSprite.src.length : 0,
				// Force expand all properties
				allProps: currentSprite ? Object.getOwnPropertyNames(currentSprite) : []
			});
		}
		*/

		
		if (frames.length === 0) { 
			console.warn(`No frames for animation: ${this.anim.name}. Available sprites:`, Object.keys(this.sprites));
			// Draw a visible player fallback
			ctx.fillStyle = '#ff0000'; // Red for player
			ctx.fillRect(this.x, this.y, this.width, this.height);
			// Add player label
			ctx.fillStyle = '#ffffff';
			ctx.font = '12px Arial';
			ctx.fillText('PLAYER', this.x, this.y - 5);
			return; 
		}
		
		const img = frames[this.anim.frame];
		
		// Debug: Check if img is valid
		if (!img) {
			console.warn(`Missing sprite frame for ${this.anim.name} frame ${this.anim.frame}/${frames.length-1}`);
			// Draw a visible player fallback
			ctx.fillStyle = '#ff0000'; // Red for player
			ctx.fillRect(this.x, this.y, this.width, this.height);
			// Add player label
			ctx.fillStyle = '#ffffff';
			ctx.font = '12px Arial';
			ctx.fillText('PLAYER', this.x, this.y - 5);
			return;
		}
		
		// Check if image is loaded properly
		if (!img.complete || img.naturalWidth === 0) {
			console.warn(`Image not loaded properly for ${this.anim.name} frame ${this.anim.frame}:`, {
				complete: img.complete,
				naturalWidth: img.naturalWidth,
				naturalHeight: img.naturalHeight,
				src: img.src
			});
			// Draw a visible player fallback
			ctx.fillStyle = '#ff0000'; // Red for player
			ctx.fillRect(this.x, this.y, this.width, this.height);
			// Add player label
			ctx.fillStyle = '#ffffff';
			ctx.font = '12px Arial';
			ctx.fillText('PLAYER', this.x, this.y - 5);
			return;
		}
		
		ctx.save();
		try {
			// Ensure proper pixel art rendering
			ctx.imageSmoothingEnabled = false;
			
			if (!this.facingRight) { 
				ctx.translate(this.x + this.width, this.y); 
				ctx.scale(-1, 1); 
				ctx.drawImage(img, 0, 0, this.width, this.height); 
			} else { 
				ctx.drawImage(img, this.x, this.y, this.width, this.height); 
			}
		} catch (error) {
			console.error(`Error drawing image for ${this.anim.name} frame ${this.anim.frame}:`, error);
			// Draw a visible player fallback
			ctx.fillStyle = '#ff0000'; // Red for player
			ctx.fillRect(this.x, this.y, this.width, this.height);
			// Add player label
			ctx.fillStyle = '#ffffff';
			ctx.font = '12px Arial';
			ctx.fillText('PLAYER', this.x, this.y - 5);
		}
		ctx.restore();
		
		// Draw shield effect if active
		if (this.hasShield && this.shieldCharges > 0 && this.shieldTimer > 0) {
			ctx.save();
			
			// Enhanced shield effect with pulsing
			const time = Date.now() * 0.005;
			const pulseIntensity = 0.3 + 0.4 * Math.sin(time * 3);
			const shieldRadius = this.width/2 + 15 + 5 * Math.sin(time * 2);
			
			// Multi-layered shield effect
			// Outer glow
			ctx.globalAlpha = 0.4 * pulseIntensity;
			ctx.strokeStyle = '#0066ff';
			ctx.lineWidth = 6;
			ctx.beginPath();
			ctx.arc(this.x + this.width/2, this.y + this.height/2, shieldRadius + 8, 0, Math.PI * 2);
			ctx.stroke();
			
			// Main shield ring
			ctx.globalAlpha = 0.8 * pulseIntensity;
			ctx.strokeStyle = '#4488ff';
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.arc(this.x + this.width/2, this.y + this.height/2, shieldRadius, 0, Math.PI * 2);
			ctx.stroke();
			
			// Inner shield ring
			ctx.globalAlpha = 0.9 * pulseIntensity;
			ctx.strokeStyle = '#88aaff';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(this.x + this.width/2, this.y + this.height/2, shieldRadius - 4, 0, Math.PI * 2);
			ctx.stroke();
			
			// Shield charges indicator (progress ring)
			const shieldProgress = this.shieldCharges / 3; // 3 charges max
			ctx.globalAlpha = 1.0;
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.arc(this.x + this.width/2, this.y + this.height/2, shieldRadius + 12, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * shieldProgress));
			ctx.stroke();
			
			// Time remaining indicator (inner ring)
			const timeProgress = this.shieldTimer / 5000; // 5 seconds max
			ctx.strokeStyle = '#ffaa00';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(this.x + this.width/2, this.y + this.height/2, shieldRadius + 6, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * timeProgress));
			ctx.stroke();
			
			// Shield particles
			const particleCount = 6;
			for (let i = 0; i < particleCount; i++) {
				const particleAngle = (i / particleCount) * Math.PI * 2 + time * 2;
				const particleRadius = shieldRadius + 20;
				const particleX = this.x + this.width/2 + Math.cos(particleAngle) * particleRadius;
				const particleY = this.y + this.height/2 + Math.sin(particleAngle) * particleRadius;
				const particleSize = 2 + Math.sin(time * 4 + i) * 1;
				
				ctx.fillStyle = `rgba(100, 150, 255, ${0.6 + 0.4 * Math.sin(time * 3 + i)})`;
				ctx.fillRect(particleX - particleSize/2, particleY - particleSize/2, particleSize, particleSize);
			}
			
			// Shield text indicator
			const timeLeft = Math.ceil(this.shieldTimer / 1000);
			ctx.fillStyle = '#4488ff';
			ctx.font = 'bold 12px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(`SHIELD: ${this.shieldCharges}/3 (${timeLeft}s)`, this.x + this.width/2, this.y - 20);
			
			ctx.restore();
		}
	}
}

class Enemy {
	constructor(x, y, type, sprites, level = 1) {
		this.x = x; this.y = y; this.width = 64; this.height = 64; this.velX = 0; this.velY = 0; this.onGround = false; this.facingRight = true;
		this.type = type; 
		this.level = level; // Store current game level for scaling
		
		// Type-specific properties with level scaling
		const typeProps = this.getTypeProperties();
		this.speed = typeProps.speed * this.getLevelSpeedMultiplier();
		this.jumpPower = typeProps.jumpPower * this.getLevelJumpMultiplier();
		this.gravity = typeProps.gravity;
		this.health = Math.floor(typeProps.health * this.getLevelHealthMultiplier());
		this.maxHealth = this.health;
		this.damage = Math.floor(typeProps.damage * this.getLevelDamageMultiplier());
		this.attackRange = typeProps.attackRange;
		this.detectionRange = Math.floor(typeProps.detectionRange * this.getLevelDetectionMultiplier());
		this.attackCooldown = 0;
		this.attackCooldownTime = Math.max(200, typeProps.attackCooldownTime - (this.level - 1) * 100); // Faster attacks per level
		this.jumpCooldown = 0; // Add jump cooldown
		this.spriteFacesRight = typeProps.spriteFacesRight; // base orientation of art frames
		
		this.state = 'idle'; 
		this.patrolDirection = 1; 
		this.patrolDistance = typeProps.patrolDistance; 
		this.startX = x; 
		this.chaseTimer = 0; 
		this.idleTimer = 1500 + Math.random() * 1500;
		this.anim = { name: '1-Idle', t: 0, speed: typeProps.animSpeed, frame: 0 };
		this.sprites = sprites || {};
		
		// Initialize animation properly after sprites are set
		this.initializeAnimation();
		
		this.isHit = false; this.hitTimer = 0; this.isDead = false; this.deathTimer = 0;
		this.hitWall = false; // set true when we collide horizontally
	}
	
	initializeAnimation() {
		// Ensure animation has valid frame index
		const frames = this.sprites[this.anim.name] || [];
		if (frames.length > 0) {
			this.anim.frame = 0; // Start with first frame
		} else {
			// Try to find any available animation
			const availableAnims = Object.keys(this.sprites);
			if (availableAnims.length > 0) {
				const firstAnim = availableAnims[0];
				this.anim.name = firstAnim;
				this.anim.frame = 0;
			}
		}
	}

	getTypeProperties() {
		const types = {
			'Bald Pirate': {
				health: 50, damage: 20, speed: 2.5, jumpPower: -18, gravity: 0.7,
				attackRange: 70, detectionRange: 380, attackCooldownTime: 800,
				patrolDistance: 120, animSpeed: 0.08, spriteFacesRight: true
			},
			'Cucumber': {
				health: 30, damage: 15, speed: 1.8, jumpPower: -20, gravity: 0.6,
				attackRange: 60, detectionRange: 340, attackCooldownTime: 600,
				patrolDistance: 80, animSpeed: 0.10, spriteFacesRight: true
			},
			'Big Guy': {
				health: 100, damage: 30, speed: 1.5, jumpPower: -14, gravity: 1.0,
				attackRange: 90, detectionRange: 200, attackCooldownTime: 1200,
				patrolDistance: 150, animSpeed: 0.06, spriteFacesRight: false
			},
			'Captain': {
				health: 75, damage: 25, speed: 2, jumpPower: -15, gravity: 0.8,
				attackRange: 75, detectionRange: 320, attackCooldownTime: 700,
				patrolDistance: 100, animSpeed: 0.09, spriteFacesRight: true
			},
			'Whale': {
				health: 150, damage: 40, speed: 1, jumpPower: -12, gravity: 1.2,
				attackRange: 100, detectionRange: 260, attackCooldownTime: 1500,
				patrolDistance: 200, animSpeed: 0.05, spriteFacesRight: false
			}
		};
		return types[this.type] || types['Bald Pirate'];
	}
	
	getHealthByType() { return this.getTypeProperties().health; }
	getDamageByType() { return this.getTypeProperties().damage; }
	
	// Level-based difficulty scaling methods
	getLevelSpeedMultiplier() {
		// Speed increases by 15% per level, capped at 3x
		return Math.min(1 + (this.level - 1) * 0.15, 3.0);
	}
	
	getLevelJumpMultiplier() {
		// Jump power increases by 10% per level, capped at 2x
		return Math.min(1 + (this.level - 1) * 0.10, 2.0);
	}
	
	getLevelHealthMultiplier() {
		// Health increases by 25% per level, capped at 4x
		return Math.min(1 + (this.level - 1) * 0.25, 4.0);
	}
	
	getLevelDamageMultiplier() {
		// Damage increases by 20% per level, capped at 3x
		return Math.min(1 + (this.level - 1) * 0.20, 3.0);
	}
	
	getLevelDetectionMultiplier() {
		// Detection range increases by 30% per level, capped at 2.5x
		return Math.min(1 + (this.level - 1) * 0.30, 2.5);
	}

	updateSpecialSkills(delta, player, platforms) {
		// Initialize special skill properties if not set
		if (this.skillCooldown === undefined) this.skillCooldown = 0;
		if (this.hasBomb === undefined) this.hasBomb = false;
		if (this.skillTimer === undefined) this.skillTimer = 0;
		
		this.skillCooldown -= delta;
		
		// Only use skills when not dead, hit, or already using a skill
		if (this.isDead || this.isHit || this.state === 'special' || this.skillCooldown > 0) {
			return;
		}

		const distToPlayer = Math.abs(this.x - player.x);
		
		switch(this.type) {
			case 'Cucumber':
				// Blow the wick - can blow out nearby bomb fuses (DISABLED FOR TESTING)
				// if (distToPlayer < 100 && this.skillCooldown <= 0) {
				// 	// Find nearby bombs and blow their fuses
				// 	if (window.game && window.game.bombs) {
				// 		window.game.bombs.forEach(bomb => {
				// 			const bombDist = Math.abs(this.x - bomb.x);
				// 			if (bombDist < 80 && !bomb.exploded && bomb.fuseTimer > 0) {
				// 				// Blow out the fuse - make it explode immediately
				// 				bomb.fuseTimer = 0;
				// 				bomb.explode();
				// 				this.state = 'special';
				// 				this.skillTimer = 1000; // 1 second skill animation
				// 				this.skillCooldown = 3000; // 3 second cooldown
				// 			}
				// 		});
				// 	}
				// }
				break;
				
			case 'Big Guy':
				// Pick and throw bombs (DISABLED FOR TESTING)
				// if (distToPlayer < 120 && this.skillCooldown <= 0) {
				// 	if (!this.hasBomb) {
				// 		// Try to pick up a nearby bomb
				// 		if (window.game && window.game.bombs) {
				// 			const nearbyBomb = window.game.bombs.find(bomb => {
				// 				const bombDist = Math.abs(this.x - bomb.x);
				// 				return bombDist < 60 && !bomb.exploded && bomb.fuseTimer > 0;
				// 			});
				// 			
				// 			if (nearbyBomb) {
				// 				this.hasBomb = true;
				// 				this.state = 'special';
				// 				this.skillTimer = 800; // Pick animation
				// 				this.skillCooldown = 2000;
				// 				// Mark the bomb as picked up instead of removing it
				// 				nearbyBomb.pickedUp = true;
				// 				nearbyBomb.exploded = true; // Prevent it from exploding
				// 			}
				// 		}
				// 	} else {
				// 		// Throw the bomb at the player
				// 		this.hasBomb = false;
				// 		this.state = 'special';
				// 		this.skillTimer = 1200; // Throw animation
				// 		this.skillCooldown = 4000;
				// 		
				// 		// Create a thrown bomb projectile
				// 		if (window.game) {
				// 			const thrownBomb = {
				// 			x: this.x + (this.facingRight ? 50 : -50),
				// 			y: this.y - 20,
				// 			velX: this.facingRight ? 8 : -8,
				// 			velY: -5,
				// 			width: 32,
				// 			height: 32,
				// 			fuseTimer: 2000,
				// 			exploded: false,
				// 			update: function(delta) {
				// 			this.x += this.velX;
				// 			this.y += this.velY;
				// 			this.velY += 0.5; // gravity
				// 			this.fuseTimer -= delta;
				// 			
				// 			if (this.fuseTimer <= 0) {
				// 				this.exploded = true;
				// 			}
				// 			
				// 			// Check collision with player
				// 			if (window.game && window.game.player) {
				// 				const player = window.game.player;
				// 				if (this.x < player.x + player.width && 
				// 					this.x + this.width > player.x &&
				// 					this.y < player.y + player.height && 
				// 					this.y + this.height > player.y) {
				// 					player.takeDamage(30);
				// 					this.exploded = true;
				// 				}
				// 			}
				// 		}
				// 	};
				// 	if (!window.game.thrownBombs) window.game.thrownBombs = [];
				// 	window.game.thrownBombs.push(thrownBomb);
				// }
				// }
				break;
				
			case 'Captain':
				// Scare run - special scare run animation when player is very close
				if (distToPlayer < 60 && this.skillCooldown <= 0) {
					this.state = 'special';
					this.skillTimer = 1500; // Scare run animation
					this.skillCooldown = 5000; // 5 second cooldown
					
					// Move away from player in scare run
					this.velX = (this.x < player.x) ? -8 : 8;
					this.velY = -6; // Jump while running away
				}
				break;
				
			case 'Whale':
				// Swallow bombs (DISABLED FOR TESTING)
				// if (distToPlayer < 150 && this.skillCooldown <= 0) {
				// 	// Find nearby bombs to swallow
				// 	if (window.game && window.game.bombs) {
				// 		const nearbyBomb = window.game.bombs.find(bomb => {
				// 			const bombDist = Math.abs(this.x - bomb.x);
				// 			return bombDist < 100 && !bomb.exploded && bomb.fuseTimer > 0;
				// 		});
				// 		
				// 		if (nearbyBomb) {
				// 			this.state = 'special';
				// 			this.skillTimer = 1200; // Swallow animation
				// 			this.skillCooldown = 6000; // 6 second cooldown
				// 			
				// 			// Mark the bomb as swallowed instead of removing it
				// 			nearbyBomb.swallowed = true;
				// 			nearbyBomb.exploded = true; // Prevent it from exploding
				// 			this.health = Math.min(this.health + 20, this.getHealthByType()); // Heal 20 HP
				// 		}
				// 	}
				// }
				break;
		}
		
		// Handle skill timer
		if (this.state === 'special') {
			this.skillTimer -= delta;
			if (this.skillTimer <= 0) {
				this.state = 'idle';
			}
		}
	}

	update(delta, player, platforms) {
		if (this.isDead) { 
			this.deathTimer += delta; 
			// Death animation sequence: Dead Hit -> Dead Ground (per type)
			const deadHitAnim = this.getAnimName('deadHit');
			const deadGroundAnim = this.getAnimName('deadGround');
			if (this.deathTimer < 1000) { this.setAnim(deadHitAnim); }
			else { this.setAnim(deadGroundAnim); }
			this.stepAnim(delta);
			return this.deathTimer < 3000; // Longer death animation
		}
		
		if (this.isHit) { 
			this.hitTimer -= delta; 
			if (this.hitTimer <= 0) {
				this.isHit = false; 
				this.state = 'idle'; // Return to idle after hit
			}
		}

		// Special skills for each enemy type
		this.updateSpecialSkills(delta, player, platforms);

		const dist = Math.abs(this.x - player.x);
		const isAgileEnemy = this.type === 'Bald Pirate' || this.type === 'Cucumber';
		
		// Debug logging for door-side enemies (commented out for performance)
		// if ((this.type === 'Captain' || this.type === 'Whale') && this.x > 600) {
		// 	console.log(`${this.type} at (${Math.round(this.x)}, ${Math.round(this.y)}) - Player at (${Math.round(player.x)}, ${Math.round(player.y)}) - Distance: ${Math.round(dist)} - Detection Range: ${this.detectionRange} - State: ${this.state} - Jump Cooldown: ${Math.round(this.jumpCooldown)}`);
		// }
		
		// Enhanced detection for agile enemies - they should always chase when player is nearby
		// Higher level enemies are more persistent and aggressive
		const levelAggressionBonus = (this.level - 1) * 0.3; // 30% more aggressive per level
		const effectiveDetectionRange = this.detectionRange * (1 + levelAggressionBonus);
		
		// Reduce detection range for better gameplay balance
		const balancedDetectionRange = Math.min(effectiveDetectionRange, 400);
		
		if (dist < balancedDetectionRange && !this.isDead) {
			if (dist < this.attackRange && this.attackCooldown <= 0 && !this.isHit) { 
				this.state = 'attack'; 
				this.attackPlayer(player); 
			} else { 
				this.state = 'chase'; 
				this.chasePlayer(player, platforms); 
			}
		} else {
			// Only return to patrol if player is really far away
			if (this.state === 'chase') { 
				this.chaseTimer += delta; 
				// Higher level enemies persist much longer in chase mode
				const baseChasTime = isAgileEnemy ? 12000 : 8000;
				const maxChaseTime = baseChasTime + (this.level - 1) * 3000; // +3s per level
				if (this.chaseTimer > maxChaseTime) { 
					this.state = 'patrol'; 
					this.chaseTimer = 0; 
				} 
			}
			if (this.state === 'patrol') this.patrol(platforms); 
			else this.idle(delta);
		}

		this.applyPhysics();
		this.checkCollisions(platforms);
		
		// Enhanced animation selection with smooth transitions
		let next = '1-Idle';
		if (this.isDead) {
			// Death animation handled above
		} else if (this.isHit) {
			next = this.getAnimName('hit');
		} else if (this.state === 'attack') {
			next = '7-Attack';
		} else if (this.state === 'special') {
			// Special skill animations
			switch(this.type) {
				case 'Cucumber': next = '8-Blow the wick'; break;
				case 'Big Guy': 
					if (this.hasBomb) next = '11-Throw (Bomb)';
					else next = '8-Pick (Bomb)';
					break;
				case 'Captain': next = '8-Scare Run'; break;
				case 'Whale': next = '8-Swalow (Bomb)'; break;
				default: next = '7-Attack';
			}
		} else if (!this.onGround) {
			next = this.velY < 0 ? '4-Jump' : '5-Fall';
		} else if (this.velX !== 0) {
			next = '2-Run';
		} else {
			// Idle with type-specific variations
			if (this.type === 'Big Guy' && this.hasBomb) {
				next = '9-Idle (Bomb)';
			} else if (this.velX !== 0 && this.type === 'Big Guy' && this.hasBomb) {
				next = '10-Run (Bomb)';
			} else {
				next = '1-Idle';
			}
		}
		
		// Smooth animation transition with blending
		this.setAnimWithBlend(next, delta); 
		this.stepAnim(delta);
		if (this.attackCooldown > 0) this.attackCooldown -= delta;
		if (this.jumpCooldown > 0) this.jumpCooldown -= delta;
		return true;
	}

	idle(delta) { 
		this.velX = 0; 
		this.idleTimer -= delta; 
		if (this.idleTimer <= 0) { 
			this.state = 'patrol'; 
			this.idleTimer = 500 + Math.random() * 1000; // Shorter idle time
		} 
	}
	patrol(platforms) { 
		if (Math.abs(this.x - this.startX) > this.patrolDistance) this.patrolDirection *= -1; 
		// Edge detection to avoid falling off platforms
		if (this.onGround && !this.hasGroundAhead(this.patrolDirection, platforms)) {
			this.patrolDirection *= -1;
		}
		
		// Smooth patrol movement
		const targetVelX = this.speed * this.patrolDirection;
		const acceleration = 0.15; // Slightly faster acceleration for better responsiveness
		
		if (this.velX < targetVelX) {
			this.velX = Math.min(this.velX + acceleration, targetVelX);
		} else if (this.velX > targetVelX) {
			this.velX = Math.max(this.velX - acceleration, targetVelX);
		}
		
		this.facingRight = this.patrolDirection > 0; 
	}
	chasePlayer(player, platforms) { 
		const dir = player.x > this.x ? 1 : -1; 
		
		// Enhanced chase logic for agile enemies with level scaling
		const isAgileEnemy = this.type === 'Bald Pirate' || this.type === 'Cucumber';
		
		// Level-based acceleration improvements
		const levelAccelerationBonus = (this.level - 1) * 0.08; // 8% faster acceleration per level
		const baseAcceleration = isAgileEnemy ? 0.25 : 0.20;
		const acceleration = baseAcceleration + levelAccelerationBonus;
		
		// Smooth acceleration towards player
		const targetVelX = this.speed * dir;
		
		if (this.velX < targetVelX) {
			this.velX = Math.min(this.velX + acceleration, targetVelX);
		} else if (this.velX > targetVelX) {
			this.velX = Math.max(this.velX - acceleration, targetVelX);
		}
		
		this.facingRight = dir > 0; 
		
		// Enhanced platform navigation - Bald Pirate and Cucumber are more aggressive
		if (this.onGround) {
			// Bald Pirate and Cucumber have enhanced platform navigation
			const isAgileEnemy = this.type === 'Bald Pirate' || this.type === 'Cucumber';
			
			// Smart jumping with level-based improvements
			const levelJumpBonus = (this.level - 1) * 20; // 20px wider jump range per level
			const agileJumpRange = 100 + levelJumpBonus;
			const heavyJumpRange = 110 + levelJumpBonus;
			
			// Smart jumping: Jump when player is above and we're close (regardless of player movement)
			if (isAgileEnemy && player.y < this.y - 40 && Math.abs(this.x - player.x) < agileJumpRange) {
				// console.log(`${this.type} jumping to chase player! Player at y=${Math.round(player.y)}, Enemy at y=${Math.round(this.y)}`);
				this.jump();
			}
			// Also let Captain/Whale jump if player is clearly above and near
			if ((this.type === 'Captain' || this.type === 'Whale') && player.y < this.y - 50 && Math.abs(this.x - player.x) < heavyJumpRange) {
				// console.log(`${this.type} jumping to chase player! Player at y=${Math.round(player.y)}, Enemy at y=${Math.round(this.y)}`);
				this.jump();
			}
			
			// Jump to reach player on nearby platform
			if (isAgileEnemy && Math.abs(this.x - player.x) < 120) {
				const nearbyPlatform = this.findPlatformNearPlayer(player, platforms);
				if (nearbyPlatform && this.y - nearbyPlatform.y > 0 && this.y - nearbyPlatform.y < 100) {
					// console.log(`${this.type} jumping to nearby platform!`);
					this.jump();
				}
			}
			
			// Basic platform navigation - avoid falling off edges unless player is below (allow drop-down)
			const playerBelow = player.y > this.y + 40;
			if (!playerBelow && !this.hasGroundAhead(dir, platforms)) {
				const nearbyPlatform = this.findNearbyPlatform(dir, platforms);
				if (nearbyPlatform) {
					// console.log(`${this.type} jumping to nearby platform to avoid falling`);
					this.jump();
				} else {
					// console.log(`${this.type} changing direction - no platform to jump to`);
					this.patrolDirection *= -1;
				}
			}
			
			// Jump over walls
			if (this.hitWall) {
				const wallJumpPlatform = this.findWallJumpPlatform(dir, platforms);
				if (wallJumpPlatform) {
					// console.log(`${this.type} jumping over wall`);
					this.jump();
				} else {
					this.patrolDirection *= -1;
				}
				this.hitWall = false;
			}
		}
	}
	// Simple probe: is there a platform under our feet at x + offset?
	hasGroundAhead(dir, platforms) {
		const probeX = this.x + (dir > 0 ? this.width + 4 : -4);
		return this.hasGroundAt(probeX, platforms);
	}
	hasGroundAt(x, platforms) {
		const footY = this.y + this.height + 1;
		for (const p of platforms) {
			// Skip walls and door blocks - they're not ground
			if (p.type === 'wall' || p.type === 'doorBlock') continue;
			
			// Check if the probe point is within this platform
			if (x >= p.x && x <= p.x + p.width) {
				// Ground if platform top is just below feet
				if (Math.abs(p.y - footY) <= 6) {
					return true;
				}
			}
		}
		return false;
	}
	
	// Find which platform the player is standing on
	findPlayerPlatform(player, platforms) {
		const footY = player.y + player.height + 1;
		for (const p of platforms) {
			if (p.type === 'wall' || p.type === 'doorBlock') continue;
			if (player.x >= p.x && player.x <= p.x + p.width) {
				if (Math.abs(p.y - footY) <= 6) return p;
			}
		}
		return null;
	}
	
	// Find which platform the enemy is standing on
	findEnemyPlatform(platforms) {
		const footY = this.y + this.height + 1;
		for (const p of platforms) {
			if (p.type === 'wall' || p.type === 'doorBlock') continue;
			if (this.x >= p.x && this.x <= p.x + p.width) {
				if (Math.abs(p.y - footY) <= 6) return p;
			}
		}
		return null;
	}
	
	// Check if enemy can reach a specific platform
	canReachPlatform(targetPlatform, platforms) {
		const jumpHeight = Math.abs(this.jumpPower) * 2; // Approximate jump height
		const heightDiff = this.y - targetPlatform.y;
		
		// Can jump up to the platform
		if (heightDiff > jumpHeight) return false;
		
		// Check if there's a clear path (no blocking platforms)
		const startX = this.x;
		const endX = targetPlatform.x + targetPlatform.width / 2;
		const step = (endX - startX) / 10;
		
		for (let x = startX; x <= endX; x += step) {
			const y = this.y - (heightDiff * (x - startX) / (endX - startX));
			
			// Check if this point is blocked by any platform
			for (const p of platforms) {
				if (p.type === 'wall' || p.type === 'doorBlock') continue;
				if (x >= p.x && x <= p.x + p.width && y >= p.y && y <= p.y + p.height) {
					return false; // Path is blocked
				}
			}
		}
		
		return true;
	}
	
	// Find a platform we can jump to when player is above us
	findJumpablePlatform(player, platforms) {
		const jumpHeight = Math.abs(this.jumpPower) * 2;
		const searchRange = 200;
		
		// console.log(`${this.type} looking for jumpable platform. Jump height: ${jumpHeight}, Search range: ${searchRange}`);
		
		for (const p of platforms) {
			if (p.type === 'wall' || p.type === 'doorBlock') continue;
			
			const platformCenterX = p.x + p.width / 2;
			const distance = Math.abs(platformCenterX - this.x);
			const heightDiff = this.y - p.y;
			
			// console.log(`Platform at (${p.x}, ${p.y}), distance: ${distance}, height diff: ${heightDiff}`);
			
			// Platform is above us, within jump height, and close enough
			if (heightDiff <= jumpHeight && heightDiff > 0 && distance < searchRange) {
				// Platform should be closer to player's position
				const playerDistance = Math.abs(platformCenterX - player.x);
				if (playerDistance < distance + 50) { // Prefer platforms closer to player
					// console.log(`${this.type} found jumpable platform at (${p.x}, ${p.y})`);
					return p;
				}
			}
		}
		// console.log(`${this.type} no jumpable platform found`);
		return null;
	}
	
	// Find a nearby platform to jump to
	findNearbyPlatform(dir, platforms) {
		const searchRange = 150;
		const jumpHeight = Math.abs(this.jumpPower) * 2;
		
		for (const p of platforms) {
			if (p.type === 'wall' || p.type === 'doorBlock') continue;
			
			const platformCenterX = p.x + p.width / 2;
			const distance = Math.abs(platformCenterX - this.x);
			
			// Platform is within search range and jumpable height
			if (distance < searchRange && this.y - p.y <= jumpHeight && this.y - p.y > 0) {
				// Platform is in the direction we want to go
				if ((dir > 0 && platformCenterX > this.x) || (dir < 0 && platformCenterX < this.x)) {
					return p;
				}
			}
		}
		return null;
	}
	
	// Find a platform to jump to when hitting a wall
	findWallJumpPlatform(dir, platforms) {
		const jumpHeight = Math.abs(this.jumpPower) * 2;
		const searchRange = 120;
		
		for (const p of platforms) {
			if (p.type === 'wall' || p.type === 'doorBlock') continue;
			
			const platformCenterX = p.x + p.width / 2;
			const distance = Math.abs(platformCenterX - this.x);
			
			// Platform is above us and within jump range
			if (this.y - p.y <= jumpHeight && this.y - p.y > 0 && distance < searchRange) {
				// Platform should be in the direction we want to go
				if ((dir > 0 && platformCenterX > this.x) || (dir < 0 && platformCenterX < this.x)) {
					return p;
				}
			}
		}
		return null;
	}
	
	// Find a platform to intercept the player's movement
	findInterceptPlatform(player, platforms) {
		const jumpHeight = Math.abs(this.jumpPower) * 2;
		const searchRange = 200;
		
		// Predict where player might go
		const playerDirection = player.velX > 0 ? 1 : -1;
		const predictedX = player.x + (playerDirection * 100); // Predict 100px ahead
		
		for (const p of platforms) {
			if (p.type === 'wall' || p.type === 'doorBlock') continue;
			
			const platformCenterX = p.x + p.width / 2;
			const distance = Math.abs(platformCenterX - this.x);
			
			// Platform is above us, within jump range, and closer to predicted player position
			if (this.y - p.y <= jumpHeight && this.y - p.y > 0 && distance < searchRange) {
				const distanceToPredicted = Math.abs(platformCenterX - predictedX);
				if (distanceToPredicted < 80) { // Platform is close to where player might go
					return p;
				}
			}
		}
		return null;
	}
	
	// Find a platform near the player to jump to
	findPlatformNearPlayer(player, platforms) {
		const jumpHeight = Math.abs(this.jumpPower) * 2;
		const searchRange = 150;
		
		for (const p of platforms) {
			if (p.type === 'wall' || p.type === 'doorBlock') continue;
			
			const platformCenterX = p.x + p.width / 2;
			const distanceToPlayer = Math.abs(platformCenterX - player.x);
			const distanceToEnemy = Math.abs(platformCenterX - this.x);
			
			// Platform is above us, within jump range, and close to player
			if (this.y - p.y <= jumpHeight && this.y - p.y > 0 && distanceToEnemy < searchRange) {
				if (distanceToPlayer < 80) { // Platform is close to player
					return p;
				}
			}
		}
		return null;
	}
	attackPlayer(player) { 
		this.velX = 0; 
		this.attackCooldown = this.attackCooldownTime; 
		// Require compact hitbox overlap to actually deal damage - only if alive
		if (this.isDead) return; // Dead enemies can't attack
		
		const playerBox = { x: player.x + 25, y: player.y + 25, width: player.width - 50, height: player.height - 50 };
		const enemyBox  = { x: this.x + 25,   y: this.y + 25,   width: this.width - 50,  height: this.height - 50 };
		if (player && !player.invulnerable && !player.isHit &&
			playerBox.x < enemyBox.x + enemyBox.width &&
			playerBox.x + playerBox.width > enemyBox.x &&
			playerBox.y < enemyBox.y + enemyBox.height &&
			playerBox.y + playerBox.height > enemyBox.y) {
			player.takeDamage(this.damage);
		}
	}
	applyPhysics() { this.velY += this.gravity; this.x += this.velX; this.y += this.velY; }
	checkCollisions(platforms) {
		this.onGround = false;
		this.hitWall = false;
		
		// Force ground snapping - find platform directly below enemy
		let groundPlatform = null;
		let closestGroundY = 1000;
		
		// Find the closest platform below the enemy
		platforms.forEach(p => {
			if (p.type !== 'wall' && p.type !== 'doorBlock') {
				// Check if enemy is horizontally aligned with platform
				if (this.x + this.width > p.x && this.x < p.x + p.width) {
					// Check if platform is below enemy
					if (p.y >= this.y + this.height - 10 && p.y < closestGroundY) {
						groundPlatform = p;
						closestGroundY = p.y;
					}
				}
			}
		});
		
		// Snap to ground if found and close enough (but not when jumping up)
		if (groundPlatform && this.y + this.height >= groundPlatform.y - 15 && this.velY >= 0) {
			this.y = groundPlatform.y - this.height;
					this.velY = 0; 
					this.onGround = true; 
				}
		
		// Handle wall collisions
		platforms.forEach(p => {
			if (this.x < p.x + p.width && this.x + this.width > p.x && this.y < p.y + p.height && this.y + this.height > p.y) {
				if (this.velX > 0 && this.x < p.x) { 
					this.x = p.x - this.width; 
					// Treat walls and the door blocker as obstacles we should react to
					if (p.type === 'wall' || p.type === 'doorBlock') {
						this.hitWall = true; 
						this.patrolDirection = -1; 
					}
				}
				else if (this.velX < 0 && this.x > p.x) { 
					this.x = p.x + p.width; 
					// Treat walls and the door blocker as obstacles we should react to
					if (p.type === 'wall' || p.type === 'doorBlock') {
						this.hitWall = true; 
						this.patrolDirection = 1; 
					}
				}
			}
		});
	}
	jump() { 
		if (this.onGround && this.jumpCooldown <= 0) { 
			this.velY = this.jumpPower; 
			this.onGround = false; 
			// Level-based jump cooldown reduction - higher level enemies jump more frequently
		const baseCooldown = 600; // Reduced base cooldown
		const levelReduction = (this.level - 1) * 150; // 150ms faster per level
		this.jumpCooldown = Math.max(200, baseCooldown - levelReduction); // Minimum 200ms cooldown
		} 
	}
	takeDamage(d) { 
		this.health -= d; 
		this.isHit = true; 
		this.hitTimer = 800; // Longer hit animation
		
		// Type-specific hit reactions
		switch(this.type) {
			case 'Bald Pirate':
				this.velX *= -0.5; // Knockback
				break;
			case 'Cucumber':
				this.velY = -8; // Jump back
				break;
			case 'Big Guy':
				this.velX *= -0.3; // Heavy knockback
				break;
			case 'Captain':
				this.velX *= -0.7; // Quick knockback
				break;
			case 'Whale':
				this.velX *= -0.2; // Minimal knockback due to size
				break;
		}
		// Ensure AI re-engages after being hit
		if (this.health > 0) {
			// Leave idle state quickly and resume movement
			this.idleTimer = 0;
		}
		
		if (this.health <= 0) {
			// Award points for killing enemy
			if (game && game.gameState) {
				const enemyKillPoints = 100; // 100 points per enemy kill
				game.gameState.currentScore += enemyKillPoints;
				game.gameState.totalScore += enemyKillPoints;
				console.log(`💀 Enemy killed: ${this.type} - +${enemyKillPoints} points! Current score: ${game.gameState.currentScore}, Total score: ${game.gameState.totalScore}`);
				
				// IMMEDIATELY save to localStorage when score changes
				if (window.walletConnection && window.walletConnection.publicKey) {
					const progress = {
						level: game.gameState.level,
						score: game.gameState.totalScore,
						lives: game.gameState.lives,
						timestamp: Date.now()
					};
					
					const progressKey = `playerProgress_${window.walletConnection.publicKey.toString()}`;
					localStorage.setItem(progressKey, JSON.stringify(progress));
					console.log('💾 Saved score update to localStorage:', progress);
				}
				
				// Update Player Registry immediately with new score
				if (window.playerRegistry && window.playerProfile) {
					window.playerProfile.totalScore = game.gameState.totalScore;
					// Calculate new tokens (10% of total score)
					const newTokens = Math.floor(game.gameState.totalScore * 0.10);
					window.playerProfile.boomTokens = newTokens;
					
					// Save profile and wait for completion
					window.playerRegistry.savePlayerProfile(window.playerProfile).then((success) => {
						if (success) {
							console.log(`💰 Profile saved successfully! Updated tokens: ${newTokens} (10% of ${game.gameState.totalScore})`);
							// Update UI to reflect new values
							if (window.walletConnection && window.walletConnection.updatePlayerInfo) {
								window.walletConnection.updatePlayerInfo();
							}
							if (game && game.updateUI) {
								game.updateUI();
							}
							
							// Force update token display immediately
							const playerTokenBalance = document.getElementById('playerTokenBalance');
							if (playerTokenBalance) {
								playerTokenBalance.textContent = newTokens;
							}
						} else {
							console.error('❌ Failed to save player profile');
						}
					}).catch(error => {
						console.error('❌ Error saving player profile:', error);
					});
				}
				
				// Update UI immediately
				// updateGameUIWithBlockchainData(window.playerProfile); // Function not defined, removing
			}
			
			this.die();
			if (game.soundManager) game.soundManager.play('enemyDeath');
			
			// Check if this is a boss enemy and record defeat in Player Registry
			if (window.playerRegistry && this.isBossEnemy()) {
				console.log(`💀 Boss enemy defeated: ${this.type}`);
				// Note: recordBossDefeat function not implemented yet
				// window.playerRegistry.recordBossDefeat(this.type, game.gameState.level, 500);
			}
		}
	}
	die() { 
		this.isDead = true; 
		this.velX = 0; 
		this.velY = 0; 
		this.deathTimer = 0;
		
		// Type-specific death behaviors
		switch(this.type) {
			case 'Bald Pirate':
				this.velY = -5; // Small death jump
				break;
			case 'Cucumber':
				this.velY = -10; // Big death jump
				break;
			case 'Big Guy':
				this.velY = -3; // Heavy fall
				break;
			case 'Captain':
				this.velY = -8; // Dramatic death jump
				break;
			case 'Whale':
				this.velY = -2; // Slow heavy fall
				break;
		}
	}
	
	isBossEnemy() {
		// Check if this enemy is a boss (Captain or Whale are considered bosses)
		return this.type === 'Captain' || this.type === 'Whale';
	}
	
	setAnim(name) { if (name !== this.anim.name) this.anim = { name, t: 0, speed: this.getTypeProperties().animSpeed, frame: 0 }; }
	
	setAnimWithBlend(name, delta) { 
		if (name !== this.anim.name) {
			// Smooth transition between animations
			const oldAnim = this.anim.name;
			this.anim = { 
				name, 
				t: 0, 
				speed: this.getTypeProperties().animSpeed, 
				frame: 0,
				transitionTime: 0,
				transitionDuration: 150 // 150ms transition
			};
			
			// Keep some momentum from previous animation for smoother transitions
			if (oldAnim === '2-Run' && name === '1-Idle') {
				this.anim.t = 0.3; // Start idle animation at a later frame
			}
		}
	}
	stepAnim(delta) { 
		const frames = this.sprites[this.anim.name] || []; 
		if (frames.length === 0) return; 
		
		// Smooth animation with frame interpolation
		this.anim.t += delta * this.anim.speed; 
		const frameIndex = Math.floor(this.anim.t) % frames.length;
		
		// Prevent frame jumping by ensuring smooth transitions
		if (Math.abs(frameIndex - this.anim.frame) > frames.length / 2) {
			this.anim.frame = frameIndex;
		} else {
			this.anim.frame = frameIndex;
		}
	}
	getAnimName(kind) {
		// Map logical kinds to real sprite folder names per enemy type
		const map = {
			'Bald Pirate': { hit: '8-Hit', deadHit: '9-Dead Hit', deadGround: '10-Dead Ground' },
			'Cucumber': { hit: '9-Hit', deadHit: '10-Dead Hit', deadGround: '11-Dead Ground' },
			'Big Guy': { hit: '12-Hit', deadHit: '13-Dead Hit', deadGround: '14-Dead Ground' },
			'Captain': { hit: '9-Hit', deadHit: '10-Dead Hit', deadGround: '11-Dead Ground' },
			'Whale': { hit: '9-Hit', deadHit: '10-Dead Hit', deadGround: '11-Dead Ground' }
		};
		const defs = { hit: '8-Hit', deadHit: '9-Dead Hit', deadGround: '10-Dead Ground' };
		return (map[this.type] && map[this.type][kind]) || defs[kind] || '1-Idle';
	}

	// Find a usable fallback frame when current animation frames are missing
	getFallbackFrameForAnim(animName) {
		// Prefer type-appropriate fallbacks
		const preferredByAnim = [];
		if (animName.includes('Dead')) {
			preferredByAnim.push('8-Hit', '9-Hit', '1-Idle');
		} else if (animName.includes('Hit')) {
			preferredByAnim.push('1-Idle', '2-Run');
		} else {
			preferredByAnim.push('1-Idle', '2-Run');
		}

		// 1) Try preferred candidates
		for (const candidate of preferredByAnim) {
			const frames = this.sprites[candidate];
			if (frames && frames.length > 0 && frames[0]) {
				return frames[0];
			}
		}

		// 2) Fallback to the first available frame from any animation
		for (const key of Object.keys(this.sprites)) {
			const frames = this.sprites[key];
			if (frames && frames.length > 0 && frames[0]) {
				return frames[0];
			}
		}

		return null;
	}
	render(ctx) { 
		const frames = this.sprites[this.anim.name] || []; 
		if (frames.length === 0) { 
			// Try to draw a sensible fallback frame to avoid black boxes
			const fallbackImg = this.getFallbackFrameForAnim(this.anim.name);
			if (fallbackImg) {
				ctx.save();
				const shouldFlip = this.spriteFacesRight ? !this.facingRight : this.facingRight;
				if (shouldFlip) {
					ctx.translate(this.x + this.width, this.y);
					ctx.scale(-1, 1);
					ctx.drawImage(fallbackImg, 0, 0, this.width, this.height);
				} else {
					ctx.drawImage(fallbackImg, this.x, this.y, this.width, this.height);
				}
				ctx.restore();
			} else {
				// As a last resort, draw simple fallback sprite
				this.renderFallbackSprite(ctx);
			}
			return; 
		}
		
		// Ensure frame index is valid
		let frameIndex = this.anim.frame || 0;
		if (frameIndex >= frames.length || frameIndex < 0) {
			frameIndex = 0;
		}
		
		const img = frames[frameIndex]; 
		if (!img) {
			// If specific frame is missing, try a sensible fallback image
			const fallbackImg = this.getFallbackFrameForAnim(this.anim.name);
			if (fallbackImg) {
				ctx.save();
				const shouldFlip = this.spriteFacesRight ? !this.facingRight : this.facingRight;
				if (shouldFlip) {
					ctx.translate(this.x + this.width, this.y);
					ctx.scale(-1, 1);
					ctx.drawImage(fallbackImg, 0, 0, this.width, this.height);
				} else {
					ctx.drawImage(fallbackImg, this.x, this.y, this.width, this.height);
				}
				ctx.restore();
			} else {
				this.renderFallbackSprite(ctx);
			}
			return;
		}
		
		ctx.save(); 
		// Correct orientation based on sprite base facing
		const shouldFlip = this.spriteFacesRight ? !this.facingRight : this.facingRight;
		if (shouldFlip) { 
			ctx.translate(this.x + this.width, this.y); 
			ctx.scale(-1, 1); 
			ctx.drawImage(img, 0, 0, this.width, this.height); 
		} else { 
			ctx.drawImage(img, this.x, this.y, this.width, this.height); 
		} 
		ctx.restore(); 
		
		// Clamp and render compact HP bar only when alive and damaged
		const clampedHealth = Math.max(0, Math.min(this.health, this.maxHealth));
		const hpPct = clampedHealth / this.maxHealth; 
		if (!this.isDead && hpPct < 1) { 
			const barWidth = Math.max(0, Math.min(this.width, this.width * hpPct));
			ctx.fillStyle = '#400'; 
			ctx.fillRect(this.x, this.y - 8, this.width, 5); 
			ctx.fillStyle = '#0f0'; 
			ctx.fillRect(this.x, this.y - 8, barWidth, 5); 
		}
	}
	
	renderFallbackSprite(ctx) {
		// Simple fallback rendering - just use a simple rectangle with type label
		ctx.fillStyle = '#333333';
		ctx.fillRect(this.x, this.y, this.width, this.height);
		
		// Add border
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineWidth = 2;
		ctx.strokeRect(this.x, this.y, this.width, this.height);
		
		// Add type text
		ctx.fillStyle = '#FFFFFF';
		ctx.font = '12px Arial';
		ctx.textAlign = 'center';
		ctx.fillText(this.type, this.x + this.width/2, this.y + this.height/2);
	}



}

class Bomb {
	constructor(x, y, sprites) { 
		this.x = x; 
		this.y = y; 
		this.width = 64; 
		this.height = 64; 
		this.fuseTime = 1500; // 1.5 seconds fuse
		this.fuseTimer = this.fuseTime; 
		this.exploded = false; 
		this.explosionRadius = 120; // Slightly smaller radius for better gameplay
		this.explosionTimer = 0; 
		this.explosionDuration = 800; // Longer explosion animation
		this.anim = { name: '1-Bomb Off', t: 0, speed: 0.12, frame: 0 }; 
		this.sprites = sprites || {}; 
		this.hasDamagedEnemies = false; // Track if enemies were already damaged
	}
	
	update(delta) { 
		if (!this.exploded) { 
			// Simple and reliable fuse countdown
			this.fuseTimer -= delta; 
			this.anim.t += delta * this.anim.speed; 
			
			// Switch to "Bomb On" animation when fuse is almost done
			if (this.fuseTimer < 1000) {
				this.anim.name = '2-Bomb On'; 
			}
			
			// Explode when fuse runs out
			if (this.fuseTimer <= 0) {
				console.log(`Bomb exploding at (${this.x}, ${this.y}) - Fuse timer: ${this.fuseTimer}`);
				this.explode(); 
			}
		} else { 
			this.explosionTimer += delta; 
		} 
	}
	
	explode() { 
		this.exploded = true; 
		this.anim.name = '3-Explotion'; 
		this.anim.t = 0; 
		this.explosionTimer = 0; // Reset explosion timer
		if (game.soundManager) game.soundManager.play('explosion');
	}
	render(ctx) { 
		// Don't render bombs that were picked up or swallowed
		if (this.pickedUp || this.swallowed) {
			return;
		}
		
		if (this.exploded) { 
			const progress = this.explosionTimer / this.explosionDuration; 
			const radius = this.explosionRadius * Math.min(1, progress); 
			const alpha = 1 - Math.min(1, progress); 
			
			// Draw explosion effect
			ctx.save(); 
			ctx.globalAlpha = alpha; 
			ctx.fillStyle = '#FF6600'; 
			ctx.beginPath(); 
			ctx.arc(this.x + this.width / 2, this.y + this.height / 2, radius, 0, Math.PI * 2); 
			ctx.fill(); 
			ctx.restore(); 
			
			// Draw explosion sprite animation
			const frames = this.sprites['3-Explotion'] || []; 
			if (frames.length > 0) { 
				const frame = Math.min(frames.length - 1, Math.floor((this.explosionTimer / this.explosionDuration) * frames.length)); 
				const img = frames[frame]; 
				if (img) {
					ctx.drawImage(img, this.x - 32, this.y - 32, this.width + 64, this.height + 64); 
				}
			} 
		} else { 
			// Draw bomb sprite animation
			const frames = this.sprites[this.anim.name] || []; 
			if (frames.length === 0 || !frames[Math.floor(this.anim.t) % frames.length]) { 
				// Use fallback bomb sprite
				this.renderFallbackBomb(ctx);
			} else { 
				const frame = Math.floor(this.anim.t) % frames.length; 
				const img = frames[frame]; 
				if (img) {
					ctx.drawImage(img, this.x, this.y, this.width, this.height); 
				} else {
					this.renderFallbackBomb(ctx);
				}
			}
			
			// Show explosion radius warning when fuse is almost done
			if (this.fuseTimer < 500) {
				const warningAlpha = (500 - this.fuseTimer) / 500 * 0.3; // Fade in warning
				ctx.save();
				ctx.globalAlpha = warningAlpha;
				ctx.strokeStyle = '#FF4500';
				ctx.lineWidth = 2;
				ctx.setLineDash([5, 5]);
				ctx.beginPath();
				ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.explosionRadius, 0, Math.PI * 2);
				ctx.stroke();
				ctx.restore();
			}
		} 
	}
	
	renderFallbackBomb(ctx) {
		// Create a fallback bomb sprite
		const canvas = document.createElement('canvas');
		canvas.width = this.width;
		canvas.height = this.height;
		const fallbackCtx = canvas.getContext('2d');
		
		const size = this.width;
		const scale = size / 64;
		
		// Draw bomb body (black circle)
		fallbackCtx.fillStyle = '#000000';
		fallbackCtx.beginPath();
		fallbackCtx.arc(size/2, size/2, size/2 - 8 * scale, 0, Math.PI * 2);
		fallbackCtx.fill();
		
		// Add bomb highlight
		fallbackCtx.fillStyle = '#333333';
		fallbackCtx.beginPath();
		fallbackCtx.arc(size/2 - 8 * scale, size/2 - 8 * scale, size/4, 0, Math.PI * 2);
		fallbackCtx.fill();
		
		// Add fuse
		fallbackCtx.strokeStyle = '#8B4513';
		fallbackCtx.lineWidth = 4 * scale;
		fallbackCtx.beginPath();
		fallbackCtx.moveTo(size/2, size/2 - size/2 + 8 * scale);
		fallbackCtx.quadraticCurveTo(size/2 + 10 * scale, size/2 - size/2 - 5 * scale, size/2 + 15 * scale, size/2 - size/2 + 5 * scale);
		fallbackCtx.stroke();
		
		// Add fuse tip
		fallbackCtx.fillStyle = '#FF4500';
		fallbackCtx.beginPath();
		fallbackCtx.arc(size/2 + 15 * scale, size/2 - size/2 + 5 * scale, 4 * scale, 0, Math.PI * 2);
		fallbackCtx.fill();
		
		// Add some sparkle effect
		fallbackCtx.fillStyle = '#FFFF00';
		fallbackCtx.beginPath();
		fallbackCtx.arc(size/2 + 18 * scale, size/2 - size/2 - 8 * scale, 2 * scale, 0, Math.PI * 2);
		fallbackCtx.fill();
		
		// Draw the fallback bomb
		ctx.drawImage(canvas, this.x, this.y, this.width, this.height);
	}
}

// Door entity
class Door {
    constructor(x, y, sprites) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 96;
        this.sprites = sprites || {};
        this.state = 'closed'; // closed | opening | open | closing
        this.anim = { name: '1-Closed', t: 0, speed: 0.15, frame: 0 };
        this.isOpen = false;
    }
    open() {
        if (this.state === 'closed' || this.state === 'closing') {
            console.log('Door opening animation started');
            this.state = 'opening';
            this.anim = { name: '2-Opening', t: 0, speed: 0.15, frame: 0 };
        }
    }
    
    // Method to check if door is in a state that can be opened
    canOpen() {
        return this.state === 'closed';
    }
    close() {
        if (this.state === 'open' || this.state === 'opening') {
            this.state = 'closing';
            this.anim = { name: '3-Closing', t: 0, speed: 0.15, frame: 0 };
        }
    }
    update(delta) {
        const frames = this.sprites[this.anim.name] || [];
        if (frames.length > 0) {
            this.anim.t += delta * this.anim.speed;
            const maxFrame = this.anim.name === '1-Closed' ? 1 : frames.length;
            this.anim.frame = Math.min(frames.length - 1, Math.floor(this.anim.t) % maxFrame);
        }
        if (this.state === 'opening') {
            const total = (this.sprites['2-Opening']||[]).length;
            if (total > 0 && Math.floor(this.anim.t) >= total) {
                console.log('Door fully opened!');
                this.state = 'open';
                this.isOpen = true;
                // Keep door in open state - show last frame of opening animation
                this.anim = { name: '2-Opening', t: total - 1, speed: 0.15, frame: total - 1 };
            }
        } else if (this.state === 'closing') {
            const total = (this.sprites['3-Closing']||[]).length;
            if (total > 0 && Math.floor(this.anim.t) >= total) {
                this.state = 'closed';
                this.isOpen = false;
                // Keep door in closed state - show first frame of closed animation
                this.anim = { name: '1-Closed', t: 0, speed: 0.15, frame: 0 };
            }
        }
    }
    render(ctx) {
        const frames = this.sprites[this.anim.name] || [];
        if (frames.length === 0 || !frames[Math.min(frames.length - 1, this.anim.frame)]) {
            this.renderFallbackDoor(ctx);
            return;
        }
        
        // For open state, show the last frame of opening animation
        let frameIndex = this.anim.frame;
        if (this.state === 'open') {
            frameIndex = frames.length - 1; // Show last frame of opening animation
        }
        
        const img = frames[Math.min(frames.length - 1, frameIndex)];
        if (img) {
        ctx.drawImage(img, this.x, this.y, this.width, this.height);
        } else {
            this.renderFallbackDoor(ctx);
        }
    }
    
    renderFallbackDoor(ctx) {
        // Create a fallback door sprite
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const fallbackCtx = canvas.getContext('2d');
        
        const size = this.width;
        const scale = size / 64;
        
        // Draw door frame
        fallbackCtx.fillStyle = '#654321';
        fallbackCtx.fillRect(0, 0, size, size);
        
        // Draw door
        fallbackCtx.fillStyle = '#8B4513';
        fallbackCtx.fillRect(4 * scale, 4 * scale, size - 8 * scale, size - 8 * scale);
        
        // Add door panels
        fallbackCtx.strokeStyle = '#654321';
        fallbackCtx.lineWidth = 2 * scale;
        fallbackCtx.strokeRect(8 * scale, 8 * scale, size - 16 * scale, size - 16 * scale);
        fallbackCtx.strokeRect(12 * scale, 12 * scale, size - 24 * scale, size - 24 * scale);
        
        // Add door handle
        fallbackCtx.fillStyle = '#FFD700';
        fallbackCtx.beginPath();
        fallbackCtx.arc(size - 12 * scale, size/2, 6 * scale, 0, Math.PI * 2);
        fallbackCtx.fill();
        
        // Add door handle border
        fallbackCtx.strokeStyle = '#B8860B';
        fallbackCtx.lineWidth = 1 * scale;
        fallbackCtx.stroke();
        
        // Add some wood grain texture
        fallbackCtx.strokeStyle = '#654321';
        fallbackCtx.lineWidth = 1 * scale;
        for (let i = 0; i < 3; i++) {
            fallbackCtx.beginPath();
            fallbackCtx.moveTo(8 * scale, 16 * scale + i * 12 * scale);
            fallbackCtx.lineTo(size - 8 * scale, 16 * scale + i * 12 * scale);
            fallbackCtx.stroke();
        }
        
        // Draw the fallback door
        ctx.drawImage(canvas, this.x, this.y, this.width, this.height);
    }
    getBounds() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
}

// ---------------------------
// Boot
// ---------------------------
// Sound Manager
class SoundManager {
	constructor() {
		this.sounds = {};
		this.enabled = true;
		this.musicEnabled = true;
		this.audioContext = null;
		this.backgroundMusic = null;
		this.musicGain = null;
		
		// Music files array
		this.musicFiles = [
			'music/Cyber punk.mp3'
		];
		this.currentMusicIndex = 0;
		this.audioElements = {}; // Store loaded audio elements
		
		this.initSounds();
		this.preloadMusic();
	}
	
	initSounds() {
		// Create simple sound effects using Web Audio API
		this.createSound('jump', 200, 0.3, 'sine');
		this.createSound('bomb', 100, 0.4, 'square');
		this.createSound('explosion', 50, 0.6, 'sawtooth');
		this.createSound('hit', 300, 0.3, 'triangle');
		this.createSound('enemyDeath', 150, 0.4, 'sine');
		this.createSound('gameOver', 100, 0.5, 'sawtooth');
		this.createSound('respawn', 150, 0.4, 'sine');
	}
	
	preloadMusic() {
		console.log('Preloading music files...');
		console.log('Music files to load:', this.musicFiles);
		
		// Test if music file is accessible
		fetch(this.musicFiles[0])
			.then(response => {
				if (response.ok) {
					console.log('✅ Music file is accessible:', this.musicFiles[0]);
				} else {
					console.error('❌ Music file not accessible:', this.musicFiles[0], 'Status:', response.status);
				}
			})
			.catch(error => {
				console.error('❌ Error checking music file:', error);
			});
		
		this.musicFiles.forEach((musicFile, index) => {
			console.log(`Loading music file ${index}: ${musicFile}`);
			const audio = new Audio();
			audio.src = musicFile;
			audio.loop = true;
			audio.volume = 0.8; // Increased volume
			audio.preload = 'auto';
			audio.crossOrigin = 'anonymous'; // Try to fix CORS issues
			
			// Store the audio element
			this.audioElements[index] = audio;
			
			// More detailed event listeners
			audio.addEventListener('canplaythrough', () => {
				console.log(`✓ Music file ${index + 1} ready to play: ${musicFile}`);
			});
			
			audio.addEventListener('loadstart', () => {
				console.log(`→ Started loading music file ${index + 1}: ${musicFile}`);
			});
			
			audio.addEventListener('loadedmetadata', () => {
				console.log(`→ Metadata loaded for music file ${index + 1}: ${musicFile}`);
			});
			
			audio.addEventListener('error', (e) => {
				console.error(`✗ Error loading music file ${musicFile}:`, e);
				console.error(`Error details:`, {
					code: e.target.error?.code,
					message: e.target.error?.message,
					src: e.target.src
				});
			});
			
			audio.addEventListener('loadeddata', () => {
				console.log(`✓ Data loaded for music file ${index + 1}: ${musicFile}`);
			});
		});
	}
	

	
	createBackgroundMusic() {
		console.log('🎵 createBackgroundMusic() called');
		console.log('Music files available:', this.musicFiles);
		console.log('Audio elements loaded:', Object.keys(this.audioElements).length);
		
		// Stop any currently playing music
		this.stopBackgroundMusic();
		
		// Get current level from game
		const level = window.game ? window.game.gameState.level : 1;
		
		// Use the single Cyber punk music file
		this.currentMusicIndex = 0;
		
		console.log(`🎵 Level ${level}: Playing Cyber punk.mp3`);
		
		// Play the music file
		this.playMusicFile(0);
	}
	
	// Old music generation methods removed - now using actual music files!
	

	
	// All old music generation methods removed - now using actual music files!
	
	startBackgroundMusic() {
		console.log('startBackgroundMusic() called');
		
		// Don't start if music is disabled
		if (!this.musicEnabled) {
			console.log('🎵 Music is disabled, not starting background music');
			return;
		}
		
		// Try using HTML audio element directly first
		const htmlAudio = document.getElementById('backgroundMusic');
		if (htmlAudio) {
			console.log('🎵 Using HTML audio element for background music...');
			htmlAudio.volume = 0.8;
			htmlAudio.loop = true;
			
			htmlAudio.play().then(() => {
				console.log('✅ HTML background music started successfully!');
			}).catch(error => {
				console.error('❌ HTML audio failed, trying SoundManager...', error);
				// Fallback to SoundManager
				setTimeout(() => {
					console.log('Starting music after user interaction...');
					this.createBackgroundMusic();
				}, 100);
			});
		} else {
			console.log('HTML audio element not found, using SoundManager...');
			// Force start music immediately after user interaction
			setTimeout(() => {
				console.log('Starting music after user interaction...');
				this.createBackgroundMusic();
			}, 100); // Small delay to ensure user interaction is registered
		}
	}
	
	stopBackgroundMusic() {
		this.musicEnabled = false;
		
		// Stop HTML audio element (the one actually playing)
		const htmlAudio = document.getElementById('backgroundMusic');
		if (htmlAudio) {
			console.log('🛑 Stopping HTML background music...');
			htmlAudio.pause();
			htmlAudio.currentTime = 0;
		}
		
		// Stop all SoundManager audio elements
		Object.values(this.audioElements).forEach(audio => {
			if (audio && !audio.paused) {
				console.log('🛑 Stopping SoundManager audio element...');
				audio.pause();
				audio.currentTime = 0;
			}
		});
		
		console.log('✅ Background music stopped');
	}
	
	playMusicFile(index) {
		console.log(`🎵 playMusicFile(${index}) called`);
		console.log(`Music enabled: ${this.musicEnabled}`);
		console.log(`Audio element exists: ${!!this.audioElements[index]}`);
		console.log(`Total audio elements: ${Object.keys(this.audioElements).length}`);
		
		if (!this.musicEnabled) {
			console.warn(`❌ Cannot play music: music system disabled`);
			return;
		}
		
		if (!this.audioElements[index]) {
			console.warn(`❌ Cannot play music file ${index}: audio element not loaded`);
			console.log('Available audio elements:', Object.keys(this.audioElements));
			return;
		}
		
		const audio = this.audioElements[index];
		console.log(`Audio ready state: ${audio.readyState}`);
		console.log(`Audio src: ${audio.src}`);
		console.log(`Audio volume: ${audio.volume}`);
		console.log(`Audio muted: ${audio.muted}`);
		console.log(`Audio paused: ${audio.paused}`);
		
		// Stop all other music first
		Object.values(this.audioElements).forEach((otherAudio, otherIndex) => {
			if (otherIndex !== index && otherAudio && !otherAudio.paused) {
				console.log(`🛑 Stopping other audio ${otherIndex}`);
				otherAudio.pause();
				otherAudio.currentTime = 0;
			}
		});
		
		// Reset and play the selected audio
		audio.currentTime = 0;
		console.log(`🎵 Attempting to play: ${this.musicFiles[index]}`);
		
		// Try to play and handle both success and failure
		const playPromise = audio.play();
		
		if (playPromise !== undefined) {
			playPromise.then(() => {
				console.log(`✓ Successfully started playing: ${this.musicFiles[index]}`);
				console.log(`Current playback time: ${audio.currentTime}`);
				console.log(`Audio duration: ${audio.duration}`);
			}).catch(error => {
				console.error(`❌ Error playing music file ${index}:`, error);
				console.error(`Error name: ${error.name}`);
				console.error(`Error message: ${error.message}`);
				
				// Try alternative approach - reload the audio
				console.log('🔄 Trying to reload audio and play again...');
				audio.load();
		setTimeout(() => {
					audio.play().catch(retryError => {
						console.error('❌ Retry also failed:', retryError);
					});
				}, 500);
			});
		}
	}
	
	changeMusicForLevel(level) {
		console.log(`🎵 changeMusicForLevel(${level}) called`);
		console.log(`Current musicEnabled status: ${this.musicEnabled}`);
		
		if (!this.musicEnabled) {
			console.log('Music disabled, not changing');
			return;
		}
		
		// Since we only have one track, just restart it
		console.log(`🎵 Level ${level}: Restarting Cyber punk.mp3`);
		
		// Stop current music
		Object.values(this.audioElements).forEach(audio => {
			if (audio && !audio.paused) {
				console.log('Stopping currently playing audio');
				audio.pause();
				audio.currentTime = 0;
			}
		});
		
		// Restart the same track
				setTimeout(() => {
			this.playMusicFile(0);
		}, 100);
	}
	
	toggleMusic() {
		this.musicEnabled = !this.musicEnabled;
		document.getElementById('musicToggle').textContent = this.musicEnabled ? '🎵 Music' : '🔇 Music';
		console.log(`Music ${this.musicEnabled ? 'enabled' : 'disabled'}`);
		
		if (this.musicEnabled) {
			this.startBackgroundMusic();
		} else {
			this.stopBackgroundMusic();
		}
		return this.musicEnabled;
	}
	
	createSound(name, duration, volume, type) {
		const audioContext = new (window.AudioContext || window.webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();
		
		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);
		
		oscillator.type = type;
		oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
		gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
		
		this.sounds[name] = { oscillator, gainNode, audioContext, duration };
	}
	
	play(name) {
		if (!this.enabled || !this.sounds[name]) return;
		
		const sound = this.sounds[name];
		const { oscillator, gainNode, audioContext, duration } = sound;
		
		// Create new instance for overlapping sounds
		const newOscillator = audioContext.createOscillator();
		const newGainNode = audioContext.createGain();
		
		newOscillator.connect(newGainNode);
		newGainNode.connect(audioContext.destination);
		
		newOscillator.type = oscillator.type;
		newOscillator.frequency.setValueAtTime(440, audioContext.currentTime);
		newGainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
		newGainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
		
		newOscillator.start();
		newOscillator.stop(audioContext.currentTime + duration / 1000);
	}
	
	toggle() {
		this.enabled = !this.enabled;
		console.log(`Sound ${this.enabled ? 'enabled' : 'disabled'}`);
		
		// Update the button text
		const soundToggle = document.getElementById('soundToggle');
		if (soundToggle) {
			soundToggle.textContent = this.enabled ? '🔊 Sound' : '🔇 Sound';
		}
		
		// Don't toggle music when sound is toggled - keep them separate
		return this.enabled;
	}
}

// Mobile Controls Handler
class MobileControls {
	constructor() {
		this.setupTouchControls();
		this.setupSoundToggle();

	}
	
	setupTouchControls() {
		const buttons = document.querySelectorAll('.dpad-btn, .control-btn');
		
		buttons.forEach(btn => {
			btn.addEventListener('touchstart', (e) => {
				e.preventDefault();
				const key = btn.dataset.key;
				if (key && game) {
					game.keys[key] = true;
					if (key === 'Space') game.player?.jump();
					if (key === 'KeyB') game.player?.placeBomb(game);
				}
			});
			
			btn.addEventListener('touchend', (e) => {
				e.preventDefault();
				const key = btn.dataset.key;
				if (key && game) {
					game.keys[key] = false;
				}
			});
			
			// Mouse support for desktop testing
			btn.addEventListener('mousedown', (e) => {
				e.preventDefault();
				const key = btn.dataset.key;
				if (key && game) {
					game.keys[key] = true;
					if (key === 'Space') game.player?.jump();
					if (key === 'KeyB') game.player?.placeBomb(game);
				}
			});
			
			btn.addEventListener('mouseup', (e) => {
				e.preventDefault();
				const key = btn.dataset.key;
				if (key && game) {
					game.keys[key] = false;
				}
			});
		});
	}
	
	setupSoundToggle() {
		console.log('🔧 Setting up sound toggle buttons...');
		
		// Setup sound toggle
		const soundToggle = document.getElementById('soundToggle');
		if (soundToggle) {
			console.log('✅ Found soundToggle element, adding click listener');
			soundToggle.addEventListener('click', () => {
				console.log('🔊 Sound toggle clicked');
				if (game && game.soundManager) {
					// Resume audio context if suspended (required by browsers)
					if (game.soundManager.audioContext && game.soundManager.audioContext.state === 'suspended') {
						game.soundManager.audioContext.resume();
					}
					game.soundManager.toggle();
				} else {
					console.warn('⚠️ Game or soundManager not available');
				}
			});
		} else {
			console.error('❌ soundToggle element not found');
		}
		
		// Setup music toggle
		const musicToggle = document.getElementById('musicToggle');
		if (musicToggle) {
			console.log('✅ Found musicToggle element, adding click listener');
			musicToggle.addEventListener('click', () => {
				console.log('🎵 Music toggle clicked');
				if (game && game.soundManager) {
					// Resume audio context if suspended (required by browsers)
					if (game.soundManager.audioContext && game.soundManager.audioContext.state === 'suspended') {
						game.soundManager.audioContext.resume();
					}
					game.soundManager.toggleMusic();
				} else {
					console.warn('⚠️ Game or soundManager not available');
				}
			});
		} else {
			console.error('❌ musicToggle element not found');
		}
		
		// Force start music on first user interaction
		document.addEventListener('click', () => {
			if (game && game.soundManager && game.soundManager.musicEnabled && !game.soundManager.audioElements[0]?.playing) {
				console.log('🎵 First user interaction detected, starting music...');
				game.soundManager.startBackgroundMusic();
			}
		}, { once: true });
		
		console.log('✅ Sound toggle setup complete');
	}
	

}

// Initialize game when page loads
let game;
let soundManager;
let mobileControls;

// Global music start function
window.startMusic = function() {
	console.log('🎵 Global startMusic() called');
	
	// Check if music is enabled
	if (game && game.soundManager && !game.soundManager.musicEnabled) {
		console.log('🎵 Music is disabled, not starting');
		return;
	}
	
	// Try HTML audio first
	const htmlAudio = document.getElementById('backgroundMusic');
	if (htmlAudio) {
		console.log('🎵 Starting HTML audio...');
		htmlAudio.volume = 0.8;
		htmlAudio.loop = true;
		
		htmlAudio.play().then(() => {
			console.log('✅ HTML audio started successfully!');
		}).catch(error => {
			console.error('❌ HTML audio failed:', error);
			
			// Try SoundManager as fallback
			if (game && game.soundManager) {
				console.log('🎵 Trying SoundManager fallback...');
				game.soundManager.startBackgroundMusic();
			}
		});
	} else {
		console.error('❌ HTML audio element not found');
	}
};

// Function to start the game
window.startGame = async function() {
	console.log('startGame() called!');
	
	// Check if Web3 is ready
	if (!window.web3Ready) {
		console.log('⏳ Waiting for Web3 to be ready...');
		setTimeout(() => {
			if (window.web3Ready) {
				console.log('✅ Web3 ready, starting game...');
				window.startGame();
			} else {
				console.error('❌ Web3 not ready after timeout');
				alert('Web3 initialization failed. Please refresh the page.');
			}
		}, 1000);
		return;
	}
	
	// Check recharge system before starting game
	if (window.rechargeManager) {
		const canPlay = window.rechargeManager.canPlay();
		if (!canPlay) {
			// Don't show popup - just return silently
			// The recharge bar will show the countdown automatically
			console.log('🔋 Player cannot play - recharge bar will show countdown');
			return;
		}
		
		// Notify recharge system that game is starting
		await window.rechargeManager.onGameStart();
		console.log('✅ Recharge system approved game start');
	}
	
	// Check if DOM is ready
	if (document.readyState !== 'complete') {
		console.log('⏳ Waiting for DOM to be ready...');
		setTimeout(() => {
			window.startGame();
		}, 500);
		return;
	}
	
	try {
		// Hide welcome menu
		const welcomeMenu = document.getElementById('welcomeMenu');
		if (welcomeMenu) {
			console.log('Hiding welcome menu...');
			welcomeMenu.style.display = 'none';
		} else {
			console.error('Welcome menu element not found!');
		}
		
		// Check if canvas exists before creating game
		const canvas = document.getElementById('gameCanvas');
		if (!canvas) {
			console.error('Canvas element not found! Cannot start game.');
			return;
		}
		console.log('Canvas found, proceeding with game initialization...');
	
		// Initialize game components
		console.log('Creating SoundManager...');
		soundManager = new SoundManager();
		
		console.log('Creating MobileControls...');
		mobileControls = new MobileControls();
		
		console.log('Creating PirateBombGame...');
		game = new PirateBombGame(); 
		window.game = game; // Make game globally accessible for enemy skills
	
		// Initialize Player Registry if wallet is connected
		if (window.walletConnection && window.walletConnection.isConnected) {
			console.log('🏴‍☠️ Initializing Player Registry for game...');
			
			// Create a working blockchain-based player registry
		window.playerRegistry = {
			// Get player's wallet address as unique identifier
			getPlayerAddress() {
				return window.walletConnection.publicKey ? window.walletConnection.publicKey.toString() : null;
			},
			
			// Sync current game state to database
			syncGameStateToDatabase() {
				if (window.playerDataManager) {
					const walletAddress = this.getPlayerAddress();
					if (walletAddress) {
						const playerProfile = {
							walletAddress: walletAddress,
							username: window.playerProfile?.username || `Kaboom_${walletAddress.slice(0, 6)}`,
							level: this.gameState.level,
							totalScore: this.gameState.totalScore,
							boomTokens: Math.floor(this.gameState.totalScore * 0.10),
							lives: this.player.lives,
							currentScore: this.gameState.currentScore
						};
						
						window.playerDataManager.savePlayerProfile(playerProfile).then(result => {
							if (result.success) {
								console.log('✅ Game state synced to database');
							} else {
								console.warn('⚠️ Failed to sync game state to database:', result.error);
							}
						});
					}
				}
			},
			
			// Load player profile from blockchain storage
			async loadPlayerProfile() {
				try {
					const playerAddress = this.getPlayerAddress();
					if (!playerAddress) {
						console.error('❌ No wallet address available');
						return null;
					}
					
					// Use localStorage as blockchain simulation (in real implementation, this would be on-chain)
					const storageKey = `kaboom_${playerAddress}`;
					const saved = localStorage.getItem(storageKey);
					
					if (saved) {
						const profile = JSON.parse(saved);
						console.log('📂 Loaded existing player profile from blockchain storage');
						console.log(`💰 Current tokens: ${profile.boomTokens}`);
						return profile;
					}
					
					return null;
				} catch (error) {
					console.error('❌ Failed to load player profile:', error);
					return null;
				}
			},
			
			// Save player profile to blockchain storage
			async savePlayerProfile(profile) {
				try {
					const playerAddress = this.getPlayerAddress();
					if (!playerAddress) {
						console.error('❌ No wallet address available');
						return false;
					}
					
					// Update last login time
					profile.lastLogin = new Date().toISOString();
					profile.updatedAt = new Date().toISOString();
					
					// Save to blockchain storage (localStorage simulation)
					const storageKey = `kaboom_${playerAddress}`;
					localStorage.setItem(storageKey, JSON.stringify(profile));
					
					console.log('💾 Player profile saved to blockchain storage');
					console.log(`💰 Updated tokens: ${profile.boomTokens}`);
					return true;
				} catch (error) {
					console.error('❌ Failed to save player profile:', error);
					return false;
				}
			},
			
			// Initialize player profile
			async initializePlayer(username) {
				try {
					console.log('🏴‍☠️ Initializing player profile...');
					
					// Check if profile already exists
					const existingProfile = await this.loadPlayerProfile();
					if (existingProfile) {
						console.log(`✅ Welcome back, ${existingProfile.username}!`);
						console.log(`💰 Your current balance: ${existingProfile.boomTokens} $BOOM tokens`);
						console.log(`📊 Blockchain level: ${existingProfile.level}, Game level: ${window.game ? window.game.gameState.level : 'N/A'}`);
						window.playerProfile = existingProfile;
						return { success: true, signature: 'blockchain_tx_signature' };
					}
					
					// Create new player profile
					const newProfile = {
						username: username,
						playerAddress: this.getPlayerAddress(),
						level: 1,
						score: 0,
						totalScore: 0,
						        						boomTokens: 0,
						achievements: [],
						lastLogin: new Date().toISOString(),
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString()
					};
					
					// Save to blockchain storage
					await this.savePlayerProfile(newProfile);
					window.playerProfile = newProfile;
					
					console.log(`✅ New player profile created! Username: ${username}`);
					console.log('💰 Starting balance: 0 $BOOM tokens');
					return { success: true, signature: 'blockchain_tx_signature' };
				} catch (error) {
					console.error('❌ Failed to initialize player profile:', error);
					return { success: false, error: error.message };
				}
			}
		};
		
		// Initialize smart contract integration
		try {
			// Initialize Player Profile Manager
			window.playerProfileManager = new PlayerProfileManager(window.walletConnection);
			const profileManagerInit = await window.playerProfileManager.initialize();
			
			if (profileManagerInit) {
				console.log('✅ Player Profile Manager initialized');
				
				// Try to load existing player profile
				const existingProfile = await window.playerProfileManager.loadPlayerProfile();
				
				if (existingProfile) {
					console.log('✅ Loaded existing player profile');
					window.playerProfile = existingProfile;
					
					// Sync game state with profile data
					if (game) {
						console.log('🔍 Before syncing profile - Game level:', game.gameState.level);
						console.log('🔍 Profile level:', existingProfile.level);
						game.gameState.level = 1; // Always start from level 1
						game.gameState.totalScore = existingProfile.totalScore || 0;
						game.gameState.currentScore = 0; // Reset current level score
						console.log(`🔄 Synced game state with profile: Level ${game.gameState.level}, Total Score: ${game.gameState.totalScore}`);
						console.log('🔍 After syncing profile - Game level:', game.gameState.level);
						
						// Update UI to reflect loaded data
						if (window.walletConnection && window.walletConnection.updatePlayerInfo) {
							window.walletConnection.updatePlayerInfo();
						}
						if (game.updateUI) {
							game.updateUI();
						}
						
						// Force update token display immediately
						const playerTokenBalance = document.getElementById('playerTokenBalance');
						if (playerTokenBalance) {
							const currentTokens = Math.floor(game.gameState.totalScore * 0.10);
							playerTokenBalance.textContent = currentTokens;
							console.log(`💰 Game loaded - Token display updated: ${currentTokens} (from score: ${game.gameState.totalScore})`);
						}
					}
				} else {
					// Create new player profile
					const playerAddress = window.walletConnection.publicKey.toString();
					const username = `Kaboom_${playerAddress.slice(0, 6)}`;
					const createResult = await window.playerProfileManager.createPlayerProfile(username);
					
					if (createResult.success) {
						console.log('✅ New player profile created');
						window.playerProfile = window.playerProfileManager.getPlayerProfile();
					} else {
						console.warn('⚠️ Failed to create player profile:', createResult.error);
					}
				}
			} else {
				console.warn('⚠️ Player Profile Manager initialization failed');
			}
			
			// Initialize Leaderboard
			window.leaderboard = new Leaderboard(window.walletConnection);
			const leaderboardInit = await window.leaderboard.initialize();
			
			if (leaderboardInit) {
				console.log('✅ Leaderboard initialized');
				// Load leaderboard data
				await window.leaderboard.loadLeaderboard();
				await window.leaderboard.getPlayerRank();
			} else {
				console.warn('⚠️ Leaderboard initialization failed');
			}
			
		} catch (error) {
			console.warn('⚠️ Smart contract integration error, but continuing with game:', error);
		}
		}
	
	// Start the game
	console.log('🎮 Starting Kaboom game...');
	await game.boot();
	

	
	console.log('✅ Game started successfully!');
	
	} catch (error) {
		console.error('❌ Game initialization failed:', error);
		console.error('Error details:', error.stack);
		alert('Error: Game initialization failed. Please refresh the page. Error: ' + error.message);
	}
};