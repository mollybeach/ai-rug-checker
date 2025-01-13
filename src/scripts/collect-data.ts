import { initializeDatabase } from '../db/data-source';
import { dataCollector } from '../data-harvesting/collector';
import { fetchTokenData } from '../data-harvesting/fetcher';
import { TokenData } from '../types/data';

// List of tokens to monitor (example tokens)
const TOKENS_TO_MONITOR = [
    // Stablecoins
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    
    // Major DeFi tokens
    '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI
    '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', // AAVE
    '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', // MKR
    
    // Layer 2 tokens
    '0x4200000000000000000000000000000000000042', // OP
    '0x85F17Cf997934a597031b2E18a9aB6ebD4B9f6a4', // NEAR
    
    // Meme tokens (for comparison)
    '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', // SHIB
    '0x6982508145454Ce325dDbE47a25d4ec3d2311933', // PEPE
];

async function main() {
    try {
        // Initialize database connection
        await initializeDatabase();
        console.log('Database initialized');

        // Collect data for each token
        console.log('Starting data collection...');
        
        // Fetch token data for each address
        const tokenDataArray: TokenData[] = [];
        for (const address of TOKENS_TO_MONITOR) {
            try {
                const tokenData = await fetchTokenData(address, 'ethereum');
                if (tokenData) {
                    tokenDataArray.push(tokenData);
                }
            } catch (error) {
                console.error(`Failed to fetch data for token ${address}:`, error);
            }
        }
        
        // Store the collected data
        await dataCollector.collectBatchTokenData(tokenDataArray);
        console.log('Data collection completed');

        process.exit(0);
    } catch (error) {
        console.error('Error in data collection:', error);
        process.exit(1);
    }
}

// Run the script
main();