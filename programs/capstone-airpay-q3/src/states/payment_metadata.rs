use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PaymentMetadata {
    pub invoice_item_account: Pubkey, 
    pub price_paid: u64,
    pub item_seq_number: u16,
    // Hash value of {name: , phone: , address: }
    pub buyer_metadata: [u8; 32], 
    pub bump: u8,
}

