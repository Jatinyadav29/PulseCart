import mongoose from "mongoose";
import {
  connectDatabase,
  disconnectDatabase,
} from "../../src/config/database.js";
import { config } from "../../src/config/env.js";
import { Product } from "../../src/models/product.model.js";
import { createSample, createProduct } from "./generate-product.js";
import { seedConfig } from "./seed-config.js";

const databaseDetails = () => {
  const parsed = new URL(config.databaseUrl);
  return {
    databaseName: parsed.pathname.replace(/^\/+/, ""),
    hostname: parsed.hostname,
  };
};

const assertSafeTarget = () => {
  const { databaseName, hostname } = databaseDetails();
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

  if (databaseName !== seedConfig.databaseName) {
    throw new Error(
      `Refusing to seed database "${databaseName}". Expected "${seedConfig.databaseName}".`,
    );
  }
  if (config.nodeEnv === "production") {
    throw new Error("Refusing to seed while NODE_ENV=production.");
  }
  if (!localHosts.has(hostname) && !seedConfig.allowNonLocal) {
    throw new Error(
      `Refusing non-local database host "${hostname}". Add --allow-nonlocal explicitly.`,
    );
  }
  if (seedConfig.count >= 10_000_000 && !seedConfig.confirmed) {
    throw new Error("The 10-million-product run requires --confirm.");
  }
};

const validateSample = async (sample) => {
  const skus = new Set();
  const names = new Set();
  const descriptions = new Set();

  for (const product of sample) {
    await Product.validate(product);
    skus.add(product.sku);
    names.add(product.name);
    descriptions.add(product.description);
    if (
      product.discountedPrice > product.price ||
      (product.averageRating !== null &&
        (product.averageRating < 1 || product.averageRating > 5))
    ) {
      throw new Error(
        `Generated product failed consistency checks: ${product.sku}`,
      );
    }
  }

  if (
    skus.size !== sample.length ||
    names.size !== sample.length ||
    descriptions.size < Math.min(sample.length, 50)
  ) {
    throw new Error("Generated sample failed uniqueness or diversity checks.");
  }
};

const formatMemory = () => {
  const { heapUsed, rss } = process.memoryUsage();
  return `heap ${(heapUsed / 1024 / 1024).toFixed(0)}MB, rss ${(rss / 1024 / 1024).toFixed(0)}MB`;
};

const printProgress = (inserted, startedAt, generationMs, insertionMs) => {
  const elapsedSeconds = (Date.now() - startedAt) / 1000;
  const rate = inserted / Math.max(elapsedSeconds, 0.001);
  const remaining = Math.max(seedConfig.count - inserted, 0);
  const etaSeconds = remaining / Math.max(rate, 0.001);
  console.log(
    `Inserted ${inserted.toLocaleString()} / ${seedConfig.count.toLocaleString()} ` +
      `(${rate.toFixed(0)} docs/sec, ETA ${Math.ceil(etaSeconds)}s; ` +
      `generation ${(generationMs / 1000).toFixed(1)}s, insertion ${(insertionMs / 1000).toFixed(1)}s; ` +
      `${formatMemory()})`,
  );
};

const run = async () => {
  assertSafeTarget();
  const sample = createSample(Math.min(100, seedConfig.count), seedConfig.seed);
  await validateSample(sample);

  if (seedConfig.dryRun) {
    console.log(
      `Dry run passed for ${sample.length} products using seed "${seedConfig.seed}".`,
    );
    console.log(JSON.stringify(sample[0], null, 2));
    return;
  }

  await connectDatabase();
  const startedAt = Date.now();
  let generationMs = 0;
  let insertionMs = 0;
  let totalBatchMs = 0;
  let batchCount = 0;
  let failedBatches = 0;
  let lastProgressAt = startedAt;
  let generated = 0;
  let inserted = 0;
  try {
    for (
      let offset = 0;
      offset < seedConfig.count;
      offset += seedConfig.batchSize
    ) {
      const size = Math.min(seedConfig.batchSize, seedConfig.count - offset);
      const generationStartedAt = Date.now();
      const batch = Array.from({ length: size }, (_, position) =>
        createProduct(
          seedConfig.startIndex + offset + position,
          seedConfig.seed,
        ),
      );
      generated += size;
      generationMs += Date.now() - generationStartedAt;
      const insertionStartedAt = Date.now();
      try {
        await Product.insertMany(batch, { ordered: true });
      } catch (error) {
        failedBatches += 1;
        console.error(
          `Batch failed at offset ${offset} (${size} documents): ${error.message}`,
        );
        throw error;
      } finally {
        const batchMs = Date.now() - insertionStartedAt;
        batchCount += 1;
        insertionMs += batchMs;
        totalBatchMs += batchMs;
      }
      inserted += size;
      if (
        inserted === seedConfig.count ||
        Date.now() - lastProgressAt >= 5000
      ) {
        printProgress(inserted, startedAt, generationMs, insertionMs);
        lastProgressAt = Date.now();
      }
    }
  } finally {
    const totalMs = Date.now() - startedAt;
    const averageBatchMs =
      batchCount === 0 ? 0 : totalBatchMs / batchCount;
    console.log(
      `Seed metrics: generated ${generated.toLocaleString()}, ` +
        `inserted ${inserted.toLocaleString()}, generation ${(generationMs / 1000).toFixed(2)}s, ` +
        `database insertion ${(insertionMs / 1000).toFixed(2)}s, ` +
        `total elapsed ${(totalMs / 1000).toFixed(2)}s, ` +
        `throughput ${(inserted / Math.max(totalMs / 1000, 0.001)).toFixed(0)} docs/sec, ` +
        `average batch insertion ${(averageBatchMs / 1000).toFixed(2)}s, ` +
        `failed batches ${failedBatches}, ${formatMemory()}`,
    );
    await disconnectDatabase();
  }
};

run().catch(async (error) => {
  console.error(error.message);
  if (mongoose.connection.readyState !== 0) await disconnectDatabase();
  process.exitCode = 1;
});
