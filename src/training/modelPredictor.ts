//path: src/training/modelPredictor.ts
import * as tf from '@tensorflow/tfjs-node';
import { fetchTokenData } from '../data-harvesting/fetcher';
import { normalizeFeatures } from '../data-processing/parser';
import { TokenData, TokenAnalysis } from '../types/data';
import path from 'path';

const MODEL_PATH = 'file://' + path.join(process.cwd(), 'models', 'trained', 'model.json');
let model: tf.LayersModel | null = null;

async function loadModel() {
    if (!model) {
        try {
            model = await tf.loadLayersModel(MODEL_PATH);
            console.log('Model loaded successfully');
        } catch (error) {
            console.error('Error loading model:', error);
            throw error;
        }
    }
    return model;
}

export async function analyzeToken(tokenAddress: string, chain: string = 'ethereum'): Promise<TokenAnalysis> {
    const model = await loadModel();
    
    // Fetch and process token data
    const tokenData = await fetchTokenData(tokenAddress, chain);
    if (!tokenData) {
        throw new Error('Token data not found');
    }

    // Prepare features for prediction
    const features = normalizeFeatures(tokenData);
    const inputTensor = tf.tensor2d([features], [1, 6]);

    try {
        // Make prediction
        const prediction = model.predict(inputTensor) as tf.Tensor;
        const rugPullProbability = prediction.dataSync()[0];

        return {
            token: tokenAddress,
            rugPullProbability,
            metrics: {
                volumeAnomaly: tokenData.volumeAnomaly,
                holderConcentration: tokenData.holderConcentration,
                liquidityScore: tokenData.liquidityScore,
                priceVolatility: tokenData.priceVolatility,
                sellPressure: tokenData.sellPressure,
                marketCapRisk: tokenData.marketCapRisk
            },
            bundlerActivity: tokenData.bundlerActivity,
            accumulationRate: tokenData.accumulationRate,
            stealthAccumulation: tokenData.stealthAccumulation,
            suspiciousPattern: tokenData.suspiciousPattern,
            reason: tokenData.metadata.reason
        };
    } finally {
        // Clean up tensor
        inputTensor.dispose();
    }
} 