import { defineNuxtModule } from '@nuxt/kit';
import * as esbuild from 'esbuild';
import { watch, type WatchEventType } from 'fs';
import fsExists from '~/server/utils/fsExists';

export default defineNuxtModule({
  async setup({ path }, nuxt) {
    if (!(await fsExists(path))) {
      return;
    }

    nuxt.hook('build:done', async () => {
      const ctx = await esbuild.context({
        entryPoints: [`${path}/*.worker.ts`],
        outdir: path,
        bundle: true,
        platform: 'node',
        format: 'cjs',
        minify: true,
        outExtension: { '.js': '.cjs' },
        external: ['sharp', 'zod'],
      });

      const watcher = watch(
        path,
        async (eventType: WatchEventType, filename: string | null = null) => {
          if (eventType !== 'change' || !filename?.endsWith('.worker.ts')) {
            return;
          }

          console.info(`${filename}: Compiling worker...`);
          await ctx.rebuild();
        }
      );

      console.info(`${path}: Watching worker directory.`);

      await ctx.rebuild();

      console.info(`${path}: Initial worker compilation complete.`);

      nuxt.hook('close', async () => {
        watcher.close();
        await ctx.dispose();
      });
    });
  },
});
