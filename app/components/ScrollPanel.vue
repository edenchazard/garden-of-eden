<template>
  <div class="relative cursor-pointer transition-shadow">
    <div
      class="rounded-md"
      :class="{
        'animate-[glow_1.5s_forwards] glow-subtlety-12 glow motion-reduce:animate-none':
          recentlyAdded.includes(dragon.id),
      }"
      @animationend="$emit('glowFinished')"
    >
      <div
        class="rounded-md grid grid-cols-[45px_1fr] gap-x-3 gap-y-2 p-2 pb-4 items-center border content-border justify-items-start overflow-hidden"
        :class="{
          'bg-green-500 dark:bg-neutral-800 deep-sea:bg-slate-700 border-transparent':
            dragon.inGarden,
          'border-green-500 dark:border-neutral-600 deep-sea:border-slate-500':
            !dragon.inGarden,
          'opacity-50': !dragon.inGarden,
        }"
      >
        <NuxtLink
          :to="`https://dragcave.net/view/${dragon.id}`"
          target="_blank"
          class="size-[45px] flex items-center justify-center rounded-md border border-green-400 dark:border-stone-700 deep-sea:border-slate-500"
          :aria-labelledby="`dragon-${dragon.id}`"
          @click.stop
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
        <div class="text-left max-w-full overflow-hidden">
          <span :id="`dragon-${dragon.id}`" class="font-bold block">
            <span
              v-if="dragon.hatch !== '0'"
              class="truncate w-full block"
              :aria-hidden="!dragon.name"
              >{{ dragon.name ?? 'Unnamed' }}</span
            >
            <span class="sr-only" :aria-hidden="!!dragon.name"
              >({{ dragon.id }})</span
            >
          </span>
          <span class="text-sm pl-3 italic" :aria-hidden="!dragon.name">
            ({{ dragon.id }})
          </span>
        </div>

        <div
          class="uppercase text-xs bg-green-900/70 dark:bg-neutral-950/70 deep-sea:bg-slate-500/40 p-1 rounded-md self-end *:underline-offset-2 absolute -right-2 bottom-4 px-1.5"
          @click.stop
        >
          <span v-tooltip="`Views`">{{ formatNumber(dragon.views) }}V</span> /
          <span v-tooltip="`Unique Views`"
            >{{ formatNumber(dragon.unique) }}U</span
          >
          /
          <span v-tooltip="`Clicks`">{{ formatNumber(dragon.clicks) }}C</span>
        </div>
        <input
          :id="`dragon-check-${dragon.id}`"
          v-model="dragon.inGarden"
          class="justify-self-end -top-2 -right-2 absolute"
          type="checkbox"
          :aria-labelledby="`dragon-${dragon.id}`"
        />
      </div>
    </div>
    <div
      class="*:first:pl-0.5 *:last:pr-0.5 bg-green-900 dark:bg-neutral-950 deep-sea:bg-slate-500 divide-x divide-white dark:divide-stone-400 deep-sea:divide-slate-300 text-xs text-left px-2 py-0.5 rounded-md absolute -bottom-2 -right-2 *:px-2"
      @click.stop
    >
      <span v-if="dragon.isStunned" v-tooltip.bottom="`Stunned`">
        <font-awesome-icon :icon="['fas', 'bolt-lightning']" />
      </span>
      <span v-if="dragon.isIncubated" v-tooltip.bottom="`Incubated`">
        <font-awesome-icon :icon="['fas', 'fire']" />
      </span>
      <span
        v-tooltip.bottom="formatHoursLeft(dragon.hoursleft, true)"
        class="inline-flex items-center"
      >
        <ToggleInput
          v-if="dragon.hoursleft <= 96 || dragon.inSeedTray"
          v-model="dragon.inSeedTray"
          :label="`ER ${formatHoursLeft(dragon.hoursleft)}`"
          size="sm"
          class="text-orange-300 dark:text-red-500 deep-sea:text-red-500 text-shadow-lg text-shadow-black/40 font-semibold"
        />
        <span v-else>{{ formatHoursLeft(dragon.hoursleft) }}</span>
      </span>
      <span
        v-if="settings.showScrollRatio"
        v-tooltip.bottom="`Views to unique views ratio`"
        >{{ formatRatio(dragon.views, dragon.unique) }}</span
      >
      <span>
        <NuxtLink
          v-if="dragon.parent_f && dragon.parent_m"
          class="underline-offset-2 deep-sea:text-white"
          :to="`https://dragcave.net/lineage/${dragon.id}`"
          target="_blank"
          @click.stop
          >LINEAGE</NuxtLink
        >
        <span v-else v-tooltip.bottom="`Caveborn`">CB</span>
      </span>
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
    </div>
  </div>
</template>

<script lang="ts" setup>
import { formatHoursLeft, formatNumber, formatRatio } from '#imports';

defineEmits<{
  (e: 'glowFinished'): void;
}>();

defineProps<{
  recentlyAdded: string[];
  settings: UserSettings;
}>();

const dragon = defineModel<ScrollView>({ required: true });
</script>
