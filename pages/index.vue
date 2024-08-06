<template>
  <main class="bg-green-600/80 dark:bg-neutral-900 p-4 space-y-4">
    <div class="w-full text-center">
      <div
        v-if="!authData?.user"
        class="flex flex-col gap-y-4"
      >
        <p>
          The <b>Garden Of Eden</b> is a highly secure garden where only those
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
            >The Garden Of Eden only stores your user id and username, not your
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

      <form
        v-else
        @submit.prevent="saveScroll()"
      >
        <fieldset
          class="space-y-6 transition-opacity"
          :disabled="isProcessing"
          :class="{
            'opacity-50': isProcessing,
          }"
        >
          <legend class="text-2xl sr-only">Your scroll</legend>
          <div
            class="grid gap-6"
            :style="{
              gridTemplateColumns: `repeat(auto-fill, minmax(17rem, 1fr))`,
            }"
          >
            <ScrollPanel
              v-for="(dragon, i) in dragons"
              :key="dragon.id"
              :recently-added
              v-model="dragons[i]"
              @click="dragon.inHatchery = !dragon.inHatchery"
            />
          </div>
          <ScrollToolbar
            id="scroll-toolbar-2"
            :dragons
            :fetch-scroll-status
            :save-scroll-status
            v-model:sort="userSettings.sort"
            @reload="refreshScroll()"
            @toggle-all="toggleAll"
          />
        </fieldset>
      </form>
    </div>

    <section class="py-2 rounded-sm border-t-2 space-y-4">
      <h2 class="text-2xl text-white">Garden</h2>
      <div
        class="p-2 bg-green-300/20 dark:bg-stone-500/20 rounded-md text-center"
      >
        <p>
          You enter the garden and see many large dragons scattered about, some
          with saplings&mdash; <em class="italic">Wait, what</em>? This is a
          garden, not a dragon's cave!
        </p>
        <p>
          There are currently
          <b>{{ hatchery.statistics.total }}</b> dragons from a total of
          <b>{{ hatchery.statistics.scrolls }}</b> scrolls.
        </p>
      </div>
      <div
        class="gap-y-4 text-center p-2 rounded-md flex flex-col md:flex-row md:items-center bg-black/30"
      >
        <label
          class="mr-2"
          for="showing"
          >Showing</label
        >
        <select
          id="showing"
          v-model.number="userSettings.perPage"
          class="text-black"
        >
          <option value="10">10 dragons</option>
          <option value="25">25 dragons</option>
          <option value="50">50 dragons</option>
          <option value="100">100 dragons</option>
          <option value="150">150 dragons</option>
          <option value="200">200 dragons</option>
        </select>
        <label
          class="mx-2"
          for="every"
          >every</label
        >
        <select
          v-model.number="userSettings.frequency"
          id="every"
        >
          <option value="15">15 seconds</option>
          <option value="30">30 seconds</option>
          <option value="60">1 minute</option>
          <option value="120">2 minutes</option>
          <option value="300">5 minutes</option>
        </select>
        <div
          class="flex-1 flex flex-col md:flex-row gap-y-4 gap-x-8 md:justify-end"
        >
          <ClientOnly>
            <button
              v-if="refreshing"
              type="button"
              class="bg-rose-900 text-white"
              @click="pause()"
            >
              <font-awesome-icon :icon="['fas', 'pause']" />
              Pause
            </button>

            <button
              v-else
              type="button"
              class="bg-emerald-900 text-white motion-safe:animate-pulse"
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
              class="btn-primary"
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
          class="size-full flex items-center justify-center"
          :href="`https://dragcave.net/view/${dragon.code}`"
          target="_blank"
          v-for="dragon in hatchery.dragons"
          :key="dragon.code"
        >
          <img
            :alt="dragon.code"
            :src="`https://dragcave.net/image/${dragon.code}.gif`"
          />
        </a>
      </div>
    </section>
    <div class="w-full hidden lg:block">
      <p
        class="p-2 bg-green-300/20 dark:bg-stone-500/20 rounded-md text-center"
      >
        The Garden of Eden takes its plant growth very seriously. That's why
        stats are continuously logged throughout the day to ensure optimum
        health of the plants.
      </p>
      <ClientOnly>
        <div>
          <Line
            class="h-[32rem] w-full"
            v-if="statisticsLoaded"
            :data="chartData"
            :options="{
              responsive: true,
              maintainAspectRatio: false,
              color: $colorMode.value === 'Mint' ? '#fff' : '#e7e5e4',
              scales: {
                y: {
                  ticks: {
                    color: $colorMode.value === 'Mint' ? '#fff' : '#e7e5e4',
                  },
                },
                x: {
                  ticks: {
                    color: $colorMode.value === 'Mint' ? '#fff' : '#e7e5e4',
                  },
                },
              },
              plugins: {
                title: {
                  color: $colorMode.value === 'Mint' ? '#fff' : '#e7e5e4',
                  display: true,
                  text: 'Garden Growth',
                },
              },
            }"
          />
        </div>
      </ClientOnly>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { useIntervalFn } from "@vueuse/core";
import { Line } from "vue-chartjs";
import ScrollPanel from "~/components/ScrollPanel.vue";

useHead({
  title: "Garden Of Eden",
});

const { data: authData, signIn } = useAuth();

const { data: userSettings } = await useFetch("/api/user/settings", {
  default: () => ({
    frequency: 30,
    perPage: 50,
    sort: "Youngest First" as const,
  }),
});

const chartData = ref();

const statisticsLoaded = ref(false);
const { data: stats, execute: fetchStats } = useAsyncData(() =>
  $fetch("/api/statistics")
);

onNuxtReady(async () => {
  await fetchStats();
  const statistics = stats.value;
  if (statistics === null) return;

  const labels = statistics.dragons.map((stat) =>
    Intl.DateTimeFormat(undefined, {
      timeStyle: "short",
    }).format(new Date(stat.recorded_on))
  );

  chartData.value = {
    labels,
    datasets: [
      {
        label: "Dragons in garden",
        backgroundColor: "#0000ff",
        borderColor: "#0000ff",
        data: statistics.dragons.map((stat) => stat.value),
      },
      {
        label: "Scrolls with dragons",
        backgroundColor: "#ff0000",
        borderColor: "#ff0000",
        data: statistics.scrolls.map((stat) => stat.value),
      },
    ],
  };
  statisticsLoaded.value = true;
});

const {
  data: dragons,
  execute: fetchScroll,
  status: fetchScrollStatus,
} = await useFetch("/api/user/scroll", {
  immediate: !!authData.value?.user,
  default: () => [],
});

const {
  data: hatchery,
  execute: fetchHatchery,
  status: hatcheryStatus,
} = await useFetch("/api/hatchery", {
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
    $fetch("/api/user/scroll", {
      method: "PATCH",
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
  [fetchScrollStatus.value, saveScrollStatus.value].includes("pending")
);

watch(
  userSettings,
  () => {
    if (!authData.value?.user) {
      return;
    }

    $fetch("/api/user/settings", {
      method: "PATCH",
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
    if (userSettings.value.sort === "Youngest First") {
      dragons.value.sort((a, b) => {
        const valueA = a.hatch + "" + a.hoursleft;
        const valueB = b.hatch + "" + b.hoursleft;
        return valueA.localeCompare(valueB);
      });
    }

    if (userSettings.value.sort === "Oldest First") {
      dragons.value.sort((a, b) => {
        const valueA = a.hatch + "" + a.hoursleft;
        const valueB = b.hatch + "" + b.hoursleft;
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
  dragons.value.forEach((dragon) => (dragon.inHatchery = checked));
}
</script>
