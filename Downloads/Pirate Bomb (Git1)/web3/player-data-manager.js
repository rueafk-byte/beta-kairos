class PlayerDataManager {
    constructor() {
        // Configure API base URL - use port 3000 for backend API
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
            this.apiBase = 'http://localhost:3000/api';
        } else {
            this.apiBase = window.location.origin + '/api';
        }
        
        this.isConnected = false;
        this.checkConnection();
    }
    
    async checkConnection() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            this.isConnected = response.ok;
            console.log(this.isConnected ? '✅ Database connected' : '❌ Database offline');
        } catch (error) {
            this.isConnected = false;
            console.log('❌ Database connection failed:', error.message);
        }
    }
    
    async savePlayerProfile(profile) {
        console.log('🔄 PlayerDataManager.savePlayerProfile called with:', profile);
        console.log('Database connection status:', this.isConnected);
        
        if (!this.isConnected) {
            console.warn('⚠️ Database offline, saving to localStorage only');
            this.saveToLocalStorage(profile);
            return { success: false, error: 'Database offline' };
        }
        
        try {
            const response = await fetch(`${this.apiBase}/players`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    wallet_address: profile.walletAddress,
                    username: profile.username,
                    level: profile.level || 1,
                    total_score: profile.totalScore || 0,
                    boom_tokens: profile.boomTokens || 0,
                    lives: profile.lives || 3,
                    current_score: profile.currentScore || 0
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Player data saved to database:', result);
                
                // Also save to localStorage as backup
                this.saveToLocalStorage(profile);
                
                return { success: true, data: result };
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error saving to database:', error);
            
            // Fallback to localStorage
            this.saveToLocalStorage(profile);
            
            return { success: false, error: error.message };
        }
    }
    
    async updatePlayerProgress(walletAddress, progress) {
        if (!this.isConnected) {
            console.warn('⚠️ Database offline, updating localStorage only');
            return { success: false, error: 'Database offline' };
        }
        
        try {
            const response = await fetch(`${this.apiBase}/players/${walletAddress}/progress`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    level: progress.level || 1,
                    total_score: progress.totalScore || 0,
                    boom_tokens: progress.boomTokens || 0,
                    lives: progress.lives || 3,
                    current_score: progress.currentScore || 0
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Player progress updated in database:', result);
                return { success: true, data: result };
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error updating progress:', error);
            return { success: false, error: error.message };
        }
    }
    
    async loadPlayerProfile(walletAddress) {
        if (!this.isConnected) {
            console.warn('⚠️ Database offline, loading from localStorage');
            return this.loadFromLocalStorage(walletAddress);
        }
        
        try {
            const response = await fetch(`${this.apiBase}/players/${walletAddress}`);
            
            if (response.ok) {
                const profile = await response.json();
                console.log('✅ Player profile loaded from database:', profile);
                
                // Convert database format to game format
                return {
                    walletAddress: profile.wallet_address,
                    username: profile.username,
                    level: profile.level,
                    totalScore: profile.total_score,
                    boomTokens: profile.boom_tokens,
                    lives: profile.lives,
                    currentScore: profile.current_score,
                    lastUpdated: profile.last_updated
                };
            } else if (response.status === 404) {
                console.log('📝 Player not found in database, creating new profile');
                return null;
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error loading from database:', error);
            
            // Fallback to localStorage
            return this.loadFromLocalStorage(walletAddress);
        }
    }
    
    saveToLocalStorage(profile) {
        try {
            const storageKey = `kaboom_${profile.walletAddress}`;
            localStorage.setItem(storageKey, JSON.stringify(profile));
            console.log('💾 Player data saved to localStorage');
        } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
        }
    }
    
    loadFromLocalStorage(walletAddress) {
        try {
            const storageKey = `kaboom_${walletAddress}`;
            const savedData = localStorage.getItem(storageKey);
            
            if (savedData) {
                const profile = JSON.parse(savedData);
                console.log('📂 Player data loaded from localStorage:', profile);
                return profile;
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error loading from localStorage:', error);
            return null;
        }
    }
    
    async syncLocalToDatabase() {
        if (!this.isConnected) {
            console.warn('⚠️ Database offline, cannot sync');
            return;
        }
        
        try {
            // Find all localStorage entries that start with 'kaboom_'
            const localProfiles = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('kaboom_')) {
                    const walletAddress = key.replace('kaboom_', '');
                    const profileData = localStorage.getItem(key);
                    
                    if (profileData) {
                        try {
                            const profile = JSON.parse(profileData);
                            localProfiles.push(profile);
                        } catch (error) {
                            console.error('❌ Error parsing localStorage data:', error);
                        }
                    }
                }
            }
            
            console.log(`🔄 Syncing ${localProfiles.length} local profiles to database...`);
            
            // Sync each profile to database
            for (const profile of localProfiles) {
                await this.savePlayerProfile(profile);
            }
            
            console.log('✅ Local profiles synced to database');
        } catch (error) {
            console.error('❌ Error syncing to database:', error);
        }
    }
}

// Export for use in other modules
window.PlayerDataManager = PlayerDataManager;
