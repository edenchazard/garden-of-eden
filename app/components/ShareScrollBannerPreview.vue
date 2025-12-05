<template>
  <div class="max-md:col-span-full relative" aria-hidden="true">
    <img :src="banner" alt="" />
    <div class="absolute flex items-center top-1.5 z-10 left-[119px]">
      <span
        class="font-alkhemikal text-[16px]"
        :style="{
          color: params.usernameColour,
        }"
        >{{ authData?.user.username ?? 'Username' }}</span
      >
      <img
        v-if="authData?.user?.flair"
        class="ml-1"
        :src="itemUrl(authData.user.flair.url)"
        :alt="authData.user.flair.name"
      />
    </div>
    <div class="absolute top-8 z-10 left-[120px] text-[8px] font-nokiafc22">
      <span
        :style="{
          color: params.labelColour,
        }"
        >Label:</span
      >
      <span
        class="ml-0.5"
        :style="{
          color: params.valueColour,
        }"
        >{{ Intl.NumberFormat('en-gb').format(123456789) }}</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import itemUrl from '~/utils/itemUrl';
import type { BannerRequestParameters } from '~~/workers/shareScrollWorkerTypes';

defineProps<{
  params: Pick<
    BannerRequestParameters,
    'labelColour' | 'usernameColour' | 'valueColour'
  >;
  banner: string;
}>();

const { data: authData } = useAuth();
</script>
