import { fileURLToPath } from 'node:url';

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
    '@nuxt/test-utils/module',
    'nuxt-security',
    'floating-vue/nuxt',
    '@nuxt/image',
    [
      '~/modules/watch-workers',
      {
        path: fileURLToPath(new URL('/src/workers', import.meta.url)),
      },
    ],
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
    bannerCacheExpiry: parseInt(process.env.BANNER_CACHE_EXPIRY ?? '1800'),
    db: {
      port: 3306,
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      database: process.env.MYSQL_DATABASE,
      password: process.env.MYSQL_PASSWORD,
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
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
    preference: 'dark',
  },
  cron: {
    runOnInit: false,
    jobsDir: 'cron',
  },
  robots: {
    disallow: ['/api', '/view'],
  },
  security: {
    rateLimiter: false,
    headers: {
      crossOriginEmbedderPolicy: false,
      referrerPolicy: false,
      contentSecurityPolicy: {
        'img-src': ["'self'", 'dragcave.net', 'data:;'],
        'upgrade-insecure-requests': false,
        'script-src-attr': ["'unsafe-inline'"],
      },
    },
    csrf: {
      enabled: true,
      encryptSecret: process.env.CSRF_SECRET,
    },
  },
  image: {
    format: ['avif', 'webp'],
    formats: ['avif', 'webp'],
  },
  routeRules: {
    // nuxt-auth has its own CSRF protection
    '/api/auth/**': {
      csurf: false,
    },
  },
  nitro: {
    storage: {
      redis: {
        driver: 'redis',
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
      cache: {
        driver: 'redis',
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
    },
    devStorage: {
      cache: {
        driver: 'redis',
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
    },
    esbuild: {
      options: {
        target: 'esnext',
        drop: ['console'],
      },
    },
  },
});
