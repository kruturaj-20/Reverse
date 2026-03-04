import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getBudgetBundle,
  getPersonalizedFeed,
} from "../controllers/productController";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateRequest } from "../middleware/validateRequest";
import {
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
  budgetBundleSchema,
} from "../validations/productValidation";
import {
  getPriceHistory,
  getBuyAdvice,
} from "../controllers/productController";

const router = Router();

// Public routes
router.get("/", validateRequest(productQuerySchema), getProducts);
router.get("/:id", getProductById);
router.get("/:id/price-history", getPriceHistory);
router.get("/:id/buy-advice", getBuyAdvice);
router.get("/:id/bundles", getBundleSuggestions);
router.post("/budget", validateRequest(budgetBundleSchema), getBudgetBundle);
// personalized home feed (requires auth middleware applied where router is mounted)
router.get("/feed/personalized", authenticate, getPersonalizedFeed);

// Admin-only routes — requires authentication + admin role
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validateRequest(createProductSchema),
  createProduct,
);
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validateRequest(updateProductSchema),
  updateProduct,
);
router.delete("/:id", authenticate, authorize("admin"), deleteProduct);

export default router;
