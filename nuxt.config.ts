// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  modules: [
    '@sidebase/nuxt-auth',
    '@nuxtjs/color-mode',
    'nuxt-cron',
    '@nuxtjs/robots',
    '@nuxt/eslint',
  ],
  css: ['~/assets/main.css', '@fortawesome/fontawesome-svg-core/styles.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  app: {
    baseURL: process.env.BASE_URL,
    buildAssetsDir: '/assets',
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        {
          name: 'description',
          content: "View and click other people's dragons.",
        },
        {
          name: 'keywords',
          content:
            'dragcave, dragons, dragon cave, hatchery, garden, eden, hatchery, nursery, eggs, hatchlings',
        },
      ],
    },
  },
  build: {
    transpile: [
      '@fortawesome/vue-fontawesome',
      '@fortawesome/fontawesome-svg-core',
    ],
  },
  runtimeConfig: {
    clientId: process.env.CLIENT_ID ?? '',
    clientSecret: process.env.CLIENT_SECRET,
    nextAuthSecret: process.env.NEXT_SECRET,
    db: {
      port: 3306,
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      database: process.env.MYSQL_DATABASE,
      password: process.env.MYSQL_PASSWORD,
    },
    public: {
      baseUrl: process.env.BASE_URL,
      origin: process.env.ORIGIN,
    },
  },
  auth: {
    isEnabled: true,
    baseURL: `${process.env.ORIGIN}${process.env.BASE_URL}/api/auth`,
    provider: {
      type: 'authjs',
      trustHost: false,
    },
  },
  colorMode: {
    classSuffix: '',
  },
  cron: {
    runOnInit: false,
    jobsDir: 'cron',
  },
  robots: {
    disallow: ['/api'],
  },
});
