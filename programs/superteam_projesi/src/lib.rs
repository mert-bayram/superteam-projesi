pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("CTeg9XE3b6WEMgKJhXtWFZbQWgcEWMp5SWKNrsG42P6R");

#[program]
pub mod superteam_projesi {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        crate::instructions::initialize::handle_initialize(ctx)
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        crate::instructions::increment::handle_increment(ctx)
    }

    pub fn send_tip(
        ctx: Context<SendTip>,
        tip_id: u64,
        amount: u64,
        message: Option<String>,
    ) -> Result<()> {
        require!(amount > 0, crate::error::ErrorCode::ZeroAmount);
        if let Some(text) = &message {
            require!(
                text.len() <= MAX_TIP_MESSAGE_BYTES,
                crate::error::ErrorCode::MessageTooLong
            );
        }

        let tip_record = &mut ctx.accounts.tip_record;
        tip_record.donor = ctx.accounts.donor.key();
        tip_record.streamer = ctx.accounts.streamer.key();
        tip_record.amount = amount;
        tip_record.tip_id = tip_id;
        tip_record.message = message;

        let transfer_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.donor.to_account_info(),
            to: ctx.accounts.streamer.to_account_info(),
        };
        let transfer_context = CpiContext::new(
            anchor_lang::system_program::ID,
            transfer_accounts,
        );
        anchor_lang::system_program::transfer(transfer_context, amount)?;

        msg!("Tip of {} lamports sent to {}", amount, tip_record.streamer);
        Ok(())
    }
}

pub const MAX_TIP_MESSAGE_BYTES: usize = 140;

#[derive(Accounts)]
#[instruction(tip_id: u64)]
pub struct SendTip<'info> {
    #[account(mut)]
    pub donor: Signer<'info>,
    /// CHECK: The recipient is only used as the SOL transfer destination.
    #[account(
        mut,
        constraint = streamer.key() != donor.key() @ crate::error::ErrorCode::SelfTip
    )]
    pub streamer: UncheckedAccount<'info>,
    #[account(
        init,
        payer = donor,
        space = 8 + TipRecord::INIT_SPACE,
        seeds = [b"tip", donor.key().as_ref(), &tip_id.to_le_bytes()],
        bump
    )]
    pub tip_record: Account<'info, TipRecord>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct TipRecord {
    pub donor: Pubkey,
    pub streamer: Pubkey,
    pub amount: u64,
    pub tip_id: u64,
    #[max_len(140)]
    pub message: Option<String>,
}

