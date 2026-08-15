import nodemailer from 'nodemailer';
import { env } from '../config.js';

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
});

export async function sendWithEthereal(input: {
  deliveryId: string;
  to: string;
  from: string;
  subject: string;
  body: string;
}) {
  return transport.sendMail({
    to: input.to,
    from: input.from,
    subject: input.subject,
    text: input.body,
    html: input.body.replace(/\n/g, '<br />'),
    // Stable Message-ID helps SMTP infrastructure deduplicate any accidental retried handoff.
    messageId: `<${input.deliveryId}@reachinbox.local>`
  });
}
