<template>
  <div
    class="grid sm:grid-cols-2 md:grid-cols-[1fr_auto_auto_auto] gap-y-2 gap-x-4 items-center"
  >
    <div class="flex col-span-full sm:col-auto">
      <label
        :for="`${id}-sort`"
        class="mr-1 sr-only"
      >
        Sort by:
      </label>
      <select
        :id="`${id}-sort`"
        v-model="sort"
        class="w-full md:max-w-60"
      >
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
            .every((dragon) => dragon.inHatchery)
        "
        @change="
          emit('toggle-all', ($event.target as HTMLInputElement).checked)
        "
      >
      <label
        :for="`${id}-select-all-hatchery`"
        class="flex-1 text-left py-2"
      >
        Select all
      </label>
    </div>

    <button
      type="button"
      class="btn-secondary"
      @click="emit('reload')"
    >
      <font-awesome-icon
        :icon="['fas', 'rotate']"
        :class="{ 'animate-spin': fetchScrollStatus === 'pending' }"
      />
      Reload
    </button>

    <button
      type="submit"
      class="btn-primary"
      @click="emit('submit')"
    >
      <font-awesome-icon
        v-if="saveScrollStatus === 'pending'"
        :icon="['fas', 'spinner']"
        class="ml-1 animate-spin size-4"
      />
      <font-awesome-icon
        v-else
        :icon="['fas', 'dragon']"
        class="ml-1 size-4"
      />
      Submit
    </button>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from "vue";

const emit = defineEmits(["reload", "toggle-all", "submit"]);

defineProps<{
  dragons: ScrollView[];
  fetchScrollStatus: string;
  saveScrollStatus: string;
  id: string;
  settings: UserSettings;
}>();

const sort = defineModel("sort", {
  type: String as PropType<UserSettings["sort"]>,
  default: "Oldest First",
});
</script>
