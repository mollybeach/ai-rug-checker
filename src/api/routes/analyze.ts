import { scanNewTokens, scanMultipleChains } from '../../data-harvesting/tokenScanner';

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'scan';
    const chain = args[1] || 'ethereum';
    const limit = parseInt(args[2] || '50', 10);

    try {
        switch (command) {
            case 'scan':
                console.log(`Scanning ${chain} chain for ${limit} new tokens...`);
                await scanNewTokens(chain, limit);
                break;
            
            case 'scan-all':
                console.log('Scanning all major chains...');
                await scanMultipleChains(['ethereum', 'bsc', 'polygon'], limit);
                break;
            
            default:
                console.log(`
Usage:
    npm run scan -- [command] [chain] [limit]

Commands:
    scan        Scan a single chain (default)
    scan-all    Scan all major chains

Chains:
    ethereum    Ethereum mainnet (default)
    bsc        Binance Smart Chain
    polygon    Polygon/Matic
    arbitrum   Arbitrum
    optimism   Optimism

Limit:
    Number of tokens to scan per chain (default: 50)

Examples:
    npm run scan
    npm run scan -- scan ethereum 100
    npm run scan -- scan-all 50
                `);
        }
    } catch (error) {
        console.error('Error running scanner:', error);
        process.exit(1);
    }
}

main(); 