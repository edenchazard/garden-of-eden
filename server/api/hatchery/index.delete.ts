import { getServerSession } from '#auth';
import { cleanUp } from '~/server/clean-up';

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);

  if (session?.user.role !== 'owner') {
    setResponseStatus(event, 401, 'Unauthorized');
    return 'Unauthorized';
  }

  return cleanUp();
});
