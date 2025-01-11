import { collectTrainingData } from '../data-harvesting/collector';
import { trainModel } from '../training/modelTrainer';

async function main() {
    try {
        // Step 1: Collect training data
        console.log('Starting data collection process...');
        const collectedData = await collectTrainingData(100); // Start with collecting 100 tokens
        
        if (!collectedData || collectedData.length === 0) {
            console.error('❌ No training data collected. Please ensure data collection is working properly.');
            process.exit(1);
        }
        
        console.log(`\n📊 Successfully collected ${collectedData.length} tokens for training.`);
        
        // Step 2: Train the model
        console.log('\nStarting model training process...');
        await trainModel(collectedData);
        
        console.log('\n✨ Process complete! The model has been trained and saved.');
    } catch (error) {
        console.error('Error in training process:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
} 