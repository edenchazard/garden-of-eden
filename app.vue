<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { toastOptions, updateGlobalOptions } from '~/plugins/vue3-toastify';
import { Chart } from '~/plugins/chartjs';

const {
  app: { baseURL },
  public: { origin },
} = useRuntimeConfig();

useServerSeoMeta({
  description:
    "A Dragon Cave hatchery with a minty theme. Help yours and other people's dragons flourish in the Garden of Eden.",
  keywords: 'dragon cave, hatchery, minty theme, garden of eden',
  ogTitle: 'Garden of Eden',
  ogType: 'website',
  ogImage: `${origin}${baseURL}/og-image.png`,
  ogDescription:
    "A Dragon Cave hatchery with a minty theme. Help yours and other people's dragons flourish in the Garden of Eden.",
  themeColor: '#7cf3a0',
  appleMobileWebAppTitle: 'Garden',
});

useServerHead({
  link: [
    {
      rel: 'icon',
      type: 'image/png',
      href: `${origin}${baseURL}favicon-96x96.png`,
      sizes: '96x96',
    },
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: `${origin}${baseURL}favicon.svg`,
    },
    {
      rel: 'shortcut icon',
      href: `${origin}${baseURL}favicon.ico`,
    },
    {
      rel: 'apple-touch-icon',
      href: `${origin}${baseURL}apple-touch-icon.png`,
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: `${origin}${baseURL}site.webmanifest`,
    },
  ],
});

watch(
  useNuxtApp().$colorMode,
  (cur) => {
    updateGlobalOptions({
      ...toastOptions,
      theme: cur.value === 'dark' ? 'dark' : 'light',
    });

    const colour = cur.value === 'light' ? '#fff' : '#e7e5e4';

    Chart.defaults.plugins.title.font = {
      size: 16,
      weight: 'bold',
    };
    Chart.defaults.color = colour;
    Chart.defaults.plugins.title.color = colour;
  },
  {
    immediate: true,
  }
);
</script>
