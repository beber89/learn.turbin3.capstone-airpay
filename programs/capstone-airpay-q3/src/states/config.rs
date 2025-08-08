use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config{
    pub seed: u64,
    pub admin: Pubkey,
    /// fee is the amount deducted by protocol in transfers
    pub fee: u16,
    /// basis_points represent the units of fees
    pub basis_points: u16,
    pub bump: u8,
}

