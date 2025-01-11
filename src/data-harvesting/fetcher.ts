import axios from 'axios';
import dotenv from 'dotenv';
import { TokenData, TokenMetrics } from '../types/data';

dotenv.config();

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

interface Transaction {
    from: string;
    to: string;
    value: string;
    timestamp: number;
    hash: string;
}

interface BundlerPattern {
    isFromBundler: boolean;
    similarTransactionCount: number;
    timePattern: number;
}

interface DexScreenerData {
    pairs?: Array<{
        priceUsd?: number;
        volume?: {
            h24?: number;
        };
        liquidity?: {
            usd?: number;
        };
        priceChange?: {
            h24?: number;
        };
    }>;
}

interface EtherscanData {
    status: string;
    result: Transaction[];
}

interface AccumulationMetrics {
    accumulationRate: number;
    stealthAccumulation: number;
}

async function fetchEtherscanData(tokenAddress: string): Promise<EtherscanData | null> {
    try {
        const response = await axios.get(`https://api.etherscan.io/api`, {
            params: {
                module: 'account',
                action: 'tokentx',
                contractaddress: tokenAddress,
                apikey: ETHERSCAN_API_KEY,
                sort: 'desc'
            }
        });
        
        if (response.data?.status === '1' && Array.isArray(response.data.result)) {
            return response.data as EtherscanData;
        }
        return null;
    } catch (error: unknown) {
        console.error('Error fetching Etherscan data:', error instanceof Error ? error.message : 'Unknown error');
        return null;
    }
}

async function fetchDexScreenerData(tokenAddress: string): Promise<DexScreenerData | null> {
    try {
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
        return response.data as DexScreenerData;
    } catch (error: unknown) {
        console.error('Error fetching DexScreener data:', error instanceof Error ? error.message : 'Unknown error');
        return null;
    }
}

async function detectBundlerPattern(transactions: Transaction[]): Promise<BundlerPattern> {
    const timeGaps = calculateTimeGaps(transactions);
    const variance = calculateVariance(timeGaps);
    
    return {
        isFromBundler: variance < 0.1,
        similarTransactionCount: transactions.length,
        timePattern: variance
    };
}

async function calculateAccumulationMetrics(transactions: Transaction[]): Promise<AccumulationMetrics> {
    const uniqueAddresses = new Set(transactions.map(tx => tx.to));
    const totalTransactions = transactions.length;
    
    return {
        accumulationRate: uniqueAddresses.size / totalTransactions,
        stealthAccumulation: totalTransactions > 100 ? 0.8 : 0.2
    };
}

function calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(val => Math.pow(val - mean, 2));
    return squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateTimeGaps(transactions: Transaction[]): number[] {
    const gaps: number[] = [];
    for (let i = 1; i < transactions.length; i++) {
        gaps.push(transactions[i-1].timestamp - transactions[i].timestamp);
    }
    return gaps;
}

function calculateVolumeAnomaly(dexData: DexScreenerData | null): number {
    if (!dexData?.pairs?.[0]?.volume?.h24) return 0.5;
    const volume = dexData.pairs[0].volume.h24;
    return volume > 1000000 ? 0.8 : 0.2;
}

function calculateHolderConcentration(etherscanData: EtherscanData | null): number {
    if (!etherscanData?.result) return 0.5;
    const uniqueHolders = new Set(etherscanData.result.map(tx => tx.to)).size;
    return uniqueHolders < 100 ? 0.8 : 0.2;
}

function calculateLiquidityScore(dexData: DexScreenerData | null): number {
    if (!dexData?.pairs?.[0]?.liquidity?.usd) return 0.5;
    const liquidity = dexData.pairs[0].liquidity.usd;
    return liquidity > 100000 ? 0.2 : 0.8;
}

