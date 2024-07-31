<template>
  <div
    class="grid sm:grid-cols-2 md:grid-cols-[1fr_auto_auto_auto] gap-y-4 gap-x-8 items-center"
  >
    <div class="flex">
      <label
        :for="`${id}-sort`"
        class="mr-1 sr-only"
      >
        Sort by:
      </label>
      <select
        class="w-full sm:max-w-60"
        :id="`${id}-sort`"
        v-model="sort"
      >
        <option value="Oldest First">Oldest First</option>
        <option value="Youngest First">Youngest First</option>
      </select>
    </div>

    <div class="flex gap-x-2">
      <input
        :id="`${id}-select-all-hatchery`"
        type="checkbox"
        :checked="dragons.every((dragon) => dragon.inHatchery)"
        @change="
          emit('toggle-all', ($event.target as HTMLInputElement).checked)
        "
      />
      <label
        :for="`${id}-select-all-hatchery`"
        class="flex-1 text-left"
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
        :icon="['fas', 'spinner']"
        class="ml-1 animate-spin size-4"
        v-if="saveScrollStatus === 'pending'"
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
}>();

const sort = defineModel("sort", {
  type: String as PropType<UserSettings["sort"]>,
  default: "Oldest First",
});
</script>
