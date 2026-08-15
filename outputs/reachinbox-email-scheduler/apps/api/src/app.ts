import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';
import { authRouter } from './routes/auth.js';
import { emailsRouter } from './routes/emails.js';
import { scheduleRouter } from './routes/schedule.js';
import { env } from './config.js';
import { passport } from './auth.js';
import { redisConnection } from './queue/connection.js';

export const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(session({
  store: new RedisStore({ client: redisConnection, prefix: 'reachinbox:session:' }),
  name: 'reachinbox.sid',
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/schedule', scheduleRouter);

// The production container serves the compiled dashboard and API from one origin.
// This avoids fragile third-party session-cookie behavior during the OAuth return.
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const dashboardDirectory = resolve(currentDirectory, '../../web/dist');
if (env.NODE_ENV === 'production' && existsSync(dashboardDirectory)) {
  app.use(express.static(dashboardDirectory));
  app.get('/{*splat}', (req, res, next) => {
    if (!req.accepts('html')) return next();
    return res.sendFile(resolve(dashboardDirectory, 'index.html'));
  });
}

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) return res.status(400).json({ error: 'Invalid request.', details: error.flatten() });
  console.error(error);
  return res.status(500).json({ error: 'Something went wrong.' });
});
