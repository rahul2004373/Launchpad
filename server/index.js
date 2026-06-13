import "dotenv/config";
import "newrelic";

import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import logger from "./src/utils/logger.js";

const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || "development";

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION", err);
  logger.fatal("Uncaught exception — process will exit", {
    err: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION", reason);
  logger.fatal("Unhandled promise rejection — process will exit", {
    reason: reason?.message || String(reason),
    stack: reason?.stack,
  });
  process.exit(1);
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info("HTTP server listening", {
        port: PORT,
        environment: NODE_ENV,
        pid: process.pid,
      });
    });
  })
  .catch((err) => {
    logger.fatal("Database connection failed — process will exit", {
      err: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });
