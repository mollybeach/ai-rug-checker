// path: src/data-harvesting/collector.ts
import { ethers } from 'ethers';
import { fetchTokenData } from './fetcher';
import { TokenData } from '../types/data';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'src', 'ml', 'models', 'datasets');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'training.json');

const RPC_ENDPOINTS = {
    ethereum: process.env.ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/'+process.env.ALCHEMY_API_KEY,
    bsc: process.env.BSC_RPC || 'https://bsc-dataseed1.binance.org',
    polygon: process.env.POLYGON_RPC || 'https://polygon-mainnet.g.alchemy.com/v2/'+process.env.ALCHEMY_API_KEY
};

// Helper function to ensure directory exists
async function ensureDirectoryExists() {
    try {
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        console.log(`📁 Ensuring output directory exists: ${OUTPUT_DIR}`);
    } catch (error) {
        console.error('Error creating directory:', error);
    }
}

// Helper function to append a single token to the file
async function appendToken(token: TokenData): Promise<void> {
    try {
        await ensureDirectoryExists();
        
        let existingData: TokenData[] = [];
        try {
            const data = await fs.readFile(OUTPUT_FILE, 'utf-8');
            existingData = JSON.parse(data);
            console.log(`📖 Read existing data: ${existingData.length} tokens`);
        } catch (error) {
            console.log('📝 Starting new data file');
            existingData = [];
        }
        
        // Check if token already exists
        const exists = existingData.some(t => t.token === token.token);
        if (exists) {
            console.log(`⚠️ Token ${token.token} already exists, skipping`);
            return;
        }
        
        existingData.push(token);
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(existingData, null, 2));
        console.log(`💾 Saved token ${token.token} to ${OUTPUT_FILE}`);
        console.log(`📊 Total tokens saved: ${existingData.length}`);
        
        // Verify the file was written
        try {
            const stats = await fs.stat(OUTPUT_FILE);
            console.log(`📁 File size: ${(stats.size / 1024).toFixed(2)} KB`);
        } catch (error) {
            console.error('❌ Error verifying file:', error);
        }
    } catch (error) {
        console.error('❌ Error saving token:', error);
        // Log the token data that failed to save
        console.error('Failed token data:', JSON.stringify(token, null, 2));
    }
}

// Helper function to load existing progress
async function loadProgress(): Promise<TokenData[]> {
    try {
        const data = await fs.readFile(OUTPUT_FILE, 'utf-8');
        const parsed = JSON.parse(data) as TokenData[];
        console.log(`📂 Loaded ${parsed.length} tokens from ${OUTPUT_FILE}`);
        return parsed;
    } catch (error) {
        console.log('No existing data found, starting fresh');
        return [];
    }
}

export async function loadExistingData(): Promise<TokenData[]> {
    try {
        const data = await fs.readFile(OUTPUT_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading existing data:', error);
        return [];
    }
}

// Helper function for timing
function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
}

// Helper for progress bar
function progressBar(current: number, total: number, length: number = 20): string {
    const progress = Math.round((current / total) * length);
    const bar = '█'.repeat(progress) + '░'.repeat(length - progress);
    return `[${bar}] ${current}/${total}`;
}

