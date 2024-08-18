<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { toastOptions, updateGlobalOptions } from '~/plugins/vue3-toastify';

watch(useNuxtApp().$colorMode, (cur) => {
  updateGlobalOptions({
    ...toastOptions,
    theme: cur.value === 'dark' ? 'dark' : 'light',
  });
});
</script>
