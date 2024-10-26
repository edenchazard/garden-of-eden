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
          {{ Intl.NumberFormat().format(personalStats.clicked_24) }} unique
          dragons clicked in the last 24 hours.<sup
            ><a href="#personal-1" class="!decoration-transparent ml-2"
              >[1]</a
            ></sup
          >
          <p class="pl-6 italic block text-sm">
            <template v-if="personalStats.not_clicked === 0">
              (Nice job! You've clicked all the dragons in the garden for now.)
            </template>
            <template v-else>
              (There's still
              {{ Intl.NumberFormat().format(personalStats.not_clicked) }}
              {{ pluralise('dragon', personalStats.not_clicked) }} in the garden
              that you haven't clicked!)
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
        <div class="max-w-prose">
          <h2>Clicks</h2>
          <p>
            It's thanks to generous gardeners such as yourself that plants grow
            so well.
          </p>
          <p class="text-sm">
            (You can configure the visibility of your name
            <RouterLink to="/settings#anon-stats">in your settings</RouterLink
            >.)
          </p>
          <p class="italic text-sm">Refreshes in 5 minute intervals.</p>
        </div>
        <div class="grid md:grid-cols-2 gap-y-4 gap-x-8 justify-between">
          <div>
            <h3 class="mt-4 font-bold">This week's top clickers</h3>
            <p class="max-w-prose">
              Be the envy of your fellow gardeners by making it to the top!
            </p>
          </div>

          <div class="col-start-1 md:row-start-2">
            <ClicksLeaderboard
              :start="weeklyLeaderboard.weekStart"
              :end="weeklyLeaderboard.weekEnd"
              :leaderboard="weeklyLeaderboard.results"
              :total="weeklyLeaderboard.clicksGiven"
            />
            <div class="text-xs italic text-right">
              <p>
                <ClientOnly
                  v-if="
                    DateTime.fromISO(weeklyLeaderboard.weekEnd)
                      .diffNow()
                      .as('milliseconds') > 0
                  "
                >
                  Tracking since
                  {{
                    DateTime.fromISO(
                      weeklyLeaderboard.weekStart
                    ).toLocaleString({
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  }}
                  &mdash;
                  <span
                    :title="
                      DateTime.fromISO(
                        weeklyLeaderboard.weekEnd
                      ).toLocaleString({
                        dateStyle: 'medium',
                        timeStyle: 'medium',
                      }) ?? undefined
                    "
                    >Resets
                    {{
                      DateTime.fromISO(weeklyLeaderboard?.weekEnd).toRelative({
                        style: 'long',
                      })
                    }}</span
                  >
                </ClientOnly>
                <ClientOnly v-else
                  >Results for
                  {{
                    DateTime.fromISO(
                      weeklyLeaderboard.weekStart
                    ).toLocaleString({
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  }}
                  &mdash;
                  {{
                    DateTime.fromISO(weeklyLeaderboard.weekEnd).toLocaleString({
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  }}
                </ClientOnly>
              </p>
            </div>

            <div
              class="flex flex-col sm:flex-row justify-between sm:items-center mt-4 gap-x-4 gap-y-2"
            >
              <p>
                <label for="week-selector" class="text-sm"
                  >See a previous week</label
                >
              </p>
              <select id="week-selector" v-model="selectedWeek" class="flex-1">
                <ClientOnly placeholder-tag="option">
                  <option
                    v-for="weekly in stats.weeklies"
                    :key="weekly.start"
                    :value="weekly.start"
                  >
                    Wk {{ weekly.week }}:
                    {{
                      Intl.DateTimeFormat(undefined, {
                        dateStyle: 'medium',
                      }).format(new Date(weekly.start))
                    }}
                    &mdash;
                    {{
                      Intl.DateTimeFormat(undefined, {
                        dateStyle: 'medium',
                      }).format(
                        DateTime.fromISO(weekly.start)
                          .plus({ weeks: 1 })
                          .toJSDate()
                      )
                    }}
                  </option>
                </ClientOnly>
              </select>
            </div>
          </div>
          <div class="max-w-sm">
            <h3 class="mt-4 font-bold">All-time top clickers</h3>
            <p class="max-w-prose">
              The leaderboard for the most gardencore of gardeners. A spot on
              the prestigious &quot;all-time&quot; will make you known as a
              <abbr title="Gardener of all time">GOAT</abbr> 🐐.
            </p>
          </div>
          <div class="md:col-start-2 md:row-start-2">
            <ClicksLeaderboard
              :leaderboard="stats.clicksAllTimeLeaderboard"
              :total="stats.clicksTotalAllTime"
            />
            <p class="text-xs italic text-right">
              <ClientOnly>
                Tracking since
                {{
                  Intl.DateTimeFormat(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date('2024-09-28 20:55:00Z'))
                }}</ClientOnly
              >
            </p>
          </div>
        </div>
      </section>

      <section class="[&_figure]:mt-4">
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

        <figure v-if="dragons" class="graph">
          <div class="h-[40rem]">
            <Line
              :data="soilComposition"
              class="w-full"
              :options="{
                normalized: true,
                plugins: {
                  title: {
                    text: 'Soil Composition',
                  },
                  filler: {},
                },
                scales: {
                  y: {
                    grid: {
                      color: 'rgba(0,0,0,0.1)',
                      z: 1,
                      lineWidth: 2,
                    },
                  },
                  x: {
                    grid: {
                      color: 'rgba(0,0,0,0.1)',
                      z: 1,
                    },
                  },
                },
              }"
            />
          </div>
          <figcaption>
            Data taken from Dragon Cave API. Abnormal data points indicate an
            API failure.
          </figcaption>
        </figure>

        <figure v-if="dragons" class="graph">
          <div class="h-[30rem]">
            <Line
              :data="hatchlingGenderRatio"
              class="w-full"
              :options="{
                normalized: true,
                plugins: {
                  title: {
                    text: 'Hatchling Gender',
                  },
                },
                scales: {
                  y: {},
                },
              }"
            />
          </div>
          <figcaption>
            Data taken from Dragon Cave API. Abnormal data points indicate an
            API failure. Does not account for dragons that cannot have a gender.
            Excludes eggs.
          </figcaption>
        </figure>

        <figure v-if="scrolls" class="graph">
          <div class="h-[20rem]">
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

        <figure v-if="userActivity" class="graph max-w-lg">
          <div class="h-[20rem]">
            <Line
              class="w-full"
              :data="userActivity"
              :options="{
                normalized: true,
                plugins: {
                  title: {
                    text: 'Gardener Activity',
                  },
                  legend: {
                    display: false,
                  },
                },
              }"
            />
          </div>
          <figcaption>
            A user is considered active if they've visited the garden within 15
            minutes of recording.
          </figcaption>
        </figure>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ChartData } from 'chart.js';
import { DateTime } from 'luxon';
import { Line } from 'vue-chartjs';
import { pluralise } from '#imports';

useHead({
  title: 'Statistics',
});

const dragons = ref<ChartData<'line'>>();
const scrolls = ref<ChartData<'line'>>();
const selectedWeek = ref<string | null>();
const userActivity = ref<ChartData<'line'>>();
const soilComposition = ref<ChartData<'line'>>();
const hatchlingGenderRatio = ref<ChartData<'line'>>();

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
    clicksAllTimeLeaderboard: [],
    dragons: [],
    scrolls: [],
    weeklies: [],
    userActivity: [],
    cleanUp: [],
  }),
});

