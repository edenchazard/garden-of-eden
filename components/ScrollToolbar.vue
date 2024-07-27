<template>
  <div
    class="grid sm:grid-cols-2 md:grid-cols-[1fr_auto_auto_auto] gap-y-4 gap-x-8 items-center"
  >
    <div class="flex">
      <label
        for="sort"
        class="mr-1 sr-only"
      >
        Sort by:
      </label>
      <select
        class="w-full sm:max-w-60 text-black p-2 rounded-md"
        id="sort"
        v-model="sort"
      >
        <option value="Oldest First">Oldest First</option>
        <option value="Youngest First">Youngest First</option>
      </select>
    </div>

    <div class="flex gap-x-2">
      <input
        id="select-all-hatchery"
        type="checkbox"
        :checked="dragons.every((dragon) => dragon.inHatchery)"
        @change="
          emit('toggle-all', ($event.target as HTMLInputElement).checked)
        "
      />
      <label
        for="select-all-hatchery"
        class="flex-1 text-left"
      >
        Select all
      </label>
    </div>

    <button
      type="button"
      class="bg-green-500 text-white px-4 py-2 rounded-md"
      @click="emit('reload')"
    >
      <font-awesome-icon
        icon="rotate"
        class="mr-1"
        :class="{ 'animate-spin': status === 'pending' }"
      />
      Reload
    </button>

    <button
      type="submit"
      class="bg-green-700 text-white px-4 py-2 rounded-md"
      @click="emit('submit')"
    >
      Submit
    </button>
  </div>
</template>

<script lang="ts" setup>
const emit = defineEmits(["reload", "toggle-all", "submit"]);

defineProps({
  dragons: Array,
  status: String,
});

const sort = defineModel("sort", {
  type: String,
  default: "Oldest",
});
</script>
