import { z } from "zod";

const nonNegativeNumber = z.coerce.number().min(0);
const nonNegativeInteger = z.coerce.number().int().min(0);

export const productCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  sku: z.string().trim().min(1).max(80),
  brand: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(100),
  subcategory: z.string().trim().min(1).max(100),
  description: z.string().trim().min(10).max(5000),
  price: nonNegativeNumber,
  discountPercentage: z.coerce.number().min(0).max(90).default(0),
  imageUrls: z.array(z.string().url()).max(20).default([]),
  averageRating: z.number().min(1).max(5).nullable().optional(),
  ratingCount: nonNegativeInteger.default(0),
  reviewCount: nonNegativeInteger.default(0),
  stockQuantity: nonNegativeInteger.default(0),
  tags: z.array(z.string().trim().min(1).max(50)).max(50).default([]),
  attributes: z.record(z.string(), z.string()).default({}),
  popularityScore: nonNegativeNumber.default(0),
  salesCount: nonNegativeInteger.default(0),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().trim().min(1).optional(),
  subcategory: z.string().trim().min(1).optional(),
  brand: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  minPrice: nonNegativeNumber.optional(),
  maxPrice: nonNegativeNumber.optional(),
  sortBy: z
    .enum([
      "createdAt",
      "price",
      "discountedPrice",
      "averageRating",
      "popularityScore",
      "salesCount",
    ])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
