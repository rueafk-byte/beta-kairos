use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use std::collections::HashMap;

declare_id!("PLYRrgstry111111111111111111111111111111111");

#[program]
pub mod player_registry {
    use super::*;

    /// Initialize a new player profile
    pub fn initialize_player(
        ctx: Context<InitializePlayer>,
        username: String,
    ) -> Result<()> {
        let player_profile = &mut ctx.accounts.player_profile;
        let clock = Clock::get()?;
        
        // Validate username length
        require!(
            username.len() >= 3 && username.len() <= 20,
            PlayerRegistryError::InvalidUsername
        );
        
        // Initialize player data
        player_profile.player = ctx.accounts.player.key();
        player_profile.username = username;
        player_profile.level = 1;
        player_profile.score = 0;
        player_profile.total_score = 0;
        player_profile.pirate_tokens = 0;
        player_profile.admiral_tokens = 0;
        player_profile.total_levels_completed = 0;
        player_profile.total_bosses_defeated = 0;
        player_profile.achievements = Vec::new();
        player_profile.achievement_count = 0;
        player_profile.last_daily_claim = 0;
        player_profile.last_weekly_claim = 0;
        player_profile.created_at = clock.unix_timestamp;
        player_profile.updated_at = clock.unix_timestamp;
        player_profile.is_active = true;
        player_profile.streak_days = 0;
        player_profile.last_login = clock.unix_timestamp;

        msg!("Player profile initialized for: {}", ctx.accounts.player.key());
        msg!("Username: {}", player_profile.username);
        Ok(())
    }

    /// Update player's level and score
    pub fn update_player_level(
        ctx: Context<UpdatePlayerLevel>,
        new_level: u8,
        new_score: u64,
        level_completed: bool,
    ) -> Result<()> {
        let player_profile = &mut ctx.accounts.player_profile;
        let clock = Clock::get()?;
        
        // Validate level progression
        require!(
            new_level >= player_profile.level && new_level <= 40,
            PlayerRegistryError::InvalidLevelProgression
        );
        
        require!(
            new_score >= player_profile.score,
            PlayerRegistryError::InvalidScore
        );

        // Update player data
        let old_level = player_profile.level;
        player_profile.level = new_level;
        player_profile.score = new_score;
        player_profile.total_score = player_profile.total_score.saturating_add(new_score);
        player_profile.updated_at = clock.unix_timestamp;
        player_profile.last_login = clock.unix_timestamp;

        // Handle level completion
        if level_completed && new_level > old_level {
            player_profile.total_levels_completed = player_profile.total_levels_completed.saturating_add(1);
            
            // Award tokens for level completion
            let level_reward = calculate_level_reward(new_level);
            player_profile.pirate_tokens = player_profile.pirate_tokens.saturating_add(level_reward);
            
            msg!("Level {} completed! Reward: {} $PIRATE", new_level, level_reward);
        }

        msg!("Player level updated to: {}", new_level);
        msg!("Total score: {}", player_profile.total_score);
        Ok(())
    }

    /// Add achievement to player profile
    pub fn add_achievement(
        ctx: Context<AddAchievement>,
        achievement_id: String,
        achievement_name: String,
        reward_amount: u64,
    ) -> Result<()> {
        let player_profile = &mut ctx.accounts.player_profile;
        let clock = Clock::get()?;
        
        // Check if achievement already exists
        require!(
            !player_profile.achievements.contains(&achievement_id),
            PlayerRegistryError::AchievementAlreadyExists
        );

        // Validate achievement data
        require!(
            achievement_id.len() <= 50 && achievement_name.len() <= 100,
            PlayerRegistryError::InvalidAchievementData
        );

        // Add achievement
        player_profile.achievements.push(achievement_id.clone());
        player_profile.achievement_count = player_profile.achievement_count.saturating_add(1);
        player_profile.updated_at = clock.unix_timestamp;

        // Award tokens for achievement
        if reward_amount > 0 {
            player_profile.pirate_tokens = player_profile.pirate_tokens.saturating_add(reward_amount);
            msg!("Achievement unlocked: {}! Reward: {} $PIRATE", achievement_name, reward_amount);
        } else {
            msg!("Achievement unlocked: {}!", achievement_name);
        }

        Ok(())
    }

