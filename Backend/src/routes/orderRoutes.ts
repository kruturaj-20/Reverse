import { Router } from 'express';
import { placeOrder, getOrders, getOrderById, checkout, verifyPayment } from '../controllers/orderController';
import { authenticate } from '../middleware/authenticate';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

// regular order placement (legacy)
router.post(
    '/',
    [
        body('shippingAddress').trim().notEmpty().withMessage('Shipping address is required'),
    ],
    validate,
    placeOrder
);

// razorpay powered checkout (preferred)
router.post(
    '/checkout',
    [
        body('shippingAddress').isObject().withMessage('Shipping address must be an object'),
        body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
        body('shippingAddress.phone').trim().notEmpty().withMessage('Phone is required'),
        body('shippingAddress.street').trim().notEmpty().withMessage('Street is required'),
        body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
        body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
        body('shippingAddress.zipCode').trim().notEmpty().withMessage('Zip code is required'),
    ],
    validate,
    checkout
);

// client posts back razorpay tokens for verification
router.post(
    '/verify',
    [
        body('orderId').trim().notEmpty().withMessage('Order ID is required'),
        body('razorpayPaymentId').trim().notEmpty().withMessage('Payment ID is required'),
        body('razorpayOrderId').trim().notEmpty().withMessage('Razorpay order ID is required'),
        body('razorpaySignature').trim().notEmpty().withMessage('Signature is required'),
    ],
    validate,
    verifyPayment
);

router.get('/', getOrders);
router.get('/:id', getOrderById);

export default router;
