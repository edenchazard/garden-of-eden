import { promises as fs } from 'fs';

export default defineNitroPlugin(async () => {
  // Setup scroll banner cache.
  await fs.mkdir('/cache/scroll', { recursive: true });
  await fs.mkdir('/src/resources/flair-shadows', { recursive: true });

  // Cheeky link to give resources access to public.
  // Recreated every start up.
  const publicPath = import.meta.dev ? '/src/public' : '/src/.output/public';
  try {
    await fs.unlink('/src/resources/public');
  } catch (e) {
    // Do nothing. We don't care bro.
    (() => e)();
  } finally {
    await fs.symlink(publicPath, '/src/resources/public', 'dir');
  }
});
