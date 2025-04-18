<template>
  <div class="px-4 space-y-4 *:space-y-4">
    <DialogFortuneCookie ref="fortuneDialog" :fortune :reward />

    <section>
      <h1>Matthias' Shop</h1>
      <div class="max-w-prose space-y-4 relative overflow-hidden">
        <p>
          As you stroll through the garden, you notice a small, hidden path. You
          follow it and find yourself at a small building surrounded by a vast
          clearing.
        </p>
        <q class="quote">Pssst!</q>
        <p>A voice calls to you from inside.</p>
        <q class="quote">Come on in!</q>
        <p>
          Inside, a small mint dragon tumbles from the shelves and lands in
          front of you, propped up against the counter.
        </p>
        <img
          :src="`${path}/npc/matthias.webp`"
          alt="Matthias the mint dragon"
          class="opacity-0 animate-[matthias-roll_2s_ease-in-out_forwards_1s]"
          height="34"
        />
        <q class="quote"
          >My name is Matthias, I'm a humble businessmint. Pardon the mess.</q
        >
        <p>
          The mighty Matthias of the business world looks you up and down
          <i class="italic">(as best as he can anyway, he's not very tall)</i>,
          and his piercing gaze is confirmation that he's assessing how best to
          get the most of your Dragon Dollars.
        </p>
        <p>The brief and unnerving silence concludes...</p>
        <q class="quote">Now then, let's get right to business.</q>
        <p>You never even asked, and yet he's going to tell you anyway.</p>
        (<NuxtLink class="text-sm italic" to="#policy"
          >Terms and Conditions apply, please see Matthias' purchase
          policy.</NuxtLink
        >)
      </div>

      <div
        v-if="authData?.user"
        class="p-4 bg-orange-200 text-black dark:bg-sky-900 dark:text-white max-w-prose mx-auto rounded-lg grid items-center gap-2 grid-cols-[auto_1fr] data-center"
      >
        <p class="col-span-full">
          Matthias will sell you <strong>flairs</strong> to display alongside
          your username in return for <strong>Dragon Dollars</strong>. You can
          display one flair but it can be changed at any time. Flairs expire, so
          after 7 days it will disappear.
        </p>
        <p class="col-span-full">
          You can acquire Dragon Dollars by clicking on dragons in the site and
          may have a maximum of 500 Dragon Dollars at any time.
        </p>
        <img src="/public/other/dragon-dollar.webp" width="17" height="10" />
        <p>You have {{ authData?.user.money ?? 0 }} Dragon Dollars.</p>
        <template v-if="data.currentFlair">
          <img :src="itemUrl(data.currentFlair.url)" alt="" />
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
      <div v-else class="text-center space-y-2 max-w-prose mx-auto">
        <p>
          Matthias will sell you <strong>flairs</strong> to display alongside
          your username in exchange for Dragon Dollars, earned by clicking. You
          must be logged in.
        </p>
        <button
          type="button"
          class="btn btn-primary"
          @click="signIn('dragcave')"
        >
          Login
        </button>
      </div>
    </section>

    <section
      v-if="data.consumables.length > 0"
      id="consumables"
      class="*:space-y-4"
    >
      <template v-for="item in data.consumables" :key="item.id">
        <div v-if="item.name === 'Fortune Cookie'">
          <h3>Happy new year!</h3>
          <div class="flex flex-col md:flex-row gap-4 md:items-start">
            <q class="max-w-prose"
              >Happy new year everyone! Please purchase a fortune cookie to
              reveal your fortune for the new year. Good luck.
            </q>
            <ShopPanel
              class="max-w-[19rem]"
              :item="item"
              as="div"
              @purchase="handleItem(item)"
            />
          </div>
        </div>
      </template>
    </section>

    <section v-if="data.limited.length > 0" id="limited">
      <h3>Limited stock</h3>
      <q class="max-w-prose quote"
        >These won't be around for long, so make sure to use them while you
        can.</q
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
          @purchase="handleItem(item)"
        />
      </ul>
    </section>

    <section id="regular">
      <h3>Regular stock</h3>
      <q class="max-w-prose quote"
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
          @purchase="handleItem(item)"
        />
      </ul>
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
              [...data.limited, ...data.regular, ...data.consumables].map(
                (item) => item.artist
              )
            )
          )
            .sort()
            .join(', ')
        }}
      </p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { itemUrl } from '#imports';
