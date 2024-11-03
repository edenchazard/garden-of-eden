<!-- eslint-disable vue/no-v-html -->
<template>
  <VDropdown :triggers="['hover']">
    <img class="inline ml-1" :src="userFlair(item.url)" :alt="item.name" />
    <template #popper>
      <div class="w-full max-w-56 p-2">
        <b>{{ item.name }}</b>
        <div class="mt-1 text-sm" v-html="item.description" />
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
