<template>
  <slot name="blurb" :statistics="hatchery.statistics" />
  <div
    class="items-center gap-y-2 gap-x-4 text-center p-2 rounded-md grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto_1fr] md:grid-cols-[auto_auto_auto_1fr_auto_auto] bg-black/30"
  >
    <label :for="`${label}-showing`">Showing</label>
    <select
      :id="`${label}-showing`"
      v-model.number="perPage"
      class="md:min-w-40"
    >
      <option value="10">10 dragons</option>
      <option value="25">25 dragons</option>
      <option value="50">50 dragons</option>
      <option value="100">100 dragons</option>
      <option value="150">150 dragons</option>
      <option value="200">200 dragons</option>
      <option value="500">500 dragons</option>
    </select>
    <label :for="`${label}-every`">every</label>
    <select
      :id="`${label}-every`"
      v-model.number="frequency"
      class="w-full md:max-w-40"
    >
      <option value="15">15 seconds</option>
      <option value="30">30 seconds</option>
      <option value="60">1 minute</option>
      <option value="120">2 minutes</option>
      <option value="300">5 minutes</option>
    </select>
    <ClientOnly>
      <button
        type="button"
        class="col-span-full sm:col-span-2 md:col-auto btn-secondary"
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
        <LoadingIcon
          v-if="loading"
          class="mr-1 size-4"
          @animationiteration="
            () => {
              if (hatcheryStatus === 'success') {
                loading = false;
              }
            }
          "
        />
        <font-awesome-icon v-else class="mr-1" :icon="['fas', 'rotate']" />
        Reload
      </button>
      <button
        v-if="refreshing"
        type="button"
        class="btn-primary col-span-full sm:col-span-2 md:col-auto"
        @click="pause()"
      >
        <font-awesome-icon :icon="['fas', 'pause']" />
        Pause
      </button>
      <button
        v-else
        type="button"
        class="btn-primary col-span-full sm:col-span-2 md:col-auto motion-safe:animate-pulse"
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
    </ClientOnly>
  </div>
  <div
    class="grid justify-center gap-1 mx-auto"
    :style="{
      gridTemplateColumns: `repeat(auto-fit, 45px)`,
      gridAutoRows: `45px`,
    }"
  >
    <a
      v-for="dragon in hatchery.dragons"
      :key="dragon.id"
      class="size-full flex items-center justify-center cursor-watering-can"
      :class="{
        'bg-orange-100/30 dark:bg-sky-200/15 deep-sea:bg-orange-200/40 transition-colors':
          dragon.clickedOn && highlightClickedDragons,
      }"
      :href="`${path}/view/${dragon.id}`"
      target="_blank"
      rel="nofollow"
      @onclick="trackClick(dragon)"
      @mouseup="trackMouseClick(dragon, $event)"
      @keydown.enter="trackClick(dragon)"
    >
      <ClientOnly>
        <img
          :alt="dragon.id"
          :src="
            cacheBust
              ? `https://dragcave.net/image/${dragon.id}.gif?cb=${Date.now()}`
              : `https://dragcave.net/image/${dragon.id}.gif`
          "
        />
      </ClientOnly>
    </a>
  </div>
  <slot v-if="hatchery.dragons.length === 0" name="empty" />
</template>

<script lang="ts" setup>
import { useIntervalFn } from '@vueuse/core';

const props = withDefaults(
  defineProps<{
    query: Record<string, string>;
    cacheBust?: boolean;
    label: string;
    highlightClickedDragons?: boolean;
    bubblewrap?: boolean;
  }>(),
  {
    cacheBust: false,
    highlightClickedDragons: false,
    bubblewrap: false,
  }
);

const frequency = defineModel<number>('frequency', { default: 30 });
const perPage = defineModel<number>('perPage', { default: 100 });

const loading = ref(false);
const config = useRuntimeConfig();
const { data: authData } = useAuth();
const path = config.public.origin + config.public.baseUrl;

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
  onRequest() {
    loading.value = true;
  },
});

const {
  pause,
  resume,
  isActive: refreshing,
} = useIntervalFn(
  fetchHatchery,
  computed(() => frequency.value * 1000)
);

function trackClick(dragon: HatcheryDragon) {
  if (props.bubblewrap) {
    const bubbles = Array.from(
      document.querySelectorAll<HTMLAudioElement>('.bubblewrap')
    );
    const bubble = bubbles[Math.floor(Math.random() * bubbles.length)];

    try {
      bubble.currentTime = 0;
      bubble.play();
    } catch {
      // Ignore
    }
  }

  if (dragon.clickedOn || !authData?.value?.user) {
    return;
  }

  dragon.clickedOn = new Date().toISOString();
}

function trackMouseClick(dragon: HatcheryDragon, event: MouseEvent) {
  if ([0, 1].includes(event.button)) {
    trackClick(dragon);
  }
}
</script>
