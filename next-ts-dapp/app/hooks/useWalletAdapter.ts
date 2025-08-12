import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { address, TransactionSigner } from 'gill';
import { useMemo } from 'react';


export function useWalletAdapter() {
  const { publicKey, signMessage, signTransaction, signAllTransactions, connected } = useWallet();

  const { connection } = useConnection();
  
  const signer: TransactionSigner<string> | null = useMemo(() => {
    if (!publicKey || !signMessage) return null;
    
    return {
      address: address(publicKey.toBase58()),
      signTransactions: async (transactions: any[]) => {
        if (!signMessage) throw new Error('Wallet does not support signing');
        console.log(transactions);
        return await signTransaction(transactions[0]);
        // if (!signAllTransactions) throw new Error('Wallet does not support signing multiple transactions');
        // return signAllTransactions(transactions);
      },
      signTransactionMessage: async (messageBytes: Uint8Array) => {
        if (!signMessage) throw new Error('Wallet does not support signing');
        return await signMessage(messageBytes);
        // if (!signTransaction) throw new Error('Wallet does not support signing');
        // return signTransaction(message);
      },
    };
  }, [publicKey, signTransaction, signAllTransactions]);
  
  return {
    publicKey: publicKey ? address(publicKey.toBase58()) : null,
    signer,
    connected,
    connection,
  };
}
