import { Queue } from 'bullmq';
import { redisConnection } from './connection.js';

export type SendEmailJob = { deliveryId: string };

export const EMAIL_QUEUE = 'email-send';

export const emailQueue = new Queue<SendEmailJob>(EMAIL_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 1000,
    removeOnFail: 1000
  }
});
