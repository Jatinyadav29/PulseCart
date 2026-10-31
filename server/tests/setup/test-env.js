import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const requiredTestVariables = [
  "MONGODB_TEST_URI",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
];

const missingVariables = requiredTestVariables.filter(
  (name) => !process.env[name],
);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing test environment variables: ${missingVariables.join(", ")}. ` +
      "Copy .env.test.example to .env.test and provide test-only values.",
  );
}

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI;
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? "silent";
