import { NuxtAuthHandler } from '#auth';
import type { TokenSet } from 'next-auth';
import { db } from '~/server/db';
import { userSettings, user as userTable } from '~/database/schema';
import { eq } from 'drizzle-orm';

const {
  clientSecret,
  clientId,
  nextAuthSecret,
  public: { origin, baseUrl },
} = useRuntimeConfig();

export default NuxtAuthHandler({
  secret: nextAuthSecret,
  providers: [
    {
      id: 'dragcave',
      name: 'Dragon Cave',
      type: 'oauth',
      clientId: clientId,
      clientSecret: clientSecret,
      checks: ['state', 'pkce'],
      authorization: {
        url: 'https://dragcave.net/oauth_login',
        params: {
          scope: 'identify dragons',
          redirect_uri: `${origin}${baseUrl}/api/auth/callback/dragcave`,
        },
      },
      token: {
        async request(context) {
          const params = new URLSearchParams();
          params.append('grant_type', 'authorization_code');
          params.append('code_verifier', context.checks.code_verifier ?? '');
          params.append('code', context.params.code ?? '');
          params.append('client_id', context.client.client_id as string);
          params.append(
            'client_secret',
            context.client.client_secret as string
          );
          params.append(
            'redirect_uri',
            `${origin}${baseUrl}/api/auth/callback/dragcave`
          );

          const tokens = await $fetch<{ tokens: TokenSet }>(
            'https://dragcave.net/api/oauth2/token',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: params,
            }
          );

          return { tokens };
        },
      },
      userinfo: 'https://dragcave.net/api/v2/me',
      profile({ _, data: profile }) {
        return {
          id: profile.user_id,
          username: profile.username,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      const userId = parseInt(user.id);

      if (account) {
        token.sessionToken = account.access_token;

        await db.transaction(async (tx) => {
          await tx.insert(userTable).ignore().values({
            id: userId,
            username: user.username,
          });

          await tx.insert(userSettings).ignore().values({
            user_id: userId,
          });
        });
      }

      if (user) {
        token.userId = userId;
      }

      return token;
    },
    async session({ session, token }) {
      const userId = parseInt(token.userId);

      const user = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, userId))
        .leftJoin(userSettings, eq(userTable.id, userSettings.user_id));

      const { username, role, user_id, ...settings } = user;

      session.user.username = username;
      session.user.role = role;
      session.user.settings = settings as UserSettings;

      return session;
    },
    redirect() {
      return baseUrl;
    },
  },
});
