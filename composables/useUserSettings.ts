export function useUserSettings(
  saveOnChange: boolean = false,
  toastOnSave: boolean = false
) {
  const { data: authData } = useAuth();

  const settings = useState(() => ({
    ...userSettingsSchema.parse({}),
    ...authData.value?.user.settings,
  }));

  const { execute, status } = useFetch('/api/user/settings', {
    method: 'PATCH',
    body: settings,
    immediate: false,
    watch: saveOnChange ? [settings] : false,
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