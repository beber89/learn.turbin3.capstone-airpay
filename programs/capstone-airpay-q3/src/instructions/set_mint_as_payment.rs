use anchor_lang::prelude::*;
use anchor_spl::{
    token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked},
    associated_token::AssociatedToken,
};

use crate::states::Config;

#[derive(Accounts)]
pub struct SetMintAsPayment<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    pub config: Account<'info, Config>,
    // this mint specifies the Token in which the fees are being paid in
    #[account(
        mint::token_program = token_program
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    /// Vault needed to collect payment fees
    #[account(
        init,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = config,
        associated_token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,

}

impl<'info> SetMintAsPayment <'info> {

    /// This creates a vault for the Mint being whitelisted
    /// Checking 
    pub fn set_mint_as_payment (
        &mut self, 
    ) -> Result<()> {
        Ok(())

    }
}

