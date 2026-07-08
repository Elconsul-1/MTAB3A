/**
 * popup.ts
 * Safe close helper for popup windows.
 *
 * Use this helper in any popup page that may be opened by the app.
 * If direct window.close() is blocked, it sends a request to the opener.
 */

type PopupCloseMessage = {
  type: 'POPUP_CLOSE_REQUEST';
  reason?: string;
};

function supportsSelfClose(): boolean {
  if (window.opener && !window.opener.closed) {
    return false;
  }
  try {
    const openerTest = window.open('', '_self');
    return !!openerTest;
  } catch (err) {
    return false;
  }
}

export function safeClosePopup(reason?: string): void {
  if (window.opener && !window.opener.closed) {
    try {
      const message: PopupCloseMessage = { type: 'POPUP_CLOSE_REQUEST', reason };
      window.opener.postMessage(message, '*');
      return;
    } catch (err) {
      console.warn('popup.ts: safeClosePopup failed to message opener', err);
    }
  }

  if (supportsSelfClose()) {
    try {
      window.close();
    } catch (err) {
      console.warn('popup.ts: safeClosePopup failed to close self', err);
    }
  }
}

export function initPopupCloseListener(): void {
  window.addEventListener('message', (event: MessageEvent<PopupCloseMessage>) => {
    const data = event.data;
    if (!data || data.type !== 'POPUP_CLOSE_REQUEST') return;
    if (canCloseWindow()) {
      window.close();
    }
  });
}

if (typeof window !== 'undefined') {
  initPopupCloseListener();
}
