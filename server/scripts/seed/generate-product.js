import crypto from "node:crypto";
import { catalog, vocabulary } from "./product-catalog.js";

const hashSeed = (seed) => {
  const digest = crypto.createHash("sha256").update(seed).digest();
  return digest.readUInt32LE(0);
};

const random = (seed, index, salt) => {
  let value = (hashSeed(seed) + index * 1664525 + salt * 1013904223) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 2246822507) >>> 0;
  value ^= value >>> 13;
  return (value >>> 0) / 4294967296;
};

const pick = (items, seed, index, salt) =>
  items[Math.floor(random(seed, index, salt) * items.length)];

const tokenAt = (items, index, base, offset) => {
  let value = Math.floor(index / offset);
  return items[value % base];
};

const roundCurrency = (value) => Math.round(value * 100) / 100;

const ratingFor = (seed, index, reviewCount) => {
  if (reviewCount === 0) return null;
  const raw = 3.2 + random(seed, index, 11) * 1.8;
  return Math.min(5, Math.round(raw * 10) / 10);
};

export const createProduct = (index, seed) => {
  const category = catalog[Math.floor(random(seed, index, 1) * catalog.length)];
  const [minimumPrice, maximumPrice] = category.priceRange;
  const price = roundCurrency(
    minimumPrice + random(seed, index, 2) * (maximumPrice - minimumPrice),
  );
  const discountPercentage = Math.floor(random(seed, index, 3) * 36);
  const discountedPrice = roundCurrency(price * (1 - discountPercentage / 100));
  const reviewCount = Math.floor(random(seed, index, 4) * 5000);
  const stockQuantity = Math.floor(random(seed, index, 5) * 500);
  const variant = tokenAt(
    vocabulary.variants,
    index,
    vocabulary.variants.length,
    category.brands.length *
      vocabulary.descriptors.length *
      category.families.length *
      vocabulary.materials.length *
      vocabulary.finishes.length,
  );
  const name = [
    category.category,
    tokenAt(category.brands, index, category.brands.length, 1),
    tokenAt(
      vocabulary.descriptors,
      index,
      vocabulary.descriptors.length,
      category.brands.length,
    ),
    tokenAt(
      category.families,
      index,
      category.families.length,
      category.brands.length * vocabulary.descriptors.length,
    ),
    tokenAt(
      vocabulary.materials,
      index,
      vocabulary.materials.length,
      category.brands.length *
        vocabulary.descriptors.length *
        category.families.length,
    ),
    tokenAt(
      vocabulary.finishes,
      index,
      vocabulary.finishes.length,
      category.brands.length *
        vocabulary.descriptors.length *
        category.families.length *
        vocabulary.materials.length,
    ),
    tokenAt(
      vocabulary.variants,
      index,
      vocabulary.variants.length,
      category.brands.length *
        vocabulary.descriptors.length *
        category.families.length *
        vocabulary.materials.length *
        vocabulary.finishes.length,
    ),
  ].join(" ");
  const tags = [
    category.category,
    category.subcategories[index % category.subcategories.length]
      .toLowerCase()
      .replaceAll(" ", "-"),
    variant.toLowerCase(),
  ];
  const attributes = Object.fromEntries(
    category.attributeNames.map((name, attributeIndex) => [
      name,
      `${pick(vocabulary.materials, seed, index, 20 + attributeIndex)} ${pick(vocabulary.finishes, seed, index, 30 + attributeIndex)}`,
    ]),
  );
  const availability =
    stockQuantity === 0
      ? "out_of_stock"
      : stockQuantity < 25
        ? "low_stock"
        : "in_stock";

  return {
    name,
    sku: `PC-${index.toString(36).padStart(8, "0")}`,
    brand: tokenAt(category.brands, index, category.brands.length, 1),
    category: category.category,
    subcategory: category.subcategories[index % category.subcategories.length],
    description: `${name} is designed for dependable ${category.subcategories[index % category.subcategories.length].toLowerCase()} use, with a ${pick(vocabulary.finishes, seed, index, 40).toLowerCase()} finish and a practical ${variant.toLowerCase()} profile.`,
    price,
    discountPercentage,
    discountedPrice,
    imageUrls: [
      `https://images.example.com/products/${index.toString(36)}-1.webp`,
    ],
    averageRating: ratingFor(seed, index, reviewCount),
    ratingCount: reviewCount,
    reviewCount,
    stockQuantity,
    availability,
    tags,
    attributes,
    popularityScore:
      Math.round(
        (reviewCount * 0.6 +
          stockQuantity * 0.2 +
          random(seed, index, 50) * 1000) *
          100,
      ) / 100,
    salesCount: Math.floor(random(seed, index, 51) * 50000),
    createdAt: new Date(
      Date.UTC(2022 + (index % 4), index % 12, (index % 27) + 1),
    ),
    updatedAt: new Date(Date.UTC(2025, index % 12, (index % 27) + 1)),
  };
};

export const createSample = (count, seed) =>
  Array.from({ length: count }, (_, index) => createProduct(index, seed));
