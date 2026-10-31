import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  connectDatabase,
  disconnectDatabase,
} from "../../src/config/database.js";
import { config } from "../../src/config/env.js";
import { User } from "../../src/models/user.model.js";
import { createUser, createUserSample } from "./generate-user.js";

const args = process.argv.slice(2);

const valueAfter = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};

const positiveInteger = (value, fallback, name) => {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
};

const databaseDetails = () => {
  const parsed = new URL(config.databaseUrl);
  return {
    databaseName: parsed.pathname.replace(/^\/+/, ""),
    hostname: parsed.hostname,
  };
};

const count = positiveInteger(valueAfter("--count"), 1000, "--count");
const batchSize = positiveInteger(
  valueAfter("--batch-size"),
  500,
  "--batch-size",
);
const seedPassword = valueAfter("--password") ?? "PulseCartSeed2026!";
const emailDomain =
  valueAfter("--email-domain") ?? "seed.pulsecart.local";
const allowNonLocal = args.includes("--allow-nonlocal");
const dryRun = args.includes("--dry-run");

const assertSafeTarget = () => {
  const { databaseName, hostname } = databaseDetails();
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

  if (databaseName !== "PulseCart") {
    throw new Error(
      `Refusing to seed database "${databaseName}". Expected "PulseCart".`,
    );
  }
  if (config.nodeEnv === "production") {
    throw new Error("Refusing to seed while NODE_ENV=production.");
  }
  if (!localHosts.has(hostname) && !allowNonLocal) {
    throw new Error(
      `Refusing non-local database host "${hostname}". Add --allow-nonlocal explicitly.`,
    );
  }
};

const validateSample = async (sample, passwordHash) => {
  const usernames = new Set();
  const emails = new Set();

  for (const user of sample) {
    await User.validate({ ...user, passwordHash });
    usernames.add(user.username);
    emails.add(user.email);
  }

  if (
    usernames.size !== sample.length ||
    emails.size !== sample.length ||
    sample.some(({ username, email }) => username.length < 3 || !email.includes("@"))
  ) {
    throw new Error("Generated user sample failed uniqueness or validity checks.");
  }
};

const formatMemory = () => {
  const { heapUsed, rss } = process.memoryUsage();
  return `heap ${(heapUsed / 1024 / 1024).toFixed(0)}MB, rss ${(rss / 1024 / 1024).toFixed(0)}MB`;
};

const run = async () => {
  assertSafeTarget();
  const passwordHash = await bcrypt.hash(seedPassword, 12);
  const sample = createUserSample(Math.min(100, count), emailDomain);
  await validateSample(sample, passwordHash);

  if (dryRun) {
    console.log(
      `Dry run passed for ${sample.length} users. Seed password: "${seedPassword}".`,
    );
    console.log(JSON.stringify({ ...sample[0], passwordHash }, null, 2));
    return;
  }

  await connectDatabase();
  const startedAt = Date.now();
  let inserted = 0;
  let failedBatches = 0;
  try {
    for (let offset = 0; offset < count; offset += batchSize) {
      const size = Math.min(batchSize, count - offset);
      const batch = Array.from({ length: size }, (_, position) => ({
        ...createUser(offset + position, emailDomain),
        passwordHash,
      }));

      try {
        await User.insertMany(batch, { ordered: true });
      } catch (error) {
        failedBatches += 1;
        console.error(
          `User batch failed at offset ${offset} (${size} documents): ${error.message}`,
        );
        throw error;
      }

      inserted += size;
      console.log(
        `Inserted ${inserted.toLocaleString()} / ${count.toLocaleString()} users ` +
          `(${formatMemory()})`,
      );
    }
  } finally {
    const elapsedSeconds = Math.max((Date.now() - startedAt) / 1000, 0.001);
    console.log(
      `User seed metrics: generated ${count.toLocaleString()}, ` +
        `inserted ${inserted.toLocaleString()}, elapsed ${elapsedSeconds.toFixed(2)}s, ` +
        `throughput ${(inserted / elapsedSeconds).toFixed(0)} users/sec, ` +
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
