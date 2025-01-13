export interface TokenMetrics {
    volumeAnomaly: number;
    holderConcentration: number;
    liquidityScore: number;
    priceVolatility: number;
    sellPressure: number;
    marketCapRisk: number;
}

export interface BaseMetrics extends TokenMetrics {
    isRugPull: boolean;
}

export interface TokenData extends TokenMetrics {
    token: string;
    name: string;
    symbol: string;
    bundlerActivity: boolean;
    accumulationRate: number;
    stealthAccumulation: number;
    suspiciousPattern: boolean | null;
    isRugPull: boolean;
    metadata: {
        reason: string;
    };
    // Price data
    currentPrice?: number;
    volume24h?: number;
    marketCap?: number;
    liquidity?: number;
}

export interface TrainingData extends BaseMetrics {
    // Training data only needs the core metrics
}

export interface TokenAnalysis {
    token: string;
    rugPullProbability: number;
    metrics: TokenMetrics;
    bundlerActivity: boolean;
    accumulationRate: number;
    stealthAccumulation: number;
    suspiciousPattern: boolean | null;
    reason: string;
}

export interface ReasonMessage {
    condition: boolean;
    message: string;
}

export interface TokenAnalysisReason {
    reasons: string[];
    formatted: string;
} 