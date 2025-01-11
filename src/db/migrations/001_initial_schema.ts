import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
    // Create Tokens table
    await queryInterface.createTable('tokens', {
        address: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        chain: {
            type: DataTypes.STRING,
            allowNull: false
        },
        volumeAnomaly: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        holderConcentration: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        liquidityScore: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        priceVolatility: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        sellPressure: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        marketCapRisk: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        bundlerActivity: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        accumulationRate: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        stealthAccumulation: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        suspiciousPattern: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        isRugPull: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });

    // Create Transactions table
    await queryInterface.createTable('transactions', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        tokenAddress: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'tokens',
                key: 'address'
            }
        },
        from: {
            type: DataTypes.STRING,
            allowNull: false
        },
        to: {
            type: DataTypes.STRING,
            allowNull: false
        },
        value: {
            type: DataTypes.DECIMAL(36, 18),
            allowNull: false
        },
        gasPrice: {
            type: DataTypes.DECIMAL(36, 18),
            allowNull: false
        },
        timestamp: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('buy', 'sell'),
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });

    // Create Metrics table
    await queryInterface.createTable('metrics', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        tokenAddress: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'tokens',
                key: 'address'
            }
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false
        },
        price: {
            type: DataTypes.DECIMAL(36, 18),
            allowNull: true
        },
        volume24h: {
            type: DataTypes.DECIMAL(36, 18),
            allowNull: true
        },
        liquidity: {
            type: DataTypes.DECIMAL(36, 18),
            allowNull: true
        },
        marketCap: {
            type: DataTypes.DECIMAL(36, 18),
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });
}

export async function down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('metrics');
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('tokens');
} 