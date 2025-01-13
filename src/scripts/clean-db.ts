import { AppDataSource } from '../db/data-source';
import { DataSource } from 'typeorm';

async function cleanDatabase() {
    let dataSource: DataSource | null = null;
    try {
        // Initialize without synchronization
        dataSource = new DataSource({
            ...AppDataSource.options,
            synchronize: false
        });
        await dataSource.initialize();
        console.log('Cleaning database...');
        
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        
        try {
            // Drop all tables and constraints
            await queryRunner.query(`
                DROP TABLE IF EXISTS token_metrics CASCADE;
                DROP TABLE IF EXISTS token_price CASCADE;
                DROP TABLE IF EXISTS token CASCADE;
                DROP TABLE IF EXISTS typeorm_metadata CASCADE;
            `);
            
            // Create tables in correct order
            await queryRunner.query(`
                CREATE TABLE token (
                    address VARCHAR PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    symbol VARCHAR NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE token_metrics (
                    id SERIAL PRIMARY KEY,
                    token_address VARCHAR NOT NULL REFERENCES token(address) ON DELETE CASCADE,
                    volume_anomaly NUMERIC CHECK (volume_anomaly >= 0 AND volume_anomaly <= 1),
                    holder_concentration NUMERIC CHECK (holder_concentration >= 0 AND holder_concentration <= 1),
                    liquidity_score NUMERIC CHECK (liquidity_score >= 0 AND liquidity_score <= 1),
                    price_volatility NUMERIC CHECK (price_volatility >= 0 AND price_volatility <= 1),
                    sell_pressure NUMERIC CHECK (sell_pressure >= 0 AND sell_pressure <= 1),
                    market_cap_risk NUMERIC CHECK (market_cap_risk >= 0 AND market_cap_risk <= 1),
                    is_rug_pull BOOLEAN DEFAULT false,
                    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    metadata JSONB DEFAULT '{}'::jsonb
                );

                CREATE TABLE token_price (
                    id SERIAL PRIMARY KEY,
                    token_address VARCHAR NOT NULL REFERENCES token(address) ON DELETE CASCADE,
                    price NUMERIC NOT NULL,
                    volume_24h NUMERIC,
                    market_cap NUMERIC,
                    liquidity NUMERIC,
                    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX idx_token_metrics_token_address_timestamp ON token_metrics(token_address, timestamp DESC);
                CREATE INDEX idx_token_price_token_address_timestamp ON token_price(token_address, timestamp DESC);
            `);
            
            console.log('Database cleaned and tables recreated successfully');
        } catch (error) {
            console.error('Error during table operations:', error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    } catch (error) {
        console.error('Error cleaning database:', error);
        process.exit(1);
    } finally {
        if (dataSource) {
            await dataSource.destroy();
        }
    }
}

if (require.main === module) {
    cleanDatabase();
}

export { cleanDatabase }; 