//path: src/training/modelPredictor.ts
import * as tf from '@tensorflow/tfjs-node';
import { TokenData, BaseMetrics } from '../types/token';

export class ModelPredictor {
    private model: tf.LayersModel | null = null;

    async loadModel(modelPath: string): Promise<void> {
        try {
            this.model = await tf.loadLayersModel(`file://${modelPath}`);
            console.log('Model loaded successfully');
        } catch (error) {
            console.error('Error loading model:', error);
            throw error;
        }
    }

    private preprocessInput(metrics: BaseMetrics): tf.Tensor {
        const features = [
            metrics.volumeAnomaly,
            metrics.holderConcentration,
            metrics.liquidityScore,
            metrics.priceVolatility,
            metrics.sellPressure,
            metrics.marketCapRisk,
            metrics.bundlerActivity ? 1 : 0,
            metrics.accumulationRate,
            metrics.stealthAccumulation,
            metrics.suspiciousPattern === true ? 1 : metrics.suspiciousPattern === false ? 0 : 0.5
        ];
        return tf.tensor2d([features], [1, features.length]);
    }

    async predict(tokenData: TokenData): Promise<number> {
        if (!this.model) {
            throw new Error('Model not loaded');
        }

        try {
            const baseMetrics: BaseMetrics = {
                volumeAnomaly: tokenData.metrics.volumeAnomaly,
                holderConcentration: tokenData.metrics.holderConcentration,
                liquidityScore: tokenData.metrics.liquidityScore,
                priceVolatility: tokenData.metrics.priceVolatility,
                sellPressure: tokenData.metrics.sellPressure,
                marketCapRisk: tokenData.metrics.marketCapRisk,
                isRugPull: tokenData.metrics.isRugPull,
                bundlerActivity: tokenData.metrics.bundlerActivity,
                accumulationRate: tokenData.metrics.accumulationRate,
                stealthAccumulation: tokenData.metrics.stealthAccumulation,
                suspiciousPattern: tokenData.metrics.suspiciousPattern,
                metadata: tokenData.metrics.metadata
            };

            const input = this.preprocessInput(baseMetrics);
            const prediction = this.model.predict(input) as tf.Tensor;
            const score = (await prediction.data())[0];
            
            input.dispose();
            prediction.dispose();
            
            return score;
        } catch (error) {
            console.error('Error making prediction:', error);
            throw error;
        }
    }
} 