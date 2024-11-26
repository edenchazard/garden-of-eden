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

          <div class="col-start-1 md:row-start-2 space-y-2">
            <ClicksLeaderboard
              :start="weeklyLeaderboard.weekStart"
              :end="weeklyLeaderboard.weekEnd"
              :leaderboard="weeklyLeaderboard.results"
              :total="weeklyLeaderboard.clicksGiven"
            />
            <div class="text-xs italic text-right">
              <figure id="daily-totals-for-week">
                <div class="h-[5rem]">
                  <Bar
                    :key="`daily-totals-${redrawTrigger}`"
                    class="w-full"
                    :data="weeklyDailyTotals"
                    :options="{
                      ...defaultChartOptions,
                      normalized: true,
                      scales: {
                        y: {
                          ...defaultChartOptions.scales?.y,
                          ticks: {
                            font: {
                              size: 10,
                            },
                          },
                        },
                        x: {
                          ...{
                            ...defaultChartOptions.scales?.x,
                            time: {
                              unit: 'day',
                              displayFormats: {
                                day: 'd',
                              },
                              tooltipFormat: 'EEEE',
                            },
                            ticks: {
                              display: false,
                            },
                          },
                        },
                      },
                      plugins: {
                        title: {
                          display: false,
                        },
                        legend: {
                          display: false,
                        },
                      },
                    }"
                  />
                </div>
              </figure>
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
                <ClientOnly v-else>
                  Results for
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
              class="border-t pt-3 flex flex-col sm:flex-row justify-between sm:items-center mt-4 gap-x-4 gap-y-2"
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
                        DateTime.fromISO(weekly.start).endOf('week').toJSDate()
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
              <abbr
                v-tooltip="{
                  content: `Gardener of all time`,
                  triggers: ['hover', 'click'],
                }"
                title=""
                >GOAT</abbr
              >
              🐐.
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
        <p class="max-w-prose">
          Visibility of individual datasets can be toggled by clicking the
          legends. Missing data points indicate an API failure.
        </p>
        <figure id="hatchery" class="graph">
          <div class="h-[31rem]">
            <Line
              :key="`hatchery-${redrawTrigger}`"
              :data="dragons"
              class="w-full"
              :options="{
                ...defaultChartOptions,
                scales: {
                  scrollAxis: {
                    type: 'linear',
                    position: 'right',
                    grid: {
                      ...defaultChartOptions.scales?.y?.grid,
                      color: rgbAlpha(colourPalette[1], 0.4),
                      z: 0,
                    },
                    ticks: {
                      color:
                        (dragons.datasets[1]?.borderColor as string) ?? '#fff',
                    },
                  },
                  y: {
                    type: 'linear',
                    position: 'left',
                    ticks: {
                      color:
                        (dragons.datasets[0]?.borderColor as string) ?? '#fff',
                    },
                    grid: {
                      ...defaultChartOptions.scales?.y?.grid,
                      color: rgbAlpha(colourPalette[0], 0.4),
                      z: 0,
                    },
                  },
                  x: defaultChartOptions.scales?.x,
                },
                normalized: true,
                plugins: {
                  title: {
                    text: 'Hatchery statistics',
                  },
                },
              }"
            />
          </div>
          <figcaption><p>Data taken in 30 minute intervals.</p></figcaption>
        </figure>

        <figure id="soil-composition" class="graph">
          <div class="h-[40rem]">
            <Line
              :key="`composition-${redrawTrigger}`"
              :data="soilComposition"
              class="w-full"
              :options="{
                ...defaultChartOptions,
                normalized: true,
                plugins: {
                  title: {
                    text: 'Soil composition',
                  },
                  legend: {
                    labels: {
                      filter: function (item, chart) {
                        return !['Dead', 'Adult'].includes(item.text);
                      },
                    },
                  },
                },
              }"
            />
          </div>
          <figcaption>
            <p>
              Data taken from Dragon Cave API every 5 minutes. "Other" includes
              frozen, hidden, dead or adult.
            </p>
          </figcaption>
        </figure>

        <figure id="hatchling-gender" class="graph">
          <div class="h-[30rem]">
            <Line
              :key="`gender-${redrawTrigger}`"
              :data="hatchlingGenderRatio"
              class="w-full"
              :options="{
                ...defaultChartOptions,
                normalized: true,
                plugins: {
                  title: {
                    text: 'Hatchling gender',
                  },
                },
              }"
            />
          </div>
          <figcaption>
            <p>
              Data taken from Dragon Cave API every 5 minutes. Ungendered
              includes S1 hatchlings, Paper Dragons, Cheese Dragons, Pastel
              Dragons and Dinos. Excludes eggs.
            </p>
          </figcaption>
        </figure>

        <figure id="cb-vs-lineaged" class="graph">
          <div class="h-[30rem]">
            <Line
              :key="`cb-vs-lineaged-${redrawTrigger}`"
              :data="cbVsLineaged"
              class="w-full"
              :options="{
                ...defaultChartOptions,
                normalized: true,
                plugins: {
                  title: {
                    text: 'Caveborn vs lineaged',
                  },
                },
              }"
            />
          </div>
          <figcaption>
            <p>Data taken from Dragon Cave API every 5 minutes.</p>
          </figcaption>
        </figure>

        <figure id="gardener-activity" class="graph">
          <div class="h-[20rem]">
            <Line
              :key="`user-activity-${redrawTrigger}`"
              class="w-full"
              :data="userActivity"
              :options="{
                ...defaultChartOptions,
                normalized: true,
                plugins: {
                  title: {
                    text: 'Gardener activity',
                  },
                  legend: {
                    display: false,
                  },
                },
              }"
            />
          </div>
          <figcaption>
            <p>
              Data taken every 15 minutes. A user is considered active if
              they've made any activity within 15 minutes of recording.
            </p>
          </figcaption>
        </figure>

        <figure id="api-requests" class="graph">
          <div class="h-[20rem]">
            <Bar
              :key="`api-requests-${redrawTrigger}`"
              class="w-full"
              :data="apiRequests"
              :options="{
                ...defaultChartOptions,
                normalized: true,
                scales: {
                  y: {
                    ...defaultChartOptions.scales?.y,
                    stacked: true,
                    ticks: {
                      callback(ctx) {
                        return Math.abs(Number(ctx));
                      },
                    },
                  },
                  x: {
                    ...{
                      ...defaultChartOptions.scales?.x,
                      time: {
                        unit: 'hour',
                        displayFormats: {
                          hour: 'T',
                        },
                        tooltipFormat: 'f',
                      },
                      stacked: true,
                    },
                  },
                },
                plugins: {
                  title: {
                    text: 'Dragon Cave API requests',
                  },
                  tooltip: {
                    callbacks: {
                      label(ctx) {
                        return (
                          `${ctx.dataset.label}: ` +
                          Math.abs((ctx.raw as number) ?? 0)
                        );
                      },
                    },
                  },
                },
              }"
            />
          </div>
          <figcaption>
            <p>
              Data taken every 5 minutes. Each bar represents number of requests
              made to Dragon Cave in the previous 5 minutes.
            </p>
          </figcaption>
        </figure>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {
  ChartData,
  ChartDataset,
  ChartOptions,
  ScriptableContext,
} from 'chart.js';
import { DateTime } from 'luxon';
import { Bar, Line } from 'vue-chartjs';
import { pluralise } from '#imports';
import type { recordingsTable } from '~/database/schema';
import 'chartjs-adapter-luxon';
import { useWindowSize } from '@vueuse/core';

