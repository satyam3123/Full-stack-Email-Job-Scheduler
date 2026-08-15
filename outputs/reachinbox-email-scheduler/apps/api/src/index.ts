import { app } from './app.js';
import { env } from './config.js';
import { prisma } from './db.js';
import { redisConnection } from './queue/connection.js';
import { startEmailWorker } from './queue/worker.js';
import { dispatchUndispatched, markStaleInFlightAsFailed } from './services/scheduler.js';

async function bootstrap() {
  await prisma.$connect();
  await redisConnection.ping();
  await markStaleInFlightAsFailed();
  await dispatchUndispatched();
  const worker = startEmailWorker();
  const server = app.listen(env.PORT, () => console.log(`API and worker listening on http://localhost:${env.PORT}`));

  const shutdown = async () => {
    server.close();
    await worker.close();
    await prisma.$disconnect();
    await redisConnection.quit();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('Could not start service', error);
  process.exit(1);
});
