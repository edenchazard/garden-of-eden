<template>
  <label class="inline-flex items-center cursor-pointer">
    <input v-model="model" type="checkbox" class="sr-only peer" />
    <div
      class="relative bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:transition-all dark:border-gray-600 peer-checked:bg-orange-200 dark:peer-checked:bg-sky-900"
      :class="{
        'w-7 h-2 after:size-3 after:-top-[2px]': size === 'sm',
        'w-11 h-6 after:size-5 after:top-[2px]': size === 'md',
      }"
    ></div>
    <span
      :class="{
        'text-xs ms-1': size === 'sm',
        'text-sm ms-2': size === 'md',
      }"
    >
      {{ label }}
    </span>
  </label>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    label: string;
    size?: 'sm' | 'md';
  }>(),
  {
    size: 'md',
  }
);

const model = defineModel<boolean>({ default: false });
</script>