useHead({
  title: 'Statistics',
});

const defaultChart = {
  datasets: [],
  labels: [],
};

const redrawTrigger = ref(0);
const selectedWeek = ref<string | null>();
const weeklyDailyTotals = ref<ChartData<'bar'>>(defaultChart);
const dragons = ref<ChartData<'line'>>(defaultChart);
const userActivity = ref<ChartData<'line'>>(defaultChart);
const soilComposition = ref<ChartData<'line'>>(defaultChart);
const hatchlingGenderRatio = ref<ChartData<'line'>>(defaultChart);
const cbVsLineaged = ref<ChartData<'line'>>(defaultChart);
const apiRequests = ref<ChartData<'bar'>>(defaultChart);

const { userSettings } = useUserSettings();

const { data: personalStats } = await useFetch('/api/user/statistics', {
  watch: false,
  headers: computed(() => ({
    'Csrf-token': useCsrf().csrf,
  })),
});

const { data: stats } = await useFetch('/api/statistics', {
  watch: false,
  default: () => ({
    clicksTotalAllTime: 0,
    clicksAllTimeLeaderboard: [],
    dragons: [],
    scrolls: [],
    weeklies: [],
    userActivity: [],
    cleanUp: [],
    apiRequests: [],
  }),
});

const { data: weeklyLeaderboard } = await useFetch('/api/statistics/weekly', {
  query: {
    start: computed(() => selectedWeek.value),
  },
  watch: [selectedWeek],
  default: () => ({
    weekStart: '',
    weekEnd: '',
    results: [],
    dailyTotals: {},
    clicksGiven: 0,
  }),
});

