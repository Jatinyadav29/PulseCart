import mongoose from "mongoose";
import { config } from "./env.js";

export const connectDatabase = async () => {
  await mongoose.connect(config.databaseUrl);
  console.log("Database connected");
};

export const disconnectDatabase = () => mongoose.disconnect();
