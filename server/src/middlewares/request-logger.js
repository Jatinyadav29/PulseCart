import morgan from "morgan";
import logger from "../config/logger.js";

const requestLogger = morgan("dev", {
  stream: {
    write: (message) => {
      const cleanMessage = message.replace(/\u001b\[[0-9;]*m/g, "").trim();
      logger.info(cleanMessage, { type: "http" });
    },
  },
});

export default requestLogger;
