// path: src/data-harvesting/collector.ts
import { ethers } from 'ethers';
import { fetchTokenData } from './fetcher';
import { TokenData } from '../types/data';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const TARGET_TOKENS = 1; // 🎯 Target number of tokens to collect
const BLOCKS_TO_SCAN = 50; // 📦 Number of blocks to scan
const TXS_PER_BLOCK = 20; // 📝 Number of transactions to check per block
const BLOCK_SKIP = 100; // ⏭️  Number of blocks to skip each time
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'ml', 'models', 'datasets');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'training.json');

const RPC_ENDPOINTS = {
    ethereum: process.env.ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/'+process.env.ALCHEMY_API_KEY,
    bsc: process.env.BSC_RPC || 'https://bsc-dataseed1.binance.org',
    polygon: process.env.POLYGON_RPC || 'https://polygon-mainnet.g.alchemy.com/v2/'+process.env.ALCHEMY_API_KEY
};

// Add rate limiting helpers at the top of the file
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Rate limiting helper
class RateLimit {
    private queue: Array<() => Promise<any>> = [];
    private processing = false;
    
    constructor(private requestsPerSecond: number) {}
    
    async add<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
            
            if (!this.processing) {
                this.process();
            }
        });
    }
    
    private async process() {
        this.processing = true;
        while (this.queue.length > 0) {
            const batch = this.queue.splice(0, this.requestsPerSecond);
            await Promise.all(batch.map(fn => fn()));
            await sleep(1000); // Wait 1 second between batches
        }
        this.processing = false;
    }
}

// Retry helper
async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries === 0 || (error?.error?.code !== 429 && error?.code !== 'UNKNOWN_ERROR')) {
            throw error;
        }
        console.log(`⏳ Rate limited, retrying in ${delay/1000}s...`);
        await sleep(delay);
        return withRetry(fn, retries - 1, delay * 2);
    }
}

// Create rate limiters for different chains
const rateLimiters = {
    ethereum: new RateLimit(5), // 5 requests per second for Alchemy
    bsc: new RateLimit(10),     // 10 for BSC
    polygon: new RateLimit(5)   // 5 for Polygon
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

// Add timeout helper
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> => {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
    const result = await Promise.race([promise, timeout]);
    return result;
};

async function collectTrainingData(numTokens: number = TARGET_TOKENS) {
    const startTime = Date.now();
    let trainingData: TokenData[] = await loadProgress();
    const chains = ['ethereum'] as const;
    const remainingTokens = numTokens - trainingData.length;
    const tokensPerChain = Math.ceil(remainingTokens / chains.length);
    
    console.log('\n🚀 Initializing Training Data Collection');
    console.log('----------------------------------------');
    console.log(`🎯 Target: ${TARGET_TOKENS} tokens`);
    console.log(`✨ Tokens per chain: ${tokensPerChain}`);
    console.log(`📊 Chain: ${chains.join(', ')}`);
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
            console.log(`🔍 Will scan ${BLOCKS_TO_SCAN} blocks`);
            console.log(`📝 Checking ${TXS_PER_BLOCK} transactions per block`);
            let processedBlocks = 0;
            
            for (let i = 0; i < BLOCKS_TO_SCAN && trainingData.length < numTokens; i++) {
                const blockNumber = latestBlock - (i * BLOCK_SKIP);
                const result = await processBlock(blockNumber, chain, provider);
                
                if (!result) continue;
                processedBlocks++;
                
                // Process found contracts
                for (const contract of result.contracts) {
                    console.log(`\n🔎 Contract found: ${contract}`);
                    const tokenData = await fetchTokenData(contract, chain);
                    
                    if (tokenData) {
                        trainingData.push(tokenData);
                        await appendToken(tokenData);
                        console.log(`✅ Valid token collected: ${contract}`);
                        console.log(`📊 Progress: ${progressBar(trainingData.length, numTokens)}`);
                        
                        if (trainingData.length >= numTokens) {
                            console.log('\n🎯 Target reached!');
                            break;
                        }
                    }
                }
                
                await sleep(500); // Reduced delay between blocks
            }
            
            const chainTime = formatDuration(Date.now() - chainStartTime);
            console.log(`\n✨ ${chain.toUpperCase()} scan completed in ${chainTime}`);
            console.log(`📊 Final stats:`);
            console.log(`   Blocks scanned: ${processedBlocks}`);
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
    
    return trainingData;
}

// Helper function to process a single block
async function processBlock(blockNumber: number, chain: string, provider: ethers.JsonRpcProvider) {
    try {
        // Get block with retry, rate limiting, and timeout
        const block = await withTimeout(
            rateLimiters[chain as keyof typeof rateLimiters].add(() =>
                withRetry(() => provider.getBlock(blockNumber))
            ),
            5000 // 5 second timeout
        );

        if (!block || !block.transactions) {
            console.log(`⚠️  Block ${blockNumber}: No transactions or timeout`);
            return null;
        }
        
        console.log(`\n📍 Block ${blockNumber} [${block.transactions.length} txs]`);
        
        // Use configured number of transactions
        const transactions = block.transactions.slice(0, TXS_PER_BLOCK);
        const contracts: string[] = [];
        const BATCH_SIZE = 5;
        
        for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
            const batch = transactions.slice(i, i + BATCH_SIZE);
            const txPromises = batch.map(txHash => 
                withTimeout(
                    rateLimiters[chain as keyof typeof rateLimiters].add(() =>
                        withRetry(async () => {
                            const tx = await provider.getTransaction(txHash);
                            if (!tx || tx.to) return null;
                            const receipt = await provider.getTransactionReceipt(txHash);
                            return receipt?.contractAddress || null;
                        })
                    ),
                    3000 // 3 second timeout per transaction
                )
            );
            
            const results = await Promise.all(txPromises);
            contracts.push(...results.filter((addr): addr is string => !!addr));
            
            // Exit early if we found any contracts
            if (contracts.length > 0) {
                console.log(`🎯 Found ${contracts.length} contracts, moving to next block`);
                break;
            }
            
            await sleep(200);
        }
        
        return {
            txCount: transactions.length,
            contracts
        };
    } catch (error) {
        console.error(`❌ Block error:`, error);
        return null;
    }
}

// Export for use in training script
export { collectTrainingData }; 