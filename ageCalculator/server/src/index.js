import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';

const app = createApp();
const shutdown = new AbortController();

const server = app.listen(env.port, () => {
  console.info(`API listening on http://localhost:${env.port}  (today is measured in ${env.timeZone})`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${env.port} is already in use. Set PORT in server/.env to a free port.`);
    process.exit(1);
  }
  throw error;
});

connectDatabase(env.mongoUri, { signal: shutdown.signal });

async function stop(signal) {
  console.info(`\n${signal} received — shutting down`);
  shutdown.abort();
  server.close();
  await disconnectDatabase().catch(() => {});
  process.exit(0);
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
