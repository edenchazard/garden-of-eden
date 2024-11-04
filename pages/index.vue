<template>
  <div class="space-y-4">
    <div v-if="!authData?.user" class="flex flex-col gap-y-4 text-center">
      <p>
        The <b>Garden of {{ userSettings.siteName }}</b> is a highly secure
        garden where only those with a DragCave account can enter. You'll need
        to sign in to add your <s>plants</s> dragons.
      </p>
      <button
        class="btn-primary py-4"
        type="button"
        @click="signIn('dragcave')"
      >
        Sign in via Dragon Cave
      </button>
      <p class="text-xs">
        * The above link will take you directly to
        <b class="font-normal">dragcave.net</b>.
        <em class="italic"
          >The Garden of {{ userSettings.siteName }} only stores your user id
          and username, not your password.</em
        >
      </p>
      <p>
        Without signing in, you can still give views and clicks, but you won't
        be able to add your own plants.
        <span class="italic">
          You're basically looking through the gate and waving at the plants
          like a madman.
        </span>
      </p>
    </div>

    <form v-else class="space-y-4" @submit.prevent="saveScroll()">
      <div class="*:max-w-prose">
        <p v-if="fetchScrollError">
          Aurrrr naurrr!!! There was an error trying to fetch your scroll. Whack
          that reload button and try again.
        </p>
        <template v-else>
          <p v-if="!scroll.dragons.length">
            It looks like you've got no dragons! Time to hit up that cave and go
            get some!
          </p>
          <p>Hidden dragons are not shown and will be regularly removed.</p>
          <p class="text-sm">
            Your dragons have received
            <b class="font-bold">{{
              Intl.NumberFormat().format(scroll.details.clicksToday)
            }}</b>
            clicks in the last 24 hours from other gardeners.
          </p>
          <div class="text-sm">
            <p v-if="eggClosestToHatching">
              <template v-if="eggClosestToHatching.hoursleft <= 96">
                Next egg can hatch now.
              </template>
              <template v-else>
                Next egg could hatch in
                {{ eggClosestToHatching.hoursleft - 96 }}
                {{ pluralise('hour', eggClosestToHatching.hoursleft - 96) }}.
              </template>
            </p>
            <p v-if="hatchlingClosestToGrowing">
              <template v-if="hatchlingClosestToGrowing.hoursleft <= 96">
                Next hatchling could grow now.
              </template>
              <template v-else>
                Next hatchling could grow in
                {{ hatchlingClosestToGrowing.hoursleft - 96 }}
                {{
                  pluralise('hour', hatchlingClosestToGrowing.hoursleft - 96)
                }}.
              </template>
            </p>
          </div>
        </template>
      </div>

      <fieldset
        v-if="hatchlings.length"
        class="transition-opacity pt-2"
        :disabled="isProcessing"
        :class="{
          'opacity-50': isProcessing,
        }"
      >
        <legend class="text-sm font-bold">Hatchlings</legend>
        <div
          class="grid gap-6 pr-2"
          :style="{
            gridTemplateColumns: `repeat(auto-fill, minmax(17rem, 1fr))`,
          }"
        >
          <ScrollPanel
            v-for="(hatchling, i) in hatchlings"
            :key="hatchling.id"
            v-model="hatchlings[i]"
            :settings="userSettings"
            :recently-added
            @click="
              () => {
                if (!isProcessing) {
                  hatchling.in_garden = !hatchling.in_garden;
                }
              }
            "
          />
        </div>
      </fieldset>
      <fieldset
        v-if="eggs.length"
        class="transition-opacity pt-2"
        :disabled="isProcessing"
        :class="{
          'opacity-50': isProcessing,
        }"
      >
        <legend class="text-sm font-bold">Eggs</legend>
        <div
          class="grid gap-6 pr-2"
          :style="{
            gridTemplateColumns: `repeat(auto-fill, minmax(17rem, 1fr))`,
          }"
        >
          <ScrollPanel
            v-for="(egg, i) in eggs"
            :key="egg.id"
            v-model="eggs[i]"
            :settings="userSettings"
            :recently-added
            @click="
              () => {
                if (!isProcessing) {
                  egg.in_garden = !egg.in_garden;
                }
              }
            "
          />
        </div>
      </fieldset>

      <ScrollToolbar
        id="scroll-toolbar"
        v-model:sort="userSettings.sort"
        class="!mt-6"
        :dragons="scroll.dragons"
        :settings="userSettings"
        :fetch-scroll-status
        :save-scroll-status
        @reload="refreshScroll()"
        @toggle-all="toggleAll"
      />
    </form>

    <section class="space-y-2">
      <h2 class="text-2xl text-white">Seed tray</h2>
      <HatcheryView
        v-model:frequency="userSettings.seedTrayFrequency"
        v-model:per-page="userSettings.seedTrayPerPage"
        :highlight-clicked-dragons="userSettings.highlightClickedDragons"
        label="seed-tray"
        :query="{ area: 'seed_tray' }"
        cache-bust
      >
        <template #blurb="{ statistics }">
          <div class="flex flex-col gap-4 md:flex-row">
            <p class="max-w-prose w-full">
              These seeds and saplings are wilting and have less than 4 days to
              live before they return to the soil. They need your green thumb
              urgently.
            </p>
            <div
              class="grid grid-cols-[1fr_auto_1fr] flex-1 items-center p-2 bg-green-300/20 dark:bg-stone-500/20 rounded-md text-center"
            >
              <div>
                <b class="text-2xl font-bold block">{{
                  Intl.NumberFormat().format(statistics.total)
                }}</b>
                dragons
              </div>
              <span class="text-2xl opacity-70 italic">/</span>
              <div>
                <b class="text-2xl font-bold block">{{
                  Intl.NumberFormat().format(statistics.scrolls)
                }}</b>
                scrolls
              </div>
            </div>
          </div>
        </template>
        <template #empty>
          <p class="text-center">
            The seed tray is empty. That's a good thing!
          </p>
        </template>
      </HatcheryView>
    </section>

    <section class="space-y-2">
      <h2 class="text-2xl text-white">Garden</h2>
      <HatcheryView
        v-model:frequency="userSettings.gardenFrequency"
        v-model:per-page="userSettings.gardenPerPage"
        :highlight-clicked-dragons="userSettings.highlightClickedDragons"
        label="garden"
        :query="{ area: 'garden' }"
      >
        <template #blurb="{ statistics }">
          <div class="flex flex-col gap-4 md:flex-row">
            <p class="max-w-prose">
              You enter the garden and see many large dragons scattered about,
              some with saplings&mdash; <em class="italic">Wait, what</em>? This
              is a garden, not a dragon's cave!
            </p>
            <div
              class="grid grid-cols-[1fr_auto_1fr] flex-1 items-center p-2 bg-green-300/20 dark:bg-stone-500/20 rounded-md text-center"
            >
              <div>
                <b class="text-2xl font-bold block">{{
                  Intl.NumberFormat().format(statistics.total)
                }}</b>
                dragons
              </div>
              <span class="text-2xl opacity-70 italic">/</span>
              <div>
                <b class="text-2xl font-bold block">{{
                  Intl.NumberFormat().format(statistics.scrolls)
                }}</b>
                scrolls
              </div>
            </div>
          </div>
        </template>
      </HatcheryView>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { pluralise } from '#imports';
