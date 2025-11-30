import { userSettingsSchema } from '~/database/schema';

export function useUserSettings(
  saveOnChange: boolean = false,
  toastOnSave: boolean = false
) {
  const { data: authData } = useAuth();

  const userSettings = useState(() => ({
    ...userSettingsSchema.parse(authData.value?.user?.settings ?? {}),
  }));

  const newSettings = useState<Partial<UserSettings>>(() => ({}));

  const { execute, status } = useFetch('/api/user/settings', {
    method: 'PATCH',
    body: newSettings,
    immediate: false,
    key: Math.random().toString(36).substring(2),
    watch: false,
    headers: computed(() => ({
      'Csrf-token': useCsrf().csrf,
    })),
    onResponse({ response }) {
      if (!toastOnSave) {
        return;
      }

      if (response.ok) {
        toast.success('Settings saved successfully. :)');
      } else {
        toast.error('Failed to save settings. :( Please try again.');
      }
    },
  });

  watch(
    userSettings,
    () => {
      if (saveOnChange && authData.value?.user) {
        saveSettings();
      }
    },
    {
      deep: true,
    }
  );

  async function saveSettings(toSet: UserSettings | null = null) {
    newSettings.value = { ...userSettings.value, ...(toSet ?? {}) };
    await execute();
    if (status.value === 'success') {
      Object.assign(userSettings.value, newSettings.value);
      newSettings.value = {};
    }
  }

  return {
    userSettings,
    saveSettings,
    saveSettingsStatus: readonly(status),
  };
}
