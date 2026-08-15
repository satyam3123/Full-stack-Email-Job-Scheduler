import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  SESSION_SECRET: z.string().min(24),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url().default('http://localhost:4000/auth/google/callback'),
  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SENDER_ADDRESSES: z.string().min(1),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(100).default(5),
  MIN_SEND_DELAY_MS: z.coerce.number().int().min(100).default(2000),
  MAX_EMAILS_PER_HOUR: z.coerce.number().int().min(1).default(200),
  MAX_CAMPAIGN_DELAY_MS: z.coerce.number().int().min(1000).default(60000),
  MAX_CAMPAIGN_HOURLY_LIMIT: z.coerce.number().int().min(1).default(1000)
});

const parsed = schema.parse(process.env);

export const env = {
  ...parsed,
  senderAddresses: parsed.SENDER_ADDRESSES.split(',').map((address) => address.trim()).filter(Boolean)
};
