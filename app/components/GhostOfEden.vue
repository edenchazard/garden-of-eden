<template>
  <img
    v-if="
      Interval.fromDateTimes(
        DateTime.fromISO(`${DateTime.now().year}-10-24T00:00:00Z`),
        DateTime.fromISO(`${DateTime.now().year}-11-07T00:00:00Z`)
      ).contains(DateTime.utc())
    "
    :src="GhostOfEden"
    alt=""
    class="ghost-of-eden absolute -z-10 left-5 motion-reduce:animate-none"
  />
</template>

<script setup lang="ts">
import { DateTime, Interval } from 'luxon';
import GhostOfEden from '~~/public/npc/ghost_of_eden.webp';
</script>

<style scoped>
.ghost-of-eden {
  animation: ghost-of-eden 10s infinite alternate 2s;
}

@keyframes ghost-of-eden {
  0% {
    opacity: 0;
    transform: translateY(0);
  }
  20% {
    opacity: 1;
    transform: translateY(-2rem);
  }
  30% {
    opacity: 1;
    transform: translateY(-1.8rem);
  }
  40% {
    opacity: 1;
    transform: translateY(-2rem);
  }
  50% {
    opacity: 1;
    transform: translateY(-1.8rem);
  }
  60% {
    opacity: 1;
    transform: translateY(-2rem);
  }
  75% {
    opacity: 1;
    transform: translateY(0);
  }
  90% {
    opacity: 0;
    transform: translateY(0);
  }
}
</style>
