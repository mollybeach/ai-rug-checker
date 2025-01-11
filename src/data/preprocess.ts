import { TrainingData } from './types';

export function normalizeFeatures(metrics: TrainingData): number[] {
    return [
        metrics.volumeAnomaly,
        metrics.holderConcentration,
        metrics.liquidityScore,
        metrics.priceVolatility,
        metrics.sellPressure,
        metrics.marketCapRisk
    ];
}

export function prepareTrainingData(data: TrainingData[]): {
    features: number[][];
    labels: number[];
} {
    const features = data.map(normalizeFeatures);
    const labels = data.map(d => d.isRugPull ? 1 : 0);
    return { features, labels };
} 
