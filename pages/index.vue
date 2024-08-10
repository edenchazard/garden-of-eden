<template>
  <div>
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
      <fieldset
        class="space-y-6 transition-opacity"
        :disabled="isProcessing"
        :class="{
          'opacity-50': isProcessing,
        }"
      >
        <legend class="text-2xl sr-only">Your scroll</legend>
        <p class="text-left ml-1 !mt-0 max-w-prose">
          Hidden dragons are not shown and will be removed regularly.
        </p>
        <div
          class="grid gap-6"
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
            @click="dragon.inHatchery = !dragon.inHatchery"
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

    <section class="py-2 rounded-sm space-y-4">
      <h2 class="text-2xl text-white">Garden</h2>
      <div class="flex flex-col gap-4 md:flex-row">
        <p class="max-w-prose">
          You enter the garden and see many large dragons scattered about, some
          with saplings&mdash; <em class="italic">Wait, what</em>? This is a
          garden, not a dragon's cave!
        </p>
        <div
          class="grid grid-cols-[1fr_auto_1fr] flex-1 items-center p-2 bg-green-300/20 dark:bg-stone-500/20 rounded-md text-center"
        >
          <div>
            <b class="text-2xl font-bold block">{{
              hatchery.statistics.total
            }}</b>
            dragons
          </div>
          <span class="text-2xl opacity-70 italic">/</span>
          <div>
            <b class="text-2xl font-bold block">{{
              hatchery.statistics.scrolls
            }}</b>
            scrolls
          </div>
        </div>
      </div>
      <div
        class="items-center gap-y-2 gap-x-4 text-center p-2 rounded-md grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto_1fr] md:grid-cols-[auto_auto_auto_1fr_auto_auto] bg-black/30"
      >
        <label for="showing">Showing</label>
        <select
          id="showing"
          v-model.number="userSettings.perPage"
          class="md:min-w-40"
        >
          <option value="10">10 dragons</option>
          <option value="25">25 dragons</option>
          <option value="50">50 dragons</option>
          <option value="100">100 dragons</option>
          <option value="150">150 dragons</option>
          <option value="200">200 dragons</option>
        </select>
        <label for="every">every</label>
        <select
          id="every"
          v-model.number="userSettings.frequency"
          class="w-full md:max-w-40"
        >
          <option value="15">15 seconds</option>
          <option value="30">30 seconds</option>
          <option value="60">1 minute</option>
          <option value="120">2 minutes</option>
          <option value="300">5 minutes</option>
        </select>
        <ClientOnly>
          <button
            v-if="refreshing"
            type="button"
            class="btn- col-span-full sm:col-span-2 md:col-auto bg-rose-900 text-white"
            @click="pause()"
          >
            <font-awesome-icon :icon="['fas', 'pause']" />
            Pause
          </button>
          <button
            v-else
            type="button"
            class="btn- col-span-full sm:col-span-2 md:col-auto bg-emerald-900 text-white motion-safe:animate-pulse"
            @click="
              () => {
                resume();
                fetchHatchery();
              }
            "
          >
            <font-awesome-icon :icon="['fas', 'play']" />
            Continue
          </button>
          <button
            type="button"
            class="col-span-full sm:col-span-2 md:col-auto btn-primary"
            @click="
              () => {
                if (refreshing) {
                  pause();
                  resume();
                }
                fetchHatchery();
              }
            "
          >
            <font-awesome-icon
              :icon="['fas', 'rotate']"
              :class="{
                'animate-spin': hatcheryStatus === 'pending',
              }"
            />
            Reload
          </button>
        </ClientOnly>
      </div>
      <div
        v-memo="hatchery.dragons"
        class="grid justify-center gap-1 mx-auto"
        :style="{
          gridTemplateColumns: `repeat(auto-fit, 45px)`,
          gridAutoRows: `45px`,
        }"
      >
        <a
          v-for="dragon in hatchery.dragons"
          :key="dragon.code"
          class="size-full flex items-center justify-center"
          :href="`https://dragcave.net/view/${dragon.code}`"
          target="_blank"
        >
          <img
            :alt="dragon.code"
            :src="`https://dragcave.net/image/${dragon.code}.gif`"
          />
        </a>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { useIntervalFn } from '@vueuse/core';
import ScrollPanel from '~/components/ScrollPanel.vue';

const { data: authData, signIn } = useAuth();
const { data: userSettings } = await useFetch('/api/user/settings', {
  default: () => userSettingsSchema.parse({}),
});

const {
  data: dragons,
  execute: fetchScroll,
  status: fetchScrollStatus,
} = await useFetch('/api/user/scroll', {
  immediate: !!authData.value?.user,
  default: () => [],
});

const {
  data: hatchery,
  execute: fetchHatchery,
  status: hatcheryStatus,
} = await useFetch('/api/hatchery', {
  default: () => ({
    dragons: [],
    statistics: {
      total: 0,
      scrolls: 0,
    },
  }),
  params: computed(() => ({
    limit: userSettings.value.perPage,
  })),
  watch: [() => [userSettings.value.frequency, userSettings.value.perPage]],
});

const {
  data: recentlyAdded,
  execute: saveScroll,
  status: saveScrollStatus,
} = useAsyncData(
  () =>
    $fetch('/api/user/scroll', {
      method: 'PATCH',
      body: dragons.value
        .filter((dragon) => dragon.inHatchery)
        .map((dragon) => dragon.id),
      onResponse() {
        setTimeout(() => (recentlyAdded.value = []), 1000);
      },
    }),
  {
    immediate: false,
    default: () => [],
  }
);

const {
  pause,
  resume,
  isActive: refreshing,
} = useIntervalFn(
  fetchHatchery,
  computed(() => userSettings.value.frequency * 1000)
);

const isProcessing = computed(() =>
  [fetchScrollStatus.value, saveScrollStatus.value].includes('pending')
);

watch(
  userSettings,
  () => {
    if (!authData.value?.user) {
      return;
    }

    $fetch('/api/user/settings', {
      method: 'PATCH',
      body: userSettings.value,
    });
  },
  {
    deep: true,
  }
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
    if (oldDragon) dragon.inHatchery = oldDragon.inHatchery;
  });
}

function toggleAll(checked: boolean) {
  dragons.value
    .filter(filterSelectAll(userSettings.value))
    .forEach((dragon) => {
      dragon.inHatchery = checked;
    });
}
</script>
