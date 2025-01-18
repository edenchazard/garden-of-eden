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
        class="*:text-center *:px-3 *:pb-0 *:whitespace-nowrap divide-x divide-emerald-900/30 dark:divide-stone-600/30 bg-green-700 dark:bg-neutral-950"
      >
        <th>G</th>
        <th ref="seedTrayColumn">S</th>
        <th class="pinned-dragon-column">
          <div>Dragon</div>
        </th>
        <th>Gender</th>
        <th>Time Left</th>
        <th>BSA</th>
        <th>Views</th>
        <th>Unique</th>
        <th>Clicks</th>
        <th v-if="!hiddenColumns.includes('U:V')">U:V</th>
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
