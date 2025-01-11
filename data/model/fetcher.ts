import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd: string;
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  txns: {
    h24: {
      buys: number;
      sells: number;
    };
    h6: {
      buys: number;
      sells: number;
    };
    h1: {
      buys: number;
      sells: number;
    };
  };
  fdv: number;
  marketCap: number;
}

export async function fetchDexScreenerData(tokenAddress: string): Promise<DexScreenerPair[]> {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
    const response = await axios.get(url);
    return response.data.pairs || [];
  } catch (error) {
    console.error('Error fetching DexScreener data:', error);
    throw error;
  }
}

export async function fetchTokenData(tokenAddress: string) {
  try {
    // Get data from both sources
    const [etherscanResponse, dexScreenerPairs] = await Promise.all([
      axios.get(`https://api.etherscan.io/api`, {
        params: {
          module: 'token',
          action: 'tokeninfo',
          contractaddress: tokenAddress,
          apikey: ETHERSCAN_API_KEY
        }
      }),
      fetchDexScreenerData(tokenAddress)
    ]);

    // Get the main trading pair (usually the one with highest liquidity)
    const mainPair = dexScreenerPairs.sort((a, b) => b.liquidity.usd - a.liquidity.usd)[0];
    
    return {
      volume: mainPair?.volume?.h24 || 0,
      holders: etherscanResponse.data.result.holders || 0,
      liquidity: mainPair?.liquidity?.usd || 0,
      priceChange24h: mainPair?.priceChange?.h24 || 0,
      buyTxns24h: mainPair?.txns?.h24?.buys || 0,
      sellTxns24h: mainPair?.txns?.h24?.sells || 0,
      marketCap: mainPair?.marketCap || 0
    };
  } catch (error) {
    console.error('Error fetching token data:', error);
    throw error;
  }
}
