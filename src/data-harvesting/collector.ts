// path: src/data-harvesting/collector.ts
import { fetchTokenData } from './fetcher';
import { TokenService } from '../db/services/TokenService';
import { AppDataSource } from '../db/data-source';

export class DataCollector {
    private tokenService: TokenService;

    constructor() {
        this.tokenService = new TokenService(AppDataSource);
    }

    async collectAndStoreTokenData(tokenAddress: string, chain: string = 'ethereum'): Promise<void> {
        try {
            // Fetch token data from external sources
            const tokenData = await fetchTokenData(tokenAddress, chain);
            if (!tokenData) {
                console.error(`No data found for token ${tokenAddress}`);
                return;
            }

            // Store base token information
            const token = await this.tokenService.upsertToken({
                address: tokenAddress,
                name: tokenData.name,
                symbol: tokenData.symbol
            });

            // Store metrics
            await this.tokenService.saveMetrics({
                tokenAddress: token.address,
                volumeAnomaly: tokenData.volumeAnomaly,
                holderConcentration: tokenData.holderConcentration,
                liquidityScore: tokenData.liquidityScore,
                priceVolatility: tokenData.priceVolatility,
                sellPressure: tokenData.sellPressure,
                marketCapRisk: tokenData.marketCapRisk,
                bundlerActivity: tokenData.bundlerActivity,
                accumulationRate: tokenData.accumulationRate,
                stealthAccumulation: tokenData.stealthAccumulation,
                suspiciousPattern: tokenData.suspiciousPattern,
                isRugPull: tokenData.isRugPull,
                metadata: tokenData.metadata
            });

            // Store current price data
            await this.tokenService.savePrice({
                tokenAddress: token.address,
                price: tokenData.currentPrice || 0,
                volume24h: tokenData.volume24h || 0,
                marketCap: tokenData.marketCap || 0,
                liquidity: tokenData.liquidity || 0
            });

            console.log(`Successfully stored data for token ${tokenAddress}`);
        } catch (error) {
            console.error(`Error collecting data for token ${tokenAddress}:`, error);
            throw error;
        }
    }

    async collectBatchTokenData(tokenAddresses: string[], chain: string = 'ethereum'): Promise<void> {
        for (const address of tokenAddresses) {
            try {
                await this.collectAndStoreTokenData(address, chain);
            } catch (error) {
                console.error(`Failed to collect data for token ${address}:`, error);
                continue;
            }
        }
    }
}

// Export a singleton instance
export const dataCollector = new DataCollector(); 