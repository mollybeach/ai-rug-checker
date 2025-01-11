// path: src/data-harvesting/chainMonitor.ts
import { ethers } from 'ethers';
import config from '../config/default';
import { fetchTokenData } from './fetcher';
import { initToken } from '../db/models/Token';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite::memory:');
const Token = initToken(sequelize);

async function monitorChain(chain: keyof typeof config.rpc, batchSize: number = config.scan.batchSize) {
    const provider = new ethers.JsonRpcProvider(config.rpc[chain]);
    console.log(`\n🔍 Scanning ${chain} chain...`);
    
    try {
        const latestBlock = await provider.getBlockNumber();
        console.log(`Latest block: ${latestBlock}`);
        
        let scannedTokens = 0;
        let currentBlock = latestBlock;
        
        while (scannedTokens < batchSize) {
            const block = await provider.getBlock(currentBlock);
            if (!block || !block.transactions) {
                currentBlock--;
                continue;
            }
            
            for (const txHash of block.transactions) {
                if (scannedTokens >= batchSize) break;
                
                try {
                    const tx = await provider.getTransaction(txHash);
                    if (!tx || tx.to) continue; // Skip if not contract creation
                    
                    const receipt = await provider.getTransactionReceipt(txHash);
                    if (!receipt || !receipt.contractAddress) continue;
                    
                    console.log(`\n📝 Analyzing token: ${receipt.contractAddress}`);
                    const tokenData = await fetchTokenData(receipt.contractAddress, chain);
                    
                    if (tokenData) {
                        await Token.create({
                            address: receipt.contractAddress,
                            chain,
                            name: tokenData.name,
                            symbol: tokenData.symbol,
                            volumeAnomaly: tokenData.volumeAnomaly,
                            holderConcentration: tokenData.holderConcentration,
                            liquidityScore: tokenData.liquidityScore,
                            priceVolatility: tokenData.priceVolatility,
                            sellPressure: tokenData.sellPressure,
                            marketCapRisk: tokenData.marketCapRisk,
                            isRugPull: tokenData.isRugPull,
                            metadata: tokenData.metadata
                        });
                        console.log(`✅ Token data collected and saved`);
                        scannedTokens++;
                    }
                } catch (error) {
                    console.error(`Error processing transaction: ${error}`);
                    continue;
                }
            }
            
            currentBlock--;
        }
        
        console.log(`\n✨ Completed scanning ${chain}. Found ${scannedTokens} tokens.`);
    } catch (error) {
        console.error(`Error scanning ${chain}:`, error);
    }
}

async function startMonitoring() {
    const chains = ['ethereum', 'bsc', 'polygon'] as const;
    
    while (true) {
        try {
            for (const chain of chains) {
                await monitorChain(chain);
            }
            console.log(`\n⏰ Waiting ${config.scan.scanInterval/1000} seconds until next scan...`);
            await new Promise(resolve => setTimeout(resolve, config.scan.scanInterval));
        } catch (error) {
            console.error('Error in scanning cycle:', error);
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s on error
        }
    }
}

// Start scanning if this file is run directly
if (require.main === module) {
    startMonitoring().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
} 