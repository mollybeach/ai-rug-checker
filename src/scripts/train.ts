import { collectTrainingData } from '../data-harvesting/collector.ts';
import { trainModel } from '../training/modelTrainer';
import path from 'path';
import fs from 'fs/promises';

async function main() {
    try {
        // Step 1: Collect training data
        console.log('Starting data collection process...');
        await collectTrainingData(1000); // Collect data for 1000 tokens
        
        // Step 2: Train the model
        console.log('\nStarting model training process...');
        const trainingDataPath = path.join(process.cwd(), 'src/ml/models/datasets/training.json');
        const trainingData = JSON.parse(await fs.readFile(trainingDataPath, 'utf-8'));
        await trainModel(trainingData);
        
        console.log('\nProcess complete! The model has been trained and saved.');
    } catch (error) {
        console.error('Error in training process:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
} 