    /// Record boss defeat
    pub fn record_boss_defeat(
        ctx: Context<RecordBossDefeat>,
        boss_id: String,
        boss_level: u8,
        reward_amount: u64,
    ) -> Result<()> {
        let player_profile = &mut ctx.accounts.player_profile;
        let clock = Clock::get()?;
        
        // Update boss defeat stats
        player_profile.total_bosses_defeated = player_profile.total_bosses_defeated.saturating_add(1);
        player_profile.updated_at = clock.unix_timestamp;

        // Award tokens for boss defeat
        if reward_amount > 0 {
            player_profile.pirate_tokens = player_profile.pirate_tokens.saturating_add(reward_amount);
            msg!("Boss {} defeated! Reward: {} $PIRATE", boss_id, reward_amount);
        }

        msg!("Boss defeat recorded: {} (Level {})", boss_id, boss_level);
        Ok(())
    }

    /// Claim daily reward
    pub fn claim_daily_reward(
        ctx: Context<ClaimDailyReward>,
    ) -> Result<()> {
        let player_profile = &mut ctx.accounts.player_profile;
        let clock = Clock::get()?;
        
        // Check if enough time has passed since last claim
        let time_since_last_claim = clock.unix_timestamp.saturating_sub(player_profile.last_daily_claim);
        require!(
            time_since_last_claim >= 86400, // 24 hours in seconds
            PlayerRegistryError::DailyRewardNotReady
        );

        // Calculate daily reward
        let daily_reward = calculate_daily_reward(player_profile.streak_days);
        
        // Update player data
        player_profile.pirate_tokens = player_profile.pirate_tokens.saturating_add(daily_reward);
        player_profile.last_daily_claim = clock.unix_timestamp;
        player_profile.streak_days = player_profile.streak_days.saturating_add(1);
        player_profile.updated_at = clock.unix_timestamp;

        msg!("Daily reward claimed: {} $PIRATE", daily_reward);
        msg!("Streak: {} days", player_profile.streak_days);
        Ok(())
    }

    /// Claim weekly reward
    pub fn claim_weekly_reward(
        ctx: Context<ClaimWeeklyReward>,
    ) -> Result<()> {
        let player_profile = &mut ctx.accounts.player_profile;
        let clock = Clock::get()?;
        
        // Check if enough time has passed since last claim
        let time_since_last_claim = clock.unix_timestamp.saturating_sub(player_profile.last_weekly_claim);
        require!(
            time_since_last_claim >= 604800, // 7 days in seconds
            PlayerRegistryError::WeeklyRewardNotReady
        );

        // Calculate weekly reward based on player activity
        let weekly_reward = calculate_weekly_reward(
            player_profile.total_levels_completed,
            player_profile.total_bosses_defeated,
            player_profile.achievement_count,
        );
        
        // Update player data
        player_profile.admiral_tokens = player_profile.admiral_tokens.saturating_add(weekly_reward);
        player_profile.last_weekly_claim = clock.unix_timestamp;
        player_profile.updated_at = clock.unix_timestamp;

        msg!("Weekly reward claimed: {} $ADMIRAL", weekly_reward);
        Ok(())
    }

    /// Update player login time
    pub fn update_login_time(
        ctx: Context<UpdateLoginTime>,
    ) -> Result<()> {
        let player_profile = &mut ctx.accounts.player_profile;
        let clock = Clock::get()?;
        
        player_profile.last_login = clock.unix_timestamp;
        player_profile.updated_at = clock.unix_timestamp;

        msg!("Login time updated for player: {}", player_profile.username);
        Ok(())
    }

    /// Transfer tokens to player's wallet
    pub fn transfer_tokens_to_player(
        ctx: Context<TransferTokens>,
        amount: u64,
        token_type: TokenType,
    ) -> Result<()> {
        let player_profile = &mut ctx.accounts.player_profile;
        
        // Check if player has enough tokens
        let available_tokens = match token_type {
            TokenType::Pirate => player_profile.pirate_tokens,
            TokenType::Admiral => player_profile.admiral_tokens,
        };
        
        require!(
            available_tokens >= amount,
            PlayerRegistryError::InsufficientTokens
        );

        // Transfer tokens from treasury to player
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.treasury_token_account.to_account_info(),
                to: ctx.accounts.player_token_account.to_account_info(),
                authority: ctx.accounts.treasury_authority.to_account_info(),
            },
        );
        
        token::transfer(transfer_ctx, amount)?;

        // Update player's token balance
        match token_type {
            TokenType::Pirate => {
                player_profile.pirate_tokens = player_profile.pirate_tokens.saturating_sub(amount);
            },
            TokenType::Admiral => {
                player_profile.admiral_tokens = player_profile.admiral_tokens.saturating_sub(amount);
            },
        }

        msg!("Transferred {} {} tokens to player", amount, token_type.to_string());
        Ok(())
    }

    /// Deactivate player account
    pub fn deactivate_player(
        ctx: Context<DeactivatePlayer>,
    ) -> Result<()> {
        let player_profile = &mut ctx.accounts.player_profile;
        let clock = Clock::get()?;
        
        player_profile.is_active = false;
        player_profile.updated_at = clock.unix_timestamp;

        msg!("Player account deactivated: {}", player_profile.username);
        Ok(())
    }
}

// Helper functions
fn calculate_level_reward(level: u8) -> u64 {
    match level {
        1..=10 => 10 + (level as u64 * 5),
        11..=20 => 60 + ((level - 10) as u64 * 10),
        21..=30 => 160 + ((level - 20) as u64 * 20),
        31..=40 => 360 + ((level - 30) as u64 * 40),
        _ => 1000,
    }
}

fn calculate_daily_reward(streak_days: u32) -> u64 {
    let base_reward = 25;
    let streak_bonus = (streak_days as u64).saturating_mul(5);
    base_reward.saturating_add(streak_bonus).min(100) // Cap at 100 tokens
}

fn calculate_weekly_reward(levels_completed: u32, bosses_defeated: u32, achievements: u32) -> u64 {
    let base_reward = 10;
    let level_bonus = (levels_completed as u64).saturating_mul(2);
    let boss_bonus = (bosses_defeated as u64).saturating_mul(5);
    let achievement_bonus = (achievements as u64).saturating_mul(3);
    
    base_reward
        .saturating_add(level_bonus)
        .saturating_add(boss_bonus)
        .saturating_add(achievement_bonus)
        .min(100) // Cap at 100 tokens
}

// Account structures
#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    #[account(
        init,
        payer = player,
        space = 8 + PlayerProfile::INIT_SPACE,
        seeds = [b"player_profile", player.key().as_ref()],
        bump
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePlayerLevel<'info> {
    #[account(
        mut,
        seeds = [b"player_profile", player.key().as_ref()],
        bump,
        has_one = player
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddAchievement<'info> {
    #[account(
        mut,
        seeds = [b"player_profile", player.key().as_ref()],
        bump,
        has_one = player
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct RecordBossDefeat<'info> {
    #[account(
        mut,
        seeds = [b"player_profile", player.key().as_ref()],
        bump,
        has_one = player
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimDailyReward<'info> {
    #[account(
        mut,
        seeds = [b"player_profile", player.key().as_ref()],
        bump,
        has_one = player
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWeeklyReward<'info> {
    #[account(
        mut,
        seeds = [b"player_profile", player.key().as_ref()],
        bump,
        has_one = player
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateLoginTime<'info> {
    #[account(
        mut,
        seeds = [b"player_profile", player.key().as_ref()],
        bump,
        has_one = player
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(
        mut,
        seeds = [b"player_profile", player.key().as_ref()],
        bump,
        has_one = player
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,
    
    pub treasury_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DeactivatePlayer<'info> {
    #[account(
        mut,
        seeds = [b"player_profile", player.key().as_ref()],
        bump,
        has_one = player
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    pub player: Signer<'info>,
}

// Data structures
#[account]
#[derive(InitSpace)]
pub struct PlayerProfile {
    pub player: Pubkey,
    pub username: String,
    pub level: u8,
    pub score: u64,
    pub total_score: u64,
    pub pirate_tokens: u64,
    pub admiral_tokens: u64,
    pub total_levels_completed: u32,
    pub total_bosses_defeated: u32,
    pub achievements: Vec<String>,
    pub achievement_count: u32,
    pub last_daily_claim: i64,
    pub last_weekly_claim: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub is_active: bool,
    pub streak_days: u32,
    pub last_login: i64,
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TokenType {
    Pirate,
    Admiral,
}

impl TokenType {
    pub fn to_string(&self) -> String {
        match self {
            TokenType::Pirate => "PIRATE".to_string(),
            TokenType::Admiral => "ADMIRAL".to_string(),
        }
    }
}

// Error codes
#[error_code]
pub enum PlayerRegistryError {
    #[msg("Invalid username length")]
    InvalidUsername,
    #[msg("Invalid level progression")]
    InvalidLevelProgression,
    #[msg("Invalid score")]
    InvalidScore,
    #[msg("Achievement already exists")]
    AchievementAlreadyExists,
    #[msg("Invalid achievement data")]
    InvalidAchievementData,
    #[msg("Daily reward not ready")]
    DailyRewardNotReady,
    #[msg("Weekly reward not ready")]
    WeeklyRewardNotReady,
    #[msg("Insufficient tokens")]
    InsufficientTokens,
}
