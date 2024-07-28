<template>
  <div class="container flex max-w-4xl">
    <NuxtRouteAnnouncer />
    <div class="flex-1 text-white flex flex-col rounded-md overflow-hidden">
      <header
        class="flex flex-col gap-y-2 md:gap-y-0 md:flex-row border-b-2 pb-2 justify-between items-center"
      >
        <h1 class="text-2xl">Garden Of Eden</h1>
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
                :icon="['fas', 'arrow-right-from-bracket']"
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
            <font-awesome-icon :icon="['fas', 'arrow-right-to-bracket']" />
          </button>
        </nav>
      </header>

      <main class="bg-green-600 p-4 space-y-6">
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

          <form
            v-else
            @submit.prevent="saveScroll()"
          >
            <fieldset
              class="space-y-4 transition-opacity"
              :disabled="isProcessing"
              :class="{
                'opacity-50': isProcessing,
              }"
            >
              <ScrollToolbar
                :dragons
                v-model:sort="sort"
                :fetch-scroll-status
                :save-scroll-status
                class="md:hidden"
                @reload="refreshScroll()"
                @toggle-all="toggleAll"
              />
              <div
                class="grid gap-6"
                :style="{
                  gridTemplateColumns: `repeat(auto-fit, minmax(15rem, 1fr))`,
                }"
              >
                <div
                  v-for="dragon in dragons"
                  :key="dragon.id"
                  @click="dragon.inHatchery = !dragon.inHatchery"
                  class="relative cursor-pointer"
                  :class="{
                    ' shadow-[0px_0px_15px_1px] shadow-yellow-600 transition-shadow':
                      recentlyAdded.includes(dragon.id),
                  }"
                >
                  <div
                    class="grid grid-cols-[2rem_auto_1fr] gap-x-4 gap-y-2 p-2 pb-4 rounded-md items-center border content-border"
                    :class="
                      dragon.inHatchery
                        ? 'bg-green-500 border-transparent'
                        : 'border-green-500'
                    "
                  >
                    <img
                      class="justify-self-center max-w-full max-h-full"
                      :src="`https://dragcave.net/image/${dragon.id}/0.gif`"
                    />
                    <div>
                      <b class="block">{{ dragon.name ?? "Unnamed" }}</b>
                      <i class="text-sm">({{ dragon.id }})</i>
                    </div>

                    <div
                      class="text-xs bg-green-700 p-1 rounded-md self-start *:underline-offset-2"
                    >
                      {{ formatNumber(dragon.views)
                      }}<abbr title="Views">V</abbr> /
                      {{ formatNumber(dragon.clicks)
                      }}<abbr title="Clicks">C</abbr> /
                      {{ formatNumber(dragon.unique)
                      }}<abbr title="Unique Views">U</abbr>
                    </div>
                    <input
                      class="justify-self-end -top-2 -right-2 absolute"
                      type="checkbox"
                      v-model="dragon.inHatchery"
                    />
                  </div>
                  <div
                    class="text-xs bg-green-800 text-left px-2 py-0.5 rounded-md absolute -bottom-1 right-1 divide-x divide-white *:px-2"
                  >
                    <span class="!pl-0.5">
                      {{ dragon.parent_f && dragon.parent_m ? "L" : "CB" }}
                    </span>
                    <span
                      v-if="dragon.gender"
                      :title="dragon.gender"
                    >
                      <font-awesome-icon
                        :icon="['fas', 'mars']"
                        v-if="dragon.gender === 'Male'"
                      />
                      <font-awesome-icon
                        :icon="['fas', 'venus']"
                        v-else-if="dragon.gender === 'Female'"
                      />
                    </span>
                    <span class="!pr-0.5">
                      {{ formatHoursLeft(dragon.hoursleft) }}
                    </span>
                  </div>
                </div>
              </div>
              <ScrollToolbar
                :dragons
                :fetch-scroll-status
                :save-scroll-status
                v-model:sort="sort"
                @reload="refreshScroll()"
                @toggle-all="toggleAll"
              />
            </fieldset>
          </form>
        </div>
        <div class="bg-green-500 p-2 rounded-sm">
          <h2 class="text-2xl text-green-950 mb-2">Garden</h2>
          <a
            :href="`https://dragcave.net/view/${dragon.code}`"
            target="_blank"
            v-for="dragon in hatchery"
            :key="dragon.id"
          >
            <img
              class="inline"
              :src="`https://dragcave.net/image/${dragon.code}.gif`"
            />
          </a>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: authData, signIn, signOut } = useAuth();
const {
  data: dragons,
  execute: fetchScroll,
  status: fetchScrollStatus,
} = await useFetch("/api/user/scroll", {
  immediate: !!authData.value?.user,
  default: () => [],
});

const { data: hatchery } = await useFetch("/api/hatchery/viewer", {
  default: () => [],
});

const {
  data: recentlyAdded,
  execute: saveScroll,
  status: saveScrollStatus,
} = useAsyncData(
  () =>
    $fetch("/api/user/update", {
      method: "PATCH",
      body: dragons.value
        .filter((dragon) => dragon.inHatchery)
        .map((dragon) => dragon.id),
      onResponse() {
        setTimeout(() => (recentlyAdded.value = []), 1000);
      },
    }),
  {
    immediate: false,
    default: () => [],
  }
);

const sort = ref<"Youngest First" | "Oldest First">("Oldest First");

const isProcessing = computed(() =>
  [fetchScrollStatus.value, saveScrollStatus.value].includes("pending")
);

watch(
  [sort, dragons],
  () => {
    dragons.value.sort((a, b) => {
      if (sort.value === "Youngest First") return a.hoursleft - b.hoursleft;
      return b.hoursleft - a.hoursleft;
    });
  },
  {
    immediate: true,
  }
);

async function refreshScroll() {
  const currentState = [...dragons.value];
  await fetchScroll();
  dragons.value.forEach((dragon) => {
    const oldDragon = currentState.find((d) => d.id === dragon.id);
    if (oldDragon) dragon.inHatchery = oldDragon.inHatchery;
  });
}

function toggleAll(checked: boolean) {
  dragons.value.forEach((dragon) => (dragon.inHatchery = checked));
}
</script>
