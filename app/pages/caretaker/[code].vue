<template>
  <div class="px-4 py-6">
    <section
      v-if="status === 'pending'"
      class="rounded-md border border-amber-400/50 bg-amber-400/10 p-4"
    >
      <h1 class="text-2xl font-bold">Loading invite...</h1>
    </section>

    <section
      v-else-if="status === 'invalid'"
      class="rounded-md border border-red-500/40 bg-red-500/10 p-4 space-y-2"
    >
      <h1 class="text-2xl font-bold">Invite not found</h1>
      <p>
        This caretaker invite is invalid or has expired. Ask the principal to
        generate a new invite link.
      </p>
    </section>

    <section
      v-else-if="status === 'sign-in-required'"
      class="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 space-y-3"
    >
      <h1 class="text-2xl font-bold">Sign in required</h1>
      <p>
        Sign in to confirm caretaker access for
        <b>{{ invite?.ownerUsername }}</b
        >.
      </p>
      <button class="btn-primary" type="button" @click="redirectToSignIn()">
        Sign in via Dragon Cave
      </button>
    </section>

    <section
      v-else-if="status === 'already-own-invite'"
      class="rounded-md border border-stone-500/40 bg-stone-500/10 p-4 space-y-2"
    >
      <h1 class="text-2xl font-bold">This invite belongs to you</h1>
      <p>You cannot add yourself as your own caretaker.</p>
    </section>

    <section
      v-else-if="status === 'approved'"
      class="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-2"
    >
      <h1 class="text-2xl font-bold">Caretaker access confirmed</h1>
      <p>
        You now have caretaker access for <b>{{ invite?.ownerUsername }}</b
        >.
      </p>
    </section>

    <section
      v-else
      class="rounded-md border border-green-400/40 bg-green-400/10 p-4 space-y-4"
    >
      <h1 class="text-2xl font-bold">Confirm caretaker access</h1>
      <p>
        <b>{{ invite?.ownerUsername }}</b> wants to add you as a trusted
        caretaker. Confirm to allow managing dragons on their scroll.
      </p>
      <button
        class="btn-primary"
        type="button"
        :disabled="confirming"
        @click="confirmInvite()"
      >
        <LoadingIcon v-if="confirming" class="mr-1" />
        {{ confirming ? 'Confirming...' : 'Confirm' }}
      </button>
    </section>
  </div>
</template>

<script lang="ts" setup>
useHead({
  title: 'Caretaker Invite',
});

type InviteDetails = {
  ownerId: number;
  ownerUsername: string;
  expiresAt: string;
};

type PageStatus =
  | 'pending'
  | 'invalid'
  | 'sign-in-required'
  | 'already-own-invite'
  | 'ready'
  | 'approving'
  | 'approved';

const route = useRoute();
const code = computed(() => String(route.params.code ?? ''));
const { data: authData, signIn, getSession } = useAuth();
const config = useRuntimeConfig();
const publicOrigin = `${config.public.origin ?? ''}`.replace(/\/$/, '');
const publicBasePath = `${config.public.baseUrl ?? ''}`.replace(/\/$/, '');

const status = ref<PageStatus>('pending');
const invite = ref<InviteDetails | null>(null);
const confirming = computed(() => status.value === 'approving');

async function loadInvite() {
  status.value = 'pending';

  await getSession();

  try {
    invite.value = await $fetch<InviteDetails>(
      `/api/caretaker/invite/${code.value}`,
      {
        headers: { 'Csrf-token': useCsrf().csrf },
      }
    );
  } catch {
    status.value = 'invalid';
    return;
  }

  if (!authData.value?.user) {
    status.value = 'sign-in-required';
    return;
  }

  if (authData.value.user.id === invite.value.ownerId) {
    status.value = 'already-own-invite';
    return;
  }

  status.value = 'ready';
}

function redirectToSignIn() {
  const callbackUrl = `${publicOrigin}${publicBasePath}${route.path}`;
  signIn('dragcave', {
    callbackUrl,
  });
}

async function confirmInvite() {
  if (!invite.value || !authData.value?.user || status.value !== 'ready') {
    return;
  }

  status.value = 'approving';

  try {
    await $fetch(`/api/caretaker/invite/${code.value}/approve`, {
      method: 'POST',
      headers: { 'Csrf-token': useCsrf().csrf },
      body: {},
    });
    status.value = 'approved';
  } catch {
    status.value = 'invalid';
  }
}

await loadInvite();
</script>
