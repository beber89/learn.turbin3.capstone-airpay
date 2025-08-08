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
        seeds = [b"invoice_account", merchant.key().as_ref(), seed.to_le_bytes().as_ref()],
        space = 8 + InvoiceAccount::INIT_SPACE,
        bump,
    )]
    pub invoice_account: Account<'info, InvoiceAccount>,
    #[account(
        mint::token_program = token_program
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        associated_token::mint = mint,
        associated_token::authority = invoice_account,
        associated_token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,

}

impl<'info> InitializeInvoiceAccount<'info> {
    pub fn initialize_invoice_account(&mut self, seed: u64, bumps: &InitializeInvoiceAccountBumps) -> Result<()> {
        self.invoice_account.set_inner(
            InvoiceAccount { 
                seed, 
                merchant: self.merchant.key(), 
                mint: self.mint.key(), 
                bump: bumps.invoice_account
            }
        );
        Ok(())

    }
}

