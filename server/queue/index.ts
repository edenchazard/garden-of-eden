import { Queue } from 'bullmq';

const {
  redis: { host, port },
  clientSecret,
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
}).on('waiting', (job) => {
  job.updateData({ ...job.data, clientSecret });
  console.log('shareScrollQueue waiting', job.id);
});
