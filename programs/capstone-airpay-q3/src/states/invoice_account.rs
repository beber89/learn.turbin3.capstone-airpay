use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct InvoiceAccount {
    pub seed: u64,
    pub merchant: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub fee_vault: Pubkey,
    pub fee: u16,
    pub basis_points: u16,
    pub invoice_account_sequence_number: u32,
    pub bump: u8,
}

