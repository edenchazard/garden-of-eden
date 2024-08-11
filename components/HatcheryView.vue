<template>
  <slot name="blurb" :statistics="hatchery.statistics" />
  <div
    class="items-center gap-y-2 gap-x-4 text-center p-2 rounded-md grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto_1fr] md:grid-cols-[auto_auto_auto_1fr_auto_auto] bg-black/30"
  >
    <label for="showing">Showing</label>
    <select id="showing" v-model.number="perPage" class="md:min-w-40">
      <option value="10">10 dragons</option>
      <option value="25">25 dragons</option>
      <option value="50">50 dragons</option>
      <option value="100">100 dragons</option>
      <option value="150">150 dragons</option>
      <option value="200">200 dragons</option>
    </select>
    <label for="every">every</label>
    <select id="every" v-model.number="frequency" class="w-full md:max-w-40">
      <option value="15">15 seconds</option>
      <option value="30">30 seconds</option>
      <option value="60">1 minute</option>
      <option value="120">2 minutes</option>
      <option value="300">5 minutes</option>
    </select>
    <ClientOnly>
      <button
        v-if="refreshing"
        type="button"
        class="btn- col-span-full sm:col-span-2 md:col-auto bg-rose-900 text-white"
        @click="pause()"
      >
        <font-awesome-icon :icon="['fas', 'pause']" />
        Pause
      </button>
      <button
        v-else
        type="button"
        class="btn- col-span-full sm:col-span-2 md:col-auto bg-emerald-900 text-white motion-safe:animate-pulse"
        @click="
          () => {
            resume();
            fetchHatchery();
          }
        "
      >
        <font-awesome-icon :icon="['fas', 'play']" />
        Continue
      </button>
      <button
        type="button"
        class="col-span-full sm:col-span-2 md:col-auto btn-primary"
        @click="
          () => {
            if (refreshing) {
              pause();
              resume();
            }
            fetchHatchery();
          }
        "
      >
        <font-awesome-icon
          :icon="['fas', 'rotate']"
          :class="{
            'animate-spin': hatcheryStatus === 'pending',
          }"
        />
        Reload
      </button>
    </ClientOnly>
  </div>
  <div
    v-memo="hatchery.dragons"
    class="grid justify-center gap-1 mx-auto"
    :style="{
      gridTemplateColumns: `repeat(auto-fit, 45px)`,
      gridAutoRows: `45px`,
    }"
  >
    <a
      v-for="dragon in hatchery.dragons"
      :key="dragon.code"
      class="size-full flex items-center justify-center"
      :href="`https://dragcave.net/view/${dragon.code}`"
      target="_blank"
    >
      <img
        :alt="dragon.code"
        :src="`https://dragcave.net/image/${dragon.code}.gif`"
      />
    </a>
  </div>
  <slot v-if="hatchery.dragons.length === 0" name="empty" />
</template>

<script lang="ts" setup>
import { useIntervalFn } from '@vueuse/core';

const props = defineProps<{
  query: Record<string, string>;
}>();

const frequency = defineModel<number>('frequency', { default: 30 });
const perPage = defineModel<number>('perPage', { default: 100 });

const {
  data: hatchery,
  execute: fetchHatchery,
  status: hatcheryStatus,
} = await useFetch('/api/hatchery', {
  default: () => ({
    dragons: [],
    statistics: {
      total: 0,
      scrolls: 0,
    },
  }),
  params: computed(() => ({
    limit: perPage.value,
    ...props.query,
  })),
  watch: [() => [frequency, perPage]],
});

const {
  pause,
  resume,
  isActive: refreshing,
} = useIntervalFn(
  fetchHatchery,
  computed(() => frequency.value * 1000)
);
</script>
