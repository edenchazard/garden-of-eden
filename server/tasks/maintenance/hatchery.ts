import { cleanUp } from '~/server/clean-up';

export default defineTask({
  meta: {
    description:
      'Remove fogged, grown or dead dragons from the hatchery, and move hatched ERs as appropriate.',
  },
  async run() {
    await cleanUp();
    return {
      result: 'success',
    };
  },
});
