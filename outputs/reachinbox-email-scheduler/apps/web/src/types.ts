export type EmailStatus = 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED';

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export type EmailDelivery = {
  id: string;
  recipient: string;
  senderAddress: string;
  subject: string;
  scheduledFor: string;
  sentAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  status: EmailStatus;
};

export type SchedulerSettings = {
  senders: string[];
  policy: {
    minDelaySeconds: number;
    maxDelaySeconds: number;
    globalHourlyLimit: number;
    maxCampaignHourlyLimit: number;
  };
};

export type ScheduleRequest = {
  recipients: string[];
  subject: string;
  body: string;
  startAt: string;
  delaySeconds: number;
  hourlyLimit: number;
  senderAddress: string;
  idempotencyKey: string;
};
