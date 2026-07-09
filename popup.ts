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

function hasAccessibleOpener(): boolean {
  try {
    return !!window.opener;
  } catch (err) {
    return false;
  }
}

// NOTE: We deliberately do NOT read window.opener.closed here.
// Under a Cross-Origin-Opener-Policy of 'same-origin' or
// 'same-origin-allow-popups', browsers (Chrome in particular) log a
// "Cross-Origin-Opener-Policy policy would block the window.closed call"
// warning whenever that property is accessed on an opener that COOP has
// severed or cross-origin'd — regardless of try/catch, since it's an
// enforcement-layer warning, not a catchable exception. We simply attempt
// postMessage and let it no-op silently if there's no reachable opener.
function supportsSelfClose(): boolean {
  try {
    const openerTest = window.open('', '_self');
    return !!openerTest;
  } catch (err) {
    return false;
  }
}

export function safeClosePopup(reason?: string): void {
  if (hasAccessibleOpener()) {
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
    if (supportsSelfClose()) {
      try {
        window.close();
      } catch (err) {
        console.warn('popup.ts: listener failed to close self', err);
      }
    }
  });
}

if (typeof window !== 'undefined') {
  initPopupCloseListener();
}
