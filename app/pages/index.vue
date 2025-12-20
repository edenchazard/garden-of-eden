<template>
  <div class="w-full space-y-4 *:mx-4">
    <template v-if="userSettings.bubblewrap">
      <audio class="bubblewrap hidden">
        <source src="/audio/bubblewrap-1.mp3" type="audio/mpeg" />
      </audio>
      <audio class="bubblewrap hidden">
        <source src="/audio/bubblewrap-2.mp3" type="audio/mpeg" />
      </audio>
      <audio class="bubblewrap hidden">
        <source src="/audio/bubblewrap-3.mp3" type="audio/mpeg" />
      </audio>
    </template>

    <WarningNewRelease
      v-if="authData?.user && scroll.releaseNotification"
      class="!mx-0"
      :notification="scroll.releaseNotification"
      @dismissed="scroll.releaseNotification = null"
    />

    <div
      v-if="!authData?.user"
      class="mx-auto! flex gap-8 max-w-2xl items-center flex-col md:flex-row"
    >
      <div class="flex flex-col gap-y-4 items-center justify-center">
        <p>
          The <b>Garden of {{ userSettings.siteName }}</b> is a highly secure
          garden where only those with a Dragon Cave account can enter. You'll
          need to sign in to add your <s>plants</s> dragons.
        </p>
        <button
          class="btn-primary py-4 self-stretch"
          type="button"
          @click="signIn('dragcave')"
        >
          Sign in via Dragon Cave
        </button>
        <p class="text-xs">
          The above link will take you directly to
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
      <NuxtPicture
        loading="lazy"
        format="avif,webp"
        src="/illustrations/backwards-binoculars.png"
        sizes="100px md:350px"
        alt="Mint looking through the gates"
      />
    </div>

    <form
      v-else-if="!authData.user.apiBlocked"
      class="flex flex-col gap-y-4 *:mx-4 mx-0!"
      @submit.prevent="saveScroll()"
    >
      <div class="space-y-2 *:max-w-prose order-1">
        <div
          v-if="fetchScrollError"
          class="justify-items-center text-center grid items-center gap-x-4 mx-auto sm:grid-cols-[auto_1fr] sm:text-left sm:justify-items-start"
        >
          <NuxtPicture
            class="row-span-2"
            loading="lazy"
            format="avif,webp"
            :src="
              isChristmas()
                ? `/illustrations/tree-needs-power.png`
                : `/illustrations/tinkering-in-the-garden.png`
            "
            :sizes="isChristmas() ? '120px md:200px' : '150px md:300px'"
            alt="Mint tinkering in the garden"
          />
          <p class="font-bold self-end">Aurrrr naurrr!!!</p>
          <p class="col-start-2">
            There was an error trying to fetch your scroll. Whack that reload
            button and try again.
            <NuxtLink to="/statistics#api-requests">
              Go here to check if Dragon Cave is having issues</NuxtLink
            >.
          </p>
        </div>
        <template v-else>
          <div
            v-if="!scroll.dragons.length"
            class="justify-items-center text-center grid items-center gap-x-4 mx-auto sm:grid-cols-[auto_1fr] sm:text-left sm:justify-items-start"
          >
            <NuxtPicture
              class="row-span-2"
              loading="lazy"
              format="avif,webp"
              src="/illustrations/lost-at-sea.png"
              sizes="150px md:300px"
              alt="Matthias fishing for eggs"
            />
            <p class="font-bold self-end">It's a bit empty here.</p>
            <p class="col-start-2">
              It looks like you've got no dragons! Time to hit up that cave and
              go get some! Or, sit and fish with Matthias.
            </p>
          </div>
          <div class="text-sm space-y-1">
            <p v-if="eggClosestToHatching">
              <template v-if="eggClosestToHatching.hoursleft <= 96">
                Next egg can hatch now.
              </template>
              <template v-else>
                Next egg could hatch in
                {{ eggClosestToHatching.hoursleft - 96 }}
                {{ pluralise('hour', eggClosestToHatching.hoursleft - 96) }}.
              </template>
              <NuxtLink to="#eggs" class="underline">[Jump]</NuxtLink>
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
              <NuxtLink to="#hatchlings" class="underline">[Jump]</NuxtLink>
            </p>
            <p class="text-xs">
              Hidden dragons are not shown and will be regularly removed.
            </p>
            <aside class="text-xs">
              Your dragons have received
              <b class="font-bold">{{
                Intl.NumberFormat().format(scroll.details.clicksToday)
              }}</b>
              clicks in the last 24 hours from other gardeners.
            </aside>
          </div>
        </template>
      </div>

      <template v-if="scroll.dragons.length > 0">
        <template v-if="userSettings.scrollLayout === 'card'">
          <fieldset
            v-if="hatchlings.length"
            class="transition-opacity pt-2 box-border flex flex-col"
            :disabled="isProcessing"
            :class="{
              'opacity-50': isProcessing,
              'order-2': userSettings.sectionOrder === 'hatchlings,eggs',
              'order-3': userSettings.sectionOrder === 'eggs,hatchlings',
            }"
          >
            <legend id="hatchlings" class="text-sm font-bold">
              Hatchlings
            </legend>
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
                      hatchling.inGarden = !hatchling.inGarden;
                    }
                  }
                "
                @glow-finished="recentlyAdded = []"
              />
            </div>
          </fieldset>
          <fieldset
            class="transition-opacity pt-2 flex-1"
            :disabled="isProcessing"
            :class="{
              'opacity-50': isProcessing,
              'order-3': userSettings.sectionOrder === 'hatchlings,eggs',
              'order-2': userSettings.sectionOrder === 'eggs,hatchlings',
            }"
          >
            <legend id="eggs" class="text-sm font-bold">Eggs</legend>
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
                      egg.inGarden = !egg.inGarden;
                    }
                  }
                "
              />
            </div>
          </fieldset>
        </template>

        <div v-else class="order-2 contain-inline-size overflow-x-auto mx-0!">
          <ScrollTable
            class="transition-opacity w-full"
            :class="{
              'opacity-50': isProcessing,
            }"
            :hidden-columns="hiddenTableColumns"
            :disabled="isProcessing"
          >
            <template
              v-if="userSettings.sectionOrder === 'hatchlings,eggs'"
              #default="{ hiddenColumns, disabled }"
            >
              <ScrollTableTbody
                id="hatchlings"
                :dragons="hatchlings"
                header="Hatchlings"
                :hidden-columns
                :disabled
              />
              <ScrollTableTbody
                id="eggs"
                :dragons="eggs"
                header="Eggs"
                :hidden-columns
                :disabled
              />
            </template>
            <template v-else #default="{ hiddenColumns, disabled }">
              <ScrollTableTbody
                id="eggs"
                :dragons="eggs"
                header="Eggs"
                :hidden-columns
                :disabled
              />
              <ScrollTableTbody
                id="hatchlings"
                :dragons="hatchlings"
                header="Hatchlings"
                :hidden-columns
                :disabled
              />
            </template>
          </ScrollTable>
        </div>
      </template>
      <ScrollToolbar
        id="scroll-toolbar"
        v-model:sort="userSettings.sort"
        class="order-4 bottom-0 sticky z-10 p-2 !mx-0"
        :dragons="scroll.dragons"
        :settings="userSettings"
        :fetch-scroll-status
        :save-scroll-status
        @reload="refreshScroll()"
        @toggle-all="toggleAll"
      />
    </form>

    <template v-if="isChristmas()">
      <div ref="formEnd" aria-hidden="true" class="h-px !m-0" />
      <Transition
        class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
      >
        <div
          v-if="scrollUpdated && isChristmas()"
          class="px-4 max-w-prose justify-items-center text-center grid items-center gap-x-4 !mx-auto sm:grid-cols-[auto_1fr] sm:text-left sm:justify-items-start"
        >
          <NuxtPicture
            class="row-span-2"
            loading="lazy"
            format="avif,webp"
            src="/illustrations/wrapping-presents.png"
            sizes="120px md:200px"
            alt="Matthias wrapping eggs"
          />
          <p class="font-bold self-end">{{ getUpdatedTexts() }}</p>
          <p class="col-start-2">
            While you're here... why not give the gift of clicks this Christmas?
          </p>
        </div>
      </Transition>
    </template>

    <section class="space-y-2">
      <h2 class="text-2xl text-white">Seed tray</h2>
      <HatcheryView
        v-model:frequency="userSettings.seedTrayFrequency"
        v-model:per-page="userSettings.seedTrayPerPage"
        :highlight-clicked-dragons="userSettings.highlightClickedDragons"
        :bubblewrap="userSettings.bubblewrap"
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
              class="grid grid-cols-[1fr_auto_1fr] flex-1 items-center p-2 bg-green-300/20 dark:bg-stone-500/20 deep-sea:bg-indigo-900/20 rounded-md text-center"
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
        :bubblewrap="userSettings.bubblewrap"
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
              class="grid grid-cols-[1fr_auto_1fr] flex-1 items-center p-2 bg-green-300/20 dark:bg-stone-500/20 deep-sea:bg-indigo-800/20 rounded-md text-center"
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
import { useElementVisibility } from '@vueuse/core';
import ScrollTable from '~/components/ScrollTable.vue';
import WarningNewRelease from '~/components/WarningNewRelease.vue';
import isChristmas from '~/utils/isChristmas';
import type { userNotificationTable } from '~~/database/schema';
import HappyMatthias from '~~/public/npc/happy_matthias.webp';

