// path: src/data-harvesting/fetcher.ts
import axios from 'axios';
import dotenv from 'dotenv';
import { TokenData, TokenMetrics } from '../types/data';

dotenv.config();

const ENDPOINTS = {
    ethereum: 'https://api.etherscan.io/api',
    bsc: 'https://api.bscscan.com/api',
    polygon: 'https://api.polygonscan.com/api'
};

const API_KEYS = {
    ethereum: process.env.ETHERSCAN_API_KEY,
    bsc: process.env.BSCSCAN_API_KEY,
    polygon: process.env.POLYGONSCAN_API_KEY
};

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
        baseToken?: {
            name: string;
            symbol: string;
        };
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

async function fetchEtherscanData(tokenAddress: string, chain: string = 'ethereum'): Promise<EtherscanData | null> {
    try {
        const endpoint = ENDPOINTS[chain as keyof typeof ENDPOINTS];
        const apiKey = API_KEYS[chain as keyof typeof API_KEYS];
        
        if (!endpoint || !apiKey) {
            console.log(`❌ No Etherscan endpoint or API key for chain: ${chain}`);
            return null;
        }

        console.log(`🔑 Using ${chain}scan API key: ${apiKey.slice(0, 6)}...`);
        const response = await axios.get(endpoint, {
            params: {
                module: 'account',
                action: 'tokentx',
                contractaddress: tokenAddress,
                apikey: apiKey,
                sort: 'desc'
            }
        });
        
        if (response.data?.status === '1' && Array.isArray(response.data.result)) {
            console.log(`✅ Found ${response.data.result.length} transactions`);
            return response.data as EtherscanData;
        }
        
        console.log(`❌ Invalid response from ${chain}scan:`, 
            response.data?.message || 
            (response.data?.result === null ? 'No transactions found' : 
             response.data?.status === '0' ? 'API request failed' : 
             'Unknown error')
        );
        console.log('🔍 Response details:', JSON.stringify(response.data, null, 2));
        return null;
    } catch (error: unknown) {
        console.error(`Error fetching ${chain}scan data:`, error instanceof Error ? error.message : 'Unknown error');
        return null;
    }
}

async function fetchDexScreenerData(tokenAddress: string): Promise<DexScreenerData | null> {
    console.log('\n🔍 Entering fetchDexScreenerData()');
    console.log(`📊 Fetching DexScreener data for: ${tokenAddress}`);
    try {
        console.log('🌐 Making API request to DexScreener...');
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
        console.log('✅ DexScreener API request successful');
        if (response.data?.pairs?.length > 0) {
            console.log(`📈 Found ${response.data.pairs.length} trading pairs`);
            console.log(`💰 Price: $${response.data.pairs[0].priceUsd || 'unknown'}`);
            console.log(`💧 Liquidity: $${response.data.pairs[0].liquidity?.usd || 'unknown'}`);
        }
        return response.data as DexScreenerData;
    } catch (error: unknown) {
        console.error('❌ Error fetching DexScreener data:', error instanceof Error ? error.message : 'Unknown error');
        return null;
    } finally {
        console.log('✅ Exiting fetchDexScreenerData()');
    }
}

async function detectBundlerPattern(transactions: Transaction[]): Promise<BundlerPattern> {
    console.log('\n🔍 Entering detectBundlerPattern()');
    console.log(`📊 Analyzing ${transactions.length} transactions for patterns`);
    
    console.log('⏱️ Calculating time gaps between transactions...');
    const timeGaps = calculateTimeGaps(transactions);
    console.log(`📈 Found ${timeGaps.length} time gaps`);
    
    console.log('🧮 Calculating variance in time gaps...');
    const variance = calculateVariance(timeGaps);
    console.log(`📊 Time gap variance: ${variance.toFixed(4)}`);
    
    const pattern = {
        isFromBundler: variance < 0.1,
        similarTransactionCount: transactions.length,
        timePattern: variance
    };
    
    console.log(`🤖 Bundler detection results:`);
    console.log(`   Is bundler: ${pattern.isFromBundler ? 'Yes' : 'No'}`);
    console.log(`   Similar transactions: ${pattern.similarTransactionCount}`);
    console.log(`   Time pattern score: ${pattern.timePattern.toFixed(4)}`);
    
    console.log('✅ Exiting detectBundlerPattern()');
    return pattern;
}

async function calculateAccumulationMetrics(transactions: Transaction[]): Promise<AccumulationMetrics> {
    console.log('\n🔍 Entering calculateAccumulationMetrics()');
    console.log(`📊 Analyzing ${transactions.length} transactions for accumulation patterns`);
    
    console.log('👥 Calculating unique addresses...');
    const uniqueAddresses = new Set(transactions.map(tx => tx.to));
    console.log(`📈 Found ${uniqueAddresses.size} unique addresses`);
    
    const totalTransactions = transactions.length;
    const accumulationRate = uniqueAddresses.size / totalTransactions;
    const stealthAccumulation = totalTransactions > 100 ? 0.8 : 0.2;
    
    console.log('📊 Accumulation metrics calculated:');
    console.log(`   Accumulation rate: ${accumulationRate.toFixed(4)}`);
    console.log(`   Stealth score: ${stealthAccumulation}`);
    console.log(`   Unique addresses ratio: ${(uniqueAddresses.size / totalTransactions * 100).toFixed(1)}%`);
    
    console.log('✅ Exiting calculateAccumulationMetrics()');
    return {
        accumulationRate,
        stealthAccumulation
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
        console.log(`\n📊 Fetching data for token: ${tokenAddress} on ${chain}`);
        
        const etherscanData = await fetchEtherscanData(tokenAddress, chain);
        if (!etherscanData?.result) {
            console.log('❌ Failed to fetch Etherscan data');
            return null;
        }
        console.log(`✅ ${chain}scan data received: ${etherscanData.result.length} transactions`);
        
        const dexData = await fetchDexScreenerData(tokenAddress);
        if (!dexData?.pairs) {
            console.log('❌ Failed to fetch DexScreener data');
            return null;
        }
        console.log(`✅ DexScreener data received: ${dexData.pairs.length} pairs`);
        
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
            name: dexData.pairs?.[0]?.baseToken?.name || 'Unknown',
            symbol: dexData.pairs?.[0]?.baseToken?.symbol || 'UNKNOWN',
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