function calculatePriceVolatility(dexData: DexScreenerData | null): number {
    if (!dexData?.pairs?.[0]?.priceChange?.h24) return 0.5;
    const priceChange = Math.abs(dexData.pairs[0].priceChange.h24);
    return priceChange > 20 ? 0.8 : 0.2;
}

function calculateSellPressure(dexData: DexScreenerData | null): number {
    if (!dexData?.pairs?.[0]?.priceChange?.h24) return 0.5;
    const priceChange = dexData.pairs[0].priceChange.h24;
    return priceChange < -10 ? 0.8 : 0.2;
}

function calculateMarketCapRisk(dexData: DexScreenerData | null): number {
    if (!dexData?.pairs?.[0]?.liquidity?.usd) return 0.5;
    const liquidity = dexData.pairs[0].liquidity.usd;
    return liquidity < 50000 ? 0.8 : 0.2;
}

export async function fetchTokenData(tokenAddress: string, chain: string = 'ethereum'): Promise<TokenData | null> {
    try {
        const etherscanData = await fetchEtherscanData(tokenAddress);
        const dexData = await fetchDexScreenerData(tokenAddress);
        
        if (!etherscanData?.result || !dexData?.pairs) {
            return null;
        }
        
        const bundlerPattern = await detectBundlerPattern(etherscanData.result);
        const accMetrics = await calculateAccumulationMetrics(etherscanData.result);
        
        const metrics: TokenMetrics = {
            volumeAnomaly: calculateVolumeAnomaly(dexData),
            holderConcentration: calculateHolderConcentration(etherscanData),
            liquidityScore: calculateLiquidityScore(dexData),
            priceVolatility: calculatePriceVolatility(dexData),
            sellPressure: calculateSellPressure(dexData),
            marketCapRisk: calculateMarketCapRisk(dexData)
        };
        
        const isRugPull = determineIfRugPull(accMetrics, metrics);
        
        return {
            token: tokenAddress,
            ...metrics,
            bundlerActivity: bundlerPattern.isFromBundler,
            accumulationRate: accMetrics.accumulationRate,
            stealthAccumulation: accMetrics.stealthAccumulation,
            suspiciousPattern: bundlerPattern.timePattern,
            isRugPull,
            metadata: {
                reason: generateReason(accMetrics, metrics)
            }
        };
    } catch (error: unknown) {
        console.error('Error fetching token data:', error instanceof Error ? error.message : 'Unknown error');
        return null;
    }
}

function determineIfRugPull(accMetrics: { accumulationRate: number, stealthAccumulation: number }, metrics: TokenMetrics): boolean {
    const riskScore = (
        metrics.volumeAnomaly +
        metrics.holderConcentration +
        metrics.liquidityScore +
        metrics.priceVolatility +
        metrics.sellPressure +
        metrics.marketCapRisk +
        accMetrics.stealthAccumulation
    ) / 7;
    
    return riskScore > 0.6;
}

function generateReason(accMetrics: { accumulationRate: number, stealthAccumulation: number }, metrics: TokenMetrics): string {
    interface ReasonCondition {
        condition: boolean;
        message: string;
    }
    
    const conditions: ReasonCondition[] = [
        { condition: metrics.volumeAnomaly > 0.7, message: 'Unusual trading volume detected' },
        { condition: metrics.holderConcentration > 0.7, message: 'High concentration of holders' },
        { condition: metrics.liquidityScore > 0.7, message: 'Low liquidity' },
        { condition: metrics.priceVolatility > 0.7, message: 'High price volatility' },
        { condition: metrics.sellPressure > 0.7, message: 'High sell pressure' },
        { condition: metrics.marketCapRisk > 0.7, message: 'Market cap concerns' },
        { condition: accMetrics.stealthAccumulation > 0.7, message: 'Suspicious accumulation pattern' }
    ];
    
    const reasons = conditions
        .filter(({ condition }) => condition)
        .map(({ message }) => message);
    
    return reasons.join(', ') || 'No specific concerns identified';
}
