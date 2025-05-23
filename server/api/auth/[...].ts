import { NuxtAuthHandler } from '#auth';
import type { TokenSet } from 'next-auth';
import { db } from '~/server/db';
import { itemsTable, usersSettingsTable, usersTable } from '~/database/schema';
import { eq, getTableColumns } from 'drizzle-orm';
import { encrypt } from '~/utils/accessTokenHandling';

const {
  clientSecret,
  clientId,
  nextAuthSecret,
  public: { origin, baseUrl },
  accessTokenPassword,
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
      profile({ data: profile }) {
        return {
          id: profile.user_id,
          username: profile.username,
        };
      },
    },
  ],
  events: {
    async signIn({ user, account }) {
      // Update the user's access token.
      await db
        .update(usersTable)
        .set({
          accessToken: encrypt(
            account?.access_token ?? '',
            accessTokenPassword
          ),
        })
        .where(eq(usersTable.id, parseInt(user.id + '')));
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        token.sessionToken = account.access_token;
        const userId = parseInt(account.providerAccountId);

        await db.transaction(async (tx) => {
          await tx.insert(usersTable).ignore().values({
            id: userId,
            username: user.username,
          });

          await tx.insert(usersSettingsTable).ignore().values({
            userId,
          });
        });
      }

      if (user) {
        token.userId = parseInt(user.id);
      }

      // only update last activity if it's been more than 5 minutes
      const now = new Date();
      if (
        token.userId &&
        (token.lastActivityTimestamp ?? 0) < now.getTime() - 1000 * 60 * 5
      ) {
        token.lastActivityTimestamp = now.getTime();

        await db
          .update(usersTable)
          .set({ lastActivity: now })
          .where(eq(usersTable.id, token.userId));
      }

      return token;
    },
    async session({ session, token }) {
      const userId = token.userId;
      const [user] = await db
        .select({
          users: getTableColumns(usersTable),
          user_settings: getTableColumns(usersSettingsTable),
          items: {
            id: itemsTable.id,
            name: itemsTable.name,
            url: itemsTable.url,
          },
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .innerJoin(
          usersSettingsTable,
          eq(usersTable.id, usersSettingsTable.userId)
        )
        .leftJoin(itemsTable, eq(usersSettingsTable.flairId, itemsTable.id));

      // Access tokens were not stored originally, so this is here to provide backwards
      // compatibility for users who have not logged in since this feature was added.
      if (!user.users.accessToken && token.sessionToken) {
        await db
          .update(usersTable)
          .set({
            accessToken: encrypt(token.sessionToken, accessTokenPassword),
          })
          .where(eq(usersTable.id, userId));
      }

      const {
        users,
        user_settings: { userId: _, ...settings },
        items: flair,
      } = user;
      session.user.id = users.id;
      session.user.username = users.username;
      session.user.money = users.money;
      session.user.role = users.role;
      session.user.apiBlocked = users.apiBlocked;
      session.user.settings = settings;
      session.user.flair = flair ?? null;
      return session;
    },
    redirect() {
      return baseUrl;
    },
  },
});
