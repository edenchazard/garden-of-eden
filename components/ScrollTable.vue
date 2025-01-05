<template>
  <div
    class="grid grid-cols-[3rem,6rem,minmax(6rem,1fr),6rem,6rem,6rem,6rem] gap-2 max-w-96"
  >
    <template v-for="dragon in dragons" :key="dragon.id">
      <div>
        <input
          :id="`dragon-check-${dragon.id}`"
          v-model="dragon.in_garden"
          type="checkbox"
          :aria-labelledby="`dragon-${dragon.id}`"
        />
      </div>
      <div>
        <input
          :id="`dragon-check-${dragon.id}`"
          v-model="dragon.in_seed_tray"
          type="checkbox"
          :aria-labelledby="`dragon-${dragon.id}`"
        />
      </div>
      <div>
        <div class="flex gap-2">
          <NuxtLink
            :to="`https://dragcave.net/view/${dragon.id}`"
            target="_blank"
            class="shrink-0 size-[45px] flex items-center justify-center rounded-md border border-green-400 dark:border-stone-700"
            :aria-labelledby="`dragon-${dragon.id}`"
          >
            <ClientOnly>
              <img
                alt=""
                loading="lazy"
                class="max-w-full max-h-full"
                :src="`https://dragcave.net/image/${dragon.id}/1?cb=${Date.now()}`"
              />
            </ClientOnly>
          </NuxtLink>
          <div class="text-left w-full truncate">
            <span class="block truncate">{{ dragon.name }}</span>
            <span class="text-sm pl-3 italic"> ({{ dragon.id }}) </span>
          </div>
        </div>
      </div>
      <div>{{ formatNumber(dragon.views) }}</div>
      <div>{{ formatNumber(dragon.unique) }}</div>
      <div>{{ formatNumber(dragon.clicks) }}</div>
      <div>{{ formatHoursLeft(dragon.hoursleft) }}</div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { formatHoursLeft, formatNumber } from '~/utils';

defineProps<{
  dragons: ScrollView[];
}>();
</script>
