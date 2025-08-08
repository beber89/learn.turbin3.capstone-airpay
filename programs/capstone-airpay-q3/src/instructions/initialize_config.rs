use anchor_lang::prelude::*;
use anchor_spl::{
    token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked},
    associated_token::AssociatedToken,
};

use crate::states::Config;

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        seeds = [b"config", admin.key().as_ref(), seed.to_le_bytes().as_ref()],
        space = 8 + Config::INIT_SPACE,
        bump,
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,

}

impl<'info> InitializeConfig<'info> {
    pub fn initialize_config(
        &mut self, 
        fee: u16, 
        basis_points: u16, 
        seed: u64,
        bumps: &InitializeConfigBumps
    ) -> Result<()> {
        self.config.set_inner(
            Config { 
                seed, 
                admin: self.admin.key(),
                fee,
                basis_points,
                bump: bumps.config
            }
        );
        Ok(())

    }
}

