import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import {
  cartCreateSchema,
  cartItemUpdateSchema,
} from "../validators/cart.validator.js";
import {
  clearCartController,
  createCartController,
  getCartItemsController,
  removeCartItemController,
  updateCartItemController,
} from "../controllers/cart.controller.js";

const router = Router();

router.get("/", authenticate, getCartItemsController);
router.post(
  "/",
  authenticate,
  validate(cartCreateSchema),
  createCartController,
);
router.patch(
  "/items/:productId",
  authenticate,
  validate(cartItemUpdateSchema),
  updateCartItemController,
);
router.delete(
  "/items/:productId",
  authenticate,
  removeCartItemController,
);
router.delete("/", authenticate, clearCartController);

export default router;