const { data: authData, signIn } = useAuth();
const { userSettings } = useUserSettings(true);

const {
  data: scroll,
  execute: fetchScroll,
  status: fetchScrollStatus,
  error: fetchScrollError,
} = await useFetch<{
  details: { clicksToday: number };
  dragons: ScrollView[];
}>('/api/user/scroll', {
  headers: computed(() => ({
    'Csrf-token': useCsrf().csrf,
  })),
  immediate: !!authData.value?.user,
  default() {
    return {
      details: {
        clicksToday: 0,
      },
      dragons: [],
    };
  },
});

const {
  data: recentlyAdded,
  execute: saveScroll,
  status: saveScrollStatus,
} = useCsrfFetch('/api/user/scroll', {
  immediate: false,
  watch: false,
  default: () => [],
  method: 'PATCH',
  body: computed(() =>
    scroll.value.dragons.map((dragon) => ({
      id: dragon.id,
      in_seed_tray: dragon.in_seed_tray,
      in_garden: dragon.in_garden,
    }))
  ),
  onResponse({ response }) {
    if (!response.ok) {
      toast.error('Failed to save your scroll. Please try again.');
      return;
    }

    setTimeout(() => (recentlyAdded.value = []), 1000);

    const seedTray = scroll.value.dragons.filter(
      (dragon) => dragon.in_seed_tray
    );
    const garden = scroll.value.dragons.filter((dragon) => dragon.in_garden);
    const texts = [];

    if (seedTray.length > 0) {
      texts.push(
        `${seedTray.length} ${pluralise('dragon', seedTray.length)} in the seed tray`
      );
    }

    texts.push(
      `${garden.length > 0 ? garden.length : 'no'} ${pluralise('dragon', garden.length)} in the garden`
    );
    toast.success('Scroll updated! You have ' + texts.join(' and ') + '.');
    return;
  },
});

