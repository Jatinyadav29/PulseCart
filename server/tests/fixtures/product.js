import crypto from "node:crypto";
import { Product } from "../../src/models/product.model.js";

export const makeProductData = (overrides = {}) => ({
  name: "Test product",
  sku: `SKU-${crypto.randomUUID().slice(0, 8)}`,
  brand: "Test brand",
  category: "Testing",
  subcategory: "Fixtures",
  description: "A product fixture used by integration tests.",
  price: 100,
  discountPercentage: 10,
  discountedPrice: 90,
  imageUrls: [],
  averageRating: null,
  ratingCount: 0,
  reviewCount: 0,
  stockQuantity: 20,
  availability: "low_stock",
  tags: ["test"],
  attributes: {},
  popularityScore: 0,
  salesCount: 0,
  ...overrides,
});

export const createProduct = (overrides = {}) =>
  Product.create(makeProductData(overrides));
