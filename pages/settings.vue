<template>
  <div class="space-y-4 px-4">
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
        <ul class="*:py-4">
          <li class="flex items-baseline">
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
          <li class="flex items-baseline">
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
        <ul class="*:py-4">
          <li class="flex items-center gap-2">
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
          <li class="flex gap-2 flex-col sm:flex-row sm:items-center">
            <select id="section-order" v-model="newSettings.sectionOrder">
              <option value="hatchlings,eggs">Hatchlings, then eggs</option>
              <option value="eggs,hatchlings">Eggs, then hatchlings</option>
            </select>
            <label for="section-order">
              {{
                newSettings.sectionOrder === 'eggs,hatchlings'
                  ? 'Show me eggs first, then hatchlings underneath.'
                  : 'Show me hatchlings first, then eggs underneath.'
              }}
            </label>
          </li>
          <li class="flex gap-2 flex-col sm:flex-row sm:items-center">
            <ButtonToggleGroup
              v-model="newSettings.scrollLayout"
              :buttons="[
                { icon: ['fas', 'table-list'], label: 'Table', value: 'table' },
                { icon: ['fas', 'square'], label: 'Card', value: 'card' },
              ]"
            />
            <p>
              Show scroll overview in the {{ newSettings.scrollLayout }} view.
            </p>
          </li>
        </ul>
      </fieldset>
      <fieldset>
        <legend>Hatchery</legend>
        <p>Customise the hatchery.</p>
        <ul class="*:py-4">
          <li class="flex items-center gap-x-2">
            <input
              id="highlight-clicked"
              v-model="newSettings.highlightClickedDragons"
              class="shrink-0"
              type="checkbox"
              :checked="newSettings.highlightClickedDragons"
            />
            <label for="highlight-clicked">
              Highlight dragons you've clicked.</label
            >
          </li>
          <li class="flex items-center gap-x-2">
            <input
              id="bubblewrap"
              v-model="newSettings.bubblewrap"
              class="shrink-0"
              type="checkbox"
              :checked="newSettings.bubblewrap"
            />
            <label for="bubblewrap"
              >Play a bubblewrap-like sound when I click dragons.</label
            >
          </li>
        </ul>
      </fieldset>
      <fieldset>
        <legend>Fun things 🎩</legend>
        <p>Fun? In my garden? It's more likely than you think.</p>
        <ul class="*:py-4">
          <li class="flex gap-2 flex-col sm:flex-row sm:items-center">
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

      <fieldset>
        <div class="flex flex-col sm:flex-row gap-x-4">
          <div>
            <legend>Privacy</legend>
            <p>Choose what data you want shared with others.</p>
            <ul class="divide-y *:py-4">
              <li class="flex items-center gap-x-2">
                <input
                  id="anon-stats"
                  v-model="newSettings.anonymiseStatistics"
                  class="shrink-0"
                  type="checkbox"
                  :checked="newSettings.anonymiseStatistics"
                />
                <label for="anon-stats">Anonymise your statistics.</label>
              </li>
            </ul>
          </div>
          <NuxtPicture
            class="self-center sm:self-start"
            loading="lazy"
            format="avif,webp"
            src="/illustrations/standing-bush.png"
            sizes="100px sm:200px"
            alt="Mint in incognito"
          />
        </div>
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
