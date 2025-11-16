import { promises as fs } from 'fs';
import fsExists from '~/server/utils/fsExists';
import path from 'node:path';

export default defineTask({
  meta: {
    description:
      'Delete saved banner files in /cache/scroll older than 60 days.',
  },
  async run() {
    const cacheDir = '/cache/scroll';
    const maxAgeInDays = 60;
    const maxAgeInMs = maxAgeInDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Check if directory exists
    if (!(await fsExists(cacheDir))) {
      return {
        result: 'success',
        message: 'Cache directory does not exist',
        deletedCount: 0,
      };
    }

    let deletedCount = 0;

    try {
      const files = await fs.readdir(cacheDir);

      for (const file of files) {
        const filePath = path.join(cacheDir, file);

        try {
          const stats = await fs.stat(filePath);

          // Check if it's a file and if it's older than 60 days
          if (stats.isFile() && now - stats.mtimeMs > maxAgeInMs) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      }

      return {
        result: 'success',
        deletedCount,
      };
    } catch (error) {
      console.error('Error reading cache directory:', error);
      return {
        result: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        deletedCount,
      };
    }
  },
});
