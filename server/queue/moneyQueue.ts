import { Queue } from 'bullmq';

export const moneyQueue = new Queue('moneyQueue', {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});
