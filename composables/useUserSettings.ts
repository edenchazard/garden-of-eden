export function useUserSettings(saveOnChange: boolean = false) {
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
  });

  return {
    userSettings: settings,
    saveSettings: execute,
    saveSettingsStatus: readonly(status),
  };
}
