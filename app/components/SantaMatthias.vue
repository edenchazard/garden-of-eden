<template>
  <img
    v-if="isChristmas()"
    :src="SantaMatthias"
    alt=""
    class="santa-matthias absolute right-0.75 -bottom-1.5 -z-10 motion-reduce:animate-none!"
  />
</template>

<script setup lang="ts">
import isChristmas from '~/utils/isChristmas';
import SantaMatthias from '~~/public/npc/santa_matthias_animated.webp';
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
