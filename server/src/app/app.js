import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "../routes/auth.routes.js";
import logger from "../config/logger.js";
import requestLogger from "../middlewares/request-logger.js";
import productRoutes from "../routes/product.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.get("/health", (_req, res) => res.json({ success: true, message: "OK" }));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

app.use((error, req, res, _next) => {
  logger.error("Unhandled application error", {
    error: error.stack ?? error.message,
    method: req.method,
    url: req.originalUrl,
  });
  res.status(500).json({ success: false, message: "Internal server error" });
});

export default app;