const { data } = useAuth();

const colourPalette = computed(() => {
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

  return chartColourPalette(useColorMode().value);
});

watch(
  () => [useColorMode().value, useWindowSize().width.value],
  () => redrawTrigger.value++
);

watch(
  () => weeklyLeaderboard.value.dailyTotals,
  () => renderCharts()
);

onNuxtReady(() => redrawTrigger.value++);

watch(redrawTrigger, renderCharts);

const defaultChartOptions: ChartOptions<'line' | 'bar'> = {
  interaction: {
    intersect: false,
    mode: 'index',
  },
  scales: {
    y: {
      grid: {
        color: rgbAlpha([255, 255, 255], 0.1),
        z: 1,
        lineWidth: 1,
      },
    },
    x: {
      type: 'time',
      time: {
        unit: 'hour',
        displayFormats: {
          hour: 'T',
        },
        tooltipFormat: 'f',
      },
      grid: {
        color: rgbAlpha([255, 255, 255], 0.1),
        z: 1,
        lineWidth: 1,
      },
    },
  },
};

function renderCharts() {
  const statistics = stats.value;

  if (statistics === null) return;

  const mapTimes = (stat: typeof recordingsTable.$inferSelect) =>
    DateTime.fromSQL(stat.recorded_on + 'Z').toJSDate();

  function transform(stat: (typeof statistics.cleanUp)[0]) {
    const extra = JSON.parse(stat.extra as string);

    if (extra.failures && extra.failures > 0) {
      for (const key in extra) {
        extra[key] = null;
      }
    }

    return {
      ...stat,
      extra,
    };
  }

  const cleanUpTransform = statistics.cleanUp.map(transform);
  const apiRequestsTransform = statistics.apiRequests.map(transform);

  weeklyDailyTotals.value = {
    labels: Object.keys(weeklyLeaderboard.value.dailyTotals),
    datasets: [
      {
        data: Object.values(weeklyLeaderboard.value.dailyTotals),
        backgroundColor: rgbAlpha(colourPalette.value[0]),
      },
    ],
  };

  dragons.value = {
    labels: statistics.dragons.map(mapTimes),
    datasets: [
      {
        ...createPoints(),
        yAxisID: 'y',
        label: 'Dragons in garden',
        backgroundColor: rgbAlpha(colourPalette.value[0]),
        borderColor: rgbAlpha(colourPalette.value[0]),
        data: statistics.dragons.map((stat) => stat.value),
      },
      {
        ...createPoints(),
        yAxisID: 'scrollAxis',
        label: 'Scrolls with dragons',
        backgroundColor: rgbAlpha(colourPalette.value[1]),
        borderColor: rgbAlpha(colourPalette.value[1]),
        data: statistics.scrolls.map((stat) => stat.value),
      },
    ],
  };

  userActivity.value = {
    labels: statistics.userActivity.map(mapTimes),
    datasets: [
      {
        ...createPoints(),
        label: 'User Activity',
        borderColor: rgbAlpha(colourPalette.value[2]),
        data: statistics.userActivity.map((stat) => stat.value),
      },
    ],
  };

  soilComposition.value = {
    labels: statistics.cleanUp.map(mapTimes),
    datasets: [
      {
        ...createPoints(),
        label: 'Other',
        backgroundColor: rgbAlpha(colourPalette.value[4], 0.75),
        borderColor: rgbAlpha(colourPalette.value[4]),
        data: cleanUpTransform.map((stat) => stat.value),
        fill: 'origin',
        hidden: true,
      },
      {
        ...createPoints(),
        label: 'Eggs',
        backgroundColor: rgbAlpha(colourPalette.value[1], 0.75),
        borderColor: rgbAlpha(colourPalette.value[1]),
        data: cleanUpTransform.map((stat) => stat.extra.eggs ?? null),
        fill: 'origin',
      },
      {
        ...createPoints(),
        label: 'Hatchlings',
        backgroundColor: rgbAlpha(colourPalette.value[2], 0.75),
        borderColor: rgbAlpha(colourPalette.value[2]),
        data: cleanUpTransform.map((stat) => stat.extra.hatchlings ?? null),
        fill: 'origin',
      },
      {
        pointHitRadius: 0,
        pointBorderWidth: 0,
        pointRadius: 0,
        borderWidth: 0,
        pointHoverBorderWidth: 0,
        pointHoverRadius: 0,
        label: 'Dead',
        backgroundColor: rgbAlpha(colourPalette.value[3], 0.75),
        borderColor: rgbAlpha(colourPalette.value[3]),
        data: cleanUpTransform.map((stat) => stat.extra.dead ?? null),
      },
      {
        pointHitRadius: 0,
        pointBorderWidth: 0,
        pointRadius: 0,
        borderWidth: 0,
        pointHoverBorderWidth: 0,
        pointHoverRadius: 0,
        label: 'Adult',
        backgroundColor: rgbAlpha(colourPalette.value[4], 0.75),
        borderColor: rgbAlpha(colourPalette.value[4]),
        data: cleanUpTransform.map((stat) => stat.extra.adults ?? null),
      },
    ],
  };

  hatchlingGenderRatio.value = {
    labels: statistics.cleanUp.map(mapTimes),
    datasets: [
      {
        ...createPoints(),
        label: 'Ungendered',
        backgroundColor: rgbAlpha(colourPalette.value[1], 0.75),
        borderColor: rgbAlpha(colourPalette.value[1]),
        data: cleanUpTransform.map(
          (stat) => stat.extra.hatchlingsUngendered ?? null
        ),
      },
      {
        ...createPoints(),
        label: 'Male',
        backgroundColor: rgbAlpha(colourPalette.value[2], 0.75),
        borderColor: rgbAlpha(colourPalette.value[2]),
        data: cleanUpTransform.map((stat) => stat.extra.hatchlingsMale ?? null),
      },
      {
        ...createPoints(),
        label: 'Female',
        backgroundColor: rgbAlpha(colourPalette.value[3], 0.75),
        borderColor: rgbAlpha(colourPalette.value[3]),
        data: cleanUpTransform.map(
          (stat) => stat.extra.hatchlingsFemale ?? null
        ),
      },
    ],
  };

  cbVsLineaged.value = {
    labels: statistics.cleanUp.map(mapTimes),
    datasets: [
      {
        ...createPoints(),
        label: 'Caveborn',
        backgroundColor: rgbAlpha(colourPalette.value[1], 0.75),
        borderColor: rgbAlpha(colourPalette.value[1]),
        data: cleanUpTransform.map((stat) => stat.extra.caveborn ?? null),
      },
      {
        ...createPoints(),
        label: 'Lineaged',
        backgroundColor: rgbAlpha(colourPalette.value[2], 0.75),
        borderColor: rgbAlpha(colourPalette.value[2]),
        data: cleanUpTransform.map((stat) => stat.extra.lineaged ?? null),
      },
    ],
  };

  apiRequests.value = {
    labels: statistics.apiRequests.map(mapTimes),
    datasets: [
      {
        label: 'Successful',
        backgroundColor: rgbAlpha(colourPalette.value[1], 0.75),
        borderColor: rgbAlpha(colourPalette.value[1]),
        data: apiRequestsTransform.map((stat) => stat.extra.success ?? 0),
      },
      {
        label: 'Failed',
        backgroundColor: rgbAlpha(colourPalette.value[2], 0.75),
        borderColor: rgbAlpha(colourPalette.value[2]),
        data: apiRequestsTransform.map((stat) => -(stat.extra.failure ?? 0)),
      },
    ],
  };
}

