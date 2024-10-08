<template>
  <div class="w-full max-w-screen-lg space-y-4 py-4">
    <div class="flex flex-col rounded-md">
      <header
        class="px-2 lg:px-0 space-y-4 sm:space-y-0 pb-4 justify-between items-center"
      >
        <div class="flex justify-end gap-3 pb-3">
          <span v-if="authData?.user" class="truncate">
            <span class="hidden sm:inline">Logged in as&nbsp;</span
            ><NuxtLink
              :to="`https://dragcave.net/user/${authData?.user.username}`"
              target="_blank"
            >
              {{ authData?.user.username }}
            </NuxtLink>
          </span>
          <ClientOnly>
            <ToggleInput
              :model-value="$colorMode.preference === 'dark'"
              :label="colorMode.preference === 'dark' ? 'Dark' : 'Mint'"
              @update:model-value="
                $colorMode.preference = $event ? 'dark' : 'mint'
              "
            />
          </ClientOnly>
          <NuxtLink
            v-if="authData?.user"
            to="/settings"
            class="shrink-0 pl-2 text-white dark:text-stone-200 group"
            ><font-awesome-icon
              :icon="['fas', 'cog']"
              class="mr-2 motion-safe:group-hover:animate-spin"
            />Settings</NuxtLink
          >
        </div>
        <div class="flex gap-y-4 flex-col sm:flex-row justify-between">
          <div class="text-center">
            <NuxtLink
              to="/"
              :style="{
                backgroundImage: `url(https://dragcave.net/image/2OrD.gif)`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '0.2rem',
              }"
              class="pl-9 text-3xl text-white dark:text-stone-200 tracking-wider font-thin decoration-transparent"
              >Garden of {{ userSettings.siteName }}</NuxtLink
            >
          </div>
          <nav
            class="flex gap-x-4 gap-y-2 justify-center sm:justify-end items-center"
          >
            <NuxtLink class="text-white dark:text-stone-200" to="/statistics"
              >Statistics</NuxtLink
            >
            <span>&bull;</span>
            <NuxtLink class="text-white dark:text-stone-200" to="/share"
              >Share</NuxtLink
            >
            <template v-if="authData?.user">
              <span>&bull;</span>
              <button
                class="underline-offset-4 underline !px-0 !shadow-none"
                type="button"
                @click="signOut()"
              >
                <font-awesome-icon
                  :icon="['fas', 'arrow-right-from-bracket']"
                />Sign out
              </button>
            </template>
            <button
              v-else
              class="underline-offset-4 underline !px-0 !shadow-none"
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
        class="lg:rounded-t-md bg-green-600/80 dark:bg-neutral-900 p-4 space-y-4 shadow-lg shadow-black/20 dark:shadow-black/50"
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
            class="border size-8 rounded-full !p-0 self-center"
            @click="cleanUp()"
          >
            <font-awesome-icon :icon="['fas', 'broom']" class="!mr-0" />
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
useHead({
  titleTemplate(titleChunk) {
    return titleChunk
      ? `${titleChunk} - Garden of ${userSettings.value.siteName}`
      : `Garden of ${userSettings.value.siteName}`;
  },
});

const colorMode = useColorMode();

const { data: authData, signIn, signOut } = useAuth();

const { userSettings } = useUserSettings();

const { execute: cleanUp } = useCsrfFetch('/api/hatchery', {
  method: 'DELETE',
  immediate: false,
  body: {},
});
</script>
