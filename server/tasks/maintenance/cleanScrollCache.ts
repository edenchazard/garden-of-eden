import { readdir, stat, unlink } from 'node:fs/promises';
import fsExists from '~/server/utils/fsExists';
import { join } from 'node:path';

export default defineTask({
  meta: {
    description:
      'Delete saved banner files in /cache/scroll older than 60 days.',
  },
  async run() {
    const cacheDir = '/cache/scroll';
    const maxAgeInMs = 60 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (!(await fsExists(cacheDir))) {
      return {
        result: 'error',
        message: 'Cache directory does not exist',
      };
    }

    try {
      const operations = (await readdir(cacheDir)).map(async (file) => {
        try {
          const filePath = join(cacheDir, file);
          const stats = await stat(filePath);
          if (now - stats.mtimeMs > maxAgeInMs) {
            await unlink(filePath);
          }
        } catch {
          // Ignore individual file errors.
        }
      });

      await Promise.all(operations);
      return {
        result: 'success',
      };
    } catch {
      return {
        result: 'error',
      };
    }
  },
});
