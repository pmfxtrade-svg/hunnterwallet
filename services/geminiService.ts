
import { GoogleGenAI } from "@google/genai";
import { Network, Status } from "../types";

// Fix: Use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Direct integration with DexScreener API
export const parseDexScreenerData = async (query: string) => {
  try {
    let searchTerm = query.trim();
    const urlMatch = searchTerm.match(/dexscreener\.com\/[^\/]+\/([a-zA-Z0-9]+)/);
    if (urlMatch && urlMatch[1]) {
        searchTerm = urlMatch[1];
    } else if (searchTerm.includes('/')) {
        const parts = searchTerm.split('/');
        searchTerm = parts[parts.length - 1];
    }

    const apiUrl = `https://api.dexscreener.com/latest/dex/search?q=${searchTerm}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.pairs || data.pairs.length === 0) {
        throw new Error("No pairs found for this token/url");
    }

    const pair = data.pairs[0];
    let network = Network.OTHER;
    const chainId = (pair.chainId || '').toLowerCase();
    if (chainId.includes('sol')) network = Network.SOLANA;
    else if (chainId.includes('eth')) network = Network.ETHEREUM;
    else if (chainId.includes('base')) network = Network.BASE;
    else if (chainId.includes('bsc')) network = Network.BSC;

    let status = Status.GOOD;
    const liquidity = pair.liquidity?.usd || 0;
    if (liquidity > 500000) {
        status = Status.EXCELLENT;
    }

    let age = "New";
    if (pair.pairCreatedAt) {
        const created = new Date(pair.pairCreatedAt);
        const now = new Date();
        const diffMs = now.getTime() - created.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffMonths = Math.floor(diffDays / 30);

        if (diffMinutes < 60) age = `${diffMinutes}m`;
        else if (diffHours < 24) age = `${diffHours}h`;
        else if (diffDays < 30) age = `${diffDays}d`;
        else age = `${diffMonths}mo`;
    }

    const fmt = (num: number) => {
        if (!num) return '$0';
        if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
        if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
        if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
        return `$${num.toFixed(2)}`;
    };

    return {
        name: pair.baseToken.symbol,
        marketCap: fmt(pair.marketCap || pair.fdv || 0),
        liquidity: fmt(liquidity),
        age: age,
        network: network,
        status: status,
        customLink: pair.url,
        dexScreenerUrl: pair.url
    };

  } catch (error) {
    console.error("DexScreener Service Error:", error);
    throw error;
  }
};
