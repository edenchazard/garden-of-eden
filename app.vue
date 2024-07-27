<template>
  <div class="container flex max-w-4xl">
    <NuxtRouteAnnouncer />
    <div class="flex-1 text-white flex flex-col rounded-md overflow-hidden">
      <header class="border-b-2 pb-2 flex justify-between items-center">
        <h1 class="text-xl">Garden Of Eden</h1>
        <nav class="flex gap-x-4 justify-end items-center">
          <template v-if="authData?.user">
            <span>
              Logged in as
              <a
                :href="`https://dragcave.net/user/${authData?.user.username}`"
                target="_blank"
                class="underline underline-offset-4"
              >
                {{ authData?.user.username }}
              </a>
            </span>

            <button
              class="bg-red-500 p-2 rounded-md"
              type="button"
              @click="signOut()"
              title="Sign out"
            >
              <font-awesome-icon
                icon="arrow-right-from-bracket"
                class="mr-1"
              />
              Sign out
            </button>
          </template>
          <button
            v-else
            class="bg-blue-500 p-2 rounded-md"
            type="button"
            @click="signIn('dragcave')"
            title="Sign in"
          >
            <font-awesome-icon icon="arrow-right-to-bracket" />
          </button>
        </nav>
      </header>

      <main class="bg-green-600 p-4 space-y-2">
        <div class="w-full text-center">
          <div
            v-if="!authData?.user"
            class="flex flex-col gap-y-4"
          >
            <p>
              The <b>Garden Of Eden</b> is a highly secure garden where only
              those with a DragCave account can enter. You'll need to sign in to
              add your <s>plants</s> dragons.
            </p>
            <button
              class="bg-blue-500 p-4 rounded-md"
              type="button"
              @click="signIn('dragcave')"
            >
              Sign in via DragCave
            </button>
            <p class="text-xs">
              * The above link will take you directly to
              <b class="font-normal">dragcave.net</b>
            </p>
            <p>
              Without signing in, you can still give views and clicks, but you
              won't be able to add your own plants.
              <span class="italic">
                You're basically looking through the gate and waving at the
                plants like a madman.
              </span>
            </p>
          </div>

          <div v-else>
            <div class="flex justify-end">
              <button
                type="button"
                :disabled="status === 'pending'"
                @click="fetchScroll()"
              >
                <font-awesome-icon
                  icon="rotate"
                  class="mr-1"
                  :class="{ 'animate-spin': status === 'pending' }"
                />
                Reload
              </button>
            </div>
            <div
              class="inline-grid md:grid-cols-[auto_1fr_auto] gap-y-1 gap-x-4 items-center"
            >
              <span>&nbsp;</span>
              <b>Name/Code</b>
              <b>In The Garden</b>
              <template
                v-for="dragon in dragons"
                :key="dragon.id"
              >
                <img :src="`https://dragcave.net/image/${dragon.id}/0.gif`" />
                <div>
                  <b class="block">{{ dragon.name ?? "Unnamed" }}</b>
                  <i class="text-sm">({{ dragon.id }})</i>
                </div>
                <input
                  type="checkbox"
                  v-model="dragon.inHatchery"
                />
              </template>
              <div class="col-span-2">&nbsp;</div>
              <input
                type="checkbox"
                :checked="dragons.every((dragon) => dragon.inHatchery)"
                @change="
                  dragons.forEach(
                    (dragon) =>
                      (dragon.inHatchery = (
                        $event.target as HTMLInputElement
                      ).checked)
                  )
                "
              />
            </div>
          </div>
        </div>
        <div class="bg-green-500 p-2 rounded-sm">some more dragons be here</div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: authData, signIn, signOut } = useAuth();
const {
  data: dragons,
  execute: fetchScroll,
  status,
} = await useFetch("/api/user/scroll", {
  watch: [authData?.user],
});
</script>
