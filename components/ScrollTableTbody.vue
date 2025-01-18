<template>
  <tbody>
    <tr class="*:bg-green-600 *:dark:bg-neutral-900">
      <td class="pinned-dragon-column is-header text-sm font-bold pl-2 py-2">
        {{ header }}
      </td>
    </tr>

    <tr
      v-for="dragon in dragons"
      :key="dragon.id"
      class="divide-x divide-emerald-900/30 dark:divide-stone-600/30 *:py-2 *:px-3 *:text-center even:bg-green-500 odd:bg-green-600 dark:even:bg-neutral-800 dark:odd:bg-neutral-900"
    >
      <td class="!border-none">
        <input
          :id="`dragon-check-${dragon.id}`"
          v-model="dragon.in_garden"
          type="checkbox"
          :aria-labelledby="`dragon-${dragon.id}`"
        />
      </td>
      <td v-if="!hiddenColumns.includes('Seed Tray')" class="!border-none">
        <input
          v-if="dragon.hoursleft <= 96 || dragon.in_seed_tray"
          :id="`dragon-check-${dragon.id}`"
          v-model="dragon.in_seed_tray"
          type="checkbox"
          :aria-labelledby="`dragon-${dragon.id}`"
        />
      </td>
      <td class="pinned-dragon-column !border-l-0">
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
          <div class="flex flex-col justify-center">
            <div
              :id="`dragon-${dragon.id}`"
              class="font-bold max-w-24 md:max-w-none *:truncate"
            >
              <div
                v-if="dragon.hatch !== '0'"
                class="block"
                :aria-hidden="!dragon.name"
              >
                {{ dragon.name ?? 'Unnamed' }}
              </div>
              <div class="sr-only" :aria-hidden="!!dragon.name">
                ({{ dragon.id }})
              </div>
            </div>
            <div
              class="text-left pl-1 text-sm italic"
              :aria-hidden="!dragon.name"
            >
              ({{ dragon.id }})
            </div>
          </div>
        </div>
      </td>
      <td>
        <span v-if="dragon.gender" v-tooltip="dragon.gender">
          <font-awesome-icon
            v-if="dragon.gender === 'Male'"
            :icon="['fas', 'mars']"
          />
          <font-awesome-icon
            v-else-if="dragon.gender === 'Female'"
            :icon="['fas', 'venus']"
          />
        </span>
      </td>
      <td>{{ formatHoursLeft(dragon.hoursleft) }}</td>
      <td>
        <span v-if="dragon.is_stunned" v-tooltip.bottom="`Stunned`">
          <font-awesome-icon :icon="['fas', 'bolt-lightning']" />
        </span>
        <span v-else-if="dragon.is_incubated" v-tooltip.bottom="`Incubated`">
          <font-awesome-icon :icon="['fas', 'fire']" />
        </span>
      </td>
      <td>{{ formatNumber(dragon.views) }}</td>
      <td>{{ formatNumber(dragon.unique) }}</td>
      <td>{{ formatNumber(dragon.clicks) }}</td>
      <td v-if="!hiddenColumns.includes('V:UV')">
        {{ formatRatio(dragon.views, dragon.unique) }}
      </td>
    </tr>
  </tbody>
</template>

<script lang="ts" setup>
import { formatHoursLeft, formatNumber, formatRatio } from '~/utils';

withDefaults(
  defineProps<{
    dragons: ScrollView[];
    header: string;
    hiddenColumns?: string[];
  }>(),
  {
    hiddenColumns: () => [],
  }
);
</script>
