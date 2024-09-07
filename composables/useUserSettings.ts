export function useUserSettings(
  saveOnChange: boolean = false,
  toastOnSave: boolean = false
) {
  const { data: authData } = useAuth();

  const settings = useState(() => ({
    ...userSettingsSchema.parse({}),
    ...userSettingsSchema.parse(authData.value?.user?.settings ?? {}),
  }));

  const { execute, status } = useCsrfFetch('/api/user/settings', {
    method: 'PATCH',
    body: settings,
    immediate: false,
    watch: saveOnChange && authData.value?.user ? [settings] : false,
    onResponse({ response }) {
      if (!toastOnSave) {
        return;
      }

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings. :( Please try again.');
      }
    },
  });

  return {
    userSettings: settings,
    saveSettings: execute,
    saveSettingsStatus: readonly(status),
  };
}
