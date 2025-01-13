import { fetchTokenData } from '../data-harvesting/fetcher';
import { dataCollector } from '../data-harvesting/collector';
import { AppDataSource } from '../db/data-source';
import { TokenData } from '../types/token';
import * as fs from 'fs';
import * as path from 'path';

async function processTrainingData(filePath: string): Promise<void> {
    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const rawTrainingData = JSON.parse(rawData);
        
        console.log(`Read ${rawTrainingData.length} records from training data file`);
        
        // Map the data to match our TokenData interface
        const trainingData: TokenData[] = rawTrainingData.map((data: any) => ({
            address: data.token, // Map token field to address
            name: data.name,
            symbol: data.symbol,
            metrics: {
                volumeAnomaly: data.volumeAnomaly ?? 0,
                holderConcentration: data.holderConcentration ?? 0,
                liquidityScore: data.liquidityScore ?? 0,
                priceVolatility: data.priceVolatility ?? 0,
                sellPressure: data.sellPressure ?? 0,
                marketCapRisk: data.marketCapRisk ?? 0,
                isRugPull: data.isRugPull ?? false,
                bundlerActivity: data.bundlerActivity ?? false,
                accumulationRate: data.accumulationRate ?? 0,
                stealthAccumulation: data.stealthAccumulation ?? 0,
                suspiciousPattern: data.suspiciousPattern, // This can be null
                metadata: data.metadata ?? {}
            },
            price: {
                price: 0, // These fields aren't in training data
                volume24h: 0,
                marketCap: 0,
                liquidity: 0
            }
        }));
        
        console.log(`Mapped ${trainingData.length} tokens for processing`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const tokenData of trainingData) {
            try {
                await dataCollector.collectAndStoreTokenData(tokenData);
                console.log(`✅ Data stored for token: ${tokenData.address}`);
                successCount++;
            } catch (error) {
                console.error(`❌ Error processing token ${tokenData.address}:`, error);
                errorCount++;
            }
        }
        
        // Flush any remaining data
        try {
            await dataCollector.flushRemaining();
            console.log('\nProcessing Summary:');
            console.log(`Successfully processed: ${successCount} tokens`);
            console.log(`Failed to process: ${errorCount} tokens`);
        } catch (error) {
            console.error('Error flushing remaining data:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error processing training data:', error);
        throw error;
    }
}

async function processTokens(tokenAddresses: string[]): Promise<void> {
    const batchSize = 10;
    const batches = [];

    // Split addresses into batches
    for (let i = 0; i < tokenAddresses.length; i += batchSize) {
        batches.push(tokenAddresses.slice(i, i + batchSize));
    }

    // Process each batch
    for (const batch of batches) {
        const tokenDataPromises = batch.map(async (address) => {
            try {
                console.log(`Processing token: ${address}`);
                const tokenData = await fetchTokenData(address);
                if (tokenData) {
                    await dataCollector.collectAndStoreTokenData(tokenData);
                    console.log(`✅ Data collected for token: ${address}`);
                } else {
                    console.log(`❌ Failed to fetch data for token: ${address}`);
                }
            } catch (error) {
                console.error(`Error processing token ${address}:`, error);
            }
        });

        await Promise.all(tokenDataPromises);
    }
}

async function main() {
    try {
        await AppDataSource.initialize();
        console.log('Database connection initialized');

        const trainingDataPath = path.join(__dirname, '../models/datasets/training.json');
        
        if (fs.existsSync(trainingDataPath)) {
            console.log('Found training data file at:', trainingDataPath);
            await processTrainingData(trainingDataPath);
            console.log('Training data processing completed');
        } else {
            console.error('Training data file not found at:', trainingDataPath);
            console.log('Processing example tokens instead');
            // Example token addresses to process
            const tokenAddresses = [
                '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
                '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
                '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9'  // AAVE
            ];
            await processTokens(tokenAddresses);
        }

        await AppDataSource.destroy();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}