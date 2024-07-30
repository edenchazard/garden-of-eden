// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: false },
  modules: ["@sidebase/nuxt-auth"],
  css: ["~/assets/main.css", "@fortawesome/fontawesome-svg-core/styles.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  app: {
    baseURL: process.env.BASE_URL,
    buildAssetsDir: "/assets",
    head: {
      htmlAttrs: {
        lang: "en",
      },
    },
  },
  build: {
    transpile: ["@fortawesome/vue-fontawesome"],
  },
  runtimeConfig: {
    clientId: process.env.CLIENT_ID ?? "",
    clientSecret: process.env.CLIENT_SECRET,
    nextAuthSecret: process.env.NEXT_SECRET,
    baseUrl: process.env.BASE_URL,
    origin: process.env.ORIGIN,
    db: {
      port: 3306,
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      database: process.env.MYSQL_DATABASE,
      password: process.env.MYSQL_PASSWORD,
    },
    public: {},
  },
  auth: {
    isEnabled: true,
    baseURL: `${process.env.ORIGIN}${process.env.BASE_URL}/api/auth`,
    provider: {
      type: "authjs",
      trustHost: false,
    },
  },
});