const { data: authData, signIn } = useAuth();
const { userSettings } = useUserSettings(true);

const scrollUpdated = ref(false);

const savedDragons = reactive({
  seedTray: 0,
  garden: 0,
});

const formEndVisible = useElementVisibility(useTemplateRef('formEnd'), {
  threshold: 0,
});

const {
  data: scroll,
  execute: fetchScroll,
  status: fetchScrollStatus,
  error: fetchScrollError,
} = await useFetch<{
  releaseNotification: null | typeof userNotificationTable.$inferSelect;
  details: { clicksToday: number };
  dragons: ScrollView[];
}>('/api/user/scroll', {
  headers: computed(() => ({
    'Csrf-token': useCsrf().csrf,
  })),
  immediate: !!authData.value?.user,
  deep: true,
  default() {
    return {
      releaseNotification: null,
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
} = useFetch('/api/user/scroll', {
  headers: computed(() => ({
    'Csrf-token': useCsrf().csrf,
  })),
  immediate: false,
  watch: false,
  deep: true,
  default: () => [],
  method: 'PATCH',
  body: computed(() =>
    scroll.value.dragons.map((dragon) => ({
      id: dragon.id,
      inSeedTray: dragon.inSeedTray,
      inGarden: dragon.inGarden,
    }))
  ),
  async onResponse({ response }) {
    if (!response.ok) {
      toast.error('Failed to save your scroll. Please try again.');
      scrollUpdated.value = false;
      return;
    }

    savedDragons.seedTray = scroll.value.dragons.filter(
      (dragon) => dragon.inSeedTray
    ).length;

    savedDragons.garden = scroll.value.dragons.filter(
      (dragon) => dragon.inGarden
    ).length;

    scrollUpdated.value = true;

    console.log('formEndVisible', formEndVisible.value);

    if (!formEndVisible.value) {
      toast.success(
        `${getUpdatedTexts()} <img class="inline" src="${HappyMatthias}" alt="Happy Matthias" />`,
        {
          dangerouslyHTMLString: true,
        }
      );
    }
  },
});

const hiddenTableColumns = computed(() => {
  const hidden: string[] = [];

  if (!userSettings.value.showScrollRatio) {
    hidden.push('V:UV');
  }

  if (
    !scroll.value.dragons.some(
      (dragon) => dragon.hoursleft <= 96 || dragon.inSeedTray
    )
  ) {
    hidden.push('Seed Tray');
  }
  return hidden;
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
    if (oldDragon) dragon.inGarden = oldDragon.inGarden;
  });
}

function toggleAll(checked: boolean) {
  if (!authData.value?.user) {
    return;
  }

  scroll.value.dragons
    .filter(filterSelectAll(userSettings.value))
    .forEach((dragon) => {
      dragon.inGarden = checked;

      if (userSettings.value.autoSeedTray && dragon.hoursleft <= 96) {
        dragon.inSeedTray = checked;
      }
    });
}

function getUpdatedTexts(): string {
  const texts: string[] = [];

  if (savedDragons.seedTray > 0) {
    texts.push(
      `${savedDragons.seedTray} ${pluralise('dragon', savedDragons.seedTray)} in the seed tray`
    );
  }

  texts.push(
    `${savedDragons.garden > 0 ? savedDragons.garden : 'no'} ${pluralise('dragon', savedDragons.garden)} in the garden`
  );

  return 'Scroll updated! You have ' + texts.join(' and ') + `.`;
}
</script>
