import { analyzeToken } from '../../../training/modelPredictor';
import { fetchTokenData } from '../../../data-harvesting/fetcher';
import { TokenData } from '../../../types/data';

// Mock the dependencies
jest.mock('../../../services/data/fetcher');
jest.mock('@tensorflow/tfjs-node', () => ({
    loadLayersModel: jest.fn().mockResolvedValue({
        predict: jest.fn().mockReturnValue({
            dataSync: () => [0.75],
            dispose: jest.fn()
        }),
        dispose: jest.fn()
    }),
    tensor2d: jest.fn().mockReturnValue({
        dispose: jest.fn()
    })
}));

describe('Predictor Service', () => {
    const mockTokenData: TokenData = {
        token: '0x123',
        volumeAnomaly: 0.8,
        holderConcentration: 0.7,
        liquidityScore: 0.4,
        priceVolatility: 0.6,
        sellPressure: 0.5,
        marketCapRisk: 0.3,
        bundlerActivity: true,
        accumulationRate: 0.6,
        stealthAccumulation: 0.4,
        suspiciousPattern: true,
        isRugPull: true,
        metadata: {
            reason: 'Test reason'
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (fetchTokenData as jest.Mock).mockResolvedValue(mockTokenData);
    });

    it('should analyze a token and return predictions', async () => {
        const result = await analyzeToken('0x123');

        expect(result).toEqual({
            token: '0x123',
            rugPullProbability: 0.75,
            metrics: {
                volumeAnomaly: 0.8,
                holderConcentration: 0.7,
                liquidityScore: 0.4,
                priceVolatility: 0.6,
                sellPressure: 0.5,
                marketCapRisk: 0.3
            },
            bundlerActivity: true,
            accumulationRate: 0.6,
            stealthAccumulation: 0.4,
            suspiciousPattern: true,
            reason: 'Test reason'
        });
    });

    it('should throw an error when token data is not found', async () => {
        (fetchTokenData as jest.Mock).mockResolvedValue(null);

        await expect(analyzeToken('0x123')).rejects.toThrow('Token data not found');
    });

    it('should use ethereum as default chain', async () => {
        await analyzeToken('0x123');

        expect(fetchTokenData).toHaveBeenCalledWith('0x123', 'ethereum');
    });

    it('should accept custom chain parameter', async () => {
        await analyzeToken('0x123', 'bsc');

        expect(fetchTokenData).toHaveBeenCalledWith('0x123', 'bsc');
    });
}); 