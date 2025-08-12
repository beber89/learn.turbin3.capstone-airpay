// src/lib/program.ts

import {
  address,
  type Address,
  type TransactionSigner,
  pipe,
  createTransactionMessage,
  appendTransactionMessageInstructions,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signAndSendTransactionMessageWithSigners,
  createSolanaClient,
  getProgramDerivedAddress,
  signTransactionMessageWithSigners,
  signTransaction,
  getSignatureFromTransaction,
  getUtf8Encoder,
  getAddressEncoder,
  createTransaction
} from 'gill';

import {
  getInitializeConfigInstructionAsync,
  getSetMintAsPaymentInstructionAsync,
  // type InitializeConfigInstructionArgs,

  // type SetMintAsPaymentInstructionArgs, // (keep if you need the args type)
} from '../generated';

// Constants
const PROGRAM_ID = 'J4aBD9W7P8sij5dLP4KZLiJZrCZXoRFazpGaVhcZuwZZ' as const;
const SEED = 12345n; // BigInt for u64


// Token addresses 
export const STABLE_TOKENS = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',

  DAI: 'EjmyN6qEC1Tf1JxiG1ae7UTJhUxSwk1TCWNWqxWV4J6o',
  PYUSD: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
  USDC_DEV: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
};

function u64Bytes(value: bigint): Uint8Array {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(value);
  return new Uint8Array(buf);
}

// RPC connection (Gill way)
// NOTE: return type is inferred from createSolanaClient; no generic Rpc<> headaches.
export function createRpcConnection() {
  const { rpc, sendAndConfirmTransaction } = createSolanaClient({
    urlOrMoniker:
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'http://127.0.0.1:8899',
  });
  return {rpc, sendAndConfirmTransaction};
}

// Initialize Config
export async function initializeConfig(
  adminSigner: TransactionSigner<string>,
  feePercentage: number,
  basisPoints: number
): Promise<string> {
  const {rpc, sendAndConfirmTransaction } = createRpcConnection();

  // Build the program instruction via Codama
  const instruction = await getInitializeConfigInstructionAsync({
    // Codama expects the signer object for signer accounts
    admin: adminSigner,
    seed: SEED,
    fee: feePercentage ,
    basisPoints: basisPoints ,
  });

  // Latest blockhash for lifetime
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  // Build tx message and attach signer as fee payer
  const transaction = createTransaction({
      version: "legacy",
      feePayer: adminSigner,
      instructions: [instruction],
      latestBlockhash
  });
  //
  // const message = pipe(
  //   createTransaction({ version: 0 }),
  //   (m) => setTransactionMessageFeePayerSigner(adminSigner, m),
  //   (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
  //   (m) => appendTransactionMessageInstructions([instruction], m)
  // );

  // ✅ sign with your TransactionSigner
  console.log("Going to sign - signTransactionMessageWithSigners");
  // FIXME: Gill gets stuck here - I can't make the user pull signature from the wallet
  const signedTx = await signTransactionMessageWithSigners(transaction);
  console.log(signedTx);

  // you can read the signature immediately once the fee payer has signed
  const sig = getSignatureFromTransaction(signedTx);
  console.log(sig);

  // ✅ send via the Gill client (no wallet “sending signer” required)
  await sendAndConfirmTransaction(signedTx);

  // // Sign and send using Gill helpers (no web3.js, no kit)
  // const sig = await signAndSendTransactionMessageWithSigners(message);
  return sig.toString(); // base58 tx signature
}

// Set Mint as Payment
export async function setMintAsPayment(
  adminSigner: TransactionSigner<string>,
  mintAddress: string

): Promise<string> {
  const rpc = createRpcConnection();
  // Auto-derive Config PDA via Codama

  const [config] = await getProgramDerivedAddress({
    programAddress: address(PROGRAM_ID),
    seeds: [
        getUtf8Encoder().encode("config"),
        getAddressEncoder().encode(adminSigner.address),
        u64Bytes(SEED)
    ]
  });

  // NOTE: The generated input type does NOT have `wallet`; use the signer account
  const instruction = await getSetMintAsPaymentInstructionAsync({
    admin: adminSigner,
    config,
    mint: address(mintAddress),
  });


  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();


  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(adminSigner, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstructions([instruction], m)
  );

  const sig = await signAndSendTransactionMessageWithSigners(message);
  return sig.toString();
}


