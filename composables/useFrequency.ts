export function useFrequency(
  frequency: Ref<string | number>,
  paused: Ref<boolean>,
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
  watch(paused, (value) => {
    if (value) {
      clearInterval(interval);
      return;
    }

    callback();
    setFrequency();
  });

  onNuxtReady(setFrequency);

  return { unwatch };
}
