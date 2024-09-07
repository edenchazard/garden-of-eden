import { NuxtAuthHandler } from '#auth';
import type { RowDataPacket } from 'mysql2';
import type { TokenSet } from 'next-auth';
import pool from '~/server/pool';

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
        const con = await pool.getConnection();

        try {
          await con.beginTransaction();
          await con.execute(
            `INSERT IGNORE INTO users (id, username) VALUES (?, ?)`,
            [user.id, user.username]
          );
          await con.execute(
            `INSERT IGNORE INTO user_settings (user_id) VALUES (?)`,
            [user.id]
          );
          await con.commit();
        } catch (e) {
          await con.rollback();
          throw e;
        } finally {
          con.release();
        }
      }

      if (user) {
        token.userId = parseInt(user.id);
      }
      return token;
    },
    async session({ session, token }) {
      const [[user]] = await pool.execute<RowDataPacket[]>(
        `SELECT users.username, users.role, user_settings.*
        FROM users
        LEFT JOIN user_settings ON users.id = user_settings.user_id
        WHERE id = ?`,
        [token.userId]
      );

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
