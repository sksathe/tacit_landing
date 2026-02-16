import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects.js';
import meetingsRouter from './routes/meetings.js';
import sessionsRouter from './routes/sessions.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/projects', projectsRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/sessions', sessionsRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server API running on port ${PORT}`);
  console.log(`Frontend origin: ${FRONTEND_ORIGIN}`);
});
