import { Router } from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} from '../controllers/productController';
import { authenticate } from '../middleware/authenticate'; // In a real app, create/update/delete would also use an authorize('admin') middleware
import { validateRequest } from '../middleware/validateRequest';
import { createProductSchema, productQuerySchema, updateProductSchema } from '../validations/productValidation';

const router = Router();

router.get('/', validateRequest(productQuerySchema), getProducts);
router.get('/:id', getProductById);

router.post('/', authenticate, validateRequest(createProductSchema), createProduct);
router.put('/:id', authenticate, validateRequest(updateProductSchema), updateProduct);
router.delete('/:id', authenticate, deleteProduct);

export default router;
