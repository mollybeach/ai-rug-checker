// path: src/data-harvesting/collector.ts
import { ethers } from 'ethers';
import { fetchTokenData } from './fetcher';
import { TokenData } from '../types/data';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'src/ml/models/datasets/training.json');
const RPC_ENDPOINTS = {
    ethereum: process.env.ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/'+process.env.ALCHEMY_API_KEY,
    bsc: process.env.BSC_RPC || 'https://bsc-dataseed1.binance.org',
    polygon: process.env.POLYGON_RPC || 'https://polygon-mainnet.g.alchemy.com/v2/'+process.env.ALCHEMY_API_KEY
};

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
    const trainingData: TokenData[] = [];
    const chains = ['ethereum', 'bsc', 'polygon'] as const;
    const tokensPerChain = Math.ceil(numTokens / chains.length);
    
    console.log('Starting data collection across chains...');
    
    for (const chain of chains) {
        console.log(`\n🔍 Processing ${chain} chain...`);
        const provider = new ethers.JsonRpcProvider(RPC_ENDPOINTS[chain]);
        
        try {
            // Get latest block for reference
            const latestBlock = await provider.getBlockNumber();
            console.log(`Latest block: ${latestBlock}`);
            
            // Collect data from recent transactions
            for (let i = 0; i < tokensPerChain; i++) {
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
                        const tokenData = await fetchTokenData(receipt.contractAddress, chain);
                        if (!tokenData) continue;
                        
                        trainingData.push(tokenData);
                        console.log(`Collected data for token: ${receipt.contractAddress} on ${chain}`);
                        
                        if (trainingData.length >= numTokens) break;
                    }
                    
                    if (trainingData.length >= numTokens) break;
                } catch (error) {
                    console.error(`Error processing block on ${chain}:`, error);
                    continue;
                }
            }
        } catch (error) {
            console.error(`Error scanning ${chain}:`, error);
            continue;
        }
    }
    
    // Save collected data
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(trainingData, null, 2));
    console.log(`\n✨ Data collection complete. Saved ${trainingData.length} tokens to ${OUTPUT_FILE}`);
}

// Export for use in training script
export { collectTrainingData }; 