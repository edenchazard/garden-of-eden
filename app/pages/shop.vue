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
          :src="
            isChristmas()
              ? `${path}/npc/santa_matthias_dressed.webp`
              : `${path}/npc/matthias.webp`
          "
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
        class="p-4 bg-orange-200 text-black dark:bg-sky-900 dark:text-white deep-sea:bg-orange-200 max-w-prose mx-auto rounded-lg grid items-center gap-2 grid-cols-[auto_1fr]"
      >
        <div
          v-if="authData?.user"
          class="grid items-center gap-2 grid-cols-[auto_1fr]"
        >
          <p class="col-span-full">
            Matthias will sell you <strong>flairs</strong> to display alongside
            your username in return for <strong>Dragon Dollars</strong>. You can
            display one flair but it can be changed at any time. Flairs expire,
            so after 7 days it will disappear.
          </p>
          <p class="col-span-full">
            You can acquire Dragon Dollars by clicking on dragons in the site
            and may have a maximum of 500 Dragon Dollars at any time.
          </p>
          <img :src="DragonDollar" width="17" height="10" />
          <p>You have {{ authData?.user.money ?? 0 }} Dragon Dollars.</p>
          <template v-if="data.currentFlair">
            <img :src="itemUrl(data.currentFlair.url)" alt="" />
            <p v-if="data.currentFlair">
              You currently have the
              <strong>{{ data.currentFlair.name }}</strong> flair. It will wilt
              on
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
        <div v-else class="space-y-2 text-center">
          <p>
            Matthias will sell you <strong>flairs</strong> to display alongside
            your username in exchange for Dragon Dollars, earned by clicking.
            You must be logged in.
          </p>
          <button
            type="button"
            class="btn btn-primary"
            @click="signIn('dragcave')"
          >
            Login
          </button>
        </div>
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
import isChristmas from '~/utils/isChristmas';
import DragonDollar from '~~/public/other/dragon-dollar.webp';

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
  deep: true,
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
      'Run.',
      "Dare to dream, but don't forget to live.",
      'Carton of eggs, milk, shredded cheese, paper towels, loaf of bread, lettuce, ketchup...',
      'An unfortunate autoabandon is upon you.',
      'A successful Staterae breeding is upon you.',
      "Don't be the bigger person. Be the bigger problem.",
      'We live in a society.',
      "I see several Gold eggs in your future... they're not yours, though.",
      "You should start spriting that dragon you've been daydreaming about.",
      '[TODO: clever fortune here]',
      'Very soon, you are about to make a series of excellent choices.',
      'Very soon, you are about to make a series of terrible choices.',
      'Positive thoughts invite positive results.',
      "Don't just step out of your comfort zone. Take a leap.",
      "When life shuts a door, open it again. That's how doors work.",
      'Bloom where you are planted.',
      "You've got a secret admirer.",
      "There's a very important email you're forgetting to answer.",
      "I don't know. Ask a Mint.",
      'Keep your friends close and your Mints closer.',
      'A Mint a day keeps your bad luck away.',
      'Those who walk in a circle only end up where they started.',
      '99% of cave hunters quit right before catching their first metal.',
      "Communication is key to a relationship. Perhaps there's something you should tell your loved one.",
      '[object Object]',
      'Keep your head up; success is just over the horizon.',
      "IT'S SO OVER",
      "You're more in control than you think.",
      "WE'RE SO BACK",
      'Fear is the mind-killer.',
      'You will be hungry again in one to three hours.',
      'A shell in the hand is better than a Shumoga hatchling in the AP.',
      "We've been trying to reach you about your automobile's extended warranty...",
      'Last year was practice. This year is yours.',
      'Choices made in anger cannot be undone!',
      'If it sucks, hit the bricks! Real winners quit!',
      'Fortune favours the cookie eater.',
      'Form is temporary, class is permanent.',
      'TRAPPED IN FORTUNE COOKIE FACTORY PLEASE HELP',
      'Disregard all previous cookies.',
      "'Good enough' is enough.",
      'Terrible luck. You might as well take this year off.',
      'Great fortune is upon you! You shall surely succeed... surely.',
      'You will open at least one fortune cookie this year.',
      'Thank you for freeing me! But your fortune is in another cookie!',
      'Clicking on {{random_breed}}s will give you good luck today.',
      'The {{random_breed}}s are up to no good today.',
      'The next time you block a mixup, block high (or low).',
      'This fortune is blank.',
      'Be kind to yourself today.',
      'Do better by doing good.',
      'This is a coupon for one firm Matthias handshake (no monetary value).',
      'You shall be blessed with a blep within a fortnight.',
      'Matthias wishes you the very best... because you owe him money, and he wants it back.',
      'You will soon regret some choices involving cheese.',
      'Today will be a good day! Or night.',
      'You are capable of doing tremendous good today.',
      "You will qualify for this month's raffle, but winning is not guaranteed.",
      "Your luck is so-so, but although your luck may be unremarkable, you don't have to be.",
      'No Harkfrost scatters only a single snowflake.',
      'Someone is in need of your kind words today.',
      'You appear to be forgetting something.',
      '<a href="https://youtu.be/dQw4w9WgXcQ">https://youtu.be/dQw4w9WgXcQ</a>',
      '<a href="https://youtu.be/9MYQVa2wA5Q">https://youtu.be/9MYQVa2wA5Q</a>',
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
      "There's always another dragon.",
    ];

    const randomCookie = fortunes[Math.floor(Math.random() * fortunes.length)];

    if (!randomCookie) {
      return;
    }

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
