<template>
  <div>
    <h1>Share</h1>
    <div class="space-y-4 [&_p]:max-w-prose [&_h2]:!-mb-4">
      <p>
        Like any public garden, if you want visitors, you've got to advertise.
      </p>
      <p>
        Proudly put one of these in your signature and you may very well show
        someone else the Way of Enlighten<em class="italic">mint</em> as they,
        too, become one with the Garden of Eden.
      </p>
      <div class="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div class="text-center text-sm justify-self-center italic">
          <img src="/share/90x35.png" alt="90x35 banner by Inghelene" />
          Inghelene
        </div>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <label for="90x35-direct">Direct:</label>
            <input
              id="90x35-direct"
              type="text"
              class="font-mono flex-1"
              :value="banner90x35"
              readonly
            />
          </div>
          <div class="flex items-center gap-2">
            <label for="90x35-html">HTML:</label>
            <input
              id="90x35-html"
              type="text"
              class="font-mono flex-1"
              :value="`<a href=&quot;${path}&quot;><img src=&quot;${banner90x35}&quot; alt=&quot;Garden of Eden&quot; /></a>`"
              readonly
            />
          </div>
        </div>
      </div>
      <h2>Other resources</h2>
      <p>Resources by other people, you should check them out!</p>
      <ul class="list-disc list-inside">
        <li>
          <NuxtLink to="https://endulum.github.io/dc-shuffle-clock/index.html"
            >Cave Shuffle Clock</NuxtLink
          >
          by <span class="italic">Mu-Cephei</span> - A tool for cave hunting.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Share',
});

const config = useRuntimeConfig();
const path = config.public.origin + config.public.baseUrl;
const banner90x35 = path + '/share/90x35.png';
</script>
