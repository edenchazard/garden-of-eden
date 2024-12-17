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
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/dc/hatchery/favicon-96x96.png',
          sizes: '96x96',
        },
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: `${process.env.BASE_URL}/favicon.svg`,
        },
        {
          rel: 'shortcut icon',
          href: `${process.env.BASE_URL}/favicon.ico`,
        },
        {
          rel: 'apple-touch-icon',
          href: `${process.env.BASE_URL}/apple-touch-icon.png`,
          sizes: '180x180',
        },
        {
          rel: 'manifest',
          href: `${process.env.BASE_URL}/site.webmanifest`,
        },
      ],
      meta: [
        {
          name: 'description',
          content:
            "A Dragon Cave hatchery with a minty theme. Help yours and other people's dragons flourish in the Garden of Eden.",
        },
        {
          name: 'keywords',
          content:
            'dragcave, dragons, dragon cave, hatchery, garden, eden, hatchery, nursery, eggs, hatchlings, clicks',
        },
        {
          property: 'og:title',
          content: 'Garden of Eden',
        },
        {
          property: 'og:type',
          content: 'website',
        },
        {
          property: 'og:url',
          content: `${process.env.ORIGIN}${process.env.BASE_URL}/`,
        },
        {
          property: 'og:image',
          content: `${process.env.ORIGIN}${process.env.BASE_URL}/open-graph.png`,
        },
        {
          property: 'og:description',
          content:
            "A Dragon Cave hatchery with a minty theme. Help yours and other people's dragons flourish in the Garden of Eden.",
        },
        {
          property: 'theme-color',
          content: '#7cf3a0',
        },
        {
          name: 'apple-mobile-web-app-title',
          content: 'Garden',
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
    accessTokenPassword: process.env.ACCESS_TOKEN_PASSWORD,
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
    removeLoggers: false,
    rateLimiter: false,
    headers: {
      crossOriginEmbedderPolicy: false,
      referrerPolicy: false,
      contentSecurityPolicy: {
        'img-src': ["'self'", 'dragcave.net', 'data:;'],
        'upgrade-insecure-requests': false,
      },
    },
    csrf: {
      enabled: true,
      encryptSecret: process.env.CSRF_SECRET,
      methodsToProtect: ['POST', 'PUT', 'PATCH', 'DELETE'],
    },
  },
  image: {
    formats: ['avif', 'webp'],
    provider: 'ipx',
    ipx: {
      maxAge: 60 * 60 * 24 * 30,
    },
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
        drop: process.env.NODE_ENV === 'production' ? ['console'] : [],
      },
    },
  },
});
