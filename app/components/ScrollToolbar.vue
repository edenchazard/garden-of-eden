<template>
  <div
    class="bg-green-800/70 dark:bg-neutral-950/70 deep-sea:bg-slate-900/70 grid grid-cols-2 md:grid-cols-[1fr_auto_auto_auto_auto] gap-y-2 gap-x-4 items-center"
  >
    <div class="flex *:flex-1 gap-4">
      <label :for="`${id}-sort`" class="mr-1 sr-only"> Sort by: </label>
      <select :id="`${id}-sort`" v-model="sort" class="md:max-w-60">
        <option value="Oldest First">Oldest First</option>
        <option value="Youngest First">Youngest First</option>
      </select>
    </div>

    <div
      class="items-center justify-self-center 3xs:justify-self-auto flex gap-x-2"
    >
      <input
        :id="`${id}-select-all-hatchery`"
        type="checkbox"
        :checked="
          dragons
            .filter(filterSelectAll(settings))
            .every((dragon) => dragon.inGarden)
        "
        @change="
          emit('toggle-all', ($event.target as HTMLInputElement).checked)
        "
      />
      <label
        :for="`${id}-select-all-hatchery`"
        class="flex-1 text-left py-2 sr-only 3xs:!not-sr-only"
      >
        Select all
      </label>
    </div>

    <button type="button" class="btn-secondary" @click="emit('reload')">
      <LoadingIcon v-if="fetchScrollStatus === 'pending'" class="mr-1 size-4" />

      <font-awesome-icon v-else class="mr-1" :icon="['fas', 'rotate']" />
      <span class="sr-only 3xs:!not-sr-only">Reload</span>
    </button>

    <button
      type="submit"
      class="btn- bg-amber-700 dark:bg-indigo-900 deep-sea:bg-sky-800"
      @click="emit('submit')"
    >
      <LoadingIcon v-if="saveScrollStatus === 'pending'" class="ml-1 size-4" />
      <font-awesome-icon v-else :icon="['fas', 'dragon']" class="ml-1 size-4" />
      <span class="sr-only 3xs:!not-sr-only">Submit</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { filterSelectAll } from '#imports';

const emit = defineEmits(['reload', 'toggle-all', 'submit']);

defineProps<{
  dragons: ScrollView[];
  fetchScrollStatus: string;
  saveScrollStatus: string;
  id: string;
  settings: UserSettings;
}>();

const sort = defineModel<UserSettings['sort']>('sort', {
  default: 'Oldest First',
});
</script>
