use anchor_lang::prelude::*;
use anchor_spl::{
    token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked},
    associated_token::AssociatedToken,
};
use crate::states::{InvoiceItem, InvoiceAccount, PaymentMetadata };


#[error_code]
pub enum ErrorCode {
   #[msg("Invoice has expired")]
   InvoiceExpired,
   #[msg("Soldout")]
   ItemSoldOut,
   #[msg("Arithmetic underflow")]
   UnderflowError,
   #[msg("Arithmetic overflow")]
   OverflowError,
}


#[derive(Accounts)]
pub struct PayInvoiceItem <'info> {
   /// User is the buyer/payer of the invoice 
   #[account(mut)]
   pub user: Signer<'info>,
   /// invoice_account created by calling initialize_invoice_account by merchant
   #[account(
       owner = crate::ID  // Ensures invoice_account is owned by this program
   )]
   pub invoice_account: Account <'info, InvoiceAccount>,
   #[account(
       has_one = invoice_account,
   )]
   pub invoice_item_account: Account<'info, InvoiceItem>,
   #[account(
       address = invoice_account.mint,
       mint::token_program = token_program
   )]
   pub mint: InterfaceAccount<'info, Mint>,
   // User's associated Token Account
   #[account(
       mut,
       associated_token::mint = mint,
       associated_token::authority = user,
       associated_token::token_program = token_program,
   )]
   pub user_ata: InterfaceAccount<'info, TokenAccount>,
   #[account(
       mut,
       address = invoice_account.vault
   )]
   pub merchant_vault: InterfaceAccount<'info, TokenAccount>,
   #[account(
       mut,
       address = invoice_account.fee_vault
   )]
   pub fee_vault: InterfaceAccount<'info, TokenAccount>,
   /// User details are referenced on payment - e.g. address of user to deliver item to
   /// The structure of metadata can be determined by merchant since it is saved on chain as a hash
   #[account(
       init,
       payer = user,
       seeds = [
           b"pay_invoice_item", 
           user.key().as_ref(), 
           invoice_item_account.key().as_ref(), 
           invoice_item_account.count.to_le_bytes().as_ref()
       ],
       space = 8 + PaymentMetadata::INIT_SPACE,
       bump
   )]
   pub payment_invoice_metadata: Account<'info, PaymentMetadata>,
   pub token_program: Interface<'info, TokenInterface>,
   pub associated_token_program: Program<'info, AssociatedToken>,
   pub system_program: Program<'info, System>,
}


impl<'info> PayInvoiceItem <'info> {
   pub fn pay_invoice_item (
       &mut self,
       buyer_metadata_hash: [u8; 32],
       bumps: &PayInvoiceItemBumps
   ) -> Result<()> {
       if (self.invoice_item_account.remaining == 0)
       {
           return err!(ErrorCode::ItemSoldOut);
       }
       self.payment_invoice_metadata.set_inner(
           PaymentMetadata {
               invoice_item_account: self.invoice_item_account.key(), 
               price_paid: self.invoice_item_account.price,
               item_seq_number: self.invoice_item_account.count,
               // Hash value of {name: , phone: , address: }
               buyer_metadata: buyer_metadata_hash,
               bump: bumps.payment_invoice_metadata
           }
       );

      // Decrement invoice_item_account.remaining safely
      self.invoice_item_account.remaining = self.invoice_item_account.remaining
          .checked_sub(1)
          .ok_or(ErrorCode::UnderflowError)?;

      // Increment invoice_item_account.count safely  
      self.invoice_item_account.count = self.invoice_item_account.count
          .checked_add(1)
          .ok_or(ErrorCode::OverflowError)?;


       let clock = Clock::get()?;
       // Verify that time is before expiry 
       if (clock.unix_timestamp as u64 > self.invoice_item_account.expiry_ts)
       {
           return err! (ErrorCode::InvoiceExpired);
       }
       let price: u64 = self.invoice_item_account.price;
       let fee: u16 = self.invoice_account.fee;
       let basis_points: u16 = self.invoice_account.basis_points;
       let fee_amount = price * fee as u64 / basis_points as u64;
       let amount = price - fee_amount;
       // Transfer price from user_ata to merchant_vault
       let cpi_accounts = TransferChecked {
           from: self.user_ata.to_account_info(),
           mint: self.mint.to_account_info(),
           to: self.merchant_vault.to_account_info(),
           authority: self.user.to_account_info(),
       };
          
       let cpi_program = self.token_program.to_account_info();
       let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
          
       transfer_checked(
           cpi_ctx, 
           amount, 
           self.mint.decimals
       )?;

       // Transfer fee from user_ata to config vault
       let cpi_accounts = TransferChecked {
           from: self.user_ata.to_account_info(),
           mint: self.mint.to_account_info(),
           to: self.fee_vault.to_account_info(),
           authority: self.user.to_account_info(),
       };
          
       let cpi_program = self.token_program.to_account_info();
       let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
          
       transfer_checked(
           cpi_ctx, 
           fee_amount, 
           self.mint.decimals
       )?;
       Ok(())
   }
}

