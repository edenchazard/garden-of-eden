<template>
  <div class="px-4 py-6">
    <template v-if="!invitation">
      <h1 class="text-2xl font-bold">Invalid caretaker invite</h1>
      <p>
        This caretaker invite link is invalid or has expired. If you were given
        this link by another person, you should request a new one.
      </p>
    </template>

    <template v-else-if="invitation?.id === authData?.user.id">
      <h1 class="text-2xl font-bold">Your invite link</h1>
      <p>
        This is your caretaker invite link. You may give it to another person to
        allow them to manage dragons on your scroll, but you cannot use it
        yourself. If you want to manage dragons on your scroll, you can do so
        from your profile page.
      </p>
    </template>

    <template v-else-if="invitation">
      <h1 class="text-2xl font-bold">Confirm caretaker access</h1>
      <p>
        <b>{{ invitation.username }}</b> wants to add you as a trusted
        caretaker. Confirm to allow managing dragons on their scroll.
      </p>
      <p>
        If you don't want to become a trusted caretaker for
        {{ invitation.username }}, you don't need to take any further action and
        can safely ignore this page.
      </p>
      <button
        class="btn-primary"
        type="button"
        :disabled="confirmationStatus === 'pending'"
        @click="confirm()"
      >
        <LoadingIcon v-if="confirmationStatus === 'pending'" class="mr-1" />
        Confirm caretaker access
      </button>
    </template>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Caretaker Invite',
});

const route = useRoute();
const { data: authData } = useAuth();

const { data: invitation } = await useFetch(
  `/api/user/invite/${route.params.code}`
);

const { execute: confirm, status: confirmationStatus } = useFetch(
  `/api/user/invite/${route.params.code}`,
  {
    method: 'patch',
    immediate: false,
    body: {},
    headers: computed(() => ({ 'Csrf-token': useCsrf().csrf })),
    onResponse() {
      if (!invitation.value) {
        return;
      }
      toast.success(
        `Caretaker access confirmed! You can now manage dragons on the scroll of ${invitation.value.principle}.`
      );
    },
  }
);
</script>
