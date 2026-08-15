import { EmailStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config.js';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/require-auth.js';

export const emailsRouter = Router();
emailsRouter.use(requireAuth);

const querySchema = z.object({ status: z.enum(['scheduled', 'sent']).default('scheduled') });

emailsRouter.get('/', async (req, res, next) => {
  try {
    const { status } = querySchema.parse(req.query);
    const userId = (req.user as { id: string }).id;
    const records = await prisma.emailDelivery.findMany({
      where: {
        campaign: { userId },
        status: status === 'scheduled' ? { in: [EmailStatus.SCHEDULED, EmailStatus.SENDING] } : { in: [EmailStatus.SENT, EmailStatus.FAILED] }
      },
      orderBy: status === 'scheduled' ? { scheduledFor: 'asc' } : { sentAt: 'desc' },
      take: 200,
      select: {
        id: true, recipient: true, subject: true, scheduledFor: true, status: true,
        sentAt: true, failedAt: true, failureReason: true, senderAddress: true
      }
    });
    res.json({ emails: records });
  } catch (error) { next(error); }
});

emailsRouter.get('/settings', (_req, res) => {
  res.json({
    senders: env.senderAddresses,
    policy: {
      minDelaySeconds: Math.ceil(env.MIN_SEND_DELAY_MS / 1000),
      maxDelaySeconds: Math.floor(env.MAX_CAMPAIGN_DELAY_MS / 1000),
      globalHourlyLimit: env.MAX_EMAILS_PER_HOUR,
      maxCampaignHourlyLimit: env.MAX_CAMPAIGN_HOURLY_LIMIT
    }
  });
});
