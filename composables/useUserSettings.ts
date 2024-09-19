export function useUserSettings(
  saveOnChange: boolean = false,
  toastOnSave: boolean = false
) {
  const { data: authData } = useAuth();

  const settings = useState(() => ({
    ...userSettingsSchema.parse({}),
    ...userSettingsSchema.parse(authData.value?.user?.settings ?? {}),
  }));

  const newSettings = useState<Partial<UserSettings>>(() => ({}));

  const { execute, status } = useCsrfFetch('/api/user/settings', {
    method: 'PATCH',
    body: newSettings,
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

  async function saveSettings(toSet: UserSettings | null = null) {
    newSettings.value = { ...settings.value, ...(toSet ?? {}) };
    await execute();
    if (status.value === 'success') {
      Object.assign(settings.value, newSettings.value);
      newSettings.value = {};
    }
  }

  return {
    userSettings: settings,
    saveSettings,
    saveSettingsStatus: readonly(status),
  };
}
