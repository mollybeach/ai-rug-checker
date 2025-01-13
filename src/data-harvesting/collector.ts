// path: src/data-harvesting/collector.ts
import { TokenService } from '../db/services/TokenService';
import { AppDataSource } from '../db/data-source';
import { TokenData } from '../types/data';

export class DataCollector {
    private tokenService: TokenService;

    constructor() {
        this.tokenService = new TokenService(AppDataSource);
    }

    async collectAndStoreTokenData(tokenData: TokenData): Promise<void> {
        try {
            // Store base token information
            const token = await this.tokenService.upsertToken({
                address: tokenData.token,
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

            console.log(`Successfully stored data for token ${tokenData.token}`);
        } catch (error) {
            console.error(`Error collecting data for token ${tokenData.token}:`, error);
            throw error;
        }
    }

    async collectBatchTokenData(tokenDataArray: TokenData[]): Promise<void> {
        for (const tokenData of tokenDataArray) {
            try {
                await this.collectAndStoreTokenData(tokenData);
            } catch (error) {
                console.error(`Failed to collect data for token ${tokenData.token}:`, error);
                continue;
            }
        }
    }
}

// Export a singleton instance
export const dataCollector = new DataCollector(); 