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
            <button
              v-if="authData.user.role === 'owner'"
              type="button"
              title="Clean"
              class="rounded-full bg-blue-500 size-8"
              @click="cleanUp()"
            >
              <font-awesome-icon :icon="['fas', 'broom']" />
            </button>
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
            <font-awesome-icon
              :icon="['fas', 'arrow-right-to-bracket']"
              class="mr-1"
            />
            Sign in
          </button>
        </nav>
      </header>

      <main class="bg-green-600 p-4 space-y-4">
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
                v-model:sort="userSettings.sort"
                :fetch-scroll-status
                :save-scroll-status
                class="md:hidden"
                @reload="refreshScroll()"
                @toggle-all="toggleAll"
              />
              <div
                class="grid gap-6"
                :style="{
                  gridTemplateColumns: `repeat(auto-fill, minmax(15rem, 1fr))`,
                }"
              >
                <div
                  v-for="dragon in dragons"
                  :key="dragon.id"
                  @click="dragon.inHatchery = !dragon.inHatchery"
                  class="relative cursor-pointer"
                  :class="{
                    'shadow-[0px_0px_15px_1px] shadow-yellow-600 transition-shadow':
                      recentlyAdded.includes(dragon.id),
                  }"
                >
                  <div
                    class="grid grid-cols-[2rem_1fr] gap-x-4 gap-y-2 p-2 pb-4 rounded-md items-center border content-border justify-items-start overflow-hidden"
                    :class="
                      dragon.inHatchery
                        ? 'bg-green-500 border-transparent'
                        : 'border-green-500'
                    "
                  >
                    <a
                      :href="`https://dragcave.net/view/${dragon.id}`"
                      target="_blank"
                      class="justify-self-center"
                      :aria-labelledby="`dragon-${dragon.id}`"
                    >
                      <img
                        alt=""
                        loading="lazy"
                        class="max-w-full max-h-full"
                        :src="`https://dragcave.net/image/${dragon.id}/0.gif`"
                      />
                    </a>
                    <div class="text-left w-full">
                      <span
                        class="block truncate font-bold"
                        :id="dragon.name ? `dragon-${dragon.id}` : undefined"
                      >
                        {{ dragon.name ?? "Unnamed" }}
                      </span>
                      <span class="text-sm pl-3 italic">
                        (<span
                          :id="!dragon.name ? `dragon-${dragon.id}` : undefined"
                          >{{ dragon.id }}</span
                        >)
                      </span>
                    </div>

                    <div
                      class="text-xs bg-green-700 p-1 rounded-md self-end *:underline-offset-2 absolute right-3 bottom-4 px-1.5"
                    >
                      {{ formatNumber(dragon.views)
                      }}<abbr title="Views">V</abbr> /
                      {{ formatNumber(dragon.unique)
                      }}<abbr title="Unique Views">U</abbr> /
                      {{ formatNumber(dragon.clicks) }}
                      <abbr title="Clicks">C</abbr>
                    </div>
                    <input
                      class="justify-self-end -top-2 -right-2 absolute"
                      type="checkbox"
                      v-model="dragon.inHatchery"
                    />
                  </div>
                  <div
                    class="text-xs bg-green-800 text-left px-2 py-0.5 rounded-md absolute -bottom-2 right-1 divide-x divide-white *:px-2"
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
                v-model:sort="userSettings.sort"
                @reload="refreshScroll()"
                @toggle-all="toggleAll"
              />
            </fieldset>
          </form>
        </div>
        <section class="p-2 rounded-sm border-t-2">
          <h2 class="text-2xl text-white">Garden</h2>
          <p class="my-1">
            There are currently <b>{{ statistics.total }}</b> dragons from a
            total of <b>{{ statistics.scrolls }}</b> scrolls.
          </p>
          <div
            class="bg-green-500 p-2 rounded-md my-4 flex flex-col md:flex-row items-center"
          >
            <label class="mr-2">Showing</label>
            <select
              v-model.number="userSettings.perPage"
              class="text-black"
            >
              <option value="10">10 dragons</option>
              <option value="25">25 dragons</option>
              <option value="50">50 dragons</option>
              <option value="100">100 dragons</option>
            </select>
            <label class="mx-2">every</label>
            <select v-model.number="userSettings.frequency">
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="120">2 minutes</option>
              <option value="300">5 minutes</option>
            </select>
            <div class="flex-1 flex flex-col md:flex-row gap-x-2 justify-end">
              <button
                v-if="!paused"
                type="button"
                class="bg-red-600 text-white px-4 py-2 rounded-md"
                @click="paused = true"
              >
                <font-awesome-icon :icon="['fas', 'pause']" />
                Pause
              </button>

              <button
                v-else
                type="button"
                class="bg-blue-600 text-white px-4 py-2 rounded-md"
                @click="paused = false"
              >
                <font-awesome-icon :icon="['fas', 'play']" />
                Continue
              </button>
              <button
                type="button"
                class="bg-green-700 text-white px-4 py-2 rounded-md"
                @click="fetchHatchery()"
              >
                <font-awesome-icon
                  :icon="['fas', 'rotate']"
                  :class="{
                    'animate-spin': hatcheryStatus === 'pending',
                  }"
                />
                Reload
              </button>
            </div>
          </div>
          <div>
            <a
              :href="`https://dragcave.net/view/${dragon.code}`"
              target="_blank"
              v-for="dragon in hatchery"
              :key="dragon.id"
            >
              <img
                alt=""
                loading="lazy"
                class="inline"
                :src="`https://dragcave.net/image/${dragon.code}.gif`"
              />
            </a>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const paused = ref(false);

const { data: authData, signIn, signOut } = useAuth();

const { data: userSettings } = await useFetch("/api/user/settings", {
  default: () => ({
    frequency: 30,
    perPage: 50,
    sort: "Youngest First" as const,
  }),
});

const {
  data: dragons,
  execute: fetchScroll,
  status: fetchScrollStatus,
} = await useFetch("/api/user/scroll", {
  immediate: !!authData.value?.user,
  default: () => [],
});

const {
  data: hatchery,
  execute: fetchHatchery,
  status: hatcheryStatus,
} = await useFetch("/api/hatchery", {
  default: () => [],
  params: {
    limit: userSettings.value.perPage,
  },
  watch: [() => [userSettings.value.frequency, userSettings.value.perPage]],
});

const { data: statistics } = await useFetch("/api/hatchery/statistics", {
  default: () => ({
    total: 0,
    scrolls: 0,
  }),
});

const {
  data: recentlyAdded,
  execute: saveScroll,
  status: saveScrollStatus,
} = useAsyncData(
  () =>
    $fetch("/api/user/scroll", {
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

const { execute: cleanUp } = useFetch("/api/hatchery", {
  method: "DELETE",
  immediate: false,
  body: {},
});

useFrequency(userSettings, paused, fetchHatchery);

const isProcessing = computed(() =>
  [fetchScrollStatus.value, saveScrollStatus.value].includes("pending")
);

watch(
  userSettings,
  () => {
    $fetch("/api/user/settings", {
      method: "PATCH",
      body: userSettings.value,
    });
  },
  {
    deep: true,
  }
);

watch(
  () => [userSettings.value.sort, dragons],
  () => {
    dragons.value.sort((a, b) => {
      if (userSettings.value.sort === "Youngest First")
        return a.hoursleft - b.hoursleft;
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
