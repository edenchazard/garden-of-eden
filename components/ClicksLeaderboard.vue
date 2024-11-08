<template>
  <table class="w-full">
    <thead>
      <tr class="*:px-4 text-center divide-x border-b-2 *:py-2">
        <th class="!px-2">Rank</th>
        <th>Username</th>
        <th>Clicks</th>
      </tr>
    </thead>
    <tbody
      class="divide-y divide-white [&_td]:px-3 [&_td]:py-1 [&_tr]:divide-x table-fixed text-sm"
    >
      <tr
        v-for="(user, $index) in leaderboard"
        :key="$index"
        :class="{
          'bg-green-900 dark:bg-stone-700':
            user.username === data?.user?.username || user.username === '-1',
          '!border-t-2': user.rank > 10,
        }"
      >
        <td class="text-right w-16">#{{ user.rank }}</td>
        <td>
          <span class="inline-flex items-center flex-wrap">
            <span v-if="['-1', '-2'].includes(user.username)" class="italic">
              (anonymous)
            </span>
            <template v-else> {{ user.username }} </template>
            <ItemPanel
              v-if="user.flair"
              :aria-id="`${user.rank}-${start}-flair`"
              :item="user.flair"
            />
          </span>
        </td>
        <td class="w-20 text-right">
          {{ Intl.NumberFormat().format(user.clicks_given) }}
        </td>
      </tr>
      <tr v-if="leaderboard.length === 10">
        <td colspan="3" class="hidden md:block">&nbsp;</td>
      </tr>
    </tbody>
    <tfoot class="font-bold">
      <tr class="*:px-3 divide-x border-t-4">
        <td>Total</td>
        <td colspan="2" class="text-right">
          {{ Intl.NumberFormat().format(total) }}
        </td>
      </tr>
    </tfoot>
  </table>
</template>

<script setup lang="ts">
import ItemPanel from './ItemPanel.vue';

withDefaults(
  defineProps<{
    start?: string;
    leaderboard: Array<{
      rank: number;
      username: string;
      clicks_given: number;
      flair: Pick<Item, 'url' | 'name' | 'description'> | null;
    }>;
    total: number;
  }>(),
  {
    start: 'all-time',
    leaderboard: () => [],
    total: 0,
  }
);

const { data } = useAuth();
</script>
