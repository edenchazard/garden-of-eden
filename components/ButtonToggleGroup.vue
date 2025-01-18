<template>
  <div
    role="radiogroup"
    class="isolate inline-flex rounded-md shadow-sm overflow-hidden"
  >
    <button
      v-for="button in buttons"
      :key="button.value"
      type="button"
      :aria-checked="model === button.value"
      role="radio"
      class="rounded-none inline-flex items-center bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      :class="{
        'bg-stone-700': model === button.value,
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
    icon?: null | [string, string];
    label: string;
    value: string;
  }>;
}>();

const model = defineModel<null | string>({ default: null });
</script>
