
import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  List, 
  Plus, 
  ExternalLink, 
  Trash2, 
  Star, 
  Search, 
  Loader2, 
  X, 
  Activity, 
  Filter, 
  Calendar, 
  Copy, 
  Check, 
  Database, 
  Terminal, 
  Info, 
  Pencil,
  Zap,
  MousePointer2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Status, Network, Coin, Wallet as WalletType } from './types';
import { parseDexScreenerData } from './services/geminiService';
import { StatsCard } from './components/StatsCard';
import { StatusBadge, NetworkBadge } from './components/Badge';

// --- Supabase Client Setup ---
const SUPABASE_URL = 'https://urimmfxmsamzwxsmtcxs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyaW1tZnhtc2Ftend4c210Y3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MjQ0MjUsImV4cCI6MjA4MjAwMDQyNX0.N6mWD0R8QS8kJVwq9XmOoQl_qLxMHJsT2Pdz_Dnu0uE';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Helper Functions ---

const parseCurrencyToNumber = (val: string): number => {
  if (!val) return 0;
  let numStr = val.replace(/[$,]/g, '').trim();
  let multiplier = 1;
  const upper = numStr.toUpperCase();
  if (upper.endsWith('K')) {
    multiplier = 1000;
    numStr = numStr.slice(0, -1);
  } else if (upper.endsWith('M')) {
    multiplier = 1000000;
    numStr = numStr.slice(0, -1);
  } else if (upper.endsWith('B')) {
    multiplier = 1000000000;
    numStr = numStr.slice(0, -1);
  }
  return parseFloat(numStr) * multiplier;
};

const simpleParseWalletText = (text: string) => {
  const moneyRegex = /[-+]?\$?\d+(?:,\d+)*(?:\.\d+)?[KMB]?|\$[-+]?\d+(?:,\d+)*(?:\.\d+)?[KMB]?/gi;
  const allMatches = text.match(moneyRegex) || [];
  const currencyMatches = allMatches.filter(m => m.includes('$'));
  
  let buy = '';
  let sell = '';
  let profit = '';
  let multStr = '1x';

  if (currencyMatches.length >= 3) {
    buy = currencyMatches[0];
    sell = currencyMatches[1];
    profit = currencyMatches[2];
  } else if (allMatches.length >= 3) {
    buy = allMatches[0];
    sell = allMatches[1];
    profit = allMatches[2];
  }

  const normalize = (val: string, isProfit = false) => {
    if (!val) return '';
    let res = val.trim();
    if (!res.includes('$')) {
      if (res.startsWith('-') || res.startsWith('+')) {
        res = res[0] + '$' + res.slice(1);
      } else {
        res = '$' + res;
      }
    }
    if (isProfit && !res.startsWith('-') && !res.startsWith('+')) {
      res = '+' + res;
    }
    return res;
  };

  buy = normalize(buy);
  sell = normalize(sell);
  profit = normalize(profit, true);

  const bNum = Math.abs(parseCurrencyToNumber(buy));
  const sNum = Math.abs(parseCurrencyToNumber(sell));
  const pNum = parseCurrencyToNumber(profit);

  if (bNum > 0) {
    if (sNum > 0) {
      multStr = (sNum / bNum).toFixed(1) + 'x';
    } else {
      multStr = ((bNum + pNum) / bNum).toFixed(1) + 'x';
    }
  }

  return { buy, sell, profit, multStr };
};

// --- Helper Components ---

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 shrink-0">
          <h3 className="font-semibold text-lg text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const WinRateGauge: React.FC<{ rate: number }> = ({ rate }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;
  
  const getColor = (r: number) => {
    if (r >= 70) return '#10b981'; // Emerald 500
    if (r >= 45) return '#f59e0b'; // Amber 500
    return '#ef4444'; // Red 500
  };

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-slate-100"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke={getColor(rate)}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-slate-700">{rate}%</span>
    </div>
  );
};

