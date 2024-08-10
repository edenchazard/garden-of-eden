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
            <span class="inline-flex flex-col mx-2">
              <input
                v-model.number="settings.hatchlingMinAge"
                min="0"
                max="72"
                type="number"
                class="w-20"
              />
              <span class="mt-1 text-xs text-center">(0 to 72)</span>
            </span>
            hours old.
          </li>
          <li>
            Exclude eggs that aren't at least
            <span class="inline-flex flex-col mx-2">
              <input
                v-model.number="settings.eggMinAge"
                min="0"
                max="72"
                type="number"
                class="w-20"
              />
              <span class="mt-1 text-xs text-center">(0 to 72)</span>
            </span>
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
      <button type="submit" class="btn-primary self-end" :disabled="canSave">
        <font-awesome-icon
          v-if="saveSettingsStatus === 'pending'"
          :icon="['fas', 'spinner']"
          class="animate-spin"
        />
        {{ saveSettingsStatus === 'pending' ? 'Saving...' : 'Save' }}
      </button>
      <p v-if="invalid" class="self-end">
        Correct the values highlighted before saving.
      </p>
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

const invalid = computed(() => {
  try {
    userSettingsSchema.parse(settings.value);
    return false;
  } catch {
    return true;
  }
});

const canSave = computed(
  () => saveSettingsStatus.value === 'pending' || invalid.value
);

const { execute: saveSettings, status: saveSettingsStatus } = useFetch(
  '/api/user/settings',
  {
    method: 'PATCH',
    body: settings,
    immediate: false,
    watch: false,
  }
);
</script>
