<template>
  <div class="space-y-4 [&_q]:pl-8 [&_q]:block">
    <div class="max-w-prose">
      As you stroll through the garden, you notice a small, hidden path. You
      follow it and find yourself at a vast clearing with a small building in
      the middle.
      <q class="italic">Pssst!</q> - A voice calls to you from inside.
      <q>Come on in!</q>
      Inside, a small mint dragon tumbles from the shelves and lands in front of
      you, propped up against the counter.
      <q
        >My name is Matthias, I'm a humble businessmint. Now then, let's get
        right to business. I can sell you these at any time.</q
      >
      <q
        >... Oh, what's this you have? A... rafflesia ticket?! I suppose if you
        have one of these then I can exchange it...</q
      >
    </div>

    <p class="p-4 bg-blue-800 max-w-prose mx-auto rounded-lg">
      Matthias will sell you <strong>flairs</strong> to display alongside your
      username in return for <strong>ClickPoints</strong>. You can display one
      flair at a time and it will wilt and disappear after 7 days. You can
      change it at any time.
    </p>

    <ul class="grid grid-cols-4 gap-x-8 gap-y-4 mt-4">
      <li
        v-for="item in items"
        :key="item.id"
        class="flex flex-col items-center gap-y-1"
      >
        <img :src="userFlair(item.url)" alt="" />
        <b class="text-base font-semibold">{{ item.name }}</b>
        <button class="btn-primary">Buy for {{ item.cost }}</button>
      </li>
    </ul>

    <div class="max-w-prose">
      <q
        >In addition to these regular items, I also have a few seasonal
        stock.</q
      >
    </div>
  </div>
</template>

<script lang="ts" setup>
import { userFlair } from '#imports';

definePageMeta({
  middleware: 'auth',
});

useHead({
  title: 'Shop',
});

const { data: items } = await useFetch('/api/shop', {
  immediate: true,
  default: () => [],
});
</script>

<style></style>
