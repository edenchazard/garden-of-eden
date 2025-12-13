<template>
  <div class="max-w-(--breakpoint-lg) space-y-4 pt-2.5 pb-4 w-full">
    <WarningApiBlock v-if="authData?.user?.apiBlocked" />

    <div class="flex flex-col rounded-md">
      <header
        class="px-2 lg:px-0 space-y-2 sm:space-y-0 pb-2 justify-between items-center [&_.link]:text-white! dark:[&_.link]:text-stone-200! deep-sea:[&_.link]:text-blue-50!"
      >
        <div
          class="flex flex-col min-[500px]:flex-row gap-x-3 gap-y-3 min-h-9 min-[500px]:items-center justify-end"
        >
          <span
            v-if="authData?.user"
            class="flex items-center justify-end gap-x-1"
          >
            <span>Logged in as&nbsp;</span
            ><NuxtLink
              :to="`https://dragcave.net/user/${authData?.user.username}`"
              target="_blank"
              class="truncate whitespace-nowrap"
              >{{ authData.user.username }}</NuxtLink
            >
            <span v-if="authData.user.flair" class="ml-1 w-[19px]">
              <img
                class="shrink-0"
                :src="itemUrl(authData.user.flair.url)"
                :alt="authData.user.flair.name"
              />
            </span>
          </span>
          <div class="flex items-center justify-end gap-x-[inherit]">
            <ClientOnly>
              <select
                class="inline-block w-[7rem] rounded px-2 !py-1 text-xs"
                :value="$colorMode.preference"
                @change="
                  $colorMode.preference = (
                    $event.target as HTMLSelectElement
                  ).value
                "
              >
                <option value="system">System</option>
                <option value="mint">Mint</option>
                <option value="dark">Dark</option>
                <option value="deep-sea">Deep Sea</option>
              </select>
              <template #fallback>
                <select
                  class="inline-block w-[7rem] rounded px-2 !py-1 text-xs"
                  disabled
                />
              </template>
            </ClientOnly>
            <NuxtLink
              v-if="authData?.user"
              to="/settings"
              class="shrink-0 pl-2 group link"
              ><font-awesome-icon
                :icon="['fas', 'cog']"
                class="mr-2 motion-safe:group-hover:animate-spin"
              />Settings</NuxtLink
            >
          </div>
        </div>
        <div class="flex gap-y-1 flex-col sm:flex-row justify-between">
          <div class="text-center z-10">
            <span class="inline-block relative bg-(--outer-bg)">
              <GhostOfEden />
              <SantaMatthias />
              <NuxtLink
                to="/"
                :style="{
                  backgroundImage: `url(https://dragcave.net/image/2OrD.gif)`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '0.2rem',
                }"
                class="link pl-9 text-3xl tracking-wider font-thin decoration-transparent"
                >Garden of {{ userSettings.siteName }}</NuxtLink
              ></span
            >
          </div>
          <nav
            class="grid grid-cols-2 justify-items-center min-[360px]:flex gap-x-4 gap-y-2 justify-center sm:justify-end items-center [&_a]:underline-offset-4 [&_a]:underline [&_a]:px-0! [&_a]:shadow-none!"
          >
            <NuxtLink class="link" to="/statistics">Statistics</NuxtLink>
            <span class="hidden min-[360px]:inline">&bull;</span>
            <NuxtLink class="link" to="/share">Share</NuxtLink>
            <span class="hidden min-[360px]:inline">&bull;</span>
            <NuxtLink class="link" to="/shop">Shop</NuxtLink>
            <span class="hidden min-[360px]:inline">&bull;</span>
            <button
              v-if="authData?.user"
              class="link underline-offset-4 underline px-0! shadow-none!"
              type="button"
              @click="signOut()"
            >
              <font-awesome-icon
                :icon="['fas', 'arrow-right-from-bracket']"
              />Sign out
            </button>
            <button
              v-else
              class="link underline-offset-4 underline px-0! shadow-none!"
              type="button"
              @click="signIn('dragcave')"
            >
              <font-awesome-icon
                :icon="['fas', 'arrow-right-to-bracket']"
              />Sign in
            </button>
          </nav>
        </div>
      </header>
      <main
        :style="{ overflow: 'initial' }"
        class="lg:rounded-t-md bg-green-600/80 dark:bg-neutral-900 deep-sea:bg-slate-800 py-4 space-y-4 shadow-lg shadow-black/20 dark:shadow-black/50"
      >
        <slot />
      </main>
      <footer
        class="pt-4 px-2 flex lg:px-0 text-right text-xs [&_a]:tracking-wider [&_a]:decoration-dotted"
      >
        <div>
          <button
            v-if="authData?.user?.role === 'owner'"
            type="button"
            title="Clean"
            class="border size-8 rounded-full p-0! self-center"
            @click="cleanUp()"
          >
            <font-awesome-icon :icon="['fas', 'broom']" class="mr-0!" />
          </button>
        </div>
        <div
          class="flex-1 flex flex-col gap-y-2 [&>p]:italic [&>p]:leading-4 items-end"
        >
          <p>
            powered by plants
            <font-awesome-icon :icon="['fas', 'leaf']" />
          </p>
          <p>
            handcrafted by eden chazard
            <font-awesome-icon :icon="['fas', 'hammer']" />
          </p>
          <div class="flex gap-2 justify-end">
            <NuxtLink
              to="https://forums.dragcave.net/topic/189636-chazzas-dc-tools-garden-of-eden-lineage-builder-fart/"
            >
              forum thread</NuxtLink
            >&bull;<NuxtLink to="https://ko-fi.com/dctools">ko-fi</NuxtLink
            >&bull;<NuxtLink to="https://github.com/edenchazard/garden-of-eden"
              >github</NuxtLink
            >&bull;<NuxtLink to="https://chazza.me/dc/tools"
              >want more?</NuxtLink
            >
          </div>
          <ClientOnly>
            <NuxtLink v-if="$colorMode.value === 'mint'" to="/single-tear">
              don't like the green?
            </NuxtLink>
          </ClientOnly>
        </div>
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import itemUrl from '~/utils/itemUrl';
import SantaMatthias from '~/components/SantaMatthias.vue';
import GhostOfEden from '~/components/GhostOfEden.vue';

useHead({
  titleTemplate(titleChunk) {
    return titleChunk
      ? `${titleChunk} - Garden of ${userSettings.value.siteName}`
      : `Garden of ${userSettings.value.siteName}`;
  },
});

const { data: authData, signIn, signOut } = useAuth();

const { userSettings } = useUserSettings();

const { execute: cleanUp } = useFetch('/api/hatchery', {
  headers: computed(() => ({
    'Csrf-token': useCsrf().csrf,
  })),
  method: 'DELETE',
  immediate: false,
  body: {},
});
</script>
