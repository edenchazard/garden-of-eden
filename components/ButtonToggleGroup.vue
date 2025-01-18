<template>
  <div
    role="radiogroup"
    class="isolate flex rounded-md shadow-sm overflow-hidden ring-1 ring-white"
  >
    <button
      v-for="button in buttons"
      :key="button.value"
      type="button"
      :aria-checked="model === button.value"
      role="radio"
      class="flex-1 bg-white text-black rounded-none text-sm font-semibold whitespace-nowrap"
      :class="{
        'bg-emerald-600 !text-white dark:bg-rose-900': model === button.value,
      }"
      @click="model = button.value"
    >
      <font-awesome-icon v-if="button.icon" :icon="button.icon" />
      <span class="shrink-0">{{ button.label }}</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  buttons: Array<{
    icon?: [string, string];
    label: string;
    value: string;
  }>;
}>();

const model = defineModel<null | string>({ default: null });
</script>
