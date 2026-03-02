import { Router } from 'express';
import multer from 'multer';
import { searchProducts, imageSearch } from '../controllers/searchController';
import { validateRequest } from '../middleware/validateRequest';
import { searchQuerySchema } from '../validations/searchValidation';

const router = Router();

// multer: store in memory (no disk I/O), limit 10MB, images only
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are accepted'));
        }
    },
});

// GET /api/v1/search?q=running+shoes
router.get('/', validateRequest(searchQuerySchema), searchProducts);

// POST /api/v1/search/image  (multipart/form-data, field: image)
router.post('/image', upload.single('image'), imageSearch);

export default router;
