import { Router } from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateWishlistTarget,
} from "../controllers/wishlistController";
import { authenticate } from "../middleware/authenticate";
import { body } from "express-validator";
import { validate } from "../middleware/validate";

const router = Router();

router.use(authenticate); // All wishlist routes require authentication

router.get("/", getWishlist);
router.post(
  "/",
  [
    body("productId").isMongoId().withMessage("Invalid product ID format"),
    body("targetPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Target price must be a non-negative number"),
  ],
  validate,
  addToWishlist,
);
router.patch(
  "/:productId/target",
  [
    body("targetPrice")
      .isFloat({ min: 0 })
      .withMessage("Target price must be a non-negative number"),
  ],
  validate,
  updateWishlistTarget,
);
router.delete("/:productId", removeFromWishlist);

export default router;
