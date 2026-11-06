let fartWindow: Window | null = null;

type PushDragonMessage = {
  code: string;
  instances?: number;
  enabled?: boolean;
};

export default function useFartWindow() {
  function openFartWindow() {
    if (import.meta.server) return;

    if (!fartWindow || fartWindow.closed) {
      fartWindow = window.open(
        'http://localhost:3001/dc/auto-refresher',
        'fart'
      );
    }
    return fartWindow;
  }

  function postAddDragon(data: PushDragonMessage) {
    if (import.meta.server) {
      return;
    }

    fartWindow?.postMessage(
      {
        type: 'PUSH_DRAGON',
        instances: 1,
        enabled: true,
        ...data,
      },
      'http://localhost:3001'
    );
  }

  function openIfNotOpenAndAdd(data: PushDragonMessage) {
    const fartWindow = openFartWindow();

    postAddDragon(data);

    fartWindow?.focus();
  }

  return {
    openFartWindow,
    postAddDragon,
    openIfNotOpenAndAdd,
  };
}
