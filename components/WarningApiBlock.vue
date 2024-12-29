<template>
  <div class="bg-yellow-900 p-4 space-y-2" role="alert">
    <p class="font-bold">
      😔 It seems you've blocked the Garden of Eden from accessing your dragons.
    </p>
    <p>While blocked, any dragons you add will be periodically removed.</p>
    <p>
      Even though the Garden uses your scroll authorisation, it still requires
      logged out access to be enabled. Don't worry, this is only used for
      assessing the state of your dragons and for performance reasons.
    </p>
    <p>
      To unblock, please press the unblock button next to "Garden of Eden" in
      your
      <NuxtLink to="https://dragcave.net/account/sessions#3rdparty"
        >Dragon Cave account settings</NuxtLink
      >, under "Logged Out Third-Party Access".
    </p>

    <button class="btn-primary" type="button" @click="checkApiBlock()">
      Alright, I've unblocked. Let me in!
    </button>
    <p v-if="working">Checking...</p>
    <p v-else-if="failedToUnblock">
      It still seems you've got the Garden blocked. Please try again. If the
      issue persists,
      <NuxtLink
        to="https://forums.dragcave.net/topic/189636-chazzas-dc-tools-garden-of-eden-lineage-builder-fart/"
        >leave a message on the forum</NuxtLink
      >.
    </p>
  </div>
</template>

<script lang="ts" setup>
const failedToUnblock = ref(false);
const working = ref(false);

const { data: authData } = useAuth();

async function checkApiBlock() {
  if (!authData.value?.user) {
    return;
  }

  working.value = true;
  const blocked = await $fetch<true | false>('/api/user/scroll/check');

  if (!blocked) {
    reloadNuxtApp();
    return;
  }

  failedToUnblock.value = true;
  working.value = false;
}
</script>
