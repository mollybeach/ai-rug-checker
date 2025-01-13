// path: src/data-harvesting/collector.ts
import { Token } from '../db/entities/Token';
import { TokenMetrics } from '../db/entities/TokenMetrics';
import { TokenPrice } from '../db/entities/TokenPrice';
import { AppDataSource } from '../db/data-source';
import { TokenData } from '../types/token';
import { In } from 'typeorm';

class DataCollector {
    private tokenBatch: TokenData[] = [];
    private readonly BATCH_SIZE = 50;
    private processingBatch = false;

    async collectAndStoreTokenData(tokenData: TokenData): Promise<void> {
        this.tokenBatch.push(tokenData);
        
        if (this.tokenBatch.length >= this.BATCH_SIZE && !this.processingBatch) {
            await this.processBatch();
        }
    }

    private async processBatch(): Promise<void> {
        if (this.processingBatch || this.tokenBatch.length === 0) return;
        
        this.processingBatch = true;
        const batchToProcess = [...this.tokenBatch];
        this.tokenBatch = [];

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Process tokens in bulk
            const tokenRepository = queryRunner.manager.getRepository(Token);
            const tokenAddresses = batchToProcess.map(data => data.address);
            
            // Check existing tokens
            const existingTokens = await tokenRepository.find({
                where: { address: In(tokenAddresses) }
            });
            const existingAddresses = new Set(existingTokens.map(t => t.address));
            
            // Prepare new tokens
            const newTokens = batchToProcess
                .filter(data => !existingAddresses.has(data.address))
                .map(data => tokenRepository.create({
                    address: data.address,
                    name: data.name,
                    symbol: data.symbol
                }));

            if (newTokens.length > 0) {
                await tokenRepository.save(newTokens);
            }

            // Process metrics in bulk
            const metricsRepository = queryRunner.manager.getRepository(TokenMetrics);
            const metricsEntities = batchToProcess.map(data => 
                metricsRepository.create({
                    tokenAddress: data.address,
                    volumeAnomaly: data.metrics.volumeAnomaly ?? 0,
                    holderConcentration: data.metrics.holderConcentration ?? 0,
                    liquidityScore: data.metrics.liquidityScore ?? 0,
                    priceVolatility: data.metrics.priceVolatility ?? 0,
                    sellPressure: data.metrics.sellPressure ?? 0,
                    marketCapRisk: data.metrics.marketCapRisk ?? 0,
                    isRugPull: data.metrics.isRugPull ?? false,
                    bundlerActivity: data.metrics.bundlerActivity ?? false,
                    accumulationRate: data.metrics.accumulationRate ?? 0,
                    stealthAccumulation: data.metrics.stealthAccumulation ?? 0,
                    suspiciousPattern: data.metrics.suspiciousPattern,
                    metadata: data.metrics.metadata ?? {}
                })
            );
            await metricsRepository.save(metricsEntities);

            // Process prices in bulk
            const priceRepository = queryRunner.manager.getRepository(TokenPrice);
            const priceEntities = batchToProcess.map(data =>
                priceRepository.create({
                    tokenAddress: data.address,
                    price: data.price.price,
                    volume24h: data.price.volume24h,
                    marketCap: data.price.marketCap,
                    liquidity: data.price.liquidity
                })
            );
            await priceRepository.save(priceEntities);

            await queryRunner.commitTransaction();
            console.log(`✅ Successfully processed batch of ${batchToProcess.length} tokens`);
        } catch (error) {
            console.error('Error processing batch:', error);
            await queryRunner.rollbackTransaction();
            
            // Requeue failed items
            this.tokenBatch = [...this.tokenBatch, ...batchToProcess];
        } finally {
            this.processingBatch = false;
            await queryRunner.release();
        }
    }

    async flushRemaining(): Promise<void> {
        if (this.tokenBatch.length > 0) {
            await this.processBatch();
        }
    }
}

export const dataCollector = new DataCollector(); 