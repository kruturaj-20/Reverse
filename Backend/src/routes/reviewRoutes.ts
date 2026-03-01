import { Router } from 'express';
import { getProductReviews, addReview } from '../controllers/reviewController';
import { authenticate } from '../middleware/authenticate';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/:productId', getProductReviews);

router.post(
    '/',
    authenticate,
    [
        body('productId').isMongoId().withMessage('Invalid product ID'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5').toInt(),
        body('comment').trim().notEmpty().withMessage('Comment is required').isLength({ max: 1000 }).withMessage('Comment too long'),
    ],
    validate,
    addReview
);

export default router;
