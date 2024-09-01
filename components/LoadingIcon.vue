<template>
  <font-awesome-icon class="egg-bounce" :icon="['fas', 'egg']" />
</template>

<style>
.egg-bounce {
  animation: bounce 1.5s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .egg-bounce {
    animation: none;
  }
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-0.4rem);
  }
  60% {
    transform: translateY(-0.25rem);
  }
}
</style>
