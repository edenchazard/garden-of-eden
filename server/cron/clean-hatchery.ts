import { defineCronHandler } from '#nuxt/cron';
import { cleanUp } from '~/server/clean-up';

export default defineCronHandler('everyFiveMinutes', () => {
  cleanUp();
});
