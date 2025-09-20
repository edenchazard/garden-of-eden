<template>
  <div class="flex flex-col sm:flex-row gap-2 items-center">
    <label class="text-sm font-medium">{{ label }}</label>
    <div class="flex gap-2 items-center">
      <input
        v-model="startDate"
        type="datetime-local"
        class="px-2 py-1 border rounded text-sm"
        :max="endDate"
        @change="emitChange"
      />
      <span class="text-sm">to</span>
      <input
        v-model="endDate"
        type="datetime-local"
        class="px-2 py-1 border rounded text-sm"
        :min="startDate"
        @change="emitChange"
      />
      <button
        class="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        @click="resetToDefault"
      >
        Last 24h
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DateTime } from 'luxon';

interface Props {
  label?: string;
  modelValue?: { start: string; end: string };
}

interface Emits {
  (e: 'update:modelValue', value: { start: string; end: string }): void;
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Time range:',
  modelValue: undefined,
});

const emit = defineEmits<Emits>();

// Convert DateTime to datetime-local format
const formatForInput = (dateTime: DateTime) => {
  return dateTime.toFormat("yyyy-MM-dd'T'HH:mm");
};

const startDate = ref(
  props.modelValue?.start 
    ? formatForInput(DateTime.fromISO(props.modelValue.start))
    : formatForInput(DateTime.now().minus({ hours: 24 }))
);

const endDate = ref(
  props.modelValue?.end
    ? formatForInput(DateTime.fromISO(props.modelValue.end))
    : formatForInput(DateTime.now())
);

const emitChange = () => {
  if (startDate.value && endDate.value) {
    emit('update:modelValue', {
      start: DateTime.fromFormat(startDate.value, "yyyy-MM-dd'T'HH:mm").toISO()!,
      end: DateTime.fromFormat(endDate.value, "yyyy-MM-dd'T'HH:mm").toISO()!,
    });
  }
};

const resetToDefault = () => {
  startDate.value = formatForInput(DateTime.now().minus({ hours: 24 }));
  endDate.value = formatForInput(DateTime.now());
  emitChange();
};

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    startDate.value = formatForInput(DateTime.fromISO(newValue.start));
    endDate.value = formatForInput(DateTime.fromISO(newValue.end));
  }
});
</script>