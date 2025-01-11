import { ethers } from 'ethers';
import axios from 'axios';
import dotenv from 'dotenv';
import { TokenData, Transaction } from './types';
import { appendTokenData } from './storage';

dotenv.config();

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

interface BundlerPattern {
    isFromBundler: boolean;
    similarTransactionCount: number;
    timePattern: number;
}

async function fetchEtherscanData(tokenAddress: string) {
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
        
        // Ensure we have valid array data
        if (response.data?.status === '1' && Array.isArray(response.data.result)) {
            return {
                ...response.data,
                result: response.data.result.filter((tx: any) => tx && typeof tx === 'object')
            };
        }
        
        // Return empty result if no valid data
        return { status: '0', result: [] };
    } catch (error) {
        console.error('Error fetching from Etherscan:', error);
        return { status: '0', result: [] };
    }
}

async function fetchDexScreenerData(tokenAddress: string) {
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    return response.data;
}

async function detectBundlerPattern(transactions: Transaction[]): Promise<BundlerPattern> {
    // Group transactions by sender
    const senderGroups = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
        acc[tx.from] = acc[tx.from] || [];
        acc[tx.from].push(tx);
        return acc;
    }, {});

    let bundlerScore = 0;
    let similarTxCount = 0;
    let timePatternScore = 0;

    Object.values(senderGroups).forEach((txs: Transaction[]) => {
        const gasVariance = calculateVariance(txs.map(tx => tx.gasPrice));
        if (gasVariance < 0.1) bundlerScore += 1;

        const valueVariance = calculateVariance(txs.map(tx => tx.value));
        if (valueVariance < 0.1) similarTxCount += txs.length;

        const timeGaps = calculateTimeGaps(txs);
        const timeVariance = calculateVariance(timeGaps);
        if (timeVariance < 300) timePatternScore += 1;
    });

    return {
        isFromBundler: bundlerScore > 3,
        similarTransactionCount: similarTxCount,
        timePattern: timePatternScore
    };
}

async function calculateAccumulationMetrics(transactions: Transaction[]) {
    const bundlerPattern = await detectBundlerPattern(transactions);
    
    const accumulationRate = transactions.reduce((acc, tx) => {
        return acc + (tx.type === 'buy' ? tx.value : -tx.value);
    }, 0) / transactions.length;

    const stealthScore = bundlerPattern.isFromBundler ? 
        (bundlerPattern.similarTransactionCount * bundlerPattern.timePattern) / 100 : 0;

    return {
        bundlerDetected: bundlerPattern.isFromBundler,
        accumulationRate,
        stealthAccumulationScore: stealthScore,
        suspiciousPatternScore: (stealthScore + accumulationRate) / 2
    };
}

function calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}

function calculateTimeGaps(transactions: Transaction[]): number[] {
    const sortedTx = transactions.sort((a, b) => a.timestamp - b.timestamp);
    const gaps = [];
    for (let i = 1; i < sortedTx.length; i++) {
        gaps.push(sortedTx[i].timestamp - sortedTx[i-1].timestamp);
    }
    return gaps;
}

function calculateVolumeAnomaly(dexData: any): number {
    const pair = dexData.pairs?.[0];
    if (!pair) return 0;

    const volumeH24 = pair.volume?.h24 || 0;
    const volumeH6 = pair.volume?.h6 || 0;
    const volumeH1 = pair.volume?.h1 || 0;

    // Check for unusual volume spikes
    const h6Ratio = volumeH6 > 0 ? (volumeH24 / 4) / volumeH6 : 1;
    const h1Ratio = volumeH1 > 0 ? (volumeH6 / 6) / volumeH1 : 1;

    // Normalize to 0-1 range where higher means more anomalous
    return Math.min(Math.max((h6Ratio + h1Ratio - 1) / 3, 0), 1);
}

function calculateHolderConcentration(etherscanData: any): number {
    if (!etherscanData?.result || !Array.isArray(etherscanData.result) || etherscanData.result.length === 0) {
        return 1; // Max risk if no valid holder data
    }

    // Get unique addresses that have interacted with the token
    const uniqueAddresses = new Set<string>();
    etherscanData.result.forEach((tx: any) => {
        if (tx && tx.from) uniqueAddresses.add(tx.from.toLowerCase());
        if (tx && tx.to) uniqueAddresses.add(tx.to.toLowerCase());
    });

    const totalAddresses = uniqueAddresses.size;
    if (totalAddresses <= 1) return 1;

    // Calculate concentration based on unique addresses vs total transactions
    const concentration = 1 - (Math.log(totalAddresses) / Math.log(etherscanData.result.length));
    
    // Normalize to 0-1 range
    return Math.min(Math.max(concentration, 0), 1);
}

