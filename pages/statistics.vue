<template>
  <div class="space-y-4 max-w-full">
    <h1>Statistics</h1>
    <section class="max-w-prose">
      <p>
        The Garden of Eden takes plant growth very seriously. That's why
        statistics are logged continuously throughout the day to ensure optimum
        health of the plants.
      </p>
      <p class="text-xs text-right italic">All times shown local to you.</p>
    </section>

    <section
      class="space-y-8"
      v-if="statisticsLoaded"
    >
      <figure class="graph">
        <div class="h-[31rem]">
          <Line
            :data="dragons"
            class="w-full"
            :options="{
              normalized: true,
              responsive: true,
              maintainAspectRatio: false,
              color: $colorMode.value === 'Mint' ? '#fff' : '#e7e5e4',
              scales: {
                y: {
                  ticks: {
                    precision: 0,
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
                  text: 'Dragons in Garden',
                  font: {
                    size: 20,
                  },
                },
              },
            }"
          />
        </div>
        <figcaption>Data taken in 30 minute intervals.</figcaption>
      </figure>

      <figure class="graph">
        <div class="h-[31rem]">
          <Line
            class="w-full"
            :data="scrolls"
            :options="{
              normalized: true,
              responsive: true,
              maintainAspectRatio: false,
              color: $colorMode.value === 'Mint' ? '#fff' : '#e7e5e4',
              scales: {
                y: {
                  ticks: {
                    precision: 0,
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
                  text: 'Scrolls With Dragons',
                  font: {
                    size: 20,
                  },
                },
              },
            }"
          />
        </div>
        <figcaption>Data taken in 30 minute intervals.</figcaption>
      </figure>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { Line } from "vue-chartjs";

useHead({
  title: "Statistics",
});

const scrolls = ref();
const dragons = ref();
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

  dragons.value = {
    labels,
    datasets: [
      {
        label: "Dragons",
        backgroundColor: "#690033",
        borderColor: "#690033",
        data: statistics.dragons.map((stat) => stat.value),
      },
    ],
  };
  scrolls.value = {
    labels,
    datasets: [
      {
        label: "Scrolls",
        backgroundColor: "#007b80",
        borderColor: "#007b80",
        data: statistics.scrolls.map((stat) => stat.value),
      },
    ],
  };
  statisticsLoaded.value = true;
});
</script>

<style scoped lang="postcss">
.graph {
  & div {
    @apply p-3 border dark:border-stone-700;
  }

  & figcaption {
    @apply text-xs text-right italic mt-2;
  }
}
</style>
