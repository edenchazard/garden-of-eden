// import { z } from 'zod';
// import { promises as fs, createReadStream } from 'fs';
// import { shareScrollQueue } from '~/server/queue';

// const expiry = 1000 * 60;

// async function exists(file: string) {
//   try {
//     await fs.stat(file);
//     return true;
//   } catch {
//     return false;
//   }
// }

// async function sendJob(username: string, filePath: string) {
//   await shareScrollQueue.add(
//     'shareScrollQueue',
//     {
//       username,
//       filePath,
//     },
//     {
//       removeOnComplete: false,
//       removeOnFail: false,
//       deduplication: {
//         id: `banner-${username}`,
//         ttl: expiry,
//       },
//     }
//   );
// }

export default defineEventHandler(async (event) => {
  // const schema = z.object({
  //   username: z
  //     .string()
  //     .min(4)
  //     .max(36)
  //     .transform((v) => v.substring(0, v.indexOf('.'))),
  // });

  // const params = await getValidatedRouterParams(event, schema.parse);
  // const filePath = `/cache/scroll/${encodeURIComponent(params.username)}.gif`;

  // await sendJob(params.username, filePath);

  // if (await exists(filePath)) {
  //   setHeaders(event, {
  //     'Content-Type': 'image/gif',
  //     'Cache-Control': `public, max-age=${expiry / 1000}`,
  //   });

  //   return sendStream(event, createReadStream(filePath));
  // }

  // TODO: maybe serve a Single Pixel(tm)
  setResponseStatus(event, 404, 'banner not found');
});
