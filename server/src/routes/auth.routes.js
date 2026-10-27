import { Router } from "express";
import {
  login,
  logout,
  me,
  refresh,
  register,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);

export default router;
