import { NuxtAuthHandler } from "#auth";
const CLIENT_ID = "dc-tools-but-testing.1486295473e9b66f";
const CLIENT_SECRET = "sqN14ARc6vthXJcqgrBY8oHBWnTDEhWbs";
const NEXT_SECRET = "your secret here";

export default NuxtAuthHandler({
  secret: NEXT_SECRET,
  providers: [
    {
      id: "dragcave",
      name: "Dragon Cave",
      type: "oauth",
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      checks: ["state", "pkce"],
      authorization: {
        url: "https://dragcave.net/oauth_login",
        params: {
          scope: "identify dragons",
          redirect_uri: "http://localhost:3000/api/auth/callback/dragcave",
        },
      },
      token: {
        async request(context) {
          const params = new URLSearchParams();
          params.append("grant_type", "authorization_code");
          params.append("code_verifier", context.checks.code_verifier);
          params.append("code", context.params.code);
          params.append("client_id", context.client.client_id);
          params.append("client_secret", context.client.client_secret);
          params.append(
            "redirect_uri",
            "http://localhost:3000/api/auth/callback/dragcave"
          );

          const response = await fetch(
            "https://dragcave.net/api/oauth2/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: params,
            }
          );
          const tokens = await response.json();
          return { tokens };
        },
      },
      userinfo: "https://dragcave.net/api/v2/me",
      profile({ errors, data: profile }) {
        return {
          id: profile.user_id,
          username: profile.username,
        };
      },
    },
  ],
  callbacks: {
    jwt({ token, user, account }) {
      if (account) {
        token.sessionToken = account.access_token;
      }

      if (user) {
        token.username = user.username;
      }

      return token;
    },
    session({ session, token }) {
      session.user.username = token.username;
      return session;
    },
  },
});
