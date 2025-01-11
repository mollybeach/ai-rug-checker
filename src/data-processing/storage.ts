//path: /storage.ts
import { TokenData } from '../types/data';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const TRAINING_FILE = path.join(DATA_DIR, 'training_data.json');

export async function loadExistingData(): Promise<TokenData[]> {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const data = await fs.readFile(TRAINING_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is invalid, return empty array
        return [];
    }
}

export async function appendTokenData(tokenData: TokenData): Promise<void> {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const existingData = await loadExistingData();
        existingData.push(tokenData);
        await fs.writeFile(TRAINING_FILE, JSON.stringify(existingData, null, 2));
    } catch (error) {
        console.error('Error appending token data:', error);
        throw error;
    }
} 