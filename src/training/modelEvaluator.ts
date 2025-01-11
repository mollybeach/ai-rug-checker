//path: src/training/modelEvaluator.ts
import * as tf from '@tensorflow/tfjs-node';
import { TrainingData, BaseMetrics } from '../types/data';
import { preprocessTokenData } from '../data-processing/parser';

interface EvaluationMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: number[][];
}

export async function evaluateModel(
    model: tf.LayersModel,
    testData: TrainingData[]
): Promise<EvaluationMetrics> {
    // Convert TrainingData to BaseMetrics format
    const processedData: BaseMetrics[] = testData.map(data => ({
        volumeAnomaly: data.volumeAnomaly,
        holderConcentration: data.holderConcentration,
        liquidityScore: data.liquidityScore,
        priceVolatility: data.priceVolatility,
        sellPressure: data.sellPressure,
        marketCapRisk: data.marketCapRisk,
        isRugPull: data.isRugPull
    }));
    
    const { features, labels } = preprocessTokenData(processedData);
    
    // Convert to tensors
    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);
    
    // Make predictions
    const predictions = model.predict(xs) as tf.Tensor;
    const predArray = Array.from(predictions.dataSync());
    const labelArray = Array.from(ys.dataSync());
    
    // Calculate metrics
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;
    
    predArray.forEach((pred, i) => {
        const predictedClass = pred >= 0.5 ? 1 : 0;
        const actualClass = labelArray[i];
        
        if (predictedClass === 1 && actualClass === 1) truePositives++;
        if (predictedClass === 1 && actualClass === 0) falsePositives++;
        if (predictedClass === 0 && actualClass === 0) trueNegatives++;
        if (predictedClass === 0 && actualClass === 1) falseNegatives++;
    });
    
    // Calculate evaluation metrics
    const accuracy = (truePositives + trueNegatives) / predArray.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    
    // Create confusion matrix
    const confusionMatrix = [
        [trueNegatives, falsePositives],
        [falseNegatives, truePositives]
    ];
    
    // Clean up tensors
    xs.dispose();
    ys.dispose();
    predictions.dispose();
    
    return {
        accuracy,
        precision,
        recall,
        f1Score,
        confusionMatrix
    };
}

export function printEvaluationReport(metrics: EvaluationMetrics): void {
    console.log('\n📊 Model Evaluation Report');
    console.log('-------------------------');
    console.log(`Accuracy:  ${(metrics.accuracy * 100).toFixed(2)}%`);
    console.log(`Precision: ${(metrics.precision * 100).toFixed(2)}%`);
    console.log(`Recall:    ${(metrics.recall * 100).toFixed(2)}%`);
    console.log(`F1 Score:  ${(metrics.f1Score * 100).toFixed(2)}%`);
    
    console.log('\nConfusion Matrix:');
    console.log('----------------');
    console.log('            Predicted');
    console.log('             0    1');
    console.log(`Actual 0    ${metrics.confusionMatrix[0][0].toString().padStart(4)}  ${metrics.confusionMatrix[0][1].toString().padStart(4)}`);
    console.log(`       1    ${metrics.confusionMatrix[1][0].toString().padStart(4)}  ${metrics.confusionMatrix[1][1].toString().padStart(4)}`);
} 