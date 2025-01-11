import { ethers } from 'ethers';
import { fetchTokenData } from './fetcher';
import { normalizeFeatures } from '../data-processing/parser';
import { TokenData } from '../types/data';
import fs from 'fs/promises';
import path from 'path';

const ETHEREUM_RPC = process.env.ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key';
const OUTPUT_FILE = path.join(process.cwd(), 'src/ml/models/datasets/training.json');

export async function loadExistingData(): Promise<TokenData[]> {
    try {
        const data = await fs.readFile(OUTPUT_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading existing data:', error);
        return [];
    }
}

async function collectTrainingData(numTokens: number = 1000) {
    const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC);
    const trainingData: TokenData[] = [];
    
    console.log('Starting data collection...');
    
    try {
        // Get latest block for reference
        const latestBlock = await provider.getBlockNumber();
        console.log(`Latest block: ${latestBlock}`);
        
        // Collect data from recent transactions
        for (let i = 0; i < numTokens; i++) {
            try {
                const blockNumber = latestBlock - (i * 100); // Sample blocks at intervals
                const block = await provider.getBlock(blockNumber);
                
                if (!block || !block.transactions) continue;
                
                // Look for token creation transactions
                for (const txHash of block.transactions) {
                    const tx = await provider.getTransaction(txHash);
                    if (!tx || tx.to) continue; // Skip if not contract creation
                    
                    const receipt = await provider.getTransactionReceipt(txHash);
                    if (!receipt || !receipt.contractAddress) continue;
                    
                    // Fetch token data
                    const tokenData = await fetchTokenData(receipt.contractAddress);
                    if (!tokenData) continue;
                    
                    trainingData.push(tokenData);
                    console.log(`Collected data for token: ${receipt.contractAddress}`);
                    
                    if (trainingData.length >= numTokens) break;
                }
                
                if (trainingData.length >= numTokens) break;
            } catch (error) {
                console.error('Error processing block:', error);
                continue;
            }
        }
        
        // Save collected data
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(trainingData, null, 2));
        console.log(`Data collection complete. Saved ${trainingData.length} tokens to ${OUTPUT_FILE}`);
        
    } catch (error) {
        console.error('Error collecting training data:', error);
        throw error;
    }
}

// Export for use in training script
export { collectTrainingData }; 