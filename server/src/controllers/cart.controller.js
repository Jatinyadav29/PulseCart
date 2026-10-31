import mongoose from "mongoose";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

const availableStatuses = ["in_stock", "low_stock"];

const productNotFound = (res) =>
  res.status(404).json({ success: false, message: "Product not found" });

const invalidProductId = (id) => !mongoose.isValidObjectId(id);

const getAvailableProduct = async (productId, quantity) => {
  const product = await Product.findById(productId).lean();
  if (!product) return { error: "not_found" };
  if (
    !availableStatuses.includes(product.availability) ||
    product.stockQuantity < quantity
  ) {
    return { error: "unavailable", product };
  }
  return { product };
};

const insufficientStock = (res) =>
  res
    .status(409)
    .json({ success: false, message: "Insufficient stock quantity" });

const loadCart = (userId) =>
  Cart.findOne({ user: userId }).populate("items.product").lean();

const addItem = async (userId, productId, quantity, stockQuantity) => {
  const existingCart = await Cart.findOne(
    { user: userId },
    { items: { $elemMatch: { product: productId } } },
  ).lean();
  const existingItem = existingCart?.items[0];

  if (existingItem) {
    if (existingItem.quantity + quantity > stockQuantity) return null;
    const updatedCart = await Cart.findOneAndUpdate(
      {
        user: userId,
        items: {
          $elemMatch: {
            product: productId,
            quantity: { $lte: stockQuantity - quantity },
          },
        },
      },
      { $inc: { "items.$.quantity": quantity } },
      { new: true },
    );
    if (!updatedCart) return null;
    return updatedCart;
  }

  try {
    return await Cart.findOneAndUpdate(
      { user: userId, "items.product": { $ne: productId } },
      {
        $setOnInsert: { user: userId },
        $push: { items: { product: productId, quantity } },
      },
      { new: true, upsert: true, runValidators: true },
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;

    return Cart.findOneAndUpdate(
      {
        user: userId,
        items: {
          $elemMatch: {
            product: productId,
            quantity: { $lte: stockQuantity - quantity },
          },
        },
      },
      { $inc: { "items.$.quantity": quantity } },
      { new: true },
    );
  }
};

export const createCartController = async (req, res, next) => {
  try {
    const quantities = new Map();
    const stockQuantities = new Map();
    for (const item of req.body.items) {
      quantities.set(
        item.product,
        (quantities.get(item.product) ?? 0) + item.quantity,
      );
    }

    for (const [productId, quantity] of quantities) {
      if (invalidProductId(productId)) return productNotFound(res);
      const result = await getAvailableProduct(productId, quantity);
      if (result.error === "not_found") return productNotFound(res);
      if (result.error === "unavailable") return insufficientStock(res);
      stockQuantities.set(productId, result.product.stockQuantity);
    }

    for (const [productId, quantity] of quantities) {
      const cart = await addItem(
        req.user._id,
        productId,
        quantity,
        stockQuantities.get(productId),
      );
      if (!cart) return insufficientStock(res);
    }

    const cart = await loadCart(req.user._id);
    return res.status(200).json({ success: true, data: cart });
  } catch (error) {
    return next(error);
  }
};

export const getCartItemsController = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $setOnInsert: { user: req.user._id, items: [] } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
      .populate("items.product")
      .lean();

    return res.status(200).json({ success: true, data: cart });
  } catch (error) {
    return next(error);
  }
};

export const updateCartItemController = async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  if (invalidProductId(productId)) return productNotFound(res);

  try {
    const result = await getAvailableProduct(productId, quantity);
    if (result.error === "not_found") return productNotFound(res);
    if (result.error === "unavailable") return insufficientStock(res);

    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id, "items.product": productId },
      { $set: { "items.$.quantity": quantity } },
      { new: true, runValidators: true },
    )
      .populate("items.product")
      .lean();

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Product is not in the cart" });
    }
    return res.json({ success: true, data: cart });
  } catch (error) {
    return next(error);
  }
};

export const removeCartItemController = async (req, res, next) => {
  const { productId } = req.params;
  if (invalidProductId(productId)) return productNotFound(res);

  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id, "items.product": productId },
      { $pull: { items: { product: productId } } },
      { new: true },
    )
      .populate("items.product")
      .lean();

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Product is not in the cart" });
    }
    return res.json({ success: true, data: cart });
  } catch (error) {
    return next(error);
  }
};

export const clearCartController = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
      .populate("items.product")
      .lean();

    return res.json({ success: true, data: cart });
  } catch (error) {
    return next(error);
  }
};
