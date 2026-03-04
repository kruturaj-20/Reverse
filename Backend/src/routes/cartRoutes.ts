import { Router } from 'express';
import { getCart, addToCart, removeFromCart } from '../controllers/cartController';
import { authenticate } from '../middleware/authenticate';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getCart);

router.post(
    '/add',
    [
        // Accept MongoDB ObjectIds (DB products) AND affiliate prefixed IDs (amz_, fk_, af_).
        // The controller will handle the affiliate case with a clear error message.
        body('productId')
            .isString()
            .notEmpty()
            .withMessage('productId is required'),
        body('quantity')
            .isInt({ min: 1 })
            .withMessage('Quantity must be at least 1')
            .toInt(),
    ],
    validate,
    addToCart
);

router.delete('/remove/:productId', removeFromCart);

export default router;
