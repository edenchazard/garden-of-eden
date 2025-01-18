<template>
  <div
    class="grid sm:grid-cols-2 md:grid-cols-[1fr_auto_auto_auto] gap-y-2 gap-x-4 items-center"
  >
    <div class="flex col-span-full sm:col-auto *:flex-1 gap-4">
      <label :for="`${id}-sort`" class="mr-1 sr-only"> Sort by: </label>
      <select :id="`${id}-sort`" v-model="sort" class="md:max-w-60">
        <option value="Oldest First">Oldest First</option>
        <option value="Youngest First">Youngest First</option>
      </select>
    </div>

    <div class="col-span-full items-center flex gap-x-2 sm:col-auto">
      <input
        :id="`${id}-select-all-hatchery`"
        type="checkbox"
        :checked="
          dragons
            .filter(filterSelectAll(settings))
            .every((dragon) => dragon.in_garden)
        "
        @change="
          emit('toggle-all', ($event.target as HTMLInputElement).checked)
        "
      />
      <label :for="`${id}-select-all-hatchery`" class="flex-1 text-left py-2">
        Select all
      </label>
    </div>

    <button type="button" class="btn-secondary" @click="emit('reload')">
      <LoadingIcon v-if="fetchScrollStatus === 'pending'" class="mr-1 size-4" />

      <font-awesome-icon v-else class="mr-1" :icon="['fas', 'rotate']" />
      Reload
    </button>

    <button
      type="submit"
      class="btn- bg-amber-700 dark:bg-indigo-900"
      @click="emit('submit')"
    >
      <LoadingIcon v-if="saveScrollStatus === 'pending'" class="ml-1 size-4" />
      <font-awesome-icon v-else :icon="['fas', 'dragon']" class="ml-1 size-4" />
      Submit
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
