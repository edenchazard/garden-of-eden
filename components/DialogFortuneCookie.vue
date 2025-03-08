<template>
  <dialog
    ref="fortuneDialog"
    class="dialog p-4 rounded-lg max-w-md bg-green-100 dark:bg-stone-200 shadow-xl"
    @close="unveiledCookie = false"
  >
    <header>
      <h2>Reveal your fortune!</h2>
    </header>

    <main class="space-y-4">
      <img
        class="mx-auto my-12 glow rounded-full"
        :src="`${path}/items/fortune-cookie.webp`"
        alt="Fortune Cookie"
      />
      <p>
        Matthias eagerly takes your Dragon Dollars and hands you the fortune
        cookie.
      </p>
      <p>You stare at it with both anticipation and nervousness.</p>

      <button
        v-if="!unveiledCookie"
        type="button"
        class="btn-primary w-full"
        @click="unveiledCookie = true"
      >
        Open the cookie
      </button>

      <template v-else>
        <div class="overflow-hidden fortune relative">
          <div
            class="w-full absolute right-0 h-full fortune-cover bg-green-100 dark:bg-stone-200"
          />
          <q
            class="block px-4 py-2 bg-orange-300 text-black italic text-center sm:px-8"
            >{{ fortune }}</q
          >
        </div>
        <template v-if="reward">
          <p class="flex items-center gap-2">
            <img :src="itemUrl(reward.url)" :alt="reward.name" />
            <template v-if="reward.category === 'trophy'">
              You also got a badge!
              <NuxtLink to="/badges">See your badges.</NuxtLink>
            </template>
          </p>
        </template>
      </template>
    </main>

    <footer>
      <form method="dialog" class="text-right">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!unveiledCookie"
        >
          Thank you, Matthias
        </button>
      </form>
    </footer>
  </dialog>
</template>

<script lang="ts" setup>
import { itemUrl } from '#imports';

defineProps<{
  fortune?: string;
  reward?: Item;
}>();

const config = useRuntimeConfig();
const path = config.public.origin + config.public.baseUrl;
const unveiledCookie = ref(false);
const fortuneDialog = useTemplateRef('fortuneDialog');

defineExpose({
  showModal() {
    fortuneDialog.value?.showModal();
  },
});
</script>

<style scoped>
/* .dialog[open] {
  animation: fade-in 0.5s ease-in-out;
}

.dialog a {
  @apply text-green-950;
}

.fortune-cover {
  animation: unveil 5s ease-in-out forwards;
  animation-delay: 1s;
}

.glow {
  animation: animate-glow 3s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .fortune-cover {
    animation: none;
    width: 0%;
  }

  .fortune-cover,
  .glow {
    opacity: 1;
  }
}

@keyframes animate-glow {
  0% {
    box-shadow: 0px 0px 34px 20px rgba(255, 189, 46, 0.7);
  }
  50% {
    box-shadow: 0px 0px 34px 20px rgba(255, 189, 46, 1);
  }
  100% {
    box-shadow: 0px 0px 34px 20px rgba(255, 189, 46, 0.7);
  }
}

@keyframes unveil {
  0% {
    width: 100%;
  }
  100% {
    width: 0%;
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
} */
</style>
