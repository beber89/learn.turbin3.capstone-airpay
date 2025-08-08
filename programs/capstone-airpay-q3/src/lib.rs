#![allow(unexpected_cfgs, deprecated)]
use anchor_lang::prelude::*;

pub mod states;
pub mod instructions;

use states::*;
use instructions::*;



declare_id!("J4aBD9W7P8sij5dLP4KZLiJZrCZXoRFazpGaVhcZuwZZ");

#[program]
pub mod capstone_airpay_q3 {
    use crate::instructions::InitializeInvoiceAccount;

    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>, 
        seed: u64 ,
        fee: u16, 
        basis_points: u16
    ) -> Result<()> {
        ctx.accounts.initialize_config(fee, basis_points,  seed, &ctx.bumps)?;
        Ok(())
    }

    pub fn initialize_invoice_account(ctx: Context<InitializeInvoiceAccount>, seed: u64 ) -> Result<()> {
        ctx.accounts.initialize_invoice_account(seed, &ctx.bumps)?;
        Ok(())
    }

    pub fn set_mint_as_payment (ctx: Context<SetMintAsPayment>) -> Result<()> {
        ctx.accounts.set_mint_as_payment()?;
        Ok(())
    }
}

