import app from "./app/app.js";
import { config } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import "./config/passport.js";
import logger from "./config/logger.js";

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(config.port, () => {
      logger.info("Server listening", { port: config.port });
    });
  } catch (error) {
    logger.error("Unable to start server", {
      error: error.stack ?? error.message,
    });
    process.exitCode = 1;
  }
};

startServer();
