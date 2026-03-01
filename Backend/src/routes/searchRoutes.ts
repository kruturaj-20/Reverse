import { Router } from 'express';
import { searchProducts } from '../controllers/searchController';
import { validateRequest } from '../middleware/validateRequest';
import { searchQuerySchema } from '../validations/searchValidation';

const router = Router();

router.get('/', validateRequest(searchQuerySchema), searchProducts);

export default router;
