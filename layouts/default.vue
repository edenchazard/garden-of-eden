<template>
  <div class="w-full max-w-screen-lg space-y-4">
    <div class="flex flex-col rounded-md overflow-hidden">
      <header
        class="px-2 lg:px-0 flex flex-col gap-y-2 md:gap-y-0 md:flex-row border-b-2 pb-2 justify-between items-center"
      >
        <h1 class="text-2xl">Garden Of Eden</h1>
        <nav
          class="flex flex-col md:flex-row gap-x-4 gap-y-2 justify-end items-center"
        >
          <template v-if="authData?.user">
            <button
              v-if="authData.user.role === 'owner'"
              type="button"
              title="Clean"
              class="border size-8 rounded-full !p-0"
              @click="cleanUp()"
            >
              <font-awesome-icon
                :icon="['fas', 'broom']"
                class="!mr-0"
              />
            </button>
            <ClientOnly>
              <label class="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  :checked="colorMode.preference === 'dark'"
                  @change="
                    $colorMode.preference = ($event.target as HTMLInputElement)
                      .checked
                      ? 'dark'
                      : 'mint'
                  "
                  class="sr-only peer"
                />
                <div
                  class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sky-900"
                ></div>
                <span class="ms-3 text-sm font-medium dark:text-gray-300">
                  {{ colorMode.preference === "dark" ? "Dark" : "Mint" }}
                </span>
              </label>
            </ClientOnly>
            <span>
              Logged in as
              <NuxtLink
                :to="`https://dragcave.net/user/${authData?.user.username}`"
                target="_blank"
              >
                {{ authData?.user.username }}
              </NuxtLink>
            </span>
            <span class="hidden md:inline">&bull;</span>
            <button
              class="underline-offset-4 underline !px-0 !shadow-none"
              type="button"
              @click="signOut()"
              title="Sign out"
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
            title="Sign in"
          >
            <font-awesome-icon :icon="['fas', 'arrow-right-to-bracket']" />Sign
            in
          </button>
        </nav>
      </header>

      <slot />
      <footer
        class="pb-4 px-2 lg:px-0 text-right text-xs [&_a]:tracking-wider [&_a]:decoration-dotted"
      >
        <p class="italic leading-4">
          powered by
          <font-awesome-icon :icon="['fas', 'leaf']" /><br />
          handcrafted by eden chazard
          <font-awesome-icon :icon="['fas', 'hammer']" />
        </p>
        <div class="flex gap-x-2 justify-end">
          <NuxtLink
            to="https://forums.dragcave.net/topic/189636-chazzas-dc-tools-garden-of-eden-lineage-builder-fart/"
          >
            forum thread</NuxtLink
          >&bull;<NuxtLink to="https://ko-fi.com/dctools">ko-fi</NuxtLink
          >&bull;<NuxtLink to="https://github.com/edenchazard/garden-of-eden"
            >github</NuxtLink
          >&bull;<NuxtLink to="https://chazza.me/dc/tools">want more?</NuxtLink>
        </div>
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
const colorMode = useColorMode();
const { data: authData, signIn, signOut } = useAuth();

const { execute: cleanUp } = useFetch("/api/hatchery", {
  method: "DELETE",
  immediate: false,
  body: {},
});
</script>
