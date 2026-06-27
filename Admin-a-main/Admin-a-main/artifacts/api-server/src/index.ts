import app from "./app";
import { logger } from "./lib/logger";
import { connectDB } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});

connectDB()
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((err) => {
    logger.error({ err }, "Failed to connect to MongoDB — check MONGODB_URI");
  });
