import { NuxtAuthHandler } from '#auth';
import type { TokenSet } from 'next-auth';
import { db } from '~/server/db';
import { userSettingsTable, userTable } from '~/database/schema';
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
      if (account) {
        token.sessionToken = account.access_token;
        const userId = parseInt(account.providerAccountId);

        await db.transaction(async (tx) => {
          await tx.insert(userTable).ignore().values({
            id: userId,
            username: user.username,
          });

          await tx.insert(userSettingsTable).ignore().values({
            user_id: userId,
          });
        });
      }

      if (user) {
        token.userId = parseInt(user.id);
      }

      return token;
    },
    async session({ session, token }) {
      const userId = token.userId;
      const [user] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, userId))
        .innerJoin(
          userSettingsTable,
          eq(userTable.id, userSettingsTable.user_id)
        );

      const {
        users,
        user_settings: { user_id, ...settings },
      } = user;

      session.user.username = users.username;
      session.user.role = users.role;
      session.user.settings = settings;

      return session;
    },
    redirect() {
      return baseUrl;
    },
  },
});
