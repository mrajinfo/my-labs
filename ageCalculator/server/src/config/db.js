import { setTimeout as delay } from 'node:timers/promises';
import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

/** Hide credentials before printing a connection string. */
export function redactUri(uri) {
  return uri.replace(/\/\/([^@/]+)@/, '//***@');
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}

/**
 * Connect to MongoDB, retrying until it is reachable. The HTTP server starts
 * straight away and answers 503 for data routes until this resolves, so a
 * database that starts late (or restarts) doesn't take the whole API down.
 */
export async function connectDatabase(uri, { retryDelayMs = 5000, logger = console, signal } = {}) {
  let warned = false;
  while (!signal?.aborted) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      logger.info(`MongoDB connected: ${redactUri(uri)}`);
      return mongoose.connection;
    } catch (error) {
      if (!warned) {
        logger.warn(
          `MongoDB is not reachable at ${redactUri(uri)} (${error.message}).\n` +
            `  Start MongoDB or set MONGODB_URI in server/.env — retrying every ${retryDelayMs / 1000}s…`,
        );
        warned = true;
      }
      await delay(retryDelayMs, undefined, { signal }).catch(() => {});
    }
  }
  return null;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
