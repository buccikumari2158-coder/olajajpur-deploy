import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { initSocket } from "./socket";
import { connectDb } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

connectDb()
  .then(() => {
    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(port, () => {
      logger.info({ port }, "Server listening");
    });

    httpServer.on("error", (err) => {
      logger.error({ err }, "HTTP server error");
      process.exit(1);
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to connect to MongoDB — server not started");
    process.exit(1);
  });
