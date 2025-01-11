//path: src/training/modelTrainer.ts
import * as tf from '@tensorflow/tfjs-node';
import { TrainingData } from '../types/data';
import { preprocessTokenData } from '../data-processing/parser';
import path from 'path';
import fs from 'fs/promises';

const MODEL_DIR = path.join(process.cwd(), 'models', 'trained');
const MODEL_PATH = 'file://' + path.join(MODEL_DIR, 'model.json');

export async function trainModel(trainingData: TrainingData[]): Promise<tf.LayersModel> {
    if (trainingData.length === 0) {
        throw new Error('No training data provided');
    }

    console.log(`Training with ${trainingData.length} samples`);
    
    // Create sequential model
    const model = tf.sequential();
    
    // Add layers
    model.add(tf.layers.dense({
        units: 12,
        activation: 'relu',
        inputShape: [6]  // 6 features
    }));
    
    model.add(tf.layers.dense({
        units: 8,
        activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid'
    }));
    
    // Compile model
    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });
    
    // Preprocess data
    const { features, labels } = preprocessTokenData(trainingData);
    
    // Convert to tensors
    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);
    
    try {
        // Adjust training parameters based on dataset size
        const batchSize = Math.max(1, Math.min(32, Math.floor(trainingData.length / 2)));
        const validationSplit = trainingData.length > 10 ? 0.2 : 0; // Only use validation split if we have enough data
        
        console.log(`Using batch size: ${batchSize}, validation split: ${validationSplit}`);
        
        // Train model
        await model.fit(xs, ys, {
            epochs: 100,
            batchSize,
            validationSplit,
            verbose: 1,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    if (logs) {
                        let logMessage = `Epoch ${epoch + 1}/100 - loss: ${logs.loss.toFixed(4)}`;
                        if (logs.acc !== undefined) {
                            logMessage += `, accuracy: ${logs.acc.toFixed(4)}`;
                        }
                        if (validationSplit > 0) {
                            if (logs.val_loss !== undefined) {
                                logMessage += `, val_loss: ${logs.val_loss.toFixed(4)}`;
                            }
                            if (logs.val_acc !== undefined) {
                                logMessage += `, val_accuracy: ${logs.val_acc.toFixed(4)}`;
                            }
                        }
                        console.log(logMessage);
                    }
                }
            }
        });
        
        // Create model directory if it doesn't exist
        await fs.mkdir(MODEL_DIR, { recursive: true });
        
        // Save model
        await model.save(MODEL_PATH);
        
        return model;
    } finally {
        // Clean up tensors
        xs.dispose();
        ys.dispose();
    }
}

// Run training if called directly
if (require.main === module) {
    const dummyData: TrainingData[] = [{
        volumeAnomaly: 0.5,
        holderConcentration: 0.6,
        liquidityScore: 0.7,
        priceVolatility: 0.4,
        sellPressure: 0.3,
        marketCapRisk: 0.2,
        isRugPull: false
    }];
    trainModel(dummyData).catch(console.error);
}

