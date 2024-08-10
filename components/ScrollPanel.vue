<template>
  <div
    class="relative cursor-pointer transition-shadow"
    :class="{
      'opacity-50': !dragon.inHatchery,
      'shadow-[0px_0px_15px_1px] shadow-yellow-600': recentlyAdded.includes(
        dragon.id
      ),
    }"
  >
    <div
      class="grid grid-cols-[45px_1fr] gap-x-3 gap-y-2 p-2 pb-4 rounded-md items-center border content-border justify-items-start overflow-hidden"
      :class="
        dragon.inHatchery
          ? 'bg-green-500 dark:bg-neutral-800 border-transparent'
          : 'border-green-500 dark:border-neutral-600'
      "
    >
      <NuxtLink
        :to="`https://dragcave.net/view/${dragon.id}`"
        target="_blank"
        class="size-[45px] flex items-center justify-center rounded-md border border-green-400 dark:border-stone-700"
        :aria-labelledby="`dragon-${dragon.id}`"
        @click.stop
      >
        <img
          alt=""
          loading="lazy"
          class="max-w-full max-h-full"
          :src="`https://dragcave.net/image/${dragon.id}/1`"
        />
      </NuxtLink>
      <div class="text-left w-full">
        <span :id="`dragon-${dragon.id}`" class="block truncate font-bold">
          <span v-if="dragon.hatch !== '0'" :aria-hidden="!dragon.name">{{
            dragon.name ?? 'Unnamed'
          }}</span>
          <span class="sr-only" :aria-hidden="!!dragon.name"
            >({{ dragon.id }})</span
          >
        </span>
        <span class="text-sm pl-3 italic" :aria-hidden="!dragon.name">
          ({{ dragon.id }})
        </span>
      </div>

      <div
        class="uppercase text-xs bg-green-900/70 dark:bg-neutral-950/70 p-1 rounded-md self-end *:underline-offset-2 absolute -right-2 bottom-4 px-1.5"
      >
        {{ formatNumber(dragon.views) }}<abbr title="Views">V</abbr> /
        {{ formatNumber(dragon.unique) }}<abbr title="Unique Views">U</abbr> /
        {{ formatNumber(dragon.clicks) }}<abbr title="Clicks">C</abbr>
      </div>
      <input
        :id="`dragon-check-${dragon.id}`"
        v-model="dragon.inHatchery"
        class="justify-self-end -top-2 -right-2 absolute"
        type="checkbox"
        :aria-labelledby="`dragon-${dragon.id}`"
      />
    </div>
    <div
      class="first:*:pl-0.5 last:*:pr-0.5 bg-green-900 dark:bg-neutral-950 divide-x divide-white dark:divide-stone-400 text-xs text-left px-2 py-0.5 rounded-md absolute -bottom-2 -right-2 *:px-2"
    >
      <span
        v-if="settings.showScrollRatio"
        title="Views to unique views ratio"
        >{{ formatRatio(dragon.views, dragon.unique) }}</span
      >
      <span>
        <NuxtLink
          v-if="dragon.parent_f && dragon.parent_m"
          class="decoration-transparent"
          :to="`https://dragcave.net/lineage/${dragon.id}`"
          target="_blank"
          @click.stop
          >LINEAGE</NuxtLink
        >
        <span v-else>CB</span>
      </span>
      <span v-if="dragon.gender" :title="dragon.gender">
        <font-awesome-icon
          v-if="dragon.gender === 'Male'"
          :icon="['fas', 'mars']"
        />
        <font-awesome-icon
          v-else-if="dragon.gender === 'Female'"
          :icon="['fas', 'venus']"
        />
      </span>
      <span>
        {{ formatHoursLeft(dragon.hoursleft) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  recentlyAdded: string[];
  settings: UserSettings;
}>();

const dragon = defineModel<ScrollView>({ required: true });
</script>
