<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    class="banner bg-yellow-900 text-sm p-2 grid grid-cols-[auto_1fr] gap-2 items-center sm:p-4 sm:gap-4"
  >
    <div
      fallback-tag="div"
      class="w-[54px] h-[55px] inline-block sm:row-span-2"
    >
      <img
        alt="Doctor Matthias"
        :src="
          [DoctorMatthias, DoctorMathiasWrong][Math.floor(Math.random() * 2)]
        "
        width="54"
        height="55"
        class="sm:row-span-2"
      />
    </div>
    <p v-html="notification.content" />
    <div
      class="flex gap-[inherit] justify-end flex-col col-span-full sm:flex-row sm:col-start-2"
    >
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
import type { userNotificationTable } from '~/database/schema';
import DoctorMatthias from '~/public/npc/doctor_matthias.webp';
import DoctorMathiasWrong from '~/public/npc/doctor_matthias_wrong.webp';

const emit = defineEmits<{
  (e: 'dismissed'): void;
}>();

const props = defineProps<{
  notification: typeof userNotificationTable.$inferSelect;
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
