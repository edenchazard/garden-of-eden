export default defineEventHandler((e) => {
  setHeader(e, 'cache-control', 'public, max-age=0');
  setHeader(e, 'expires', 0);
});
