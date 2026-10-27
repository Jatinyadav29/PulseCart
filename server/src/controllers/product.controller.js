import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import logger from "../config/logger.js";

const calculateDiscountedPrice = (price, discountPercentage) =>
  Math.round(price * (1 - discountPercentage / 100) * 100) / 100;

const getAvailability = (stockQuantity) =>
  stockQuantity === 0
    ? "out_of_stock"
    : stockQuantity < 25
      ? "low_stock"
      : "in_stock";

const withDerivedFields = (product) => ({
  ...product,
  discountedPrice: calculateDiscountedPrice(
    product.price,
    product.discountPercentage,
  ),
  availability: getAvailability(product.stockQuantity),
});

const notFound = (res) =>
  res.status(404).json({ success: false, message: "Product not found" });

const invalidId = (id) => !mongoose.isValidObjectId(id);

export const listProducts = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      category,
      subcategory,
      brand,
      search,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    } = req.validated?.query ?? req.query;
    const filter = {};

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (brand) filter.brand = brand;
    if (search) {
      const searchPattern = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      filter.$or = [
        { name: searchPattern },
        { brand: searchPattern },
        { category: searchPattern },
        { subcategory: searchPattern },
        { tags: searchPattern },
      ];
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getProduct = async (req, res, next) => {
  if (invalidId(req.params.id)) return notFound(res);

  try {
    const product = await Product.findById(req.params.id).lean();
    return product ? res.json({ success: true, data: product }) : notFound(res);
  } catch (error) {
    return next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(withDerivedFields(req.body));
    logger.info("Product created", {
      productId: product._id.toString(),
      userId: req.user._id.toString(),
    });
    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error?.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "SKU is already registered" });
    }
    return next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  if (invalidId(req.params.id)) return notFound(res);

  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return notFound(res);

    const values = { ...req.body };
    const price = values.price ?? existing.price;
    const discountPercentage =
      values.discountPercentage ?? existing.discountPercentage;
    const stockQuantity = values.stockQuantity ?? existing.stockQuantity;
    values.discountedPrice = calculateDiscountedPrice(
      price,
      discountPercentage,
    );
    values.availability = getAvailability(stockQuantity);

    const product = await Product.findByIdAndUpdate(req.params.id, values, {
      new: true,
      runValidators: true,
    });
    logger.info("Product updated", {
      productId: product._id.toString(),
      userId: req.user._id.toString(),
    });
    return res.json({ success: true, data: product });
  } catch (error) {
    if (error?.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "SKU is already registered" });
    }
    return next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  if (invalidId(req.params.id)) return notFound(res);

  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return notFound(res);
    logger.info("Product deleted", {
      productId: product._id.toString(),
      userId: req.user._id.toString(),
    });
    return res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    return next(error);
  }
};
