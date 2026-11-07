let fartWindow: Window | null = null;
let fartReady = false;

type PushDragonMessage = {
  code: string;
  instances?: number;
  enabled?: boolean;
};

const pendingMessages: PushDragonMessage[] = [];

export default function useFartWindow() {
  function postAddDragon(data: PushDragonMessage) {
    if (import.meta.server) return;

    // Queue until FART confirms it's ready
    if (!fartWindow || fartWindow.closed || !fartReady) {
      pendingMessages.push(data);
      return;
    }

    fartWindow.postMessage(
      {
        type: 'PUSH_DRAGON',
        instances: 1,
        enabled: true,
        ...data,
      },
      'http://localhost:3001'
    );
  }

  function handleFartMessage(event: MessageEvent) {
    if (event.origin !== 'http://localhost:3001') return;
    if (event.source !== fartWindow) return;

    if (event.data?.type === 'FART_READY') {
      fartReady = true;

      // Flush queued messages
      while (pendingMessages.length > 0) {
        postAddDragon(pendingMessages.shift()!);
      }
    }
  }

  function openFartWindow() {
    if (import.meta.server) return;

    if (!fartWindow || fartWindow.closed) {
      fartReady = false;

      // Register before opening the window
      window.addEventListener('message', handleFartMessage);

      fartWindow = window.open(
        'http://localhost:3001/dc/auto-refresher',
        'fart'
      );
    }

    return fartWindow;
  }

  function openIfNotOpenAndAdd(data: PushDragonMessage) {
    const win = openFartWindow();

    if (!win) return;

    postAddDragon(data);
    win.focus();
  }

  return {
    openFartWindow,
    postAddDragon,
    openIfNotOpenAndAdd,
  };
}
