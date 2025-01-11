import { Options } from 'sequelize';
import path from 'path';

interface DatabaseConfig {
    url: string;
    options: Options;
}

interface Config {
    database: DatabaseConfig;
}

export const config: Config = {
    database: {
        url: process.env.DATABASE_URL || 'sqlite:' + path.join(process.cwd(), 'data', 'database.sqlite'),
        options: {
            logging: false,
            dialect: 'sqlite',
            storage: path.join(process.cwd(), 'data', 'database.sqlite')
        }
    }
};
