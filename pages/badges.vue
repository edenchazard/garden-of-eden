<template>
  <div class="space-y-4 *:space-y-4 px-4">
    <h1>Badges</h1>
    <p class="max-w-prose">
      Below are the badges you've earned in the Garden. Some badges, such as
      those awarded weekly can be earned more than once.
    </p>
    <ul v-if="data.length > 0" class="space-y-4">
      <li
        v-for="badge in data"
        :key="badge.id"
        class="grid grid-cols-[auto_1fr] gap-x-4"
      >
        <ItemPanel width="23" :item="badge" class="self-center row-span-2" />
        <span class="font-bold">{{ badge.name }}</span>
        <p>
          {{ badge.description }}
          <ClientOnly>
            <span class="italic text-sm"
              >(Earned on
              {{
                DateTime.fromISO(badge.awardedOn).toLocaleString({
                  dateStyle: 'medium',
                })
              }})</span
            ></ClientOnly
          >
        </p>
      </li>
    </ul>

    <div v-else class="col-span-full">You have no badges currently! :(</div>

    <section v-if="data.length > 0" id="credits">
      <h2>Art credits</h2>
      <p>
        Art by:
        {{
          Array.from(new Set(data.map((item) => item.artist)))
            .sort()
            .join(', ')
        }}
      </p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { DateTime } from 'luxon';
import ItemPanel from '~/components/ItemPanel.vue';

definePageMeta({
  middleware: 'auth',
});

useHead({
  title: 'Badges',
});

const { data } = await useFetch('/api/user/badges', {
  default: () => [],
});
</script>
