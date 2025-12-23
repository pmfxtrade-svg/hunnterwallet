export enum Status {
  GOOD = 'Good',
  EXCELLENT = 'Excellent',
}

export enum Network {
  SOLANA = 'Solana',
  ETHEREUM = 'Ethereum',
  BASE = 'Base',
  BSC = 'BSC',
  OTHER = 'Other',
}

export interface Coin {
  id: string;
  name: string;
  marketCap: string;
  liquidity: string;
  age: string; // e.g., "2 days", "4 hours"
  dateAdded: string;
  network: Network;
  status: Status;
  customLink?: string;
  isFavorite: boolean;
  dexScreenerUrl?: string;
}

export interface Wallet {
  id: string;
  address: string;
  buyVolume: string;
  sellVolume: string;
  profit: string; // P&L
  source: string; // GMGN, Birdeye
  network: Network;
  age: string;
  dateAdded: string;
  status: Status;
  multiplier: string;
  winRate: number; // Percentage 0-100
  customLink?: string;
  isFavorite: boolean;
}

export interface StatsData {
  totalCoins: number;
  totalWallets: number;
  favoriteCoins: number;
  topNetwork: string;
}