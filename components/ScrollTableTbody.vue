<template>
  <tbody>
    <tr class="*:bg-green-600 *:dark:bg-neutral-900">
      <td colspan="3" class="sticky left-0">
        <div class="pinned-dragon-column my-2 text-sm font-bold ml-3">
          {{ header }}
        </div>
      </td>
      <td colspan="6">&nbsp;</td>
    </tr>
    <tr
      v-for="dragon in dragons"
      :key="dragon.id"
      class="*:py-2 *:px-3 *:text-center even:bg-green-500 odd:bg-green-600 dark:even:bg-neutral-800 dark:odd:bg-neutral-900"
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
      <td class="pinned-dragon-column sticky left-0">
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
          <div>
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
</template>

<script lang="ts" setup>
import { formatHoursLeft, formatNumber } from '~/utils';

defineProps<{
  dragons: ScrollView[];
  header: string;
}>();
</script>
