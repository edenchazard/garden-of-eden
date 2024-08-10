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
        <p>
          Eggs and hatchlings that don't meet these restrictions will be ignored
          by select all. They can still be manually added.
        </p>
        <ul class="divide-y *:py-4">
          <li>
            Exclude hatchlings that aren't at least
            <input
              v-model.number="settings.hatchlingMinAge"
              min="0"
              max="72"
              type="number"
              class="w-20"
            />
            hours old.
          </li>
          <li>
            Exclude eggs that aren't at least
            <input
              v-model.number="settings.eggMinAge"
              min="0"
              max="72"
              type="number"
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
              v-model="settings.showScrollRatio"
              type="checkbox"
              :checked="settings.showScrollRatio"
            />
            <label for="hide-scroll-ratio">
              Show views to unique views ratio.</label
            >
          </li>
        </ul>
      </fieldset>
      <button type="submit" class="btn-primary self-end">Save</button>
    </form>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: 'auth',
});

useHead({
  title: 'Settings',
});

const settings = useState(() => userSettingsSchema.parse({}));

await useFetch('/api/user/settings', {
  onResponse({ response: { _data: data } }) {
    Object.assign(settings.value, data, {
      showScrollRatio: !!data.showScrollRatio,
    });
  },
});

const { execute: saveSettings } = useFetch('/api/user/settings', {
  method: 'PATCH',
  body: settings,
  immediate: false,
  watch: false,
});
</script>
