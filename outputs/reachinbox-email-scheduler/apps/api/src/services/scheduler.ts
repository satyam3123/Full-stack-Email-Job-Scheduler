import { EmailStatus, Prisma } from '@prisma/client';
import { env } from '../config.js';
import { prisma } from '../db.js';
import { emailQueue } from '../queue/email-queue.js';

export type ScheduleInput = {
  recipients: string[];
  subject: string;
  body: string;
  startAt: Date;
  delaySeconds: number;
  hourlyLimit: number;
  senderAddress?: string;
  idempotencyKey: string;
};

export async function createCampaign(userId: string, input: ScheduleInput) {
  const recipients = [...new Set(input.recipients.map((recipient) => recipient.trim().toLowerCase()))];
  const senderAddress = input.senderAddress ?? env.senderAddresses[0];
  const delayMs = Math.max(env.MIN_SEND_DELAY_MS, input.delaySeconds * 1000);
  const hourlyLimit = Math.min(input.hourlyLimit, env.MAX_CAMPAIGN_HOURLY_LIMIT);
  // A campaign's own pace must satisfy both controls; the queue-wide limiter below
  // remains the final distributed safeguard when campaigns overlap.
  const campaignSpacingMs = Math.max(delayMs, Math.ceil((60 * 60 * 1000) / hourlyLimit));

  try {
    const campaign = await prisma.$transaction(async (tx) => {
      const created = await tx.campaign.create({
        data: {
          userId,
          subject: input.subject,
          body: input.body,
          senderAddress,
          startAt: input.startAt,
          delayMs,
          hourlyLimit,
          idempotencyKey: input.idempotencyKey
        }
      });

      const deliveries = await Promise.all(recipients.map((recipient, index) => tx.emailDelivery.create({
        data: {
          campaignId: created.id,
          recipient,
          subject: input.subject,
          body: input.body,
          senderAddress,
          scheduledFor: new Date(input.startAt.getTime() + index * campaignSpacingMs)
        }
      })));

      await tx.queueOutbox.createMany({ data: deliveries.map((delivery) => ({ deliveryId: delivery.id })) });
      return { ...created, scheduledCount: deliveries.length };
    });

    // The outbox is durable before we touch Redis, so a crash cannot lose a request.
    await dispatchUndispatched();
    return campaign;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.campaign.findFirst({
        where: { idempotencyKey: input.idempotencyKey, userId },
        include: { _count: { select: { deliveries: true } } }
      });
      if (existing) return { ...existing, scheduledCount: existing._count.deliveries };
    }
    throw error;
  }
}

/** Dispatches only durable outbox rows. Called after creation and at process boot; never on a cron. */
export async function dispatchUndispatched(): Promise<number> {
  const rows = await prisma.queueOutbox.findMany({
    where: { dispatchedAt: null },
    include: { delivery: true },
    orderBy: { createdAt: 'asc' },
    take: 500
  });

  let dispatched = 0;
  for (const row of rows) {
    if (row.delivery.status !== EmailStatus.SCHEDULED) continue;
    const delay = Math.max(0, row.delivery.scheduledFor.getTime() - Date.now());
    try {
      await emailQueue.add('send-email', { deliveryId: row.deliveryId }, {
        jobId: `delivery-${row.deliveryId}`,
        delay
      });
      await prisma.queueOutbox.update({ where: { id: row.id }, data: { dispatchedAt: new Date() } });
      dispatched += 1;
    } catch (error) {
      // A competing instance may have added the deterministic job first. Leave the outbox row
      // for the next boot instead of risking an untracked delivery.
      console.error('Could not dispatch outbox row', row.id, error);
    }
  }
  return dispatched;
}

export async function markStaleInFlightAsFailed(): Promise<void> {
  const staleAt = new Date(Date.now() - 15 * 60 * 1000);
  await prisma.emailDelivery.updateMany({
    where: { status: EmailStatus.SENDING, updatedAt: { lt: staleAt } },
    data: {
      status: EmailStatus.FAILED,
      failedAt: new Date(),
      failureReason: 'Worker stopped while handing the email to SMTP; held to avoid duplicate sending.'
    }
  });
}
