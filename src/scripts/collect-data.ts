import { scanToken } from '../data-harvesting/tokenScanner';
import { trainModel } from '../training/modelTrainer';
import { loadExistingData } from '../data-processing/storage';
import { TokenData, TrainingData } from '../types/data';
import * as tf from '@tensorflow/tfjs-node';

// Continuous scanning function
async function continuousScanning(interval: number = 300000) { // 5 minutes default
    while (true) {
        try {
            console.log('🔄 Starting new scan cycle...');
            await scanToken(['ethereum', 'bsc', 'polygon'], 20);
            console.log(`⏰ Waiting ${interval/1000} seconds until next scan...`);
            await new Promise(resolve => setTimeout(resolve, interval));
        } catch (error) {
            console.error('❌ Error in scanning cycle:', error);
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s on error
        }
    }
}

// Model training function
async function continuousTraining(interval: number = 900000) { // 15 minutes default
    while (true) {
        try {
            // Load collected data
            console.log('\n📊 Loading collected data for training...');
            const tokenData = await loadExistingData();
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
                console.log('\n✅ Training cycle complete!');

                // Clean up
                sampleInput.dispose();
                prediction.dispose();
            }

            console.log(`⏰ Waiting ${interval/1000} seconds until next training cycle...`);
            await new Promise(resolve => setTimeout(resolve, interval));
        } catch (error) {
            console.error('❌ Error in training cycle:', error);
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s on error
        }
    }
}

// Main function to run both processes
async function main() {
    try {
        console.log('🚀 Starting Rug Watch Dog data collection and training system...');
        
        // Run both processes concurrently
        await Promise.all([
            continuousScanning(),
            continuousTraining()
        ]);
    } catch (error) {
        console.error('❌ Critical error in main process:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    process.exit(0);
});

main();