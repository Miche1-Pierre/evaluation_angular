import { Router } from 'express';
import authRoutes from './auth.routes';
import productsRoutes from './products.routes';
import sessionsRoutes from './sessions.routes';

const router = Router();

// Register routes
router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/sessions', sessionsRoutes);

export default router;
