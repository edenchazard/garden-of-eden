<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="bg-yellow-900 py-2 px-4 space-y-2 rounded-sm">
    <p v-html="notification.content" />

    <div class="flex gap-2 justify-end mt-2">
      <button
        type="button"
        class="btn-primary"
        @click="dismissReleaseNotification()"
      >
        Dismiss
      </button>
      <button
        type="button"
        class="btn-secondary"
        @click="disableNewReleaseAlerts()"
      >
        Can it, Matthias! Don't tell me again
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { userNotificationsTable } from '~/database/schema';

const emit = defineEmits<{
  (e: 'dismissed'): void;
}>();

const props = defineProps<{
  notification: typeof userNotificationsTable.$inferSelect;
}>();

const { userSettings } = useUserSettings(true);

async function dismissReleaseNotification() {
  if (!props.notification) {
    return;
  }

  await $fetch(`/api/user/notifications/${props.notification.id}`, {
    headers: {
      'Csrf-token': useCsrf().csrf,
    },
    method: 'DELETE',
  });

  emit('dismissed');
}

function disableNewReleaseAlerts() {
  userSettings.value.newReleaseAlerts = false;
  void dismissReleaseNotification();
}
</script>
