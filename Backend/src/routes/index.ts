import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import wishlistRoutes from './wishlistRoutes';
import cartRoutes from './cartRoutes';
import orderRoutes from './orderRoutes';
import searchRoutes from './searchRoutes';
import reviewRoutes from './reviewRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/search', searchRoutes);
router.use('/reviews', reviewRoutes);

export default router;