function calculateLiquidityScore(dexData: any): number {
    const pair = dexData.pairs?.[0];
    if (!pair) return 0;

    const liquidity = pair.liquidity?.usd || 0;
    const marketCap = pair.marketCap || 0;

    if (marketCap === 0) return 0;

    // Calculate liquidity ratio
    const liquidityRatio = liquidity / marketCap;
    
    // Normalize to 0-1 range where higher means better liquidity
    return Math.min(Math.max(liquidityRatio * 2, 0), 1);
}

function calculatePriceVolatility(dexData: any): number {
    const pair = dexData.pairs?.[0];
    if (!pair) return 0;

    const priceChanges = [
        Math.abs(pair.priceChange?.h24 || 0),
        Math.abs(pair.priceChange?.h6 || 0),
        Math.abs(pair.priceChange?.h1 || 0)
    ];
    const maxChange = Math.max(...priceChanges);
    return Math.min(maxChange / 100, 1); // Normalize to 0-1
}

function calculateSellPressure(dexData: any): number {
    const pair = dexData.pairs?.[0];
    if (!pair) return 1;

    const sells = pair.txns?.h24?.sells || 0;
    const buys = pair.txns?.h24?.buys || 0;
    if (buys + sells === 0) return 1; // Max risk if no transactions
    return Math.min(sells / (buys + sells), 1);
}

function calculateMarketCapRisk(dexData: any): number {
    const pair = dexData.pairs?.[0];
    if (!pair) return 1;

    const marketCap = pair.marketCap || 0;
    if (marketCap === 0) return 1;

    // Higher risk for very low or very high market caps
    const logMarketCap = Math.log10(marketCap);
    const normalizedRisk = Math.abs(logMarketCap - 6) / 6; // Assuming 1M is ideal
    return Math.min(normalizedRisk, 1);
}

export async function fetchTokenData(tokenAddress: string, chain: string = 'ethereum'): Promise<TokenData | null> {
    try {
        const [etherscanData, dexScreenerData] = await Promise.all([
            fetchEtherscanData(tokenAddress),
            fetchDexScreenerData(tokenAddress)
        ]);

        if (!etherscanData?.result || !Array.isArray(etherscanData.result)) {
            console.log('Invalid Etherscan data structure:', etherscanData);
            return null;
        }

        const transactions = etherscanData.result.map((tx: any) => ({
            from: tx.from,
            to: tx.to,
            value: parseFloat(ethers.formatEther(tx.value || '0')),
            gasPrice: parseFloat(ethers.formatUnits(tx.gasPrice || '0', 'gwei')),
            timestamp: parseInt(tx.timeStamp || '0'),
            type: tx.to.toLowerCase() === tokenAddress.toLowerCase() ? 'buy' : 'sell'
        }));

        const accMetrics = await calculateAccumulationMetrics(transactions);

        const tokenData: TokenData = {
            token: tokenAddress,
            volumeAnomaly: calculateVolumeAnomaly(dexScreenerData),
            holderConcentration: calculateHolderConcentration(etherscanData),
            liquidityScore: calculateLiquidityScore(dexScreenerData),
            priceVolatility: calculatePriceVolatility(dexScreenerData),
            sellPressure: calculateSellPressure(dexScreenerData),
            marketCapRisk: calculateMarketCapRisk(dexScreenerData),
            bundlerActivity: accMetrics.bundlerDetected,
            accumulationRate: accMetrics.accumulationRate,
            stealthAccumulation: accMetrics.stealthAccumulationScore,
            suspiciousPattern: accMetrics.suspiciousPatternScore,
            isRugPull: determineIfRugPull(accMetrics, dexScreenerData),
            metadata: {
                reason: generateReason(accMetrics, dexScreenerData)
            }
        };

        await appendTokenData(tokenData);
        return tokenData;
    } catch (error) {
        console.error('Error fetching token data:', error);
        return null;
    }
}

function determineIfRugPull(accMetrics: any, dexData: any): boolean {
    const riskFactors = [
        accMetrics.stealthAccumulationScore > 0.7,
        accMetrics.bundlerDetected && accMetrics.accumulationRate > 0.5,
        accMetrics.suspiciousPatternScore > 0.8,
        dexData.priceChange24h < -0.3 && accMetrics.stealthAccumulationScore > 0.5
    ];

    return riskFactors.filter(Boolean).length >= 2;
}

function generateReason(accMetrics: any, dexData: any): string {
    const reasons = [];

    if (accMetrics.bundlerDetected) {
        reasons.push('Detected bundler wallet activity');
    }
    if (accMetrics.stealthAccumulationScore > 0.7) {
        reasons.push('High stealth accumulation detected');
    }
    if (accMetrics.suspiciousPatternScore > 0.8) {
        reasons.push('Suspicious trading patterns identified');
    }
    if (accMetrics.accumulationRate > 0.5) {
        reasons.push('Abnormal token accumulation rate');
    }

    return reasons.join(', ') || 'No suspicious patterns detected';
}