async function collectTrainingData(numTokens: number = 1000) {
    const startTime = Date.now();
    let trainingData: TokenData[] = await loadProgress();
    const chains = ['ethereum', 'bsc', 'polygon'] as const;
    const remainingTokens = numTokens - trainingData.length;
    const tokensPerChain = Math.ceil(remainingTokens / chains.length);
    
    console.log('\n🚀 Initializing Training Data Collection');
    console.log('----------------------------------------');
    console.log(`🎯 Target: ${numTokens} tokens (${tokensPerChain} per chain)`);
    console.log(`📊 Chains: ${chains.join(', ')}`);
    console.log(`📈 Progress: ${trainingData.length} tokens already collected`);
    console.log('----------------------------------------\n');
    
    for (const chain of chains) {
        const chainStartTime = Date.now();
        console.log(`\n🔍 Processing ${chain.toUpperCase()} chain`);
        console.log('----------------------------------------');
        const provider = new ethers.JsonRpcProvider(RPC_ENDPOINTS[chain]);
        
        try {
            const latestBlock = await provider.getBlockNumber();
            console.log(`📡 Connected to ${chain} network`);
            console.log(`📦 Latest block: ${latestBlock}`);
            let processedBlocks = 0;
            let processedTxs = 0;
            let foundContracts = 0;
            
            for (let i = 0; i < tokensPerChain && trainingData.length < numTokens; i++) {
                const blockStartTime = Date.now();
                try {
                    const blockNumber = latestBlock - (i * 100);
                    processedBlocks++;
                    
                    const block = await provider.getBlock(blockNumber);
                    if (!block || !block.transactions) {
                        console.log(`⚠️  Block ${blockNumber}: No transactions`);
                        continue;
                    }
                    
                    processedTxs += block.transactions.length;
                    console.log(`\n📍 Block ${blockNumber} [${block.transactions.length} txs]`);
                    
                    for (const txHash of block.transactions) {
                        const tx = await provider.getTransaction(txHash);
                        if (!tx || tx.to) continue;
                        
                        const receipt = await provider.getTransactionReceipt(txHash);
                        if (!receipt || !receipt.contractAddress) continue;
                        
                        foundContracts++;
                        console.log(`\n🔎 Contract found: ${receipt.contractAddress}`);
                        const tokenData = await fetchTokenData(receipt.contractAddress, chain);
                        
                        if (tokenData) {
                            trainingData.push(tokenData);
                            // Save each token immediately
                            await appendToken(tokenData);
                            
                            const elapsedTime = formatDuration(Date.now() - startTime);
                            console.log(`✅ Valid token collected: ${receipt.contractAddress}`);
                            console.log(`⏱️  Time elapsed: ${elapsedTime}`);
                            console.log(`📊 Progress: ${progressBar(trainingData.length, numTokens)}`);
                            console.log(`📈 Stats for ${chain}:`);
                            console.log(`   Blocks: ${processedBlocks}`);
                            console.log(`   Transactions: ${processedTxs}`);
                            console.log(`   Contracts found: ${foundContracts}`);
                            console.log(`   Success rate: ${((trainingData.length / foundContracts) * 100).toFixed(1)}%`);
                        } else {
                            console.log(`❌ Invalid token or failed to fetch data`);
                        }
                    }
                    
                    if (processedBlocks % 10 === 0) {
                        const blockTime = formatDuration(Date.now() - blockStartTime);
                        console.log(`\n⏳ Block scan completed in ${blockTime}`);
                        console.log(`🔍 Processed ${processedBlocks}/${tokensPerChain} blocks`);
                    }
                } catch (error) {
                    console.error(`❌ Block error:`, error);
                    continue;
                }
            }
            
            const chainTime = formatDuration(Date.now() - chainStartTime);
            console.log(`\n✨ ${chain.toUpperCase()} scan completed in ${chainTime}`);
            console.log(`📊 Final chain stats:`);
            console.log(`   Blocks scanned: ${processedBlocks}`);
            console.log(`   Transactions processed: ${processedTxs}`);
            console.log(`   Contracts found: ${foundContracts}`);
            console.log(`   Tokens collected: ${trainingData.length}`);
            
        } catch (error) {
            console.error(`❌ Chain error:`, error);
            continue;
        }
    }
    
    const totalTime = formatDuration(Date.now() - startTime);
    console.log('\n🏁 Collection Complete');
    console.log('----------------------------------------');
    console.log(`✨ Total tokens collected: ${trainingData.length}`);
    console.log(`⏱️  Total time: ${totalTime}`);
    console.log(`💾 Data saved to: ${OUTPUT_FILE}`);
    console.log('----------------------------------------\n');
}

// Export for use in training script
export { collectTrainingData }; 