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
        class="*: border-b-2 *:text-center *:px-3 *:py-2 *:whitespace-nowrap bg-green-700 dark:bg-neutral-950"
      >
        <th>G</th>
        <th v-if="!hiddenColumns.includes('Seed Tray')">ST</th>
        <th ref="dragonColumn" class="pinned-dragon-column">
          <div>Dragon</div>
        </th>
        <th>Time Left</th>
        <th>Gender</th>
        <th>BSA</th>
        <th>Views</th>
        <th>Unique</th>
        <th>Clicks</th>
        <th v-if="!hiddenColumns.includes('V:UV')">V:UV</th>
      </tr>
    </thead>

    <slot :hidden-columns="hiddenColumns" />
  </table>
</template>

<script lang="ts" setup>
import { useScroll } from '@vueuse/core';

withDefaults(defineProps<{ hiddenColumns?: string[] }>(), {
  hiddenColumns: () => [],
});

const table = useTemplateRef('table');
const dragonColumn = useTemplateRef('dragonColumn');
const hasScrolled = ref(false);

// set hasScrolled to true if the table has been scroll further than the right edge of the seedTrayColumn
useScroll(
  computed(() => table.value?.parentElement),
  {
    onScroll() {
      if (!dragonColumn.value || !table.value) {
        return;
      }

      hasScrolled.value =
        table.value.scrollLeft >=
        dragonColumn.value.getBoundingClientRect().left;
    },
  }
);
</script>

<style>
.pinned-dragon-column {
  @apply bg-inherit -left-[1px] sticky;

  &:not(.is-header) {
    @apply !p-0;
  }

  & > div {
    @apply py-2 px-3;
  }
}

.has-pinned-scroll .pinned-dragon-column {
  & > div {
    @apply border-r-8 border-black/40;
  }
}
</style>
