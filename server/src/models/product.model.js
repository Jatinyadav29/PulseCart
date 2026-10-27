import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, required: true, min: 0, max: 90 },
    discountedPrice: { type: Number, required: true, min: 0 },
    imageUrls: { type: [String], default: [] },
    averageRating: { type: Number, min: 1, max: 5, default: null },
    ratingCount: { type: Number, required: true, min: 0, default: 0 },
    reviewCount: { type: Number, required: true, min: 0, default: 0 },
    stockQuantity: { type: Number, required: true, min: 0 },
    availability: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      required: true,
    },
    tags: { type: [String], default: [] },
    attributes: { type: Map, of: String, default: {} },
    popularityScore: { type: Number, required: true, min: 0 },
    salesCount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

productSchema.index({ category: 1, price: 1 });
productSchema.index({ brand: 1 });

export const Product = mongoose.model("Product", productSchema);
