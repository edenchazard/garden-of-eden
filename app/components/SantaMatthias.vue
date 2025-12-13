<template>
  <img
    v-if="
      Interval.fromDateTimes(
        DateTime.fromISO(`${DateTime.now().year}-10-11T00:00:00Z`),
        DateTime.fromISO(`${DateTime.now().year}-12-31T23:59:59Z`)
      ).contains(DateTime.utc())
    "
    :src="SantaMatthias"
    alt=""
    class="santa-matthias absolute right-0.75 -bottom-1.5 -z-10 motion-reduce:animate-none!"
  />
</template>

<script setup lang="ts">
import { DateTime, Interval } from 'luxon';
import SantaMatthias from '~~/public/npc/santa_matthias3.webp';
</script>

<style scoped>
.santa-matthias {
  will-change: offset-distance, opacity, transform;
  offset-path: path('M40 0 Q-90 -90 -130 0');
  offset-rotate: 0deg;
  animation: santa-arc 6s linear infinite 2s;
}

@keyframes santa-arc {
  0% {
    offset-distance: 0%;
    opacity: 0;
    transform: translateY(0) scale(1);
  }
  30% {
    offset-distance: 45%;
    transform: translateY(0) scale(1.02);
    opacity: 1;
  }
  50% {
    offset-distance: 85%;
  }
  66.6% {
    offset-distance: 100%;
    transform: translateY(0) scale(1);
  }
  75% {
    opacity: 0;
  }
  100% {
    offset-distance: 100%;
    opacity: 0;
    transform: translateY(0) scale(1);
  }
}
</style>
