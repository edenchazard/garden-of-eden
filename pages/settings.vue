<template>
  <div class="space-y-4">
    <h1>Settings</h1>
    <p>These settings will persist across your devices.</p>
    <form
      class="flex flex-col gap-y-4 [&_legend]:text-2xl [&_legend]:font-bold"
      @submit.prevent="saveSettings(newSettings)"
    >
      <fieldset>
        <legend>Select all protections</legend>
        <p>
          Eggs and hatchlings that don't meet these restrictions will be ignored
          by select all. They can still be manually added.
        </p>
        <ul class="divide-y *:py-4">
          <li>
            <span class="inline-flex flex-col mx-2">
              <input
                v-model.number="newSettings.hatchlingMinAge"
                min="0"
                max="72"
                type="number"
                class="w-20"
              />
              <span class="mt-1 text-xs text-center">(0 to 72)</span>
            </span>
            Exclude hatchlings that aren't at least
            {{ formatHoursLeft(168 - newSettings.hatchlingMinAge) }} old.
          </li>
          <li>
            <span class="inline-flex flex-col mx-2">
              <input
                v-model.number="newSettings.eggMinAge"
                min="0"
                max="72"
                type="number"
                class="w-20"
              />
              <span class="mt-1 text-xs text-center">(0 to 72)</span>
            </span>
            Exclude eggs that aren't at least
            {{ formatHoursLeft(168 - newSettings.eggMinAge) }} old.
          </li>
          <li class="flex items-center gap-x-2">
            <input
              id="auto-er"
              v-model="newSettings.autoSeedTray"
              class="shrink-0"
              type="checkbox"
              :checked="newSettings.autoSeedTray"
            />
            <label for="auto-er"
              >Automatically place dragons in the seed tray when 4 days or less
              and selected.</label
            >
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
              v-model="newSettings.showScrollRatio"
              class="shrink-0"
              type="checkbox"
              :checked="newSettings.showScrollRatio"
            />
            <label for="hide-scroll-ratio">
              Show views to unique views ratio.</label
            >
          </li>
        </ul>
      </fieldset>
      <fieldset>
        <legend>Fun things 🎩</legend>
        <p>Fun? In my garden? It's more likely than you think.</p>
        <ul class="divide-y *:py-4">
          <li class="flex items-center gap-x-2">
            <select id="site-name" v-model="newSettings.siteName">
              <option value="Eden">Garden of Eden</option>
              <option value="Elena">Garden of Elena</option>
            </select>
            <label for="site-name">
              Display the site name as the Garden of
              {{ newSettings.siteName }}.</label
            >
          </li>
        </ul>
      </fieldset>
      <button type="submit" class="btn-primary self-end" :disabled="canSave">
        <LoadingIcon v-if="saveSettingsStatus === 'pending'" class="mr-1" />
        {{ saveSettingsStatus === 'pending' ? 'Saving...' : 'Save' }}
      </button>
      <p v-if="invalid" class="self-end">
        Correct the values highlighted before saving.
      </p>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { userSettingsSchema } from '~/database/schema';
import { formatHoursLeft } from '#imports';

definePageMeta({
  middleware: 'auth',
});

useHead({
  title: 'Settings',
});

const { userSettings, saveSettingsStatus, saveSettings } = useUserSettings(
  false,
  true
);

const newSettings = useState(() => ({ ...userSettings.value }));

const invalid = computed(() => {
  try {
    userSettingsSchema.parse(newSettings.value);
    return false;
  } catch {
    return true;
  }
});

const canSave = computed(
  () => saveSettingsStatus.value === 'pending' || invalid.value
);
</script>
