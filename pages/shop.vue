<template>
  <div class="space-y-4 *:space-y-4">
    <section>
      <h1>Matthias' Shop</h1>
      <div class="max-w-prose space-y-4 relative overflow-hidden">
        <p>
          As you stroll through the garden, you notice a small, hidden path. You
          follow it and find yourself at a small building surrounded by a vast
          clearing.
        </p>
        <q>Pssst!</q>
        <p>A voice calls to you from inside.</p>
        <q>Come on in!</q>
        <p>
          Inside, a small mint dragon tumbles from the shelves and lands in
          front of you, propped up against the counter.
        </p>
        <img
          :src="matthias"
          alt="Matthias the mint dragon"
          class="matthias opacity-0"
          height="34"
        />
        <q>My name is Matthias, I'm a humble businessmint. Pardon the mess.</q>
        <p>
          The mighty Matthias of the business world looks you up and down
          <i class="italic">(as best as he can anyway, he's not very tall)</i>,
          and his piercing gaze is confirmation that he's assessing how best to
          get the most of your Dragon Dollars.
        </p>
        <p>The brief and unnerving silence concludes...</p>
        <q>Now then, let's get right to business.</q>
        <p>You never even asked, and yet he's going to tell you anyway.</p>
        (<NuxtLink class="text-sm italic" to="#policy"
          >Terms and Conditions apply, please see Matthias' purchase
          policy.</NuxtLink
        >)
      </div>

      <div
        class="p-4 bg-orange-200 text-black dark:bg-sky-900 dark:text-white max-w-prose mx-auto rounded-lg grid gap-2 grid-cols-[auto_1fr] data-center"
      >
        <p class="col-span-full">
          Matthias will sell you <strong>flairs</strong> to display alongside
          your username in return for <strong>Dragon Dollars</strong>. You can
          display one flair but it can be changed at any time. Flowers wilt, so
          after 7 days it will disappear.
        </p>
        <p class="col-span-full">
          You can acquire Dragon Dollars by clicking on dragons in the site and
          may have a maximum of 500 Dragon Dollars at any time.
        </p>
        <font-awesome-icon :icon="['fas', 'dragon']" class="size-4" />
        <p>You have {{ authData?.user.money ?? 0 }} Dragon Dollars.</p>
        <template v-if="data.currentFlair">
          <img :src="userFlair(data.currentFlair.url)" alt="" />
          <p v-if="data.currentFlair">
            You currently have the
            <strong>{{ data.currentFlair.name }}</strong> flair. It will wilt on
            <ClientOnly>
              {{
                DateTime.fromISO(data.currentFlair.purchasedOn)
                  .plus({
                    days: 7,
                  })
                  .toLocaleString({
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })
              }}</ClientOnly
            >.
          </p>
        </template>
        <p v-else class="col-span-full">You have no flair currently.</p>
      </div>
    </section>

    <section id="regular">
      <h3>Regular stock</h3>
      <q class="max-w-prose"
        >I can sell you these at any time. Some are expensive, but well worth
        the money.</q
      >
      <ul
        class="grid gap-6 mt-4 justify-center"
        :style="{
          gridTemplateColumns: `repeat(auto-fit, 19rem)`,
        }"
      >
        <ShopPanel
          v-for="item in data.regular"
          :key="item.id"
          :item="item"
          as="li"
          @purchase="purchase"
        />
      </ul>
    </section>

    <section id="limited">
      <h3>Limited stock</h3>
      <template v-if="data.limited.length === 0">
        <q class="max-w-prose"
          >I currently don't have anything limited right now, so please check
          back later.</q
        >
      </template>

      <template v-else>
        <q class="max-w-prose"
          >In addition to these regular items, I also have a few seasonal
          stock.</q
        >
        <ul
          class="grid gap-6 mt-4 justify-center"
          :style="{
            gridTemplateColumns: `repeat(auto-fit, 19rem)`,
          }"
        >
          <ShopPanel
            v-for="item in data.limited"
            :key="item.id"
            :item="item"
            as="li"
            @purchase="purchase"
          />
        </ul>
      </template>
    </section>

    <section id="policy" class="max-w-prose">
      <h2>Purchase Policy</h2>
      <p>
        Matthias does not offer refunds. All sales are final. All transactions
        are exempt from The Consumer Protection (Distance Selling) Regulations
        Act 2000.
      </p>
    </section>
    <section id="credits">
      <h2>Art credits</h2>
      <p>
        Art by:
        {{
          Array.from(
            new Set(
              [...data.limited, ...data.regular].map((item) => item.artist)
            )
          ).join(', ')
        }}
      </p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { userFlair } from '#imports';
import { DateTime } from 'luxon';

definePageMeta({
  middleware: 'auth',
});

useHead({
  title: "Matthias' Shop",
});

const { data: authData, getSession } = useAuth();
await getSession();
const { data } = await useFetch('/api/shop', {
  immediate: true,
  default: () => ({
    currentFlair: null,
    regular: [],
    limited: [],
  }),
});

async function purchase(item: Item) {
  $fetch(`/api/shop/${item.id}`, {
    method: 'POST',
    headers: {
      'Csrf-token': useCsrf().csrf,
    },
    body: {},

    async onResponse({ response }) {
      if (!response.ok) {
        toast.error('Failed to purchase flair.');
        return;
      }

      await Promise.all([refreshNuxtData(), getSession()]);
      toast.success('Flair updated!');
      return;
    },
  });
}

const config = useRuntimeConfig();
const path = config.public.origin + config.public.baseUrl;
const matthias = `${path}/npc/matthias.gif`;
</script>

<style scoped>
q {
  @apply border-l-4 block pl-4;
}

.matthias {
  animation: animate-roll 2s ease-in-out forwards 1s;
}

@media (prefers-reduced-motion: reduce) {
  .matthias {
    animation: none;
    opacity: 1;
  }
}

@keyframes animate-roll {
  0% {
    opacity: 1;
    transform: translateX(-100%) rotate(-90deg);
  }
  100% {
    opacity: 1;
    transform: translate(100%) rotate(1080deg);
  }
}
</style>
