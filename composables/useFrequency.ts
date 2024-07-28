export function useFrequency(
  frequency: Ref<string | number>,
  callback: () => void
) {
  let interval: ReturnType<typeof setInterval> | undefined;

  function setFrequency() {
    clearInterval(interval);
    interval = setInterval(
      callback,
      parseInt(frequency.value.toString()) * 1000
    );
  }

  const unwatch = watch(frequency, setFrequency);

  onNuxtReady(setFrequency);

  return { unwatch };
}
