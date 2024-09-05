<template>
  <div class="space-y-4">
    <div v-if="!authData?.user" class="flex flex-col gap-y-4 text-center">
      <p>
        The <b>Garden of Eden</b> is a highly secure garden where only those
        with a DragCave account can enter. You'll need to sign in to add your
        <s>plants</s> dragons.
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
          >The Garden of Eden only stores your user id and username, not your
          password.</em
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

    <form v-else @submit.prevent="saveScroll()">
      <p v-if="fetchScrollStatus === 'error'" class="text-center">
        Aurrrr naurrr!!! There was an error trying to fetch your scroll. Whack
        that reload button and try again.
      </p>

      <p v-if="dragons.length" class="text-left ml-1 !mt-0 max-w-prose">
        Hidden dragons are not shown and will be removed regularly.
      </p>

      <fieldset
        class="space-y-6 transition-opacity"
        :disabled="isProcessing"
        :class="{
          'opacity-50': isProcessing,
        }"
      >
        <legend class="text-2xl sr-only">Your scroll</legend>
        <div
          class="grid gap-6 pr-2"
          :style="{
            gridTemplateColumns: `repeat(auto-fill, minmax(17rem, 1fr))`,
          }"
        >
          <ScrollPanel
            v-for="(dragon, i) in dragons"
            :key="dragon.id"
            v-model="dragons[i]"
            :settings="userSettings"
            :recently-added
            @click="
              () => {
                if (!isProcessing) {
                  dragon.in_garden = !dragon.in_garden;
                }
              }
            "
          />
        </div>
        <ScrollToolbar
          id="scroll-toolbar"
          v-model:sort="userSettings.sort"
          :dragons
          :settings="userSettings"
          :fetch-scroll-status
          :save-scroll-status
          @reload="refreshScroll()"
          @toggle-all="toggleAll"
        />
      </fieldset>
    </form>

    <section class="space-y-2">
      <h2 class="text-2xl text-white">Seed tray</h2>
      <HatcheryView
        v-model:frequency="userSettings.seedTrayFrequency"
        v-model:per-page="userSettings.seedTrayPerPage"
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
const { data: authData, signIn } = useAuth();
const { userSettings } = useUserSettings(true);

const {
  data: dragons,
  execute: fetchScroll,
  status: fetchScrollStatus,
} = await useFetch('/api/user/scroll', {
  immediate: !!authData.value?.user,
  default: () => [],
});

const {
  data: recentlyAdded,
  execute: saveScroll,
  status: saveScrollStatus,
} = useAsyncData(
  () =>
    $fetch('/api/user/scroll', {
      method: 'PATCH',
      body: dragons.value.map((dragon) => ({
        id: dragon.id,
        in_seed_tray: dragon.in_seed_tray,
        in_garden: dragon.in_garden,
      })),
      onResponse({ response }) {
        if (!response.ok) {
          toast.error('Failed to save your scroll. Please try again.');
          return;
        }

        setTimeout(() => (recentlyAdded.value = []), 1000);

        const seedTray = dragons.value.filter((dragon) => dragon.in_seed_tray);
        const garden = dragons.value.filter((dragon) => dragon.in_garden);
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
    }),
  {
    immediate: false,
    default: () => [],
  }
);

const isProcessing = computed(() =>
  [fetchScrollStatus.value, saveScrollStatus.value].includes('pending')
);
watch(
  () => [userSettings.value.sort, dragons],
  () => {
    if (userSettings.value.sort === 'Youngest First') {
      dragons.value.sort((a, b) => {
        const valueA = a.hatch + '' + a.hoursleft;
        const valueB = b.hatch + '' + b.hoursleft;
        return valueA.localeCompare(valueB);
      });
    }

    if (userSettings.value.sort === 'Oldest First') {
      dragons.value.sort((a, b) => {
        const valueA = a.hatch + '' + a.hoursleft;
        const valueB = b.hatch + '' + b.hoursleft;
        return valueB.localeCompare(valueA);
      });
    }
  },
  {
    immediate: true,
    deep: true,
  }
);

async function refreshScroll() {
  const currentState = [...dragons.value];
  await fetchScroll();
  dragons.value.forEach((dragon) => {
    const oldDragon = currentState.find((d) => d.id === dragon.id);
    if (oldDragon) dragon.in_garden = oldDragon.in_garden;
  });
}

function toggleAll(checked: boolean) {
  if (!authData.value?.user) {
    return;
  }

  dragons.value
    .filter(filterSelectAll(userSettings.value))
    .forEach((dragon) => {
      dragon.in_garden = checked;

      if (userSettings.value.autoSeedTray && dragon.hoursleft <= 96) {
        dragon.in_seed_tray = checked;
      }
    });
}
</script>
