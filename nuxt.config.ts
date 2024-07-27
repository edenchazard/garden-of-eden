// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: false },
  css: ["~/assets/main.css", "@fortawesome/fontawesome-svg-core/styles.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: ["@sidebase/nuxt-auth"],
  auth: {
    isEnabled: true,
    baseURL: "http://localhost:3000/api/auth",
    provider: {
      type: "authjs",
      trustHost: true,
      addDefaultCallbackUrl: true,
    },
  },
});