const isProcessing = computed(() =>
  [fetchScrollStatus.value, saveScrollStatus.value].includes('pending')
);

const eggClosestToHatching = computed(() => {
  const eggs = scroll.value.dragons.filter((dragon) => dragon.hatch === '0');

  if (eggs.length > 0) {
    return eggs.reduce(
      (minDragon, currentDragon) =>
        currentDragon.hoursleft < minDragon.hoursleft
          ? currentDragon
          : minDragon,
      eggs[0]
    );
  }
  return null;
});

const hatchlingClosestToGrowing = computed(() => {
  const hatchlings = scroll.value.dragons.filter(
    (dragon) => dragon.hatch !== '0' && dragon.grow === '0'
  );

  if (hatchlings.length > 0) {
    return hatchlings.reduce(
      (minDragon, currentDragon) =>
        currentDragon.hoursleft < minDragon.hoursleft
          ? currentDragon
          : minDragon,
      hatchlings[0]
    );
  }
  return null;
});

const eggs = computed(() =>
  scroll.value.dragons.filter((dragon) => dragon.hatch === '0')
);

const hatchlings = computed(() =>
  scroll.value.dragons.filter((dragon) => dragon.hatch !== '0')
);

const sortDragonsAndEggs = (sortOrder: 'Youngest First' | 'Oldest First') => {
  const sort = (a: ScrollView, b: ScrollView) =>
    sortOrder === 'Youngest First'
      ? b.hoursleft - a.hoursleft
      : a.hoursleft - b.hoursleft;

  eggs.value.sort(sort);
  hatchlings.value.sort(sort);
};

watch(
  () => [userSettings.value.sort, scroll],
  () => sortDragonsAndEggs(userSettings.value.sort),
  {
    immediate: true,
    deep: true,
  }
);

async function refreshScroll() {
  const currentState = [...scroll.value.dragons];
  await fetchScroll();
  scroll.value.dragons.forEach((dragon) => {
    const oldDragon = currentState.find((d) => d.id === dragon.id);
    if (oldDragon) dragon.in_garden = oldDragon.in_garden;
  });
}

function toggleAll(checked: boolean) {
  if (!authData.value?.user) {
    return;
  }

  scroll.value.dragons
    .filter(filterSelectAll(userSettings.value))
    .forEach((dragon) => {
      dragon.in_garden = checked;

      if (userSettings.value.autoSeedTray && dragon.hoursleft <= 96) {
        dragon.in_seed_tray = checked;
      }
    });
}
</script>
