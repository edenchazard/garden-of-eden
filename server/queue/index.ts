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
