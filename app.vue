<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { toastOptions, updateGlobalOptions } from '~/plugins/vue3-toastify';
import { Chart } from '~/plugins/chartjs';

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
