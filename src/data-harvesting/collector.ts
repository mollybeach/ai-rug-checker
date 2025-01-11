// path: src/data-harvesting/collector.ts
import { ethers } from 'ethers';
import { fetchTokenData } from './fetcher';
import { TokenData } from '../types/data';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const TARGET_TOKENS = 1000; // 🎯 Target number of tokens to collect
const BLOCKS_TO_SCAN = 100;  // Increased from 5 to 100 blocks
const TXS_PER_BLOCK = 100;   // Keep checking 100 transactions per block
const BLOCK_SKIP = 50;       // Skip 50 blocks between each scan for variety
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'models', 'datasets');
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

// Helper to detect if an address is a token contract
async function isTokenContract(address: string, provider: ethers.JsonRpcProvider): Promise<boolean> {
    try {
        // Get the contract code
        const code = await provider.getCode(address);
        if (code === '0x') return false;
        
        // Check for common ERC20 function signatures
        const hasTransfer = code.includes('a9059cbb');        // transfer
        const hasBalanceOf = code.includes('70a08231');       // balanceOf
        const hasTransferFrom = code.includes('23b872dd');    // transferFrom
        
        return hasTransfer && hasBalanceOf;
    } catch (error) {
        console.error('Error checking contract:', error);
        return false;
    }
}

async function collectTrainingData(numTokens: number = TARGET_TOKENS): Promise<TokenData[]> {
    const startTime = Date.now();
    const collectedTokens: TokenData[] = [];
    let tokensCollected = 0;

    console.log('\n🚀 Starting data collection...');
    console.log(`🎯 Target: ${numTokens} tokens`);

    for (const chain of ['ethereum']) {
        try {
            const provider = new ethers.JsonRpcProvider(RPC_ENDPOINTS[chain as keyof typeof RPC_ENDPOINTS]);
            console.log(`\n📡 Connected to ${chain.toUpperCase()} network`);

            const latestBlock = await provider.getBlockNumber();
            console.log(`📦 Latest block: ${latestBlock}`);
            console.log(`🔍 Scanning ${BLOCKS_TO_SCAN} blocks, ${TXS_PER_BLOCK} transactions per block`);

            for (let i = 0; i < BLOCKS_TO_SCAN && tokensCollected < numTokens; i++) {
                const blockNumber = latestBlock - (i * BLOCK_SKIP);
                const block = await provider.getBlock(blockNumber);
                
                if (!block) continue;

                console.log(`\n📦 Processing block ${blockNumber} (${i + 1}/${BLOCKS_TO_SCAN})`);
                
                // Process transactions
                const transactions = block.transactions.slice(0, TXS_PER_BLOCK);
                for (const txHash of transactions) {
                    try {
                        const tx = await provider.getTransaction(txHash);
                        if (!tx || !tx.to) continue;

                        const tokenData = await fetchTokenData(tx.to, chain);
                        if (tokenData) {
                            await appendToken(tokenData);
                            collectedTokens.push(tokenData);
                            tokensCollected++;
                            console.log(`✅ Token collected (${tokensCollected}/${numTokens}): ${tx.to}`);
                            
                            if (tokensCollected >= numTokens) {
                                console.log('\n🎉 Target number of tokens collected!');
                                return collectedTokens;
                            }
                        }
                    } catch (error) {
                        console.error('Error processing transaction:', error);
                    }
                }
            }
        } catch (error) {
            console.error(`❌ Error processing ${chain} chain:`, error);
        }
    }

    const duration = Date.now() - startTime;
    console.log(`\n✨ Collection complete! Collected ${tokensCollected} tokens in ${duration/1000}s`);
    return collectedTokens;
}

// Export for use in training script
export { collectTrainingData }; 