import { defineNuxtModule } from '@nuxt/kit';
import chokidar from 'chokidar';
import { exec } from 'child_process';

export default defineNuxtModule({
  setup(_, nuxt) {
    exec(
      `tsc server/workers/**.ts --module esnext --moduleResolution bundler --target esnext`,
      (error, stdout, stderr) => {
        if (error) console.error(`Error: ${error.message}`);
        if (stderr) console.error(`stderr: ${stderr}`);
        if (stdout) console.log(stdout);
        if (!error && !stderr) console.log('Initial compilation successful');
      }
    );

    nuxt.hook('build:before', () => {
      const watcher = chokidar.watch('server/workers/**/*.ts', {
        ignoreInitial: true,
      });

      watcher.on('change', (path) => {
        console.log(`File changed: ${path}. Re-compiling...`);
        exec(
          `tsc ${path} --module esnext --moduleResolution bundler --target esnext`,
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