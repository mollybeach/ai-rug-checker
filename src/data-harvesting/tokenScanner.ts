// path: src/data-harvesting/tokenScanner.ts
import { ethers } from 'ethers';
import { fetchTokenData } from './fetcher';
import { appendTokenData } from '../data-processing/storage';

const RPC_ENDPOINTS = {
    ethereum: process.env.ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/'+process.env.ALCHEMY_API_KEY,
    bsc: process.env.BSC_RPC || 'https://bsc-dataseed1.binance.org',
    polygon: process.env.POLYGON_RPC || 'https://polygon-mainnet.g.alchemy.com/v2/'+process.env.ALCHEMY_API_KEY
};

export async function scanToken(chains: string[] = ['ethereum'], batchSize: number = 10): Promise<void> {
    for (const chain of chains) {
        const provider = new ethers.JsonRpcProvider(RPC_ENDPOINTS[chain as keyof typeof RPC_ENDPOINTS]);
        console.log(`\n🔍 Scanning ${chain} chain...`);
        
        try {
            const latestBlock = await provider.getBlockNumber();
            console.log(`Latest block: ${latestBlock}`);
            
            let scannedTokens = 0;
            let currentBlock = latestBlock;
            let blocksWithoutTokens = 0;
            const MAX_BLOCKS_WITHOUT_TOKENS = 100;
            
            while (scannedTokens < batchSize && blocksWithoutTokens < MAX_BLOCKS_WITHOUT_TOKENS) {
                const block = await provider.getBlock(currentBlock);
                if (!block || !block.transactions) {
                    currentBlock--;
                    blocksWithoutTokens++;
                    continue;
                }
                
                let foundTokenInBlock = false;
                for (const txHash of block.transactions) {
                    if (scannedTokens >= batchSize) break;
                    
                    try {
                        const tx = await provider.getTransaction(txHash);
                        if (!tx || tx.to) continue; // Skip if not contract creation
                        
                        const receipt = await provider.getTransactionReceipt(txHash);
                        if (!receipt || !receipt.contractAddress) continue;
                        
                        // Wait a few blocks to ensure the token has some activity
                        if (latestBlock - currentBlock < 5) continue;
                        
                        console.log(`\n📝 Analyzing token: ${receipt.contractAddress}`);
                        const tokenData = await fetchTokenData(receipt.contractAddress, chain);
                        
                        if (tokenData) {
                            await appendTokenData(tokenData);
                            console.log(`✅ Token data collected and saved`);
                            scannedTokens++;
                            foundTokenInBlock = true;
                        }
                    } catch (error) {
                        console.error(`Error processing transaction: ${error}`);
                        continue;
                    }
                }
                
                if (!foundTokenInBlock) {
                    blocksWithoutTokens++;
                } else {
                    blocksWithoutTokens = 0;
                }
                
                currentBlock--;
            }
            
            console.log(`\n✨ Completed scanning ${chain}. Found ${scannedTokens} tokens.`);
            if (blocksWithoutTokens >= MAX_BLOCKS_WITHOUT_TOKENS) {
                console.log(`⚠️ Stopped scanning after ${MAX_BLOCKS_WITHOUT_TOKENS} blocks without finding new tokens.`);
            }
        } catch (error) {
            console.error(`Error scanning ${chain}:`, error);
        }
    }
} 