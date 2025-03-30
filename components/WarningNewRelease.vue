<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="banner bg-yellow-900 py-2 px-4 space-y-2 text-sm">
    <p v-html="notification.content" />

    <div class="flex gap-2 justify-end mt-2 flex-col sm:flex-row">
      <button
        type="button"
        class="btn-primary"
        @click="
          dismissReleaseNotification();
          emit('dismissed');
        "
      >
        Dismiss
      </button>
      <button
        type="button"
        class="btn-secondary"
        @click="disableNewReleaseAlerts()"
      >
        Can it, Matthias! Never show me these again
      </button>
    </div>
    <p v-if="shutUpMatthias" class="text-xs text-right">Alright... 😔</p>
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
const shutUpMatthias = ref(false);

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
}

function disableNewReleaseAlerts() {
  userSettings.value.newReleaseAlerts = false;
  shutUpMatthias.value = true;

  setTimeout(() => {
    shutUpMatthias.value = false;
    emit('dismissed');
  }, 2000);

  void dismissReleaseNotification();
}
</script>
