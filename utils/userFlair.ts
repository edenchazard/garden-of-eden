export default function (flairName: UserFlair) {
  const config = useRuntimeConfig();
  const path = config.public.origin + config.public.baseUrl;
  return `${path}/items/${flairName}.png`;
}
