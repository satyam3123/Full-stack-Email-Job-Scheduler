import { EmailStatus } from '@prisma/client';
import { Worker } from 'bullmq';
import { env } from '../config.js';
import { prisma } from '../db.js';
import { sendWithEthereal } from '../services/mailer.js';
import { waitForGlobalSendSlot } from '../services/rate-gate.js';
import { EMAIL_QUEUE, SendEmailJob } from './email-queue.js';
import { redisConnection } from './connection.js';

export function startEmailWorker() {
  let worker: Worker<SendEmailJob>;
  worker = new Worker<SendEmailJob>(EMAIL_QUEUE, async (job) => {
    // This distributed gate handles the configurable minimum inter-email delay.
    const waitMs = await waitForGlobalSendSlot(env.MIN_SEND_DELAY_MS);
    if (waitMs > 0) {
      await worker.rateLimit(waitMs);
      throw Worker.RateLimitError();
    }

    const claimed = await prisma.emailDelivery.updateMany({
      where: { id: job.data.deliveryId, status: EmailStatus.SCHEDULED },
      data: { status: EmailStatus.SENDING }
    });
    if (claimed.count !== 1) return; // idempotent job replay or an already-final record

    const delivery = await prisma.emailDelivery.findUniqueOrThrow({ where: { id: job.data.deliveryId } });
    try {
      const result = await sendWithEthereal({
        deliveryId: delivery.id,
        to: delivery.recipient,
        from: delivery.senderAddress,
        subject: delivery.subject,
        body: delivery.body
      });
      await prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: { status: EmailStatus.SENT, sentAt: new Date(), messageId: result.messageId }
      });
    } catch (error) {
      await prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: {
          status: EmailStatus.FAILED,
          failedAt: new Date(),
          failureReason: error instanceof Error ? error.message : 'Unknown SMTP failure'
        }
      });
      throw error;
    }
  }, {
    connection: redisConnection,
    concurrency: env.WORKER_CONCURRENCY,
    // BullMQ persists this limiter in Redis, so it is global across all worker instances.
    limiter: { max: env.MAX_EMAILS_PER_HOUR, duration: 60 * 60 * 1000 }
  });

  worker.on('failed', (job, error) => console.error(`Email job ${job?.id} failed:`, error.message));
  worker.on('error', (error) => console.error('Email worker error:', error));
  return worker;
}
