import fs from 'node:fs';
import path from 'node:path';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { todayDayNumber } from '@umer/shared';
import { isDatabaseReady } from './config/db.js';
import { env } from './config/env.js';
import { describeDay } from './lib/serializeMember.js';
import { apiNotFound, errorHandler, requireDatabase } from './middleware/errors.js';
import { membersRouter } from './routes/members.routes.js';

const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function corsOrigin(origin, callback) {
  // Same-origin requests and tools like curl send no Origin header.
  if (!origin) return callback(null, true);
  const allowed =
    env.clientOrigins.includes(origin) || (!env.isProduction && LOCALHOST_ORIGIN.test(origin));
  callback(null, allowed);
}

/** Serve the built React app (client/dist) with long-lived caching for hashed assets. */
function serveClient(app) {
  const dist = path.resolve(env.serverRoot, '../client/dist');
  const indexHtml = path.join(dist, 'index.html');
  if (!fs.existsSync(indexHtml)) return false;

  app.use(
    express.static(dist, {
      index: false,
      setHeaders(res, filePath) {
        const hashed = filePath.includes(`${path.sep}assets${path.sep}`);
        res.setHeader('Cache-Control', hashed ? 'public, max-age=31536000, immutable' : 'no-cache');
      },
    }),
  );
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexHtml);
  });
  return true;
}

export function createApp({ logRequests = env.nodeEnv !== 'test' } = {}) {
  const app = express();

  app.use(
    helmet({
      // Keep plain-HTTP LAN testing (e.g. http://192.168.x.x:5050 on a phone) working.
      contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } },
    }),
  );
  app.use(cors({ origin: corsOrigin }));
  app.use(compression());
  app.use(express.json({ limit: '10kb' }));
  if (logRequests) app.use(morgan(env.isProduction ? 'tiny' : 'dev'));

  app.use(
    '/api',
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: 'draft-8', legacyHeaders: false }),
  );

  app.get('/api/health', (req, res) => {
    const database = isDatabaseReady() ? 'connected' : 'disconnected';
    res.status(database === 'connected' ? 200 : 503).json({
      status: database === 'connected' ? 'ok' : 'degraded',
      database,
      today: describeDay(todayDayNumber(env.timeZone), env.timeZone),
    });
  });
  app.use('/api/members', requireDatabase, membersRouter);
  app.use('/api', apiNotFound);

  if (env.serveClient) serveClient(app);

  app.use(errorHandler);
  return app;
}
