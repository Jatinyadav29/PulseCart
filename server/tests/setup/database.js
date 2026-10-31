import mongoose from "mongoose";

const testDatabasePattern = /test/i;

const assertTestDatabase = () => {
  const databaseUrl = process.env.MONGODB_TEST_URI;
  if (!databaseUrl) {
    throw new Error("MONGODB_TEST_URI is required for integration tests");
  }

  let databaseName;
  try {
    databaseName = new URL(databaseUrl).pathname.replace(/^\/+/, "");
  } catch {
    throw new Error("MONGODB_TEST_URI must be a valid MongoDB connection URI");
  }

  if (!databaseName || !testDatabasePattern.test(databaseName)) {
    throw new Error(
      "Refusing to run integration tests: MONGODB_TEST_URI database name must contain 'test'",
    );
  }
};

export const connectTestDatabase = async () => {
  assertTestDatabase();
  await mongoose.connect(process.env.MONGODB_TEST_URI);
};

export const clearTestDatabase = async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(
    collections.map((collection) => collection.deleteMany({})),
  );
};

export const disconnectTestDatabase = async () => {
  await mongoose.disconnect();
};
