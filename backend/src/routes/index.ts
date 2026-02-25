import { Router } from 'express';
import authRoutes from './auth.routes';
import productsRoutes from './products.routes';
import themesRoutes from './themes.routes';
import sessionsRoutes from './sessions.routes';
import friendsRoutes from './friends.routes';
import invitesRoutes from './invites.routes';
import leaderboardRoutes from './leaderboard.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Register routes
router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/themes', themesRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/friends', friendsRoutes);
router.use('/invites', invitesRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/admin', adminRoutes);

export default router;
