import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import winston from "winston";
import { config } from "./env.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const logDirectory = path.resolve(currentDirectory, "../../logs");

fs.mkdirSync(logDirectory, { recursive: true });

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({
      filename: path.join(logDirectory, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logDirectory, "combined.log"),
    }),
  ],
});

export default logger;
