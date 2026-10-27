import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../controllers/product.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import {
  productCreateSchema,
  productQuerySchema,
  productUpdateSchema,
} from "../validators/product.validator.js";

const router = Router();

router.get("/", validate(productQuerySchema, "query"), listProducts);
router.get("/:id", getProduct);
router.post("/", authenticate, validate(productCreateSchema), createProduct);
router.patch(
  "/:id",
  authenticate,
  validate(productUpdateSchema),
  updateProduct,
);
router.delete("/:id", authenticate, deleteProduct);

export default router;
