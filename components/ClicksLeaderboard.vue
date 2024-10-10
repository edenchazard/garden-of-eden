<template>
  <table class="w-full">
    <thead>
      <tr class="*:px-4 text-center divide-x border-b-2 *:py-2">
        <th class="!px-2">Rank</th>
        <th>Username</th>
        <th>Clicks given</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-white">
      <tr
        v-for="user in leaderboard"
        :key="user.rank"
        class="*:px-4 *:py-1 divide-x"
        :class="{
          'bg-green-900 dark:bg-stone-700':
            user.username === data?.user?.username || user.username === '-1',
          '!border-t-2': user.rank > 10,
        }"
      >
        <td class="text-right">#{{ user.rank }}</td>
        <td v-if="['-1', '-2'].includes(user.username)" class="italic">
          (anonymous)
        </td>
        <td v-else>{{ user.username }}</td>
        <td>{{ Intl.NumberFormat().format(user.clicks_given) }}</td>
      </tr>
    </tbody>
    <tfoot class="font-bold">
      <tr class="*:px-4 divide-x border-t-4">
        <td colspan="2">Total</td>
        <td>
          {{ Intl.NumberFormat().format(total) }}
        </td>
      </tr>
    </tfoot>
  </table>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    leaderboard: Array<{
      rank: number;
      username: string;
      clicks_given: number;
    }>;
    total: number;
  }>(),
  {
    leaderboard: () => [],
    total: 0,
  }
);

const { data } = useAuth();
</script>
