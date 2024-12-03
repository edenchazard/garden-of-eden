<!-- eslint-disable vue/no-v-html -->
<template>
  <VDropdown :triggers="['hover']" class="shrink-0">
    <img class="inline ml-1" :src="userFlair(item.url)" :alt="item.name" />
    <template #popper>
      <div class="w-full max-w-56 p-2">
        <b class="font-bold">{{ item.name }}</b>
        <div class="text-sm" v-html="item.description" />
        <p class="text-xs text-right italic">Art by {{ item.artist }}</p>
      </div>
    </template>
  </VDropdown>
</template>

<script setup lang="ts">
import userFlair from '~/utils/userFlair';

defineProps<{
  item: Item;
}>();
</script>
