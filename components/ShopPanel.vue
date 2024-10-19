<!-- eslint-disable vue/no-v-html -->
<template>
  <component
    :is="as"
    :key="item.id"
    :style="{
      gridTemplateRows: '1fr auto',
    }"
    class="grid grid-cols-[auto_1fr] gap-4 bg-green-500 dark:bg-neutral-800 border-transparent rounded-md p-4"
  >
    <div class="flex flex-col items-center gap-y-2 row-span-2">
      <span class="size-6 flex items-center justify-center">
        <img :src="userFlair(item.url)" alt="" />
      </span>
      <b class="text-base font-semibold">{{ item.name }}</b>
      <button
        v-if="item.cost && authData?.user"
        class="btn-primary"
        :disabled="item.cost > authData?.user.money"
        :title="
          item.cost > authData?.user.money ? 'You cannot afford this item.' : ''
        "
        @click="emit('purchase', item)"
      >
        Buy for {{ item.cost }}
      </button>
    </div>

    <p class="text-xs leading-5" v-html="item.description" />
    <p
      v-if="item.availableFrom && item.availableTo"
      class="text-xs italic row-start-3 col-span-full"
    >
      <ClientOnly>
        (Available
        {{
          DateTime.fromSQL(`${item.availableFrom}.000Z`).toLocaleString({
            dateStyle: 'short',
            timeStyle: 'short',
          })
        }}
        &mdash;
        {{
          DateTime.fromSQL(`${item.availableTo}.000Z`).toLocaleString({
            dateStyle: 'short',
            timeStyle: 'short',
          })
        }})
      </ClientOnly>
    </p>
  </component>
</template>

<script lang="ts" setup>
import { userFlair } from '#imports';
import { DateTime } from 'luxon';

const emit = defineEmits<{
  (e: 'purchase', item: Item): void;
}>();

withDefaults(
  defineProps<{
    item: Item;
    as?: string;
  }>(),
  {
    as: 'div',
  }
);

const { data: authData } = useAuth();
</script>
