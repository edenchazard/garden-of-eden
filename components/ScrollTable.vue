<template>
  <table
    ref="table"
    class="relative text-sm"
    :class="{
      'has-pinned-scroll': hasScrolled,
    }"
  >
    <thead>
      <tr
        class="*:text-center *:px-3 *:pb-0 *:whitespace-nowrap bg-neutral-900"
      >
        <th>G</th>
        <th ref="seedTrayColumn">S</th>
        <th class="pinned-dragon-column sticky left-0"><div>Dragon</div></th>
        <th>Gender</th>
        <th>Time Left</th>
        <th>BSA</th>
        <th>Views</th>
        <th>Unique</th>
        <th>Clicks</th>
      </tr>
    </thead>

    <slot />
  </table>
</template>

<script lang="ts" setup>
import { useScroll } from '@vueuse/core';

const table = useTemplateRef('table');
const seedTrayColumn = useTemplateRef('seedTrayColumn');
const hasScrolled = ref(false);

// set hasScrolled to true if the table has been scroll further than the right edge of the seedTrayColumn
useScroll(
  computed(() => table.value?.parentElement),
  {
    onScroll() {
      if (!seedTrayColumn.value || !table.value) {
        return;
      }

      hasScrolled.value =
        table.value.scrollLeft >=
        seedTrayColumn.value.getBoundingClientRect().right;
    },
  }
);
</script>

<style>
.pinned-dragon-column {
  @apply !p-0;

  & > div {
    @apply py-2 px-3;
  }
}

.has-pinned-scroll .pinned-dragon-column {
  @apply bg-white dark:bg-inherit;

  & > div {
    @apply border-r-8 border-black/40;
  }
}
</style>
