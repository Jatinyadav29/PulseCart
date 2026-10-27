const valueAfter = (args, name) => {
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

const nonNegativeInteger = (value, fallback, name) => {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return parsed;
};

const args = process.argv.slice(2);
const count = positiveInteger(valueAfter(args, "--count"), 1000, "--count");
const batchSize = positiveInteger(
  valueAfter(args, "--batch-size"),
  2000,
  "--batch-size",
);
const startIndex = nonNegativeInteger(
  valueAfter(args, "--start-index"),
  0,
  "--start-index",
);
const seed =
  valueAfter(args, "--seed") ?? process.env.SEED ?? "pulsecart-products-v1";
const databaseName =
  valueAfter(args, "--database-name") ??
  process.env.SEED_DATABASE_NAME ??
  "PulseCart";

export const seedConfig = {
  count,
  batchSize,
  startIndex,
  seed,
  databaseName,
  dryRun: args.includes("--dry-run"),
  confirmed: args.includes("--confirm"),
  allowNonLocal: args.includes("--allow-nonlocal"),
};
