export default {
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
    },
    rpc: {
        ethereum: process.env.ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
        bsc: process.env.BSC_RPC || 'https://bsc-dataseed.binance.org',
        polygon: process.env.POLYGON_RPC || 'https://polygon-rpc.com'
    },
    api: {
        etherscan: process.env.ETHERSCAN_API_KEY || '',
        dexscreener: process.env.DEXSCREENER_API_KEY || ''
    },
    model: {
        path: 'models/model.json',
        trainingDataPath: 'data/training_data.json'
    },
    scan: {
        batchSize: 20,
        scanInterval: 300000,  // 5 minutes
        trainingInterval: 900000  // 15 minutes
    }
} 