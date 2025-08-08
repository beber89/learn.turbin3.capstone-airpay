import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CapstoneAirpayQ3 } from "../target/types/capstone_airpay_q3";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAssociatedTokenAddressSync,
  getAccount,
} from "@solana/spl-token";

import { expect } from "chai";


describe("Capstone AirPay Q3 Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CapstoneAirpayQ3 as Program<CapstoneAirpayQ3>;
  
  // Test accounts
  let admin: Keypair;
  let merchant: Keypair;
  let mint: PublicKey;
  let configAccount: PublicKey;
  let invoiceAccount: PublicKey;
  let feeVault: PublicKey;
  let invoiceVault: PublicKey;
  
  // Test data
  const configSeed = new anchor.BN(5);
  const invoiceSeed = new anchor.BN(67890);
  const fee = 250; // 2.5%
  const basisPoints = 10000;
  
  before(async () => {
    // Initialize test accounts
    admin = Keypair.generate();
    merchant = Keypair.generate();
    
    // Airdrop SOL to test accounts

    await provider.connection.requestAirdrop(
      admin.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    
    await provider.connection.requestAirdrop(
      merchant.publicKey,
      2 * LAMPORTS_PER_SOL

    );
    
    // Wait for airdrops to confirm
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a test mint
    mint = await createMint(
      provider.connection,

      admin,
      admin.publicKey,
      null,
      6, // 6 decimals

      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );
    const configSeedBuffer = Buffer.alloc(8);
    configSeedBuffer.writeBigUInt64LE( BigInt(configSeed.toNumber() ));
    

    // Derive PDA addresses
    let _configBump;
    [configAccount, _configBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("config"),
        admin.publicKey.toBuffer(),
        configSeedBuffer,

      ],
      program.programId
    );

    
    [invoiceAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("invoice_account"),
        merchant.publicKey.toBuffer(),
        invoiceSeed.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    
    // Get associated token account addresses
    feeVault = getAssociatedTokenAddressSync(
      mint,
      configAccount,
      true, // allowOwnerOffCurve
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    invoiceVault = getAssociatedTokenAddressSync(
      mint,
      invoiceAccount,
      true, // allowOwnerOffCurve
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
  });

  describe("Test 1: Admin creates Config account", () => {
    it("Should successfully initialize a config account", async () => {
      // @note [debug] passing seed as last argument somehow messed up the function call !!
      try {
        const tx = await program.methods
          .initializeConfig(
            configSeed,
            fee,
            basisPoints
          )
          .accountsPartial({
            admin: admin.publicKey,
            config: configAccount,
            systemProgram: SystemProgram.programId,
          })
          .signers([admin])
          .rpc();


        console.log("Config initialization transaction signature:", tx);

        // Verify the config account was created and initialized correctly
        const configAccountData = await program.account.config.fetch(configAccount);
        
        expect(configAccountData.seed.toString()).to.equal(configSeed.toString());
        expect(configAccountData.admin.toString()).to.equal(admin.publicKey.toString());
        expect(configAccountData.fee).to.equal(fee);
        expect(configAccountData.basisPoints).to.equal(basisPoints);

        
        console.log("✅ Config account created successfully!");
        console.log("Config details:", {
          seed: configAccountData.seed.toString(),
          admin: configAccountData.admin.toString(),
          fee: configAccountData.fee,
          basisPoints: configAccountData.basisPoints,
        });

      } catch (error) {
        console.error("❌ Error initializing config:", error);
        throw error;
      }
    });


    it("Should fail to initialize config with same seed twice", async () => {

      try {
        await program.methods
          .initializeConfig(
            configSeed, // Same seed as before
            fee,
            basisPoints,
          )
          .accountsPartial({
            admin: admin.publicKey,
            config: configAccount,
            systemProgram: SystemProgram.programId,
          })
          .signers([admin])
          .rpc();

        // Should not reach here

        expect.fail("Expected transaction to fail but it succeeded");
      } catch (error) {
        // Expected to fail because account already exists
        expect(error.message).to.include("already in use");
        console.log("✅ Correctly failed to create duplicate config");
      }
    });
  });

  describe("Test 2: Admin sets a mint as a whitelist and creates a fee vault", () => {
    it("Should successfully initialize a config account", async () => {
      // @note [debug] passing seed as last argument somehow messed up the function call !!
      try {
        const tx = await program.methods
          .setMintAsPayment(
          )
          .accountsPartial({
            admin: admin.publicKey,
            config: configAccount,
            mint,
            vault: feeVault,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([admin])
          .rpc();


        console.log("Config initialization transaction signature:", tx);

        // Verify the vault account was created and initialized correctly
        const feeVaultAccountData = await getAccount(provider.connection, feeVault);
        
        expect (feeVaultAccountData.isInitialized).to.be.true ;

        
        console.log("✅ Fee vault account created successfully!");
        console.log("Fee Vault details:");

      } catch (error) {
        console.error("❌ Error setting fee vault :", error);
        throw error;
      }
    });
  });



  describe.skip("Test 3: Merchant creates InvoiceAccount", () => {
    it("Should successfully initialize an invoice account", async () => {
      try {
        const tx = await program.methods

          .initializeInvoiceAccount(invoiceSeed)

          .accountsPartial({
            config: configAccount,
            merchant: merchant.publicKey,
            invoiceAccount: invoiceAccount,

            mint: mint,
            vault: invoiceVault,

            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([merchant])

          .rpc();

        console.log("Invoice account initialization transaction signature:", tx);

        // Verify the invoice account was created and initialized correctly
        const invoiceAccountData = await program.account.invoiceAccount.fetch(invoiceAccount);
        
        expect(invoiceAccountData.seed.toString()).to.equal(invoiceSeed.toString());
        expect(invoiceAccountData.merchant.toString()).to.equal(merchant.publicKey.toString());
        expect(invoiceAccountData.mint.toString()).to.equal(mint.toString());
        
        console.log("✅ Invoice account created successfully!");
        console.log("Invoice account details:", {
          seed: invoiceAccountData.seed.toString(),
          merchant: invoiceAccountData.merchant.toString(),
          mint: invoiceAccountData.mint.toString(),
        });

      } catch (error) {

        console.error("❌ Error initializing invoice account:", error);
        throw error;
      }
    });


    it("Should fail to initialize invoice account with same seed twice", async () => {
      try {

        await program.methods

          .initializeInvoiceAccount(invoiceSeed) // Same seed as before

          .accountsPartial({
            config: configAccount,
            merchant: merchant.publicKey,
            invoiceAccount: invoiceAccount,

            mint: mint,
            vault: invoiceVault,

            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([merchant])
          .rpc();

        // Should not reach here
        expect.fail("Expected transaction to fail but it succeeded");
      } catch (error) {

        // Expected to fail because account already exists
        expect(error.message).to.include("already in use");
        console.log("✅ Correctly failed to create duplicate invoice account");
      }
    });

    it("Should allow different merchants to create invoice accounts with same seed", async () => {
      const anotherMerchant = Keypair.generate();
      

      // Airdrop SOL to new merchant
      await provider.connection.requestAirdrop(
        anotherMerchant.publicKey,
        LAMPORTS_PER_SOL
      );
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Derive new invoice account for different merchant
      const [anotherInvoiceAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("invoice_account"),
          anotherMerchant.publicKey.toBuffer(),
          invoiceSeed.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
      
      const anotherInvoiceVault = getAssociatedTokenAddressSync(
        mint,
        anotherInvoiceAccount,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      try {
        const tx = await program.methods
          .initializeInvoiceAccount(invoiceSeed) // Same seed but different merchant
          .accountsPartial({
            config: configAccount,
            merchant: anotherMerchant.publicKey,

            invoiceAccount: anotherInvoiceAccount,
            mint: mint,
            vault: anotherInvoiceVault,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([anotherMerchant])
          .rpc();

        console.log("Second merchant invoice account transaction signature:", tx);
        

        // Verify the account was created
        const anotherInvoiceData = await program.account.invoiceAccount.fetch(anotherInvoiceAccount);
        expect(anotherInvoiceData.merchant.toString()).to.equal(anotherMerchant.publicKey.toString());
        
        console.log("✅ Different merchant successfully created invoice account with same seed");

      } catch (error) {
        console.error("❌ Error creating second merchant invoice account:", error);
        throw error;
      }
    });

  });
});
