import { fetchTokenData } from './fetcher.js';

interface TokenMetrics {
  volume: number;
  holders: number;
  liquidity: number;
  priceChange24h: number;
  buyTxns24h: number;
  sellTxns24h: number;
  marketCap: number;
}

export async function preprocessTokenData(tokenData: TokenMetrics) {
  // Normalize and calculate risk indicators
  const volumeAnomaly = tokenData.volume < 10000; // Low volume
  const holderConcentration = tokenData.holders < 100; // Few holders
  const lowLiquidity = tokenData.liquidity < 50000; // Low liquidity
  const highPriceVolatility = Math.abs(tokenData.priceChange24h) > 30; // >30% price change
  const sellPressure = tokenData.sellTxns24h > tokenData.buyTxns24h * 2; // More sells than buys
  const lowMarketCap = tokenData.marketCap < 100000; // Low market cap

  // Return all required fields for TrainingData interface
  return {
    volumeAnomaly: Number(volumeAnomaly),
    holderConcentration: Number(holderConcentration),
    liquidityScore: Number(lowLiquidity),
    priceVolatility: Number(highPriceVolatility),
    sellPressure: Number(sellPressure),
    marketCapRisk: Number(lowMarketCap)
  };
} 
