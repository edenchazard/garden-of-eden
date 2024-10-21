import { NuxtAuthHandler } from '#auth';
import type { TokenSet } from 'next-auth';
import { db } from '~/server/db';
import { itemsTable, userSettingsTable, userTable } from '~/database/schema';
import { eq, getTableColumns } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

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

        const salt = await bcrypt.genSalt(10);
        const hashedToken = await bcrypt.hash(account.access_token, salt);

        await db.transaction(async (tx) => {
          await tx.insert(userTable).ignore().values({
            id: userId,
            username: user.username,
            access_token: hashedToken,
          });

          await tx.insert(userSettingsTable).ignore().values({
            user_id: userId,
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
          .update(userTable)
          .set({ last_activity: now })
          .where(eq(userTable.id, token.userId));
      }

      return token;
    },
    async session({ session, token }) {
      const userId = token.userId;
      const [user] = await db
        .select({
          users: getTableColumns(userTable),
          user_settings: getTableColumns(userSettingsTable),
          items: {
            id: itemsTable.id,
            name: itemsTable.name,
            url: itemsTable.url,
          },
        })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .innerJoin(
          userSettingsTable,
          eq(userTable.id, userSettingsTable.user_id)
        )
        .leftJoin(itemsTable, eq(userSettingsTable.flair_id, itemsTable.id));

      const {
        users,
        user_settings: { user_id, ...settings },
        items: flair,
      } = user;
      session.user.username = users.username;
      session.user.money = users.money;
      session.user.role = users.role;
      session.user.settings = settings;
      session.user.flair = flair ?? null;
      return session;
    },
    redirect() {
      return baseUrl;
    },
  },
});