const { data: weeklyLeaderboard } = await useFetch('/api/statistics/weekly', {
  query: {
    start: computed(() => selectedWeek.value),
  },
  watch: [selectedWeek],
  headers: computed(() => ({
    'Csrf-token': useCsrf().csrf,
  })),
  default: () => ({
    weekStart: '',
    weekEnd: '',
    results: [],
    clicksGiven: 0,
  }),
});

const { data } = useAuth();

onNuxtReady(() => renderCharts());

function chartColourPalette(palette: string) {
  const defaultPalette = [
    [255, 225, 0],
    [242, 156, 76],
    [242, 162, 196],
    [242, 196, 196],
    [105, 0, 51],
    [0, 123, 128],
  ];

  return ({
    mint: defaultPalette,
    dark: [
      [105, 0, 51],
      [0, 123, 128],
      [242, 201, 76],
      [242, 156, 76],
      [242, 162, 196],
      [242, 196, 196],
    ],
  }[palette] ?? defaultPalette) as [number, number, number][];
}

watch(() => useColorMode().value, renderCharts);

function renderCharts() {
  const rgba = (colour: [number, number, number], a: number = 1) =>
    `rgba(${colour.join(',')},${a})`;

  const statistics = stats.value;
  if (statistics === null) return;

  const mapTimes = (stat) =>
    Intl.DateTimeFormat(undefined, {
      timeStyle: 'short',
    }).format(new Date(stat.recorded_on));

  const colours = chartColourPalette(useColorMode().value);

  dragons.value = {
    labels: statistics.dragons.map(mapTimes),
    datasets: [
      {
        label: 'Dragons',
        backgroundColor: rgba(colours[0]),
        borderColor: rgba(colours[0]),
        data: statistics.dragons.map((stat) => stat.value),
      },
    ],
  };

  scrolls.value = {
    labels: statistics.scrolls.map(mapTimes),
    datasets: [
      {
        label: 'Scrolls',
        borderColor: rgba(colours[1]),
        data: statistics.scrolls.map((stat) => stat.value),
      },
    ],
  };

  userActivity.value = {
    labels: statistics.userActivity.map(mapTimes),
    datasets: [
      {
        label: 'User Activity',
        borderColor: rgba(colours[2]),
        data: statistics.userActivity.map((stat) => stat.value),
      },
    ],
  };
  console.log(statistics.cleanUp);
  soilComposition.value = {
    labels: statistics.cleanUp.map(mapTimes),
    datasets: [
      {
        label: 'Other',
        backgroundColor: rgba(colours[4], 0.75),
        borderColor: rgba(colours[4]),
        data: statistics.cleanUp.map((stat) => stat.value),
        pointRadius: (context) => (context.dataIndex % 2 === 0 ? 0 : 3),
        pointHoverRadius: (context) => (context.dataIndex % 2 === 0 ? 0 : 5),
        fill: 'origin',
        hidden: true,
      },
      {
        label: 'Eggs',
        backgroundColor: rgba(colours[1], 0.75),
        borderColor: rgba(colours[1]),
        data: statistics.cleanUp.map((stat) => stat.extra?.eggs ?? 0),
        pointRadius: (context) => (context.dataIndex % 2 === 0 ? 0 : 3),
        pointHoverRadius: (context) => (context.dataIndex % 2 === 0 ? 0 : 5),
        fill: 'origin',
      },
      {
        label: 'Hatchlings',
        backgroundColor: rgba(colours[2], 0.75),
        borderColor: rgba(colours[2]),
        data: statistics.cleanUp.map((stat) => stat.extra?.hatchlings ?? 0),
        pointRadius: (context) => (context.dataIndex % 2 === 0 ? 0 : 3),
        pointHoverRadius: (context) => (context.dataIndex % 2 === 0 ? 0 : 5),
        fill: 'origin',
      },
    ],
  };

  hatchlingGenderRatio.value = {
    labels: statistics.cleanUp.map(mapTimes),
    datasets: [
      {
        label: 'Ungendered',
        backgroundColor: rgba(colours[1], 0.75),
        borderColor: rgba(colours[1]),
        data: statistics.cleanUp.map(
          (stat) => stat.extra?.hatchlingsUngendered
        ),
        pointRadius: 0,
        hidden: true,
      },
      {
        label: 'Male',
        backgroundColor: rgba(colours[2], 0.75),
        borderColor: rgba(colours[2]),
        data: statistics.cleanUp.map((stat) => stat.extra?.hatchlingsMale),
        pointRadius: 0,
      },
      {
        label: 'Female',
        backgroundColor: rgba(colours[3], 0.75),
        borderColor: rgba(colours[3]),
        data: statistics.cleanUp.map((stat) => stat.extra?.hatchlingsFemale),
        pointRadius: 0,
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
