import { Router } from 'express';
import { searchProducts } from '../controllers/searchController';
import { query } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

router.get(
    '/',
    [
        query('q').optional().trim(),
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('category').optional().trim(),
        query('brand').optional().trim(),
    ],
    validate,
    searchProducts
);

export default router;
