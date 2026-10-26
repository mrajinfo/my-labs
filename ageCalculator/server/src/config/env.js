import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(serverRoot, '.env'), quiet: true });

function readTimeZone(value) {
  const zone = value?.trim() || 'Asia/Kathmandu';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return zone;
  } catch {
    throw new Error(`APP_TIME_ZONE "${zone}" is not a valid IANA time zone (e.g. Asia/Kathmandu)`);
  }
}

function readList(value) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5050,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nepali_age_calculator',
  /** Extra origins allowed to call the API (only needed when the client is hosted elsewhere). */
  clientOrigins: readList(process.env.CLIENT_ORIGIN),
  /** The server's notion of "today" for ages it returns. Browsers use their own local day. */
  timeZone: readTimeZone(process.env.APP_TIME_ZONE),
  /** Serve client/dist from this server when it exists (single-service production deploys). */
  serveClient: process.env.SERVE_CLIENT !== 'false',
  serverRoot,
});
