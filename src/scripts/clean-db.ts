import { Sequelize } from 'sequelize';
import { initToken } from '../db/models/Token';
import { config } from '../config';

async function cleanDatabase() {
    try {
        const sequelize = new Sequelize(config.database.url, config.database.options);
        const Token = initToken(sequelize);
        
        console.log('Cleaning database...');
        await Token.destroy({ where: {} });
        console.log('Database cleaned successfully');
        
        await sequelize.close();
    } catch (error) {
        console.error('Error cleaning database:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    cleanDatabase();
}

export { cleanDatabase }; 