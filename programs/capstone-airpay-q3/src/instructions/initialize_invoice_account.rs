use anchor_lang::prelude::*;
use anchor_spl::{
    token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked},
    associated_token::AssociatedToken,
};

use crate::states::InvoiceAccount;
use crate::states::Config;

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct InitializeInvoiceAccount<'info> {
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub merchant: Signer<'info>,
    #[account(
        init,
        payer = merchant,
        seeds = [b"invoice_account", merchant.key().as_ref(), mint.key().as_ref(), seed.to_le_bytes().as_ref()],
        space = 8 + InvoiceAccount::INIT_SPACE,
        bump,
    )]
    pub invoice_account: Account<'info, InvoiceAccount>,
    #[account(
        mint::token_program = token_program
    )]
    pub mint: InterfaceAccount<'info, Mint>,
   /// Fee vault that must exist for this mint (proves mint is whitelisted)
   /// If not, this will throw error
   #[account(
       associated_token::mint = mint,
       associated_token::authority = config,
       associated_token::token_program = token_program,
   )]
   pub fee_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init,
        payer = merchant,
        associated_token::mint = mint,
        associated_token::authority = invoice_account,
        associated_token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,

}

impl<'info> InitializeInvoiceAccount<'info> {
    pub fn initialize_invoice_account(&mut self, seed: u64, bumps: &InitializeInvoiceAccountBumps) -> Result<()> {
        // Already checked if mint is whitelisted by verifying the proper fee_vault exists
        self.invoice_account.set_inner(
            InvoiceAccount { 
                seed, 
                merchant: self.merchant.key(), 
                mint: self.mint.key(),
                vault: self.vault.key(),
                fee_vault: self.fee_vault.key(),
                fee: self.config.fee,
                basis_points: self.config.basis_points,
                bump: bumps.invoice_account
            }
        );
        Ok(())

    }
}


