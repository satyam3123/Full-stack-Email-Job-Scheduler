import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config.js';
import { requireAuth } from '../middleware/require-auth.js';
import { createCampaign } from '../services/scheduler.js';

export const scheduleRouter = Router();
scheduleRouter.use(requireAuth);

const scheduleSchema = z.object({
  recipients: z.array(z.string().trim().email()).min(1).max(10_000),
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(100_000),
  startAt: z.coerce.date().refine((date) => date.getTime() >= Date.now() - 5_000, 'Start time must be now or in the future.'),
  delaySeconds: z.coerce.number().int().min(1).max(Math.floor(env.MAX_CAMPAIGN_DELAY_MS / 1000)),
  hourlyLimit: z.coerce.number().int().min(1).max(env.MAX_CAMPAIGN_HOURLY_LIMIT),
  senderAddress: z.string().optional(),
  idempotencyKey: z.string().uuid()
}).superRefine((data, context) => {
  if (data.senderAddress && !env.senderAddresses.includes(data.senderAddress)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Unknown sender address.', path: ['senderAddress'] });
  }
});

scheduleRouter.post('/', async (req, res, next) => {
  try {
    const input = scheduleSchema.parse(req.body);
    const campaign = await createCampaign((req.user as { id: string }).id, input);
    res.status(201).json({ campaign });
  } catch (error) { next(error); }
});
