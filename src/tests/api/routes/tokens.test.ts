import request from 'supertest';
import express from 'express';
import tokensRouter from '../../../api/routes/tokens';
import { analyzeToken } from '../../../training/modelPredictor';

// Mock the dependencies
jest.mock('../../../services/ml/predictor');

describe('Tokens Routes', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/tokens', tokensRouter);
    });

    describe('POST /tokens/analyze', () => {
        const mockAnalysis = {
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
            suspiciousPattern: 0.7,
            reason: 'Test reason'
        };

        beforeEach(() => {
            (analyzeToken as jest.Mock).mockResolvedValue(mockAnalysis);
        });

        it('should return token analysis when valid address is provided', async () => {
            const response = await request(app)
                .post('/tokens/analyze')
                .send({ tokenAddress: '0x123' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockAnalysis);
        });

        it('should return 400 when token address is missing', async () => {
            const response = await request(app)
                .post('/tokens/analyze')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'Token address is required' });
        });

        it('should return 500 when analysis fails', async () => {
            (analyzeToken as jest.Mock).mockRejectedValue(new Error('Analysis failed'));

            const response = await request(app)
                .post('/tokens/analyze')
                .send({ tokenAddress: '0x123' });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Error analyzing token' });
        });

        it('should use provided chain parameter', async () => {
            await request(app)
                .post('/tokens/analyze')
                .send({ tokenAddress: '0x123', chain: 'bsc' });

            expect(analyzeToken).toHaveBeenCalledWith('0x123', 'bsc');
        });
    });
}); 