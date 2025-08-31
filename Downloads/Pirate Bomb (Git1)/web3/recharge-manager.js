// Recharge Manager - Handles wallet-based recharge system
class RechargeManager {
    constructor() {
        this.apiBase = window.location.origin + '/api';
        this.currentWallet = null;
        this.rechargeStatus = null;
        this.updateInterval = null;
        this.isInitialized = false;
    }

    async initialize(walletAddress) {
        try {
            // If this is a different wallet, clean up the old one
            if (this.currentWallet && this.currentWallet !== walletAddress) {
                console.log('🔋 Switching wallets, cleaning up old wallet:', this.currentWallet);
                this.stopPeriodicUpdates();
                this.rechargeStatus = null;
            }
            
            this.currentWallet = walletAddress;
            console.log('🔋 Initializing RechargeManager for wallet:', walletAddress);
            
            // Load initial recharge status
            await this.loadRechargeStatus();
            
            // Check if player has no lives and should start recharge
            if (this.rechargeStatus && this.rechargeStatus.lives_remaining === 0 && !this.rechargeStatus.is_recharging) {
                console.log('🔄 Player has no lives - starting recharge automatically');
                await this.startRecharge();
            }
            
            // Start periodic updates
            this.startPeriodicUpdates();
            
            this.isInitialized = true;
            console.log('✅ RechargeManager initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize RechargeManager:', error);
            return false;
        }
    }

    // Method to switch to a different wallet
    async switchWallet(newWalletAddress) {
        try {
            console.log('🔋 Switching RechargeManager to new wallet:', newWalletAddress);
            
            // Stop current updates
            this.stopPeriodicUpdates();
            
            // Clear current status
            this.rechargeStatus = null;
            this.isInitialized = false;
            
            // Initialize with new wallet
            return await this.initialize(newWalletAddress);
        } catch (error) {
            console.error('❌ Failed to switch wallet:', error);
            return false;
        }
    }