const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={`flex items-center gap-1.5 p-1.5 rounded transition-colors ${label ? 'bg-slate-100 hover:bg-slate-200 px-3' : 'hover:bg-slate-200 text-slate-400 hover:text-indigo-600'}`}
      title="Copy"
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
      {label && <span className="text-xs font-medium text-slate-600">{copied ? 'Copied!' : label}</span>}
    </button>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'wallets'>('watchlist');
  
  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNetwork, setFilterNetwork] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Data State
  const [coins, setCoins] = useState<Coin[]>([]);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isCoinModalOpen, setIsCoinModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [editingCoinId, setEditingCoinId] = useState<string | null>(null);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  
  // Add/Edit Coin Form State
  const [newCoinUrl, setNewCoinUrl] = useState('');
  const [isParsingCoin, setIsParsingCoin] = useState(false);
  const [parsedCoinData, setParsedCoinData] = useState<Partial<Coin> | null>(null);

  // Add/Edit Wallet Form State
  const [rawWalletText, setRawWalletText] = useState('');
  const [isFetchingTokenForWallet, setIsFetchingTokenForWallet] = useState(false);
  const [newWallet, setNewWallet] = useState<Partial<WalletType>>({
    network: Network.SOLANA,
    status: Status.GOOD,
    winRate: 50
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [{ data: tokensData }, { data: walletsData }] = await Promise.all([
        supabase.from('tokens').select('*').order('date_added', { ascending: false }),
        supabase.from('wallets').select('*').order('date_added', { ascending: false })
      ]);

      if (tokensData) {
        setCoins(tokensData.map(t => ({
          id: t.id,
          name: t.name,
          marketCap: t.market_cap,
          liquidity: t.liquidity,
          age: t.age,
          dateAdded: t.date_added,
          network: t.network as Network,
          status: t.status as Status,
          customLink: t.custom_link,
          isFavorite: t.is_favorite,
          dexScreenerUrl: t.dex_screener_url
        })));
      }

      if (walletsData) {
        setWallets(walletsData.map(w => ({
          id: w.id,
          address: w.address,
          buyVolume: w.buy_volume,
          sellVolume: w.sell_volume,
          profit: w.profit,
          source: w.source,
          network: w.network as Network,
          age: w.age,
          dateAdded: w.date_added,
          status: w.status as Status,
          multiplier: w.multiplier,
          winRate: w.win_rate,
          customLink: w.custom_link,
          isFavorite: w.is_favorite
        })));
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Supabase SQL Code ---
  const supabaseSql = `-- Create tables for CryptoTrackr
CREATE TABLE IF NOT EXISTS public.tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  market_cap TEXT,
  liquidity TEXT,
  age TEXT,
  date_added DATE DEFAULT CURRENT_DATE,
  network TEXT,
  status TEXT,
  custom_link TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  dex_screener_url TEXT
);

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  buy_volume TEXT,
  sell_volume TEXT,
  profit TEXT,
  source TEXT,
  network TEXT,
  age TEXT,
  date_added DATE DEFAULT CURRENT_DATE,
  status TEXT,
  multiplier TEXT,
  win_rate INTEGER,
  custom_link TEXT,
  is_favorite BOOLEAN DEFAULT FALSE
);

-- Enable RLS and public access
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.tokens FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON public.wallets FOR ALL USING (true) WITH CHECK (true);`;

  // --- Derived State (Stats & Filtering) ---

  const totalFavorites = coins.filter(c => c.isFavorite).length + wallets.filter(w => w.isFavorite).length;
  
  // Calculate Dominant Network
  const allNetworks = [...coins.map(c => c.network), ...wallets.map(w => w.network)];
  const networkCounts = allNetworks.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const dominantNetwork = Object.entries(networkCounts).sort((a,b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'N/A';

  // Filter Logic
  const filteredCoins = coins.filter(coin => {
    const matchesSearch = coin.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNetwork = filterNetwork === 'All' || coin.network === filterNetwork;
    const matchesStatus = filterStatus === 'All' || coin.status === filterStatus;
    return matchesSearch && matchesNetwork && matchesStatus;
  });

  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch = wallet.address.toLowerCase().includes(searchQuery.toLowerCase()) || wallet.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNetwork = filterNetwork === 'All' || wallet.network === filterNetwork;
    const matchesStatus = filterStatus === 'All' || wallet.status === filterStatus;
    return matchesSearch && matchesNetwork && matchesStatus;
  });

  // --- Handlers ---

  const handleParseCoin = async () => {
    if (!newCoinUrl) return;
    setIsParsingCoin(true);
    try {
      const data = await parseDexScreenerData(newCoinUrl);
      setParsedCoinData({ ...data, customLink: newCoinUrl, dexScreenerUrl: newCoinUrl });
    } catch (e) {
      alert("Failed to parse data");
    } finally {
      setIsParsingCoin(false);
    }
  };

  const handleManualSmartParse = () => {
    if (!rawWalletText) return;
    const data = simpleParseWalletText(rawWalletText);
    setNewWallet(prev => ({
      ...prev,
      buyVolume: data.buy,
      sellVolume: data.sell,
      profit: data.profit,
      multiplier: data.multStr
    }));
    setRawWalletText('');
  };

  const handleSourceChange = async (val: string) => {
    setNewWallet(prev => ({ ...prev, source: val }));
    
    // Check if the source is actually a DexScreener URL
    if (val.includes('dexscreener.com')) {
      setIsFetchingTokenForWallet(true);
      try {
        const data = await parseDexScreenerData(val);
        setNewWallet(prev => ({
          ...prev,
          source: data.name, // Save token symbol as source
          customLink: data.dexScreenerUrl, // Save URL for the link
          network: data.network || prev.network
        }));
      } catch (e) {
        console.error("Auto-fetch error:", e);
      } finally {
        setIsFetchingTokenForWallet(false);
      }
    }
  };

  const startEditCoin = (coin: Coin) => {
    setEditingCoinId(coin.id);
    setParsedCoinData({ ...coin });
    setIsCoinModalOpen(true);
  };

  const startEditWallet = (wallet: WalletType) => {
    setEditingWalletId(wallet.id);
    setNewWallet({ ...wallet });
    setIsWalletModalOpen(true);
  };

  const saveCoin = async () => {
    if (parsedCoinData) {
      const coinPayload = {
        name: parsedCoinData.name,
        market_cap: parsedCoinData.marketCap,
        liquidity: parsedCoinData.liquidity,
        age: parsedCoinData.age,
        network: parsedCoinData.network,
        status: parsedCoinData.status,
        custom_link: parsedCoinData.customLink,
        dex_screener_url: parsedCoinData.dexScreenerUrl,
        is_favorite: parsedCoinData.isFavorite ?? false
      };

      try {
        if (editingCoinId) {
          await supabase.from('tokens').update(coinPayload).eq('id', editingCoinId);
        } else {
          await supabase.from('tokens').insert([{ ...coinPayload, date_added: new Date().toLocaleDateString('en-CA') }]);
        }
        await fetchData();
        closeCoinModal();
      } catch (e) {
        alert("Error saving to database. Ensure you have run the SQL script.");
      }
    }
  };

  const saveWallet = async () => {
    if (newWallet.address) {
      const walletPayload = {
        address: newWallet.address,
        buy_volume: newWallet.buyVolume,
        sell_volume: newWallet.sellVolume,
        profit: newWallet.profit,
        source: newWallet.source,
        network: newWallet.network,
        age: newWallet.age,
        status: newWallet.status,
        multiplier: newWallet.multiplier,
        win_rate: newWallet.winRate,
        custom_link: newWallet.customLink,
        is_favorite: newWallet.isFavorite ?? false
      };

      try {
        if (editingWalletId) {
          await supabase.from('wallets').update(walletPayload).eq('id', editingWalletId);
        } else {
          await supabase.from('wallets').insert([{ ...walletPayload, date_added: new Date().toLocaleDateString('en-CA') }]);
        }
        await fetchData();
        closeWalletModal();
      } catch (e) {
        alert("Error saving to database. Ensure you have run the SQL script.");
      }
    }
  };

  const toggleFavoriteCoin = async (coin: Coin) => {
    try {
      await supabase.from('tokens').update({ is_favorite: !coin.isFavorite }).eq('id', coin.id);
      await fetchData();
    } catch (e) {}
  };

  const deleteCoin = async (id: string) => {
    if (window.confirm('Delete this token from watchlist?')) {
      try {
        await supabase.from('tokens').delete().eq('id', id);
        await fetchData();
      } catch (e) {}
    }
  };

  const toggleFavoriteWallet = async (wallet: WalletType) => {
    try {
      await supabase.from('wallets').update({ is_favorite: !wallet.isFavorite }).eq('id', wallet.id);
      await fetchData();
    } catch (e) {}
  };

  const deleteWallet = async (id: string) => {
    if (window.confirm('Stop tracking this wallet?')) {
      try {
        await supabase.from('wallets').delete().eq('id', id);
        await fetchData();
      } catch (e) {}
    }
  };

  const closeCoinModal = () => {
    setIsCoinModalOpen(false);
    setEditingCoinId(null);
    setParsedCoinData(null);
    setNewCoinUrl('');
  };

  const closeWalletModal = () => {
    setIsWalletModalOpen(false);
    setEditingWalletId(null);
    setNewWallet({ network: Network.SOLANA, status: Status.GOOD, winRate: 50 });
    setRawWalletText('');
  };

  // --- Render Sections ---

  const renderStatsRow = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard 
        title="Total Watchlist" 
        value={coins.length} 
        icon={<List size={20} />} 
      />
      <StatsCard 
        title="Tracked Wallets" 
        value={wallets.length} 
        icon={<Wallet size={20} />} 
      />
      <StatsCard 
        title="Total Favorites" 
        value={totalFavorites} 
        icon={<Star size={20} />} 
      />
      <StatsCard 
        title="Dominant Network" 
        value={dominantNetwork} 
        icon={<Activity size={20} className="text-purple-500"/>} 
      />
    </div>
  );

  const renderFilterBar = () => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex flex-1 gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
        
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 md:flex-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Network Filter */}
        <div className="relative min-w-[140px]">
          <select 
            value={filterNetwork}
            onChange={(e) => setFilterNetwork(e.target.value)}
            className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
          >
            <option value="All">All Networks</option>
            {Object.values(Network).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
        </div>

        {/* Status Filter */}
        <div className="relative min-w-[140px]">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
          >
            <option value="All">All Status</option>
            {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
           <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
        </div>
      </div>

      {/* Action Button */}
      <div className="w-full md:w-auto">
        {activeTab === 'watchlist' ? (
          <button 
            onClick={() => setIsCoinModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-medium"
          >
            <Plus size={18} /> Add Coin
          </button>
        ) : (
          <button 
            onClick={() => setIsWalletModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-medium"
          >
            <Plus size={18} /> Add Wallet
          </button>
        )}
      </div>
    </div>
  );

  const renderWatchlist = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[15px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-700">Token</th>
              <th className="px-6 py-4 font-bold text-slate-700">Network</th>
              <th className="px-6 py-4 font-bold text-slate-700">Market Cap</th>
              <th className="px-6 py-4 font-bold text-slate-700">Liquidity</th>
              <th className="px-6 py-4 font-bold text-slate-700">Age</th>
              <th className="px-6 py-4 font-bold text-slate-700">Date Added</th>
              <th className="px-6 py-4 font-bold text-slate-700">Status</th>
              <th className="px-6 py-4 font-bold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">Loading tokens...</td></tr>
            ) : filteredCoins.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                  {coins.length === 0 ? "No coins added yet." : "No coins match your filters."}
                </td>
              </tr>
            ) : (
              filteredCoins.map((coin) => (
                <tr key={coin.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{coin.name}</td>
                  <td className="px-6 py-4"><NetworkBadge network={coin.network} /></td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{coin.marketCap}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{coin.liquidity}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{coin.age}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{coin.dateAdded}</td>
                  <td className="px-6 py-4"><StatusBadge status={coin.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {coin.customLink && (
                        <a 
                          href={coin.customLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Open Link"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                      <button 
                        onClick={() => startEditCoin(coin)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Edit Token"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => toggleFavoriteCoin(coin)}
                        className={`p-2 rounded-lg transition-all ${coin.isFavorite ? 'text-yellow-500 bg-yellow-50' : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                        title="Favorite"
                      >
                        <Star size={18} fill={coin.isFavorite ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={() => deleteCoin(coin.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWallets = () => (
    <div className="grid grid-cols-1 gap-4">
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading wallets...</div>
      ) : filteredWallets.map((wallet) => (
        <div key={wallet.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                 <NetworkBadge network={wallet.network} />
                 <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded">
                    <span className="font-mono text-slate-600 text-sm font-semibold">{wallet.address}</span>
                    <CopyButton text={wallet.address} />
                 </div>
                 <StatusBadge status={wallet.status} />
              </div>
              <div className="flex gap-8 mt-4 text-base">
                 <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase tracking-wider mb-1">Source</span>
                    {wallet.customLink ? (
                      <a 
                        href={wallet.customLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        {wallet.source}
                        <ExternalLink size={12} className="inline-block" />
                      </a>
                    ) : (
                      <span className="font-bold text-slate-700">{wallet.source}</span>
                    )}
                 </div>
                 <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase tracking-wider mb-1">Age</span>
                    <span className="font-bold text-slate-700">{wallet.age}</span>
                 </div>
                 <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase tracking-wider mb-1">Added</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Calendar size={14} className="text-slate-400"/> {wallet.dateAdded}
                    </span>
                 </div>
                 <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase tracking-wider mb-1">Multiplier</span>
                    <span className="font-extrabold text-indigo-600">{wallet.multiplier}</span>
                 </div>
              </div>
            </div>

            <div className="flex-1 flex gap-8 lg:justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 pl-0 lg:pl-6">
               <div className="flex items-center gap-4">
                 <div className="text-right">
                    <span className="text-slate-400 block text-xs font-bold uppercase tracking-wider mb-1">Win Rate</span>
                    <span className="font-bold text-slate-700">Performance</span>
                 </div>
                 <WinRateGauge rate={wallet.winRate} />
               </div>
               <div className="w-px h-8 bg-slate-100 mx-2 self-center hidden lg:block"></div>
               <div className="flex gap-8 items-center">
                  <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase tracking-wider mb-1">Buy Vol</span>
                    <span className="font-bold text-slate-700">{wallet.buyVolume}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase tracking-wider mb-1">Sell Vol</span>
                    <span className="font-bold text-slate-700">{wallet.sellVolume}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase tracking-wider mb-1">Profit (P&L)</span>
                    <span className={`font-extrabold text-lg ${wallet.profit.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {wallet.profit}
                    </span>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
              {wallet.customLink && (
                <a 
                  href={wallet.customLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  title="Link"
                >
                  <ExternalLink size={20} />
                </a>
              )}
              <button 
                onClick={() => startEditWallet(wallet)}
                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="Edit Wallet"
              >
                <Pencil size={20} />
              </button>
              <button 
                onClick={() => toggleFavoriteWallet(wallet)}
                className={`p-2.5 rounded-lg transition-all ${wallet.isFavorite ? 'text-yellow-500 bg-yellow-50' : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                title="Favorite"
              >
                <Star size={20} fill={wallet.isFavorite ? "currentColor" : "none"} />
              </button>
              <button 
                onClick={() => deleteWallet(wallet.id)}
                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                title="Delete"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      ))}
      {filteredWallets.length === 0 && !isLoading && (
        <div className="text-center py-12 text-slate-400 font-medium">
          {wallets.length === 0 ? "No wallets tracked yet." : "No wallets match your filters."}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 md:h-screen sticky top-0 z-10 shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <Activity className="text-indigo-600" />
            CryptoTrackr
          </h1>
          <button 
            onClick={() => setIsSqlModalOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
            title="Database Setup"
          >
            <Database size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('watchlist')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'watchlist' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <List size={20} /> Watchlist
          </button>
          <button 
            onClick={() => setActiveTab('wallets')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'wallets' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Wallet size={20} /> Wallets
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto w-full h-full">
        <div className="w-full">
          {renderStatsRow()}
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            {activeTab === 'watchlist' ? 'Watchlist' : 'Wallets'}
          </h2>
          {renderFilterBar()}
          {activeTab === 'watchlist' && renderWatchlist()}
          {activeTab === 'wallets' && renderWallets()}
        </div>
      </main>

      {/* --- Modals --- */}

      {/* Database SQL Modal */}
      <Modal isOpen={isSqlModalOpen} onClose={() => setIsSqlModalOpen(false)} title="Supabase Database Setup & Credentials">
        <div className="space-y-6">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-4">
            <div className="bg-indigo-600 p-2.5 h-fit rounded-lg text-white">
              <Terminal size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-indigo-900">Database Setup Required</h4>
              <p className="text-sm text-indigo-800 leading-relaxed">
                Supabase protects your data by default. To allow this app to save Wallets and Tokens without logging in, you must run the SQL below to create tables and enable public access.
              </p>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Run this SQL in Supabase Editor</h5>
                <CopyButton text={supabaseSql} label="Copy SQL" />
             </div>
             <div className="bg-slate-900 p-4 rounded-xl overflow-hidden">
                <pre className="text-xs text-indigo-300 font-mono overflow-x-auto whitespace-pre">
                   {supabaseSql}
                </pre>
             </div>
             <p className="text-xs text-slate-500 italic">Click Copy SQL above, go to your Supabase SQL Editor, paste the code and click Run.</p>
          </div>

          <div className="space-y-3">
             <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Project Credentials</h5>
             <div className="grid gap-3">
                <div className="flex flex-col gap-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                   <span className="text-[10px] font-bold text-slate-400 uppercase">Project Name</span>
                   <span className="text-sm font-medium text-slate-700">cimoh66890@nctime.com's Project</span>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                   <span className="text-[10px] font-bold text-slate-400 uppercase">Project ID</span>
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-slate-700">urimmfxmsamzwxsmtcxs</span>
                      <CopyButton text="urimmfxmsamzwxsmtcxs" />
                   </div>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                   <span className="text-[10px] font-bold text-slate-400 uppercase">Project URL</span>
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-slate-700">https://urimmfxmsamzwxsmtcxs.supabase.co</span>
                      <CopyButton text="https://urimmfxmsamzwxsmtcxs.supabase.co" />
                   </div>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                   <span className="text-[10px] font-bold text-slate-400 uppercase">Public API Key (Anon)</span>
                   <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-mono text-slate-500 truncate">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</span>
                      <CopyButton text="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyaW1tZnhtc2Ftend4c210Y3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MjQ0MjUsImV4cCI6MjA4MjAwMDQyNX0.N6mWD0R8QS8kJVwq9XmOoQl_qLxMHJsT2Pdz_Dnu0uE" />
                   </div>
                </div>
             </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
             <div className="flex gap-3">
                <Info size={18} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="text-sm text-slate-600">
                   <strong>Why am I seeing this?</strong> Supabase protects your data by default. This setup ensures your wallets and tokens can be saved without requiring a login for this demo.
                </div>
             </div>
          </div>
          
          <button 
            onClick={() => setIsSqlModalOpen(false)}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Come back here and try adding a wallet!
          </button>
        </div>
      </Modal>

      {/* Add/Edit Coin Modal */}
      <Modal isOpen={isCoinModalOpen} onClose={closeCoinModal} title={editingCoinId ? "Edit Watchlist Item" : "Add Coin to Watchlist"}>
        <div className="space-y-4">
          {!parsedCoinData ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">DexScreener URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newCoinUrl}
                    onChange={(e) => setNewCoinUrl(e.target.value)}
                    placeholder="https://dexscreener.com/..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button 
                    onClick={handleParseCoin} 
                    disabled={!newCoinUrl || isParsingCoin}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isParsingCoin ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Paste a URL and we'll fetch the data for you.</p>
              </div>
            </>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                Data loaded! Review details below.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500">Name</label>
                  <input 
                    type="text" 
                    value={parsedCoinData.name} 
                    onChange={e => setParsedCoinData({...parsedCoinData, name: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded mt-1 bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">Market Cap</label>
                  <input 
                    type="text" 
                    value={parsedCoinData.marketCap} 
                    onChange={e => setParsedCoinData({...parsedCoinData, marketCap: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded mt-1 bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">Liquidity</label>
                  <input 
                    type="text" 
                    value={parsedCoinData.liquidity} 
                    onChange={e => setParsedCoinData({...parsedCoinData, liquidity: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded mt-1 bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">Age</label>
                  <input 
                    type="text" 
                    value={parsedCoinData.age} 
                    onChange={e => setParsedCoinData({...parsedCoinData, age: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded mt-1 bg-white" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Network</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    value={parsedCoinData.network}
                    onChange={(e) => setParsedCoinData({...parsedCoinData, network: e.target.value as Network})}
                  >
                    {Object.values(Network).map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    value={parsedCoinData.status}
                    onChange={(e) => setParsedCoinData({...parsedCoinData, status: e.target.value as Status})}
                  >
                    <option value={Status.GOOD}>{Status.GOOD}</option>
                    <option value={Status.EXCELLENT}>{Status.EXCELLENT}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom Link</label>
                <input 
                  type="text" 
                  value={parsedCoinData.customLink || ''}
                  onChange={(e) => setParsedCoinData({...parsedCoinData, customLink: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={closeCoinModal} 
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveCoin} 
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold"
                >
                  {editingCoinId ? 'Update Token' : 'Save Token'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Add/Edit Wallet Modal */}
      <Modal isOpen={isWalletModalOpen} onClose={closeWalletModal} title={editingWalletId ? "Edit Wallet Tracker" : "Track New Wallet"}>
        <div className="space-y-6">
          
          {/* Quick Parser Box */}
          {!editingWalletId && (
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-3">
                <MousePointer2 className="text-indigo-600" size={18} />
                <h4 className="text-sm font-bold text-indigo-900">Quick Text Parser</h4>
              </div>
              <textarea 
                value={rawWalletText}
                onChange={e => setRawWalletText(e.target.value)}
                placeholder="Paste performance text here..."
                className="w-full h-24 p-3 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none"
              />
              <button 
                onClick={handleManualSmartParse}
                disabled={!rawWalletText}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition-all shadow-sm"
              >
                <Zap size={16} />
                Auto-fill from Text
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Wallet Address</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                placeholder="0x..."
                value={newWallet.address || ''}
                onChange={e => setNewWallet({...newWallet, address: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Buy Vol</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="$0"
                    value={newWallet.buyVolume || ''}
                    onChange={e => setNewWallet({...newWallet, buyVolume: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sell Vol</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="$0"
                    value={newWallet.sellVolume || ''}
                    onChange={e => setNewWallet({...newWallet, sellVolume: e.target.value})}
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Profit (P&L)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="+$0"
                  value={newWallet.profit || ''}
                  onChange={e => setNewWallet({...newWallet, profit: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Win Rate (%)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="0"
                    max="100"
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    value={newWallet.winRate || 0}
                    onChange={e => setNewWallet({...newWallet, winRate: parseInt(e.target.value)})}
                  />
                  <span className="text-sm font-bold w-10 text-slate-700">{newWallet.winRate}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Multiplier</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="1.5x"
                  value={newWallet.multiplier || ''}
                  onChange={e => setNewWallet({...newWallet, multiplier: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${isFetchingTokenForWallet ? 'bg-slate-50 pr-10' : 'border-slate-300'}`}
                    placeholder="e.g. GMGN or DexScreener URL"
                    value={newWallet.source || ''}
                    onChange={e => handleSourceChange(e.target.value)}
                  />
                  {isFetchingTokenForWallet && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 size={16} className="animate-spin text-indigo-600" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Pasting a DexScreener link here will auto-fetch the token name.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Network</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={newWallet.network}
                  onChange={e => setNewWallet({...newWallet, network: e.target.value as Network})}
                >
                  {Object.values(Network).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                 <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={newWallet.status}
                  onChange={e => setNewWallet({...newWallet, status: e.target.value as Status})}
                >
                  <option value={Status.GOOD}>{Status.GOOD}</option>
                  <option value={Status.EXCELLENT}>{Status.EXCELLENT}</option>
                </select>
              </div>
            </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom Link</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="https://..."
                  value={newWallet.customLink || ''}
                  onChange={e => setNewWallet({...newWallet, customLink: e.target.value})}
                />
              </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={closeWalletModal}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveWallet}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-bold shadow-sm transition-all"
              >
                {editingWalletId ? 'Update Wallet' : 'Save Wallet'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}
