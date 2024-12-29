import { Queue } from 'bullmq';

const {
  redis: { host, port },
} = useRuntimeConfig();

export const clickRecordQueue = new Queue('clickRecordQueue', {
  connection: {
    host,
    port: Number(port),
  },
});

export const shareScrollQueue = new Queue('shareScrollQueue', {
  connection: {
    host,
    port: Number(port),
  },
});

export const blockedApiQueue = new Queue('blockedApiQueue', {
  connection: {
    host,
    port: Number(port),
  },
});
