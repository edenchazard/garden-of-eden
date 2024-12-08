export default function (flairName: string) {
  const config = useRuntimeConfig();
  const path = config.public.origin + config.public.baseUrl;
  return `${path}/items/${flairName}`;
}
