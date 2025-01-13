import express from 'express';
import { initializeDatabase } from '../db/data-source';
import tokenRoutes from './routes/tokenRoutes';

const app = express();
app.use(express.json());

// Use token routes
app.use('/api/tokens', tokenRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Initialize database connection
        await initializeDatabase();
        console.log('Database connection initialized');

        // Start the server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 