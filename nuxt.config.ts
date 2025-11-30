import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-11-28',
  devtools: { enabled: false },
  modules: [
    '@sidebase/nuxt-auth',
    '@nuxtjs/color-mode',
    '@nuxtjs/robots',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',
    'nuxt-security',
    'floating-vue/nuxt',
    [
      '~~/modules/watch-workers.ts',
      {
        path: fileURLToPath(new URL('/src/workers', import.meta.url)),
      },
    ],
  ],
  css: ['~/assets/main.css', '@fortawesome/fontawesome-svg-core/styles.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL,
    buildAssetsDir: '/assets',
    head: {
      htmlAttrs: {
        lang: 'en',
      },
    },
  },
  build: {
    transpile: [
      '@fortawesome/vue-fontawesome',
      '@fortawesome/fontawesome-svg-core',
    ],
  },
  runtimeConfig: {
    clientId: '',
    clientSecret: '',
    nextAuthSecret: '',
    bannerCacheExpiry: 1800,
    accessTokenPassword: '',
    db: {
      user: '',
      password: '',
      host: '',
      port: 3306,
      database: '',
    },
    redis: {
      host: process.env.NUXT_REDIS_HOST,
      port: process.env.NUXT_REDIS_PORT,
    },
    public: {
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL,
      origin: process.env.NUXT_PUBLIC_ORIGIN,
    },
  },
  auth: {
    isEnabled: true,
    baseURL: process.env.AUTH_ORIGIN,
    provider: {
      type: 'authjs',
      trustHost: false,
    },
  },
  colorMode: {
    classSuffix: '',
    preference: 'dark',
  },
  robots: { disallow: ['/api', '/view'] },
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
      methodsToProtect: ['POST', 'PUT', 'PATCH', 'DELETE'],
    },
  },
  image: {
    format: ['avif', 'webp'],
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
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      // Every 5 minutes
      '*/5 * * * *': [
        'maintenance:flairs',
        'maintenance:hatchery',
        'statistics:calculateLeaderboards',
        'statistics:logApiRequests',
      ],
      // Every 15 minutes
      '*/15 * * * *': ['statistics:logUserActivity'],
      // Every 30 minutes
      '*/30 * * * *': ['statistics:logScrollsAndDragons'],
      // Every 2 hours
      '0 */2 * * *': ['external:dragCaveFeed'],
      // Every day at midnight
      '0 0 * * *': [
        'maintenance:notifications',
        'maintenance:flairReleaseCycle',
      ],
    },
    storage: {
      cache: {
        driver: 'redis',
        host: 'redis',
      },
    },
    devStorage: {
      cache: {
        driver: 'redis',
        host: 'redis',
      },
    },
    esbuild: {
      options: {
        target: 'esnext',
        drop: process.env.NODE_ENV === 'production' ? ['console'] : [],
      },
    },
  },
  experimental: {
    sharedPrerenderData: false,
    pendingWhenIdle: true,
    granularCachedData: false,
    purgeCachedData: false,
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: false,
      },
    },
  },
});
