import express, { Request, Response, RequestHandler } from 'express';
import * as tf from '@tensorflow/tfjs-node';
import { fetchTokenData } from './data-harvesting/fetcher';
import { normalizeFeatures } from './data-processing/parser';
import { loadExistingData } from './data-harvesting/collector';
import { TokenMetrics } from './types/data';

const app = express();
app.use(express.json());

let model: tf.LayersModel | null = null;

// Load the model at startup
async function loadModel() {
    try {
        model = await tf.loadLayersModel('file://./models/model.json');
        console.log('Model loaded successfully');
    } catch (error) {
        console.error('Error loading model:', error);
        process.exit(1);
    }
}

interface AnalyzeRequest {
    tokenAddress: string;
    chain?: string;
}

// Endpoint to analyze a token
const analyzeToken: RequestHandler<{}, any, AnalyzeRequest> = async (req, res, next) => {
    try {
        const { tokenAddress, chain = 'ethereum' } = req.body;

        if (!tokenAddress) {
            res.status(400).json({ error: 'Token address is required' });
            return;
        }

        if (!model) {
            res.status(500).json({ error: 'Model not loaded' });
            return;
        }

        // Fetch and process token data
        const tokenData = await fetchTokenData(tokenAddress, chain);
        if (!tokenData) {
            res.status(404).json({ error: 'Token data not found' });
            return;
        }

        // Prepare features for prediction
        const features = normalizeFeatures(tokenData);
        const inputTensor = tf.tensor2d([features], [1, 6]);

        // Make prediction
        const prediction = model.predict(inputTensor) as tf.Tensor;
        const rugPullProbability = prediction.dataSync()[0];

        // Clean up tensor
        inputTensor.dispose();
        prediction.dispose();

        res.json({
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
        });
    } catch (error) {
        console.error('Error analyzing token:', error);
        res.status(500).json({ error: 'Error analyzing token' });
    }
};

// Endpoint to get training data statistics
const getStats: RequestHandler = async (_req, res, next) => {
    try {
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

        res.json({
            totalTokens,
            rugPulls,
            legitimateTokens,
            averageMetrics,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Error fetching statistics' });
    }
};

app.post('/analyze', analyzeToken);
app.get('/stats', getStats);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    await loadModel();
    console.log(`Server running on port ${PORT}`);
}); 