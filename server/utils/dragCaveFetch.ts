const counters: Record<string, number[]> = {
  success: [],
  failure: [],
};

export function dragCaveFetch() {
  return $fetch.create({
    baseURL: 'https://dragcave.net/api/v2',
    timeout: 10000,
    onResponse({ response }) {
      if (response.ok) {
        counters.success.push(new Date().getTime());
      } else {
        counters.failure.push(new Date().getTime());
      }
    },
    onRequestError() {
      counters.failure.push(new Date().getTime());
    },
  });
}

export function getCounters() {
  return { ...counters };
}

export function purgeCounters(before: number) {
  counters.success = counters.success.filter(
    (timestamp) => timestamp >= before
  );
  counters.failure = counters.failure.filter(
    (timestamp) => timestamp >= before
  );
}