function createPoints() {
  const determineSizeByChartWidth = (
    context: ScriptableContext<'line'>,
    threshold: number,
    small: number = 0
  ) => {
    if (typeof context.parsed === 'undefined') {
      return {};
    }
    const resolvedDesktopSize =
      DateTime.fromMillis(context.parsed.x).minute === 0 ? threshold : 0;
    return context.chart.width > 615 ? resolvedDesktopSize : small;
  };

  const points: Partial<ChartDataset<'line'>> = {
    pointBackgroundColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointRadius: (ctx) => determineSizeByChartWidth(ctx, 6),
    pointHoverRadius: (ctx) => determineSizeByChartWidth(ctx, 12, 4),
    pointHoverBorderWidth: (ctx) => determineSizeByChartWidth(ctx, 6, 4),
    pointHitRadius: 0,
  };
  return points;
}

function rgbAlpha(colour: [number, number, number], a: number = 1) {
  return `rgba(${colour.join(',')},${a})`;
}
</script>

<style scoped lang="postcss">
.graph {
  & div {
    @apply p-3 border border-green-300 dark:border-stone-700 bg-black/25;
  }

  & canvas {
    user-select: none;
  }

  & figcaption {
    @apply text-xs italic mt-2 flex justify-end;
  }

  & p {
    @apply max-w-prose text-right;
  }
}
</style>
