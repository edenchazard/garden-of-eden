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

    <div
      v-if="!authData?.user"
      class="mx-auto flex gap-8 max-w-2xl items-center flex-col md:flex-row"
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
      class="flex flex-col gap-y-4 *:mx-4 !mx-0"
      @submit.prevent="saveScroll()"
    >
      <div class="*:max-w-prose order-1">
        <div
          v-if="fetchScrollError"
          class="flex flex-col sm:flex-row items-center gap-4 mx-auto"
        >
          <NuxtPicture
            loading="lazy"
            format="avif,webp"
            src="/illustrations/tinkering-in-the-garden.png"
            sizes="150px md:300px"
            alt="Mint tinkering in the garden"
          />
          <div>
            <span class="font-bold">Aurrrr naurrr!!!</span>
            <p>
              There was an error trying to fetch your scroll. Whack that reload
              button and try again.
            </p>
          </div>
        </div>
        <template v-else>
          <div
            v-if="!scroll.dragons.length"
            class="flex flex-col sm:flex-row items-center gap-4 mx-auto"
          >
            <NuxtPicture
              loading="lazy"
              format="avif,webp"
              src="/illustrations/lost-at-sea.png"
              sizes="150px md:300px"
              alt="Matthias fishing for eggs"
            />
            <div>
              <span class="font-bold">It's a bit empty here.</span>
              <p>
                It looks like you've got no dragons! Time to hit up that cave
                and go get some! Or, sit and fish with Matthias.
              </p>
            </div>
          </div>
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
          class="transition-opacity pt-2 flex-1"
          :disabled="isProcessing"
          :class="{
            'opacity-50': isProcessing,
            'order-3': userSettings.sectionOrder === 'hatchlings,eggs',
            'order-2': userSettings.sectionOrder === 'eggs,hatchlings',
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
      </template>

      <div v-else class="order-2 contain-inline-size overflow-x-auto !mx-0">
        <ScrollTable class="w-full">
          <template v-if="userSettings.sectionOrder === 'hatchlings,eggs'">
            <ScrollTableTbody :dragons="hatchlings" header="Hatchlings" />
            <ScrollTableTbody :dragons="eggs" header="Eggs" />
          </template>
          <template v-else>
            <ScrollTableTbody :dragons="eggs" header="Eggs" />
            <ScrollTableTbody :dragons="hatchlings" header="Hatchlings" />
          </template>
        </ScrollTable>
      </div>

      <ScrollToolbar
        id="scroll-toolbar"
        v-model:sort="userSettings.sort"
        v-model:layout="layout"
        class="!mt-6 order-4"
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
import ScrollTable from '~/components/ScrollTable.vue';
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
} = useFetch('/api/user/scroll', {
  headers: computed(() => ({
    'Csrf-token': useCsrf().csrf,
  })),
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
