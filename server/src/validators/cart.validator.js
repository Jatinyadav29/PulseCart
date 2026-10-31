import mongoose from "mongoose";
import { z } from "zod";

const objectId = z.string().refine(mongoose.isValidObjectId, {
  message: "Must be a valid object ID",
});

const quantity = z.coerce.number().int().min(1);

export const cartItemSchema = z.object({
  product: objectId,
  quantity,
});

export const cartCreateSchema = z.object({
  items: z.array(cartItemSchema).min(1),
});

export const cartUpdateSchema = z.object({
  items: z.array(cartItemSchema).min(1),
});

export const cartItemCreateSchema = cartItemSchema;

export const cartItemUpdateSchema = z.object({
  quantity,
});
