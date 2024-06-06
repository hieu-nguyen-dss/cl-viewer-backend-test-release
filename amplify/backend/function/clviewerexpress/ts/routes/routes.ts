import express from 'express';
import { adminAuthMiddleware, userAuthMiddleware } from '../api/authMiddleware';
import loginRoute from '../api/login';
import adminRoutes from './adminRoutes';
import userRoutes from './userRoutes';
const router = express.Router();

router.use('/login', loginRoute);
router.use('/admin', adminAuthMiddleware, adminRoutes);
router.use('/', userAuthMiddleware, userRoutes);

export default router;
