import { defineNuxtModule } from '@nuxt/kit';
import * as esbuild from 'esbuild';
import { watch } from 'fs';

export default defineNuxtModule({
  async setup({ path }, nuxt) {
    const ctx = await esbuild.context({
      entryPoints: [`${path}/*.worker.ts`],
      outdir: path,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      minify: true,
      outExtension: { '.js': '.cjs' },
    });

    const watcher = watch(
      path,
      async (eventType: string, filename: string | null = null) => {
        if (eventType !== 'change' || !filename?.endsWith('.worker.ts')) {
          return;
        }

        console.info(`${filename}: Compiling worker...`);
        await ctx.rebuild();
      }
    );

    console.info(`${path}: Watching worker directory.`);

    ctx.rebuild();

    console.info(`${path}: Initial worker compilation complete.`);

    nuxt.hook('close', async () => {
      watcher.close();
      await ctx.dispose();
    });
  },
});
