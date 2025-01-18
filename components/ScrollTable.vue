<template>
  <table class="relative text-sm">
    <thead>
      <tr class="*:text-center *:px-3 *:pb-2 *:whitespace-nowrap">
        <th>G</th>
        <th>S</th>
        <th>Dragon</th>
        <th>Gender</th>
        <th>Time Left</th>
        <th>BSA</th>
        <th>Views</th>
        <th>Unique</th>
        <th>Clicks</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="dragon in dragons"
        :key="dragon.id"
        class="*:py-1.5 *:px-3 *:text-center odd:bg-neutral-950 *:border-x *:border-x-stone-800"
      >
        <td class="!border-l-0">
          <input
            :id="`dragon-check-${dragon.id}`"
            v-model="dragon.in_garden"
            type="checkbox"
            :aria-labelledby="`dragon-${dragon.id}`"
          />
        </td>
        <td>
          <input
            :id="`dragon-check-${dragon.id}`"
            v-model="dragon.in_seed_tray"
            type="checkbox"
            :aria-labelledby="`dragon-${dragon.id}`"
          />
        </td>
        <td class="sticky left-0">
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
        </td>
        <td>
          <font-awesome-icon
            v-if="dragon.gender === 'Male'"
            :icon="['fas', 'mars']"
          />
          <font-awesome-icon
            v-else-if="dragon.gender === 'Female'"
            :icon="['fas', 'venus']"
          />
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
        <td class="!border-r-0">{{ formatNumber(dragon.clicks) }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import { formatHoursLeft, formatNumber } from '~/utils';

defineProps<{
  dragons: ScrollView[];
}>();
</script>
