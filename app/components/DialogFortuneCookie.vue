<template>
  <!-- eslint-disable vue/no-v-html We're good. -->
  <dialog
    ref="fortuneDialog"
    class="backdrop:bg-black/50 m-auto p-4 rounded-lg max-w-md bg-green-100 dark:bg-stone-200 deep-sea:bg-slate-500 deep-sea:text-white shadow-xl open:animate-[fade-in_0.5s_ease-in-out] [&_a]:text-green-950"
    @close="unveiledCookie = false"
  >
    <header>
      <h2>Reveal your fortune!</h2>
    </header>

    <main class="space-y-4">
      <img
        class="mx-auto my-12 animate-[glow_3s_ease-in-out_infinite] glow rounded-full motion-reduce:opacity-1"
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
            class="w-full absolute right-0 h-full bg-green-100 dark:bg-stone-200 deep-sea:bg-slate-500 animate-[unveil_5s_ease-in-out_forwards_1s] motion-reduce:animate-none motion-reduce:w-0 motion-reduce:opacity-1"
          />
          <q
            class="block px-4 py-2 bg-orange-300 text-black italic text-center sm:px-8"
            v-html="fortune"
          />
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
