import { collectTrainingData } from '../data-processing/trainingData';
import { trainModel } from '../training/modelTrainer';
import { TokenData, TrainingData } from '../types/data';
import * as tf from '@tensorflow/tfjs-node';

async function main() {
    try {
        // Load collected data
        console.log('\n📊 Loading collected data for training...');
        const tokenData = await collectTrainingData();
        console.log(`Found ${tokenData.length} tokens in dataset`);

        if (tokenData.length > 0) {
            // Convert TokenData to TrainingData
            const trainingData: TrainingData[] = tokenData.map((token: TokenData): TrainingData => ({
                volumeAnomaly: token.volumeAnomaly,
                holderConcentration: token.holderConcentration,
                liquidityScore: token.liquidityScore,
                priceVolatility: token.priceVolatility,
                sellPressure: token.sellPressure,
                marketCapRisk: token.marketCapRisk,
                isRugPull: token.isRugPull
            }));

            // Train model
            console.log('\n🤖 Training model...');
            const model = await trainModel(trainingData);

            // Test the model
            const sampleInput = tf.tensor2d([[
                tokenData[0].volumeAnomaly,
                tokenData[0].holderConcentration,
                tokenData[0].liquidityScore,
                tokenData[0].priceVolatility,
                tokenData[0].sellPressure,
                tokenData[0].marketCapRisk
            ]], [1, 6]);

            const prediction = model.predict(sampleInput) as tf.Tensor;
            console.log('\n🔮 Sample prediction for first token:', prediction.dataSync()[0]);
            console.log('\n✅ Training complete!');

            // Clean up
            sampleInput.dispose();
            prediction.dispose();
        }
    } catch (error) {
        console.error('Error in training process:', error);
        process.exit(1);
    }
}

main(); 