    async loadRechargeStatus() {
        try {
            if (!this.currentWallet) {
                console.warn('⚠️ No wallet address set for recharge status');
                return null;
            }

            const response = await fetch(`${this.apiBase}/recharge/${this.currentWallet}`);
            
            if (response.ok) {
                this.rechargeStatus = await response.json();
                console.log('🔋 Recharge status loaded:', this.rechargeStatus);
                return this.rechargeStatus;
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Failed to load recharge status:', error);
            return null;
        }
    }

    async updateLivesRemaining(lives) {
        try {
            if (!this.currentWallet) {
                console.warn('⚠️ No wallet address set for lives update');
                return false;
            }

            const response = await fetch(`${this.apiBase}/recharge/lives/${this.currentWallet}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lives_remaining: lives })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('🔋 Lives updated:', result);
                
                // Update local status
                if (this.rechargeStatus) {
                    this.rechargeStatus.lives_remaining = lives;
                }
                
                return true;
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Failed to update lives:', error);
            return false;
        }
    }

    async startRecharge() {
        console.log('🔄 Starting recharge process...');
        const success = await this.startRechargeCooldown();
        if (success) {
            // Update UI immediately after starting recharge
            await this.loadRechargeStatus();
            this.updateUI();
        }
        return success;
    }

    async startRechargeCooldown() {
        try {
            if (!this.currentWallet) {
                console.warn('⚠️ No wallet address set for recharge cooldown');
                return false;
            }

            const response = await fetch(`${this.apiBase}/recharge/start/${this.currentWallet}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('🔋 Recharge cooldown started:', result);
                
                // Update local status
                await this.loadRechargeStatus();
                
                return true;
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Failed to start recharge cooldown:', error);
            return false;
        }
    }

    async completeRecharge() {
        try {
            if (!this.currentWallet) {
                console.warn('⚠️ No wallet address set for recharge completion');
                return false;
            }

            const response = await fetch(`${this.apiBase}/recharge/complete/${this.currentWallet}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('🔋 Recharge completed:', result);
                
                // Update local status
                await this.loadRechargeStatus();
                
                return true;
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Failed to complete recharge:', error);
            return false;
        }
    }

    startPeriodicUpdates() {
        // Clear existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Update every 30 seconds for general updates
        this.updateInterval = setInterval(async () => {
            await this.loadRechargeStatus();
            this.updateUI();
        }, 30000);

        // If currently recharging, also update UI every second for countdown
        if (this.rechargeStatus && this.rechargeStatus.is_recharging) {
            this.startCountdownUpdates();
        }

        console.log('🔄 Started periodic recharge updates');
    }

    startCountdownUpdates() {
        // Clear existing countdown interval
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        // Update countdown every second
        this.countdownInterval = setInterval(() => {
            if (this.rechargeStatus && this.rechargeStatus.is_recharging) {
                // Update the countdown display without reloading from server
                this.updateCountdownDisplay();
            } else {
                // Stop countdown updates if not recharging
                this.stopCountdownUpdates();
            }
        }, 1000);

        console.log('⏰ Started countdown updates');
    }

    stopCountdownUpdates() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
            console.log('⏰ Stopped countdown updates');
        }
    }

    updateCountdownDisplay() {
        const rechargeFill = document.getElementById('rechargeFill');
        const rechargeText = document.getElementById('rechargeText');

        if (!rechargeFill || !rechargeText || !this.rechargeStatus) {
            return;
        }

        // Calculate current time remaining
        const now = new Date();
        const cooldownEnd = new Date(this.rechargeStatus.recharge_cooldown_end);
        const remainingMs = Math.max(0, cooldownEnd - now);

        if (remainingMs <= 0) {
            // Recharge complete
            this.rechargeStatus.is_recharging = false;
            this.rechargeStatus.time_remaining_ms = 0;
            this.stopCountdownUpdates();
            this.updateUI();
            return;
        }

        // Update progress bar
        const totalCooldownMs = 45 * 60 * 1000;
        const progressPercent = Math.max(0, Math.min(100, ((totalCooldownMs - remainingMs) / totalCooldownMs) * 100));
        rechargeFill.style.width = progressPercent + '%';

        // Update countdown text
        const minutesRemaining = Math.floor(remainingMs / (1000 * 60));
        const secondsRemaining = Math.floor((remainingMs % (1000 * 60)) / 1000);
        rechargeText.textContent = `Recharging... ${minutesRemaining}:${secondsRemaining.toString().padStart(2, '0')}`;
    }

    stopPeriodicUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('🛑 Stopped periodic recharge updates');
        }
        this.stopCountdownUpdates();
    }

    updateUI() {
        const rechargeFill = document.getElementById('rechargeFill');
        const rechargeText = document.getElementById('rechargeText');
        const startButton = document.getElementById('startButton');

        if (!rechargeFill || !rechargeText) {
            return;
        }

        // Handle case when no wallet is connected or no recharge status
        if (!this.currentWallet || !this.rechargeStatus) {
            rechargeFill.style.width = '0%';
            rechargeFill.classList.remove('charging', 'depleted');
            rechargeText.textContent = 'Connect wallet to play';
            
            if (startButton) {
                startButton.disabled = true;
                startButton.style.opacity = '0.5';
            }
            return;
        }

        if (this.rechargeStatus.is_recharging) {
            // Calculate recharge progress (45 minutes = 2700 seconds)
            const totalCooldownMs = 45 * 60 * 1000; // 45 minutes in milliseconds
            const remainingMs = this.rechargeStatus.time_remaining_ms;
            const progressPercent = Math.max(0, Math.min(100, ((totalCooldownMs - remainingMs) / totalCooldownMs) * 100));
            
            rechargeFill.style.width = progressPercent + '%';
            rechargeFill.classList.remove('charging', 'depleted');
            rechargeFill.classList.add('charging');
            
            // Show precise countdown with minutes and seconds
            const minutesRemaining = Math.floor(remainingMs / (1000 * 60));
            const secondsRemaining = Math.floor((remainingMs % (1000 * 60)) / 1000);
            rechargeText.textContent = `Recharging... ${minutesRemaining}:${secondsRemaining.toString().padStart(2, '0')}`;
            
            // Start countdown updates for real-time countdown
            this.startCountdownUpdates();
            
            // Disable start button during recharge
            if (startButton) {
                startButton.disabled = true;
                startButton.style.opacity = '0.5';
            }
        } else {
            // Not recharging - show lives status
            const livesPercent = (this.rechargeStatus.lives_remaining / 3) * 100;
            rechargeFill.style.width = livesPercent + '%';
            rechargeFill.classList.remove('charging', 'depleted');
            
            if (this.rechargeStatus.lives_remaining === 0) {
                // Check if we should start recharge countdown
                if (!this.rechargeStatus.is_recharging) {
                    // Start the recharge process automatically
                    console.log('🔄 No lives remaining - starting recharge countdown');
                    this.startRecharge();
                } else {
                    // Already recharging - show countdown
                    rechargeFill.classList.add('depleted');
                    const minutesRemaining = Math.floor(this.rechargeStatus.time_remaining_ms / (1000 * 60));
                    const secondsRemaining = Math.floor((this.rechargeStatus.time_remaining_ms % (1000 * 60)) / 1000);
                    rechargeText.textContent = `Recharging... ${minutesRemaining}:${secondsRemaining.toString().padStart(2, '0')}`;
                    
                    // Start countdown updates for real-time countdown
                    this.startCountdownUpdates();
                }
                
                // Disable start button when no lives
                if (startButton) {
                    startButton.disabled = true;
                    startButton.style.opacity = '0.5';
                }
            } else if (this.rechargeStatus.lives_remaining < 3) {
                rechargeFill.classList.add('charging');
                rechargeText.textContent = `${this.rechargeStatus.lives_remaining}/3 lives remaining`;
                
                // Enable start button when lives available
                if (startButton) {
                    startButton.disabled = false;
                    startButton.style.opacity = '1';
                }
            } else {
                rechargeText.textContent = 'Ready to Kaboom!';
                
                // Enable start button when fully charged
                if (startButton) {
                    startButton.disabled = false;
                    startButton.style.opacity = '1';
                }
            }
        }
    }

    canPlay() {
        if (!this.rechargeStatus) {
            return false;
        }
        return this.rechargeStatus.can_play;
    }

    getLivesRemaining() {
        if (!this.rechargeStatus) {
            return 3; // Default for new wallets
        }
        return this.rechargeStatus.lives_remaining;
    }

    isRecharging() {
        if (!this.rechargeStatus) {
            return false;
        }
        return this.rechargeStatus.is_recharging;
    }

    getTimeRemaining() {
        if (!this.rechargeStatus) {
            return 0;
        }
        return this.rechargeStatus.time_remaining_ms;
    }

    getCurrentWallet() {
        return this.currentWallet;
    }

    getDebugInfo() {
        return {
            currentWallet: this.currentWallet,
            isInitialized: this.isInitialized,
            rechargeStatus: this.rechargeStatus,
            hasUpdateInterval: !!this.updateInterval
        };
    }

    async onPlayerDeath() {
        try {
            const currentLives = this.getLivesRemaining();
            const newLives = Math.max(0, currentLives - 1);
            
            console.log(`💀 Player died! Lives: ${currentLives} → ${newLives}`);
            
            // Update lives in database
            await this.updateLivesRemaining(newLives);
            
            // If no lives remaining, start recharge cooldown
            if (newLives === 0) {
                console.log('🔋 No lives remaining, starting 45-minute recharge cooldown');
                await this.startRechargeCooldown();
            }
            
            // Update UI
            this.updateUI();
            
            return newLives;
        } catch (error) {
            console.error('❌ Error handling player death:', error);
            return this.getLivesRemaining();
        }
    }

    async onGameStart() {
        try {
            // Check if player can play
            if (!this.canPlay()) {
                console.warn('⚠️ Player cannot start game - recharging or no lives');
                return false;
            }
            
            console.log('🎮 Game started - recharge system active');
            return true;
        } catch (error) {
            console.error('❌ Error on game start:', error);
            return false;
        }
    }

    destroy() {
        this.stopPeriodicUpdates();
        this.currentWallet = null;
        this.rechargeStatus = null;
        this.isInitialized = false;
        console.log('🗑️ RechargeManager destroyed');
    }

    // Clear recharge status when wallet disconnects
    clearStatus() {
        console.log('🔋 Clearing RechargeManager status');
        
        // Stop periodic updates
        this.stopPeriodicUpdates();
        
        // Clear current status
        this.rechargeStatus = null;
        this.isInitialized = false;
        this.currentWallet = null;
        
        // Update UI to show disconnected state
        this.updateUI();
        
        console.log('🔋 RechargeManager status cleared');
    }
}

// Export for use in other modules
window.RechargeManager = RechargeManager;
