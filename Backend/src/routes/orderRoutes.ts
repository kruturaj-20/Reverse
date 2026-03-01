import { Router } from 'express';
import { placeOrder, getOrders, getOrderById } from '../controllers/orderController';
import { authenticate } from '../middleware/authenticate';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.post(
    '/',
    [
        body('shippingAddress').trim().notEmpty().withMessage('Shipping address is required'),
    ],
    validate,
    placeOrder
);

router.get('/', getOrders);
router.get('/:id', getOrderById);

export default router;
