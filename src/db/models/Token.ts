import { Model, DataTypes, Sequelize } from 'sequelize';

interface TokenAttributes {
    address: string;
    name: string;
    symbol: string;
    volumeAnomaly: number;
    holderConcentration: number;
    liquidityScore: number;
    priceVolatility: number;
    sellPressure: number;
    marketCapRisk: number;
    isRugPull: boolean;
    metadata: object;
}

class Token extends Model<TokenAttributes> implements TokenAttributes {
    public address!: string;
    public name!: string;
    public symbol!: string;
    public volumeAnomaly!: number;
    public holderConcentration!: number;
    public liquidityScore!: number;
    public priceVolatility!: number;
    public sellPressure!: number;
    public marketCapRisk!: number;
    public isRugPull!: boolean;
    public metadata!: object;
}

export function initToken(sequelize: Sequelize): typeof Token {
    Token.init({
        address: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        symbol: {
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
        isRugPull: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Token',
        tableName: 'tokens',
        timestamps: true
    });

    return Token;
} 