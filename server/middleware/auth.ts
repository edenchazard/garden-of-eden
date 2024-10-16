import { getServerSession, getToken } from '#auth';

export default defineEventHandler(async (event) => {
  if (
    event.path.startsWith('/api/user') ||
    event.path.startsWith('/api/shop')
  ) {
    const [session, token] = await Promise.all([
      getServerSession(event),
      getToken({ event }),
    ]);

    if (!session || !token) {
      setResponseStatus(event, 401, 'Unauthorized');
      return 'Unauthorized';
    }
  }
});
