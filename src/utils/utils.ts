import { ethers } from 'ethers';

/**
 * Calculate variance of a numeric array
 */
export function calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}

/**
 * Format a number to a fixed number of decimal places
 */
export function formatNumber(value: number, decimals: number = 2): string {
    return value.toFixed(decimals);
}

/**
 * Convert Wei to Ether
 */
export function weiToEther(wei: string | number): number {
    return parseFloat(ethers.formatEther(wei.toString()));
}

/**
 * Convert Gwei to Ether
 */
export function gweiToEther(gwei: string | number): number {
    return parseFloat(ethers.formatUnits(gwei.toString(), 'gwei'));
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Group array elements by a key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((acc, item) => {
        const groupKey = String(item[key]);
        acc[groupKey] = acc[groupKey] || [];
        acc[groupKey].push(item);
        return acc;
    }, {} as Record<string, T[]>);
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            if (attempt === maxAttempts) break;
            
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await sleep(delay);
        }
    }
    
    throw lastError;
} 