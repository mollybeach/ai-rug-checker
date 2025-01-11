import express from 'express';
import config from '../config/default';
import { initializeDatabase } from '../db/connection';
import tokensRouter from './routes/tokens';
import metricsRouter from './routes/metrics';
import * as tf from '@tensorflow/tfjs-node';
import path from 'path';

const app = express();
let model: tf.LayersModel | null = null;

// Load the model at startup
async function loadModel() {
    try {
        const modelPath = 'file://' + path.join(process.cwd(), 'src/ml/models/trained/model.json');
        model = await tf.loadLayersModel(modelPath);
        console.log('Model loaded successfully');
    } catch (error) {
        console.error('Error loading model:', error);
        process.exit(1);
    }
}

// Middleware
app.use(express.json());

// Routes
app.use('/tokens', tokensRouter);
app.use('/metrics', metricsRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();
        
        // Load model
        await loadModel();
        
        // Start listening
        const { port, host } = config.server;
        app.listen(port, () => {
            console.log(`Server running at http://${host}:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 