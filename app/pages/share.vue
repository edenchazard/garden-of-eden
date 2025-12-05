<template>
  <div class="space-y-4 px-4">
    <h1>Share</h1>
    <div class="space-y-2 [&_p]:max-w-prose">
      <p>
        Like any public garden, if you want visitors, you've got to advertise.
      </p>
      <p>
        Proudly put one of these in your signature and you may very well show
        someone else the Way of Enlighten<em class="italic">mint</em> as they,
        too, become one with the Garden of {{ userSettings.siteName }}.
      </p>
      <div class="grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-y-8">
        <div class="text-center text-sm justify-self-center italic">
          <img src="/share/90x35.webp" alt="90x35 banner by Inghelene" />
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

        <div class="text-center text-sm justify-self-center italic">
          <img src="/share/90x51.webp" alt="90x51 banner by Inghelene" />
          Inghelene
        </div>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <label for="90x51-direct">Direct:</label>
            <input
              id="90x51-direct"
              type="text"
              class="font-mono flex-1"
              :value="banner90x51"
              readonly
            />
          </div>
          <div class="flex items-center gap-2">
            <label for="90x51-html">HTML:</label>
            <input
              id="90x51-html"
              type="text"
              class="font-mono flex-1"
              :value="`<a href=&quot;${path}&quot;><img src=&quot;${banner90x51}&quot; alt=&quot;Garden of Eden&quot; /></a>`"
              readonly
            />
          </div>
        </div>

        <div class="text-center text-sm justify-self-center italic">
          <img src="/share/88x63.webp" alt="88x63 banner by Inghelene" />
          Inghelene
        </div>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <label for="88x63-direct">Direct:</label>
            <input
              id="88x63-direct"
              type="text"
              class="font-mono flex-1"
              :value="banner88x63"
              readonly
            />
          </div>
          <div class="flex items-center gap-2">
            <label for="88x63-html">HTML:</label>
            <input
              id="88x63-html"
              type="text"
              class="font-mono flex-1"
              :value="`<a href=&quot;${path}&quot;><img src=&quot;${banner88x63}&quot; alt=&quot;Garden of Eden&quot; /></a>`"
              readonly
            />
          </div>
        </div>

        <div class="col-span-full text-center flex flex-col gap-2">
          <img
            class="self-center"
            src="/share/294x30.webp"
            alt="294x30 banner by Inghelene"
          />
          <span class="italic text-sm">Inghelene</span>
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <label for="294x30-direct">Direct:</label>
              <input
                id="294x30-direct"
                type="text"
                class="font-mono flex-1"
                :value="banner294x30"
                readonly
              />
            </div>
            <div class="flex items-center gap-2">
              <label for="294x30-html">HTML:</label>
              <input
                id="294x30-html"
                type="text"
                class="font-mono flex-1"
                :value="`<a href=&quot;${path}&quot;><img src=&quot;${banner294x30}&quot; alt=&quot;Garden of Eden&quot; /></a>`"
                readonly
              />
            </div>
          </div>
        </div>

        <div class="col-span-full flex flex-col space-y-6">
          <h2>Animated banner</h2>
          <div
            class="self-center flex flex-col items-center lg:flex-row lg:items-start text-center gap-4"
          >
            <div class="flex flex-col space-y-4">
              <img
                :src="`${config.public.baseUrl}/share/scroll/249648-42`"
                alt="animated 327x61 banner by Mu-Cephei"
              />
              <img
                :src="`${config.public.baseUrl}/share/scroll/249648-42?stats=dragons`"
                alt="animated 327x61 banner by Mu-Cephei"
              />
            </div>
            <p
              class="bg-green-500 dark:bg-neutral-800 deep-sea:bg-slate-700 border-transparent rounded-md p-4 max-w-prose text-sm"
            >
              These banners are examples. Your banner will display any eggs and
              hatchlings you currently have in the garden. If you have a flair,
              it'll be shown alongside your username. It updates at a minimum of
              every 30 minutes.
            </p>
          </div>

          <div
            class="flex flex-col min-[840px]:flex-row gap-4 items-start justify-around"
          >
            <div
              class="justify-items-center self-center grid md:grid-cols-[auto_auto_auto] gap-2 items-center text-center md:text-left"
            >
              <ShareScrollBannerPreview
                :params="animatedBannerOptions"
                :banner="`${config.public.baseUrl}/share/scroll/default.webp`"
              />
              <input
                id="animated-default"
                v-model="animatedBannerOptions.style"
                value="default"
                type="radio"
                name="animated-banner"
              />
              <label for="animated-default">Default</label>
              <span class="italic text-sm col-span-full text-center"
                >Mu-Cephei</span
              >
              <ShareScrollBannerPreview
                :params="animatedBannerOptions"
                :banner="`${config.public.baseUrl}/share/scroll/christmas.webp`"
              />
              <input
                id="animated-christmas"
                v-model="animatedBannerOptions.style"
                value="christmas"
                type="radio"
                name="animated-banner"
              />
              <label for="animated-christmas">Christmas</label>
              <span class="italic text-sm col-span-full text-center">Arcy</span>
              <ShareScrollBannerPreview
                :params="animatedBannerOptions"
                :banner="`${config.public.baseUrl}/share/scroll/aquarium.webp`"
              />
              <input
                id="animated-aquarium"
                v-model="animatedBannerOptions.style"
                value="aquarium"
                type="radio"
                name="animated-banner"
              />
              <label for="animated-aquarium">Aquarium</label>
              <span class="italic text-sm col-span-full text-center">Arcy</span>
            </div>

            <div
              class="self-stretch bg-green-500 dark:bg-neutral-800 deep-sea:bg-slate-700 p-4 rounded-md flex-col sm:flex-row flex gap-4 md:flex-none *:flex-1"
            >
              <fieldset>
                <legend class="font-bold">Colours</legend>
                <div class="mt-1 grid grid-cols-[auto_1fr] gap-2 items-center">
                  <input
                    id="animated-username-colour"
                    v-model="animatedBannerOptions.usernameColour"
                    :disabled="useDefaultPalette"
                    type="color"
                  />
                  <label for="animated-username-colour">Username</label>
                  <input
                    id="animated-label-colour"
                    v-model="animatedBannerOptions.labelColour"
                    :disabled="useDefaultPalette"
                    type="color"
                  />
                  <label for="animated-label-colour">Label</label>
                  <input
                    id="animated-value-colour"
                    v-model="animatedBannerOptions.valueColour"
                    :disabled="useDefaultPalette"
                    type="color"
                  />
                  <label for="animated-value-colour">Value</label>
                  <input
                    id="animated-use-default=palette"
                    v-model="useDefaultPalette"
                    type="checkbox"
                  />
                  <label for="animated-use-default=palette">Defaults</label>
                </div>
              </fieldset>

              <fieldset>
                <legend class="font-bold">Type of statistic</legend>
                <div class="mt-1 grid grid-cols-[auto_1fr] gap-2 items-center">
                  <input
                    id="animated-stat-dragons"
                    v-model="animatedBannerOptions.stats"
                    value="dragons"
                    type="radio"
                    name="animated-stat"
                  />
                  <label for="animated-stat-dragons">Dragons</label>
                  <input
                    id="animated-stat-garden"
                    v-model="animatedBannerOptions.stats"
                    value="garden"
                    type="radio"
                    name="animated-stat"
                  />
                  <label for="animated-stat-garden">Garden</label>
                </div>
              </fieldset>
            </div>
          </div>

          <div v-if="authData?.user" class="space-y-2">
            <div class="flex items-center gap-2">
              <label for="animated-327x61-direct">Direct:</label>
              <input
                id="animated-327x61-direct"
                type="text"
                class="font-mono flex-1"
                :value="animatedBannerUrl"
                readonly
              />
            </div>
            <div class="flex items-center gap-2">
              <label for="animated-327x61-html">HTML:</label>
              <input
                id="animated-327x61-html"
                type="text"
                class="font-mono flex-1"
                :value="`<a href=&quot;${path}&quot;><img src=&quot;${animatedBannerUrl}&quot; alt=&quot;Garden of Eden&quot; /></a>`"
                readonly
              />
            </div>
          </div>
          <div v-else class="self-center space-y-2 text-center">
            <p>Animated banners are only available to registered gardeners!</p>
            <button
              type="button"
              class="btn btn-primary"
              @click="signIn('dragcave')"
            >
              Login
            </button>
          </div>
        </div>
      </div>
      <h2>Other resources</h2>
      <p>Resources by other people, you should check them out!</p>
      <ul class="list-disc list-inside">
        <li>
          <NuxtLink to="https://dc-shuffle-clock.vercel.app"
            >Cave Shuffle Clock</NuxtLink
          >
          by <span class="italic">Mu-Cephei</span> - A tool for cave hunting.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  defaultPalette,
  type BannerRequestParameters,
} from '~~/workers/shareScrollWorkerTypes';

