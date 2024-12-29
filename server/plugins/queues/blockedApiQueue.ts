import { Worker as BullWorker } from 'bullmq';

const {
  redis: { host, port },
  clientSecret,
} = useRuntimeConfig();

export default defineNitroPlugin(async () => {
  new BullWorker<{ userId: number }>(
    'blockedApiQueue',
    async (job) => {
      await $fetch('/api/checks/blocked', {
        query: {
          userId: job.data.userId,
          clientSecret,
        },
      });
    },
    {
      connection: {
        host,
        port: Number(port),
      },
      concurrency: 10,
    }
  );

  console.info('API block check worker started');
});