import { DateTime } from 'luxon';
import DialogFortuneCookie from '~/components/DialogFortuneCookie.vue';

useHead({
  title: "Matthias' Shop",
});

const { data: authData, getSession, signIn } = useAuth();
const config = useRuntimeConfig();
const path = config.public.origin + config.public.baseUrl;
const fortuneDialog = useTemplateRef('fortuneDialog');
const fortune = ref<string | undefined>();
const reward = ref<Item | undefined>();

await getSession();

const { data } = await useFetch('/api/shop', {
  immediate: true,
  default: () => ({
    currentFlair: null,
    regular: [],
    limited: [],
    consumables: [],
  }),
});

async function purchase(item: Item) {
  const response = await $fetch(`/api/shop/${item.id}`, {
    method: 'POST',
    headers: {
      'Csrf-token': useCsrf().csrf,
    },
    body: {},
    async onResponse({ response }) {
      if (!response.ok) {
        toast.error('Failed to purchase. :(');
        return;
      }

      await getSession();

      if (item.category === 'flair') {
        data.value.currentFlair = {
          name: item.name,
          url: item.url,
          purchasedOn: DateTime.now().toISO(),
        };
        toast.success('Flair purchased!');
        return;
      }
    },
  });

  reward.value = response.reward;
}

async function handleItem(item: Item) {
  reward.value = undefined;
  fortune.value = undefined;

  await purchase(item);

  if (item.name === 'Fortune Cookie') {
    const fortunes = [
      'Terrible luck. You might as well take this year off.',
      'Great fortune is upon you! You shall surely succeed…surely.',
      'You will open at least one fortune cookie this year.',
      'Thank you for freeing me! But your fortune is in another cookie!',
      'Clicking on {{random_breed}}s will give you good luck today.',
      'The next time you block a mixup, block high (or low).',
      'This fortune is blank.',
      'Today will be a good day! Or night.',
      'You are capable of doing tremendous good today.',
      "Your luck is so-so, but although your luck may be unremarkable, you don't have to be.",
      'No Harkfrost scatters only a single snowflake.',
      'Someone is in need of your kind words today.',
      'You appear to be forgetting something.',
      'https://youtu.be/p7YXXieghto',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://youtu.be/9MYQVa2wA5Q',
      'You seem to be stuck in an infinite loop.',
      'Your luck is reasonable, but it may be unwise to try it.',
      'You are dearly missed by a certain friend.',
      'Try to be a better person than you were yesterday.',
      'The most important step to fixing a problem is identifying it.',
      "Live for tomorrow's version of you, not today's.",
      'Did you forget a semicolon?',
      "Your reading the wrong yores in you're fortune.",
      'Fruit requires only time to ripen.',
      'Compliment someone today.',
      'A chance is better than a missed opportunity.',
      'You are not illiterate.',
      'You are now {{price}} dragon dollars poorer.',
      'You are about to finish reading a fortune.',
      'You may see at least one Staterae in the cave this week.',
    ];

    const randomCookie = fortunes[Math.floor(Math.random() * fortunes.length)];
    fortune.value = formatItemText(item)(randomCookie);

    await nextTick();

    if (fortuneDialog.value) {
      fortuneDialog.value.showModal();
    }
  }
}

function formatItemText(item: Item) {
  const formatters: Record<string, (text: string) => string> = {
    'Fortune Cookie': function (text) {
      return text.replace(/{{(.*?)}}/g, (_, key) => {
        if (key === 'random_breed') {
          const breeds = [
            'Mint',
            'Aria',
            'Xol',
            'Black',
            'White',
            'Brimstone',
            'Wisteria',
            'Waterhorse',
            'Xenowyrm',
            'Ridgewing',
            'Lotaan',
            'Geode',
          ];
          return breeds[Math.floor(Math.random() * breeds.length)];
        }
        if (key === 'price') {
          return item.cost?.toString() ?? '42';
        }

        return key;
      });
    },
  };

  return formatters[item.name] ?? ((text: string) => text);
}
</script>
