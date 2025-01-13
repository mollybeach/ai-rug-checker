import { AppDataSource } from '../db/data-source';
import { Token } from '../db/entities/Token';
import { TokenMetrics } from '../db/entities/TokenMetrics';
import { TokenPrice } from '../db/entities/TokenPrice';

async function cleanDatabase() {
    try {
        await AppDataSource.initialize();
        console.log('Database connection initialized');

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Delete all records from tables in correct order
            await queryRunner.manager.delete(TokenPrice, {});
            await queryRunner.manager.delete(TokenMetrics, {});
            await queryRunner.manager.delete(Token, {});

            await queryRunner.commitTransaction();
            console.log('✅ Database cleaned successfully');
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Error cleaning database:', error);
            throw error;
        } finally {
            await queryRunner.release();
        }

        await AppDataSource.destroy();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    cleanDatabase();
}

export { cleanDatabase }; 