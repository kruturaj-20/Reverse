import { Router } from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} from '../controllers/productController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validateRequest';
import { createProductSchema, productQuerySchema, updateProductSchema } from '../validations/productValidation';

const router = Router();

// Public routes
router.get('/', validateRequest(productQuerySchema), getProducts);
router.get('/:id', getProductById);

// Admin-only routes — requires authentication + admin role
router.post('/', authenticate, authorize('admin'), validateRequest(createProductSchema), createProduct);
router.put('/:id', authenticate, authorize('admin'), validateRequest(updateProductSchema), updateProduct);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

export default router;
