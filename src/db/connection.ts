import { Sequelize } from 'sequelize';
import { initToken } from './models/Token';

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost:5432/rugwatchdog', {
    dialect: 'postgres',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Initialize models
export const Token = initToken(sequelize);

// Test connection
export async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
}

export default sequelize; 