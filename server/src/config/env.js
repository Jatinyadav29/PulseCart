import dotenv from "dotenv";

dotenv.config();

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const config = {
  port: Number.parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl:
    process.env.DATABASE_URL ??
    process.env.MONGO_URI ??
    required("MONGODB_URI"),
  accessTokenSecret: required("ACCESS_TOKEN_SECRET"),
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY ?? "15m",
  refreshTokenSecret: required("REFRESH_TOKEN_SECRET"),
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY ?? "7d",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
  logLevel: process.env.LOG_LEVEL ?? "info",
  refreshCookieName: "refreshToken",
};
