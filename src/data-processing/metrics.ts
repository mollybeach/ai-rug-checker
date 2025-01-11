// path: src/data-processing/metrics.ts
import { TokenMetrics } from '../types/data';
import { loadExistingData } from './storage';

export async function getTokenStats() {
    const data = await loadExistingData();
    const totalTokens = data.length;
    const rugPulls = data.filter(t => t.isRugPull).length;
    const legitimateTokens = totalTokens - rugPulls;

    const averageMetrics = data.reduce<TokenMetrics>((acc, token) => {
        acc.volumeAnomaly += token.volumeAnomaly;
        acc.holderConcentration += token.holderConcentration;
        acc.liquidityScore += token.liquidityScore;
        acc.priceVolatility += token.priceVolatility;
        acc.sellPressure += token.sellPressure;
        acc.marketCapRisk += token.marketCapRisk;
        return acc;
    }, {
        volumeAnomaly: 0,
        holderConcentration: 0,
        liquidityScore: 0,
        priceVolatility: 0,
        sellPressure: 0,
        marketCapRisk: 0
    });

    // Calculate averages
    if (totalTokens > 0) {
        Object.keys(averageMetrics).forEach((key) => {
            (averageMetrics as any)[key] = averageMetrics[key as keyof TokenMetrics] / totalTokens;
        });
    }

    return {
        totalTokens,
        rugPulls,
        legitimateTokens,
        averageMetrics,
        lastUpdated: new Date().toISOString()
    };
} 