use anchor_lang::prelude::*;
use crate::states::{InvoiceItem, InvoiceAccount };

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct InitializeInvoiceItemAccount<'info> {
   /// merchant is the creator of this InvoiceItem
   #[account(mut)]
   pub merchant: Signer<'info>,
   /// invoice_account created by calling initialize_invoice_account
   #[account(
       has_one = merchant,
       owner = crate::ID  // Ensures invoice_account is owned by this program
   )]
   pub invoice_account: Account<'info, InvoiceAccount>,
   /// The account we aim to create here
   #[account(
       init,
       payer = merchant,
       seeds = [b"invoice_item", invoice_account.key().as_ref(), seed.to_le_bytes().as_ref()],
       space = 8 + InvoiceItem::INIT_SPACE,
       bump,
   )]
   pub invoice_item_account: Account<'info, InvoiceItem>,
   pub system_program: Program<'info, System>,

}


impl<'info> InitializeInvoiceItemAccount<'info> {
   pub fn initialize_invoice_item_account(
       &mut self, 
       seed: u64,
       price: u64,
       product_id: u64,
       expiry_ts: u64,
       items: u16,         // How many items for sale
       bumps: &InitializeInvoiceItemAccountBumps
   ) -> Result<()> {
       let clock = Clock::get()?;
       
       self.invoice_item_account.set_inner(

           InvoiceItem {
               seed,
               invoice_account: self.invoice_account.key(),

               price,
               product_id,
               creation_ts: clock.unix_timestamp as u64,
               expiry_ts,
               remaining: items,
               count: 0,                    // How many items sold yet, intialized to zero
               bump: bumps.invoice_item_account,
           }
       );
       Ok(())
   }
}


