'use client';

import { useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { type TransactionSigner } from 'gill';
import {
  initializeConfig,
  setMintAsPayment,
  STABLE_TOKENS,
} from '../../lib/solana/program';
import { useWalletAdapter } from '../hooks/useWalletAdapter';

// ---- Program IDs (well-known) ----
const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';
const ASSOCIATED_TOKEN_PROGRAM_ID =
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const TOKEN_PROGRAM_IDS = {
  TOKEN_LEGACY: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  TOKEN_2022: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
};

// Keep the seed consistent with what you used when calling initialize_config on-chain.
// If your client derives it internally, remove this and the UI for it.
const DEFAULT_SEED = 12345n;

type StableToken = { name: string; address: string; symbol: string };

const STABLE_TOKEN_LIST: StableToken[] = [
  { name: 'USDC', address: STABLE_TOKENS.USDC, symbol: 'USDC' },
  { name: 'USDT', address: STABLE_TOKENS.USDT, symbol: 'USDT' },
  { name: 'DAI', address: STABLE_TOKENS.DAI, symbol: 'DAI' },

  { name: 'PYUSD', address: STABLE_TOKENS.PYUSD, symbol: 'PYUSD' },
];

export default function AdminDashboard() {
  const { connected } = useWallet();
  const { signer } = useWalletAdapter(); // returns TransactionSigner<string> | null

  // UI state
  const [activeTab, setActiveTab] = useState<'config' | 'mint'>('config');
  const [darkMode, setDarkMode] = useState(false);


  // Config state
  const [seedStr, setSeedStr] = useState<string>(DEFAULT_SEED.toString());
  const [feePercentage, setFeePercentage] = useState('2'); // % as string
  const [basisPoints, setBasisPoints] = useState('10000'); // 100% in bps
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);

  // Mint management state
  const [selectedStableToken, setSelectedStableToken] = useState<StableToken | null>(null);

  const [customMintAddress, setCustomMintAddress] = useState('');
  const [programKind, setProgramKind] = useState<'TOKEN_LEGACY' | 'TOKEN_2022'>('TOKEN_LEGACY');
  const [mintLoading, setMintLoading] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintSuccess, setMintSuccess] = useState<string | null>(null);
  const [whitelistedMints, setWhitelistedMints] = useState<StableToken[]>([]);

  const parsedSeed: bigint | null = useMemo(() => {
    try {
      if (seedStr.trim() === '') return null;
      // allow decimal or bigint-like strings
      return BigInt(seedStr);
    } catch {
      return null;
    }
  }, [seedStr]);

  const programIdForMint = useMemo(() => TOKEN_PROGRAM_IDS[programKind], [programKind]);

  const ensureSigner = (): asserts signer is TransactionSigner<string> => {
    if (!signer) throw new Error('Please connect your wallet first.');
  };

  // ---- Actions ----

  const handleInitializeConfig = async () => {
    try {
      ensureSigner();
      setConfigLoading(true);
      setConfigError(null);
      setConfigSuccess(null);

      // feePercentage (e.g., "2") -> number 2
      const feePctNum = Number(feePercentage);

      if (!Number.isFinite(feePctNum) || feePctNum < 0) {
        throw new Error('Invalid fee percentage.');
      }


      const bpsNum = Number(basisPoints);
      if (!Number.isInteger(bpsNum) || bpsNum <= 0) {
        throw new Error('Invalid basis points.');
      }

      // NOTE: If your airpayClient.initializeConfig internally uses a constant seed,
      // remove parsedSeed usage. If it accepts seed, add it to the client call.
      console.log("Before executing initializeConfig");
      const sig = await initializeConfig(signer, feePctNum, bpsNum);
      console.log("After executing initializeConfig");

      setConfigSuccess(`Configuration initialized. Tx: ${sig}`);
    } catch (e: any) {
      setConfigError(e?.message ?? 'Failed to initialize configuration.');
    } finally {

      setConfigLoading(false);
    }
  };

  const addMint = async (mintAddr: string, display: StableToken) => {
    try {
      ensureSigner();
      setMintLoading(true);
      setMintError(null);
      setMintSuccess(null);

      if (!parsedSeed) {
        throw new Error('Invalid seed. Please provide a valid u64 (0 to 2^64-1).');

      }

      // Pass explicit program IDs to avoid guessing the mint’s owner program.
      const sig = await setMintAsPayment(
        signer,
        parsedSeed,
        mintAddr,

        programIdForMint,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      setWhitelistedMints((prev) =>
        prev.some((m) => m.address === display.address) ? prev : [...prev, display]

      );
      setMintSuccess(`Payment mint added. Tx: ${sig}`);

      setSelectedStableToken(null);
      setCustomMintAddress('');
    } catch (e: any) {
      setMintError(e?.message ?? 'Failed to add payment mint.');
    } finally {
      setMintLoading(false);
    }
  };

  const handleAddStableToken = async () => {
    if (!selectedStableToken) {
      setMintError('Please select a stable token first.');
      return;
    }
    await addMint(selectedStableToken.address, selectedStableToken);
  };


  const handleAddCustomMint = async () => {
    const mintAddr = customMintAddress.trim();
    if (!mintAddr) {
      setMintError('Please enter a valid mint address.');
      return;

    }
    await addMint(mintAddr, {
      name: 'Custom Token',
      address: mintAddr,
      symbol: 'CUSTOM',
    });

  };


  const removeMint = (mintAddress: string) => {
    setWhitelistedMints((prev) => prev.filter((m) => m.address !== mintAddress));
  };

  // ---- UI ----

  return (

    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* Header */}
      <header
        className={`border-b transition-colors duration-200 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-4">

              <WalletMultiButton />
              <button
                onClick={() => setDarkMode((v) => !v)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="Toggle theme"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="mb-6">

          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'config'
                  ? darkMode

                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >

              Configuration
            </button>
            <button

              onClick={() => setActiveTab('mint')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'mint'
                  ? darkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : darkMode

                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Payment Methods
            </button>
          </nav>
        </div>

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div
            className={`rounded-lg p-6 transition-colors duration-200 ${
              darkMode ? 'bg-gray-800' : 'bg-white shadow-md'
            }`}
          >

            <h2 className="text-xl font-semibold mb-4">Initialize Config</h2>

            {!connected && (

              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                Please connect your wallet to continue.
              </div>
            )}

            {configError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {configError}
              </div>

            )}

            {configSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {configSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Seed (u64)</label>
                <input
                  type="text"
                  value={seedStr}
                  onChange={(e) => setSeedStr(e.target.value)}
                  placeholder="e.g. 12345"
                  className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  }`}
                  disabled={!connected}
                />

                <p className="text-xs mt-1 opacity-70">
                  Must match the seed used by your program for the Config PDA.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fee Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={feePercentage}
                  onChange={(e) => setFeePercentage(e.target.value)}

                  className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  }`}
                  disabled={!connected}
                />
              </div>


              <div>

                <label className="block text-sm font-medium mb-2">Basis Points (bps)</label>
                <input
                  type="number"

                  step="1"
                  min="1"
                  value={basisPoints}
                  onChange={(e) => setBasisPoints(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 ${

                    darkMode

                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  }`}

                  disabled={!connected}
                />
              </div>
            </div>

            <button
              onClick={handleInitializeConfig}
              disabled={configLoading || !connected || !parsedSeed}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                configLoading || !connected || !parsedSeed
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {configLoading ? 'Initializing…' : 'Initialize Config'}
            </button>
          </div>
        )}

        {/* Mint Management Tab */}
        {activeTab === 'mint' && (
          <div
            className={`rounded-lg p-6 transition-colors duration-200 ${
              darkMode ? 'bg-gray-800' : 'bg-white shadow-md'
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Payment Method Management</h2>

            {!connected && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                Please connect your wallet to continue.
              </div>
            )}

            {mintError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {mintError}
              </div>
            )}
            {mintSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {mintSuccess}
              </div>
            )}

            {/* Token Program Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Token Program</label>
              <div className="flex gap-3">
                <select
                  value={programKind}
                  onChange={(e) => setProgramKind(e.target.value as 'TOKEN_LEGACY' | 'TOKEN_2022')}
                  className={`px-3 py-2 border rounded-md ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  disabled={!connected}
                >

                  <option value="TOKEN_LEGACY">SPL Token (legacy)</option>
                  <option value="TOKEN_2022">Token-2022</option>
                </select>
              </div>
              <p className="text-xs mt-1 opacity-70">
                Make sure this matches the mint’s owner program; otherwise the instruction will fail.
              </p>
            </div>


            {/* Stable Tokens */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Stable Tokens</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {STABLE_TOKEN_LIST.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => setSelectedStableToken(token)}
                    disabled={!connected}
                    className={`p-3 rounded-lg border transition-colors duration-200 ${
                      selectedStableToken?.address === token.address
                        ? darkMode
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-blue-500 border-blue-400 text-white'
                        : darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'

                    } ${!connected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-medium">{token.name}</div>
                    <div className="text-sm opacity-75">{token.symbol}</div>
                  </button>
                ))}
              </div>
              <button

                onClick={async () => {
                  if (!selectedStableToken) return;
                  await addMint(selectedStableToken.address, selectedStableToken);
                }}
                disabled={mintLoading || !selectedStableToken || !connected || !parsedSeed}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  mintLoading || !selectedStableToken || !connected || !parsedSeed
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'

                }`}
              >
                {mintLoading ? 'Adding…' : 'Add Stable Token'}
              </button>
            </div>


            {/* Custom Mint */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Custom Mint Address</h3>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={customMintAddress}
                  onChange={(e) => setCustomMintAddress(e.target.value)}
                  placeholder="Enter mint address…"
                  disabled={!connected}
                  className={`flex-1 px-3 py-2 border rounded-md transition-colors duration-200 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } ${!connected ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <button
                  onClick={handleAddCustomMint}
                  disabled={mintLoading || !connected || !parsedSeed || !customMintAddress.trim()}

                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    mintLoading || !connected || !parsedSeed || !customMintAddress.trim()
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {mintLoading ? 'Adding…' : 'Add Custom Mint'}
                </button>
              </div>
            </div>


            {/* Whitelisted list */}
            <div>
              <h3 className="text-lg font-medium mb-3">Whitelisted Mints</h3>
              {whitelistedMints.length === 0 ? (
                <div className="text-sm opacity-70">No mints added yet.</div>
              ) : (
                <ul className="space-y-2">
                  {whitelistedMints.map((m) => (
                    <li
                      key={m.address}
                      className={`flex items-center justify-between p-3 rounded-md border ${
                        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs opacity-70 break-all">{m.address}</div>
                      </div>
                      <button
                        onClick={() => removeMint(m.address)}

                        className="px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

