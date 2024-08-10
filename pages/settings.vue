<template>
  <div class="space-y-4">
    <h1>Settings</h1>
    <p>These settings will persist across your devices.</p>
    <form
      class="flex flex-col gap-y-4 [&_legend]:text-2xl [&_legend]:font-bold"
      @submit.prevent="saveSettings()"
    >
      <fieldset>
        <legend>Select all protections</legend>
        <p>Prevent select all from including dragons.</p>
        <ul class="divide-y *:py-4">
          <li>
            Only add my hatchlings if they're at least
            <input
              min="0"
              max="72"
              type="number"
              class="w-20"
              v-model.number="settings.hatchlingMinAge"
            />
            hours old.
          </li>
          <li>
            Only add my eggs if they're at least
            <input
              min="0"
              max="72"
              type="number"
              v-model.number="settings.eggMinAge"
              class="w-20"
            />
            hours old.
          </li>
        </ul>
      </fieldset>
      <fieldset>
        <legend>Scroll view</legend>
        <p>Customise the scroll view interface.</p>
        <ul class="divide-y *:py-4">
          <li class="flex items-center gap-x-2">
            <input
              id="hide-scroll-ratio"
              type="checkbox"
              :checked="settings.showScrollRatio"
              v-model="settings.showScrollRatio"
            />
            <label for="hide-scroll-ratio">
              Show views to unique views ratio.</label
            >
          </li>
        </ul>
      </fieldset>
      <button
        type="submit"
        class="btn-primary self-end"
      >
        Save
      </button>
    </form>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: "auth",
});

useHead({
  title: "Settings",
});

const settings = useState(() => userSettingsSchema.parse({}));

await useFetch("/api/user/settings", {
  onResponse({ response: { _data: data } }) {
    Object.assign(settings.value, data, {
      showScrollRatio: !!data.showScrollRatio,
    });
  },
});

const { execute: saveSettings } = useFetch("/api/user/settings", {
  method: "PATCH",
  body: settings,
  immediate: false,
  watch: false,
});
</script>
