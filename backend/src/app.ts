import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

const app: Application = express();

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ file đính kèm tĩnh
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

import documentRouter from './routes/document.route';
import authRouter from './routes/auth.route';
import userRouter from './routes/user.route';
import documentTypeRouter from './routes/document-type.route';

// Health Check Route
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'E-Approval API is running' });
});

// API Routes (chuẩn Modular pattern)
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/documents', documentRouter);
app.use('/api/v1/document-types', documentTypeRouter);

export default app;
