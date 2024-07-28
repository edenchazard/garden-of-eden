export function useFrequency(
  userSettings: Ref<UserSettings>,
  paused: Ref<boolean>,
  callback: () => void
) {
  let interval: ReturnType<typeof setInterval> | undefined;

  function setFrequency() {
    clearInterval(interval);
    interval = setInterval(
      callback,
      parseInt(userSettings.value.frequency.toString()) * 1000
    );
  }

  const unwatch = watch(() => userSettings.value.frequency, setFrequency);
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
