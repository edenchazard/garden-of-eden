import { z } from 'zod';
import { promises as fs, createReadStream } from 'fs';
import { shareScrollQueue } from '~/server/queue';

const expiry = 1000 * 60;

async function exists(file: string) {
  try {
    await fs.stat(file);
    return true;
  } catch {
    return false;
  }
}

async function sendJob(username: string, filePath: string) {
  await shareScrollQueue.add(
    'shareScrollQueue',
    {
      username,
      filePath,
    },
    {
      removeOnComplete: false,
      removeOnFail: false,
      deduplication: {
        id: `banner-${username}`,
        ttl: expiry,
      },
    }
  );
}

export default defineEventHandler(async (event) => {
  const schema = z.object({
    username: z
      .string()
      .min(2)
      .max(36)
      .transform((v) => {
        const dotIndex = v.indexOf('.');
        return dotIndex !== -1 ? v.substring(0, dotIndex) : v;
      }),
  });

  const params = await getValidatedRouterParams(event, schema.parse);
  const filePath = `/cache/scroll/${encodeURIComponent(params.username)}.gif`;

  await sendJob(params.username, filePath);

  if (await exists(filePath)) {
    setHeaders(event, {
      'Content-Type': 'image/gif',
      'Cache-Control': `public, max-age=${expiry / 1000}`,
    });

    return sendStream(event, createReadStream(filePath));
  }

  // todo: what if banner generation fails (nonexistent scrollname)?
  // i want to render the 'scroll not found' banner in that case
  // but when and where to trigger that...?

  setHeaders(event, {
    'Content-Type': 'image/webp',
  });

  return sendStream(event, createReadStream(
    '/src/public/banner/banner_inprogress.webp'
  ));
  // little thing: the url ends in .gif but this resource is a .webp.
  // it serves just fine. will the filetype discrepancy be a problem later?
});
