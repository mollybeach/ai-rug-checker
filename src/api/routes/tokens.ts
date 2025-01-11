import { Router, RequestHandler } from 'express';
import { analyzeToken } from '../../training/modelPredictor';
import { TokenAnalysisRequest } from '../../types/api';

const router = Router();

const analyzeTokenHandler: RequestHandler = async (req, res) => {
    try {
        const { tokenAddress, chain = 'ethereum' } = req.body as TokenAnalysisRequest;

        if (!tokenAddress) {
            res.status(400).json({ error: 'Token address is required' });
            return;
        }

        const analysis = await analyzeToken(tokenAddress, chain);
        res.json(analysis);
    } catch (error) {
        console.error('Error analyzing token:', error);
        res.status(500).json({ error: 'Error analyzing token' });
    }
};

router.post('/analyze', analyzeTokenHandler);

export default router; 