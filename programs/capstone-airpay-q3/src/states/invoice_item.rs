use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct InvoiceItem {
    pub seed: u64,
    pub invoice_account: Pubkey, 
    pub price: u64,
    pub product_id: [u8; 32],
    pub creation_ts: u64,
    pub expiry_ts: u64,
    pub remaining: u16,
    pub count: u16,
    pub bump: u8,
}

