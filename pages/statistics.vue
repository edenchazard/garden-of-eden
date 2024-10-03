<template>
  <div class="space-y-4 max-w-full">
    <h1>Statistics</h1>
    <section class="max-w-prose">
      <p>
        The Garden of {{ userSettings.siteName }} takes plant growth very
        seriously. That's why statistics are logged continuously throughout the
        day to ensure optimum health of the plants.
      </p>
      <p class="text-xs text-right italic">All times shown local to you.</p>
    </section>

    <section v-if="data?.user && personalStats">
      <h2>Personal statistics</h2>
      <ul class="list-disc list-inside space-y-2">
        <li>
          {{ personalStats.clicked_24 }} unique dragons clicked in the last 24
          hours.<sup
            ><a href="#personal-1" class="!decoration-transparent ml-2"
              >[1]</a
            ></sup
          >
          <p class="pl-6 italic block text-sm">
            <template v-if="personalStats.not_clicked === 0">
              (Nice job! You've clicked all the dragons in the garden for now.)
            </template>
            <template v-else>
              (There are still {{ personalStats.not_clicked }} dragons in the
              garden that you haven't clicked at all!)
            </template>
          </p>
        </li>
      </ul>
      <ol class="list-decimal list-inside text-sm mt-2">
        <li id="personal-1">
          Dragons clicked more than 24 hours ago will not count towards this
          total.
        </li>
      </ol>
    </section>

    <div class="space-y-8">
      <section>
        <h2>Clicks</h2>
        <p>
          Since
          <ClientOnly>{{
            Intl.DateTimeFormat(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date('2024-09-28 20:55:00Z'))
          }}</ClientOnly
          >, {{ Intl.NumberFormat().format(stats.clicksTotalAllTime) }} clicks
          have been given by generous gardeners.
        </p>

        <h3 class="mt-4 font-bold">This week's top clickers</h3>
        <p class="max-w-prose">
          Be the envy of your fellow gardeners by making it to the top!
        </p>
        <div class="max-w-sm mt-2">
          <table class="w-full">
            <thead>
              <tr class="*:px-4 text-center divide-x border-b-2 *:py-2">
                <th class="!px-2">Rank</th>
                <th>Username</th>
                <th>Clicks given</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white">
              <tr
                v-for="user in stats?.clicksLeaderboard"
                :key="user.rank"
                class="*:px-4 *:py-1 divide-x"
                :class="{
                  'bg-green-900 dark:bg-stone-700':
                    user.username === data?.user?.username,
                  '!border-t-2 font-bold': user.rank > 10,
                }"
              >
                <td class="text-right">#{{ user.rank }}</td>
                <td v-if="user.username">{{ user.username }}</td>
                <td v-else class="italic">(anonymous)</td>
                <td>{{ Intl.NumberFormat().format(user.clicks_given) }}</td>
              </tr>
            </tbody>
          </table>
          <div class="text-xs italic text-right">
            <p>Refreshes in 5 minute intervals</p>
            <p>
              <ClientOnly>
                (Resets in
                {{
                  DateTime.now().startOf('week').plus({ weeks: 1 }).toRelative({
                    style: 'long',
                  })
                }})
              </ClientOnly>
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2>Hatchery</h2>
        <figure v-if="dragons" class="graph">
          <div class="h-[31rem]">
            <Line
              :data="dragons"
              class="w-full"
              :options="{
                normalized: true,
                plugins: {
                  title: {
                    text: 'Dragons in Garden',
                  },
                  legend: {
                    display: false,
                  },
                },
              }"
            />
          </div>
          <figcaption>Data taken in 30 minute intervals.</figcaption>
        </figure>

        <figure v-if="scrolls" class="graph">
          <div class="h-[31rem]">
            <Line
              class="w-full"
              :data="scrolls"
              :options="{
                normalized: true,
                plugins: {
                  title: {
                    text: 'Scrolls with Dragons',
                  },
                  legend: {
                    display: false,
                  },
                },
              }"
            />
          </div>
          <figcaption>Data taken in 30 minute intervals.</figcaption>
        </figure>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ChartData } from 'chart.js';
import { DateTime } from 'luxon';
import { Line } from 'vue-chartjs';

useHead({
  title: 'Statistics',
});

const { userSettings } = useUserSettings();
const { data: personalStats } = await useFetch('/api/user/statistics', {
  watch: false,
  headers: computed(() => ({
    'Csrf-token': useCsrf().csrf,
  })),
});

const { data: stats } = await useFetch('/api/statistics', {
  watch: false,
  headers: computed(() => ({
    'Csrf-token': useCsrf().csrf,
  })),
  default: () => ({
    clicksTotalAllTime: 0,
    clicksLeaderboard: [],
    dragons: [],
    scrolls: [],
  }),
});

const { data } = useAuth();

const dragons = ref<ChartData<'line'>>();
const scrolls = ref<ChartData<'line'>>();

onNuxtReady(() => renderCharts());

function chartColourPalette(palette: string) {
  const defaultPalette = [
    '#ffe100',
    '#f29c4c',
    '#f2a2c4',
    '#f2c4c4',
    '#690033',
    '#007b80',
  ];

  return (
    {
      mint: defaultPalette,
      dark: ['#690033', '#007b80', '#f2c94c', '#f29c4c', '#f2a2c4', '#f2c4c4'],
    }[palette] ?? defaultPalette
  );
}

watch(() => useColorMode().value, renderCharts);

function renderCharts() {
  const statistics = stats.value;
  if (statistics === null) return;

  const labels = statistics.dragons.map((stat) =>
    Intl.DateTimeFormat(undefined, {
      timeStyle: 'short',
    }).format(new Date(stat.recorded_on))
  );

  const colours = chartColourPalette(useColorMode().value);

  dragons.value = {
    labels,
    datasets: [
      {
        label: 'Dragons',
        backgroundColor: colours[0],
        borderColor: colours[0],
        data: statistics.dragons.map((stat) => stat.value),
      },
    ],
  };

  scrolls.value = {
    labels,
    datasets: [
      {
        label: 'Scrolls',
        backgroundColor: colours[1],
        borderColor: colours[1],
        data: statistics.scrolls.map((stat) => stat.value),
      },
    ],
  };
}
</script>

<style scoped lang="postcss">
.graph {
  & div {
    @apply p-3 border border-green-300 dark:border-stone-700 bg-black/25;
  }

  & figcaption {
    @apply text-xs text-right italic mt-2;
  }
}
</style>
