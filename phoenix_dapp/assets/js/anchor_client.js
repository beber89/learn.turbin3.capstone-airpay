import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {Buffer} from 'buffer';

const PROGRAM_ID = new PublicKey('J4aBD9W7P8sij5dLP4KZLiJZrCZXoRFazpGaVhcZuwZZ');
// const CONNECTION = new Connection('https://api.devnet.solana.com');
const CONNECTION = new Connection('http://127.0.0.1:8899');
const wrappedSol = new PublicKey('So11111111111111111111111111111111111111112');
const usdcDev = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
const usdcMain = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const SEED = 12345;

const initializeConfig = async ( fee, basisPoints) => {
    // TODO: Wrap the window into a safe provider class
    const response = await window.solana.connect();
    const admin = response.publicKey;
    
    // Instruction discriminator (sha256 hash of "global:initialize_config")
    const discriminator = Buffer.from([
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
    ]);

    
    // Derive config PDA: [b"config", admin.key(), seed.to_le_bytes()]
    const [config] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('config'),
            admin.toBuffer(),
            Buffer.from(new BigUint64Array([BigInt(SEED)]).buffer)
        ],
        PROGRAM_ID
    );
    
    // Derive vault (associated token account)
    const vault = await getAssociatedTokenAddress(usdcMain, config, true);
    
    // Serialize instruction data
    const data = Buffer.alloc(8 + 8 + 2 + 2 + 64);
    let offset = 0;
    
    discriminator.copy(data, offset); offset += 8;
    data.writeBigUInt64LE(BigInt(SEED), offset); offset += 8;
    data.writeUInt16LE(fee, offset); offset += 2;
    data.writeUInt16LE(basisPoints, offset); offset += 2;
    usdcMain.toBuffer().copy(data, offset); offset += 32;    // Mint needed for fee
    usdcMain.toBuffer().copy(data, offset);   // whitelist_mint
    
    const instruction = new TransactionInstruction({
        keys: [
            { pubkey: admin, isSigner: true, isWritable: true },
            { pubkey: config, isSigner: false, isWritable: true },
            // { pubkey: usdcMain, isSigner: false, isWritable: false },
            // { pubkey: vault, isSigner: false, isWritable: true },
            // { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            // { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ],
        programId: PROGRAM_ID,
        data
    });
    
    const { blockhash } = await CONNECTION.getLatestBlockhash();
    const transaction = new Transaction({ feePayer: admin, recentBlockhash: blockhash }).add(instruction);
    const signed = await window.solana.signTransaction(transaction);
    const signature = await CONNECTION.sendRawTransaction(signed.serialize());
    
    return signature;
};


const setMintAsPayment = async (mint) => {
    const response = await window.solana.connect();
    const wallet = response.publicKey;
    
    // Instruction discriminator (sha256 hash of "global:initialize_config")
    const discriminator = Buffer.from([
        232,
        249,
        189,
        233,
        153,
        5,
        4,
        61
    ]);
    
    // Derive config PDA: [b"config", admin.key(), seed.to_le_bytes()]
    const [config] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('config'),
            wallet.toBuffer(),
            Buffer.from(new BigUint64Array([BigInt(SEED)]).buffer)
        ],
        PROGRAM_ID
    );
    
    // Derive vault (associated token account)
    const feeVault = await getAssociatedTokenAddress(new PublicKey(mint), config, true);

    // Serialize instruction data
    const data = Buffer.alloc(8);
    let offset = 0;
    discriminator.copy(data, offset); 
    
    const instruction = new TransactionInstruction({
        keys: [
            { pubkey: wallet, isSigner: true, isWritable: true },
            { pubkey: config, isSigner: false, isWritable: true },
            { pubkey: new PublicKey(mint), isSigner: false, isWritable: false },
            { pubkey: feeVault, isSigner: false, isWritable: true },
            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ],
        programId: PROGRAM_ID,
        data
    });
    
    const { blockhash } = await CONNECTION.getLatestBlockhash();
    const transaction = new Transaction({ feePayer: wallet, recentBlockhash: blockhash }).add(instruction);
    const signed = await window.solana.signTransaction(transaction);
    const signature = await CONNECTION.sendRawTransaction(signed.serialize());
    
    return signature;
};



export {initializeConfig, setMintAsPayment};


