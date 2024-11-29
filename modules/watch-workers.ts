import { defineNuxtModule } from '@nuxt/kit';
import chokidar from 'chokidar';
import { exec } from 'child_process';

export default defineNuxtModule({
  setup({ path }, nuxt) {
    exec(
      `npx esbuild ${path}/*.worker.ts --outdir=${path} --bundle --platform=node --format=cjs --minify --out-extension:.js=.cjs`,
      (error, stdout, stderr) => {
        if (error) console.error(`Error: ${error.message}`);
        if (stderr) console.error(`stderr: ${stderr}`);
        if (stdout) console.log(stdout);
        if (!error && !stderr) console.log('Initial compilation successful');
      }
    );

    nuxt.hook('build:before', () => {
      const watcher = chokidar.watch(`${path}/**/*.ts`, {
        ignoreInitial: true,
      });

      watcher.on('change', (path) => {
        const file = path.substring(0, path.lastIndexOf('.'));
        console.log(file);
        console.log(`File changed: ${path}. Re-compiling...`);
        exec(
          `npx esbuild ${path} --bundle --platform=node --outfile=${file}.cjs --format=cjs --minify`,
          (error, stdout, stderr) => {
            if (error) console.error(`Error: ${error.message}`);
            if (stderr) console.error(`stderr: ${stderr}`);
            if (stdout) console.log(stdout);
            if (!error && !stderr) console.log('Compilation successful');
          }
        );
      });

      // Stop watcher on Nuxt close
      nuxt.hook('close', () => watcher.close());
    });
  },
});
