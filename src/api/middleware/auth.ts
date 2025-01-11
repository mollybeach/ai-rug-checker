import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
    apiKey?: string;
}

export function validateApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
        return res.status(401).json({ error: 'API key is required' });
    }

    // In a real application, you would validate against a database of API keys
    // For now, we'll use a simple environment variable comparison
    if (apiKey !== process.env.API_KEY) {
        return res.status(403).json({ error: 'Invalid API key' });
    }

    req.apiKey = apiKey;
    next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication token is required' });
    }

    try {
        // In a real application, you would verify the JWT token here
        // For now, we'll just check if it exists
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid authentication token' });
    }
} 