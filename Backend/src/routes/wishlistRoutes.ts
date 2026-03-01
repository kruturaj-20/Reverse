import { Router } from 'express';
import {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
} from '../controllers/wishlistController';
import { authenticate } from '../middleware/authenticate';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate); // All wishlist routes require authentication

router.get('/', getWishlist);
router.post(
    '/',
    [body('productId').isMongoId().withMessage('Invalid product ID format')],
    validate,
    addToWishlist
);
router.delete('/:productId', removeFromWishlist);

export default router;