useHead({
  title: 'Share',
});

const { userSettings } = useUserSettings();
const { data: authData, signIn } = useAuth();

const config = useRuntimeConfig();
const path = config.public.origin + config.public.baseUrl;
const banner90x35 = path + '/share/90x35.webp';
const banner294x30 = path + '/share/294x30.webp';
const banner90x51 = path + '/share/90x51.webp';
const banner88x63 = path + '/share/88x63.webp';
const useDefaultPalette = ref(true);

const animatedBannerOptions = ref<BannerRequestParameters>({
  style: 'default',
  stats: 'garden',
  ...defaultPalette.default,
  ext: '.gif',
});

watch(
  () => animatedBannerOptions.value.style,
  () => {
    if (useDefaultPalette.value && animatedBannerOptions.value.style) {
      const palette = defaultPalette[animatedBannerOptions.value.style];
      animatedBannerOptions.value.usernameColour = palette.usernameColour;
      animatedBannerOptions.value.labelColour = palette.labelColour;
      animatedBannerOptions.value.valueColour = palette.valueColour;
    }
  }
);

const animatedBannerUrl = computed(() => {
  const params = new URLSearchParams(
    animatedBannerOptions.value satisfies Record<string, string>
  );

  if (useDefaultPalette.value) {
    params.delete('usernameColour');
    params.delete('labelColour');
    params.delete('valueColour');
  }

  if (animatedBannerOptions.value.style === 'default') {
    params.delete('style');
  }

  if (animatedBannerOptions.value.stats === 'garden') {
    params.delete('stats');
  }

  // Hide for now.
  params.delete('ext');

  const url = new URL(
    `${path}/share/scroll/${authData.value?.user.id}-${authData.value?.user.username}`
  );

  url.search = params.toString();
  return url.toString();
});
</script>
