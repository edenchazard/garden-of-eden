import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Vue3Toastify, toastOptions);
});

export const toastOptions = {
  autoClose: 3000,
  pauseOnFocusLoss: false,
  newestOnTop: true,
  position: 'bottom-left',
  transition: 'slide',
} as ToastContainerOptions;

export * from 'vue3-toastify';
