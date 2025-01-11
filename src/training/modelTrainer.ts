//path: src/training/modelTrain.ts
import * as tf from '@tensorflow/tfjs-node';
import { TrainingData } from '../types/data';
import { preprocessTokenData } from '../data-processing/parser';
import path from 'path';
import fs from 'fs/promises';

const MODEL_DIR = path.join(process.cwd(), 'models', 'trained');
const MODEL_PATH = 'file://' + path.join(MODEL_DIR, 'model.json');

export async function trainModel(trainingData: TrainingData[]): Promise<tf.LayersModel> {
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
        // Train model
        await model.fit(xs, ys, {
            epochs: 100,
            batchSize: 32,
            validationSplit: 0.2,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}, accuracy = ${logs?.acc.toFixed(4)}`);
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

