import { BaseMetrics } from '../types/data';

interface ProcessedData {
    features: number[][];
    labels: number[];
}

export function normalizeFeatures(data: BaseMetrics): number[] {
    return [
        data.volumeAnomaly,
        data.holderConcentration,
        data.liquidityScore,
        data.priceVolatility,
        data.sellPressure,
        data.marketCapRisk
    ];
}

export function preprocessTokenData(data: BaseMetrics[]): ProcessedData {
    return {
        features: data.map(token => normalizeFeatures(token)),
        labels: data.map(token => token.isRugPull ? 1 : 0)
    };
} 
