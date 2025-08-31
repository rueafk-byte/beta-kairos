use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("AdmiralToken111111111111111111111111111111111");

#[program]
pub mod admiral_token {
    use super::*;

    // Initialize the $ADMIRAL token
    pub fn initialize_token(
        ctx: Context<InitializeToken>,
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: u64,
    ) -> Result<()> {
        let token_mint = &mut ctx.accounts.token_mint;
        let authority = &ctx.accounts.authority;
        let system_program = &ctx.accounts.system_program;
        let token_program = &ctx.accounts.token_program;
        let rent = &ctx.accounts.rent;

        // Initialize the token mint
        token::initialize_mint(
            CpiContext::new(
                token_program.to_account_info(),
                token::InitializeMint {
                    mint: token_mint.to_account_info(),
                    rent: rent.to_account_info(),
                },
            ),
            decimals,
            authority,
            Some(authority),
        )?;

        // Create token account for the authority
        let cpi_accounts = token::MintTo {
            mint: token_mint.to_account_info(),
            to: ctx.accounts.authority_token_account.to_account_info(),
            authority: authority.to_account_info(),
        };

        let cpi_program = token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, total_supply)?;

        msg!("$ADMIRAL token initialized successfully!");
        msg!("Name: {}", name);
        msg!("Symbol: {}", symbol);
        msg!("Decimals: {}", decimals);
        msg!("Total Supply: {}", total_supply);

        Ok(())
    }

    // Transfer $ADMIRAL tokens (for premium rewards)
    pub fn transfer_tokens(
        ctx: Context<TransferTokens>,
        amount: u64,
    ) -> Result<()> {
        let cpi_accounts = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        msg!("Transferred {} $ADMIRAL tokens", amount);
        Ok(())
    }

    // Mint additional tokens (for premium rewards)
    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
    ) -> Result<()> {
        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, amount)?;

        msg!("Minted {} $ADMIRAL tokens", amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeToken<'info> {
    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = authority.key(),
    )]
    pub token_mint: Account<'info, token::Mint>,
    
    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = authority,
    )]
    pub authority_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, token::Mint>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
