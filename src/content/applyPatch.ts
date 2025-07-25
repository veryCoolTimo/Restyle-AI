import { ApplyPatchSchema } from '../shared/messaging';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chrome = (window as any).chrome;

let styleId = 'gpt-styler';
let appliedPatches: { selector: string; replace: string; outer?: boolean }[] = [];
let appliedCss = '';
let observer: MutationObserver | null = null;

function insertCss(css: string) {
  // Content script fallback — <style> элемент в head
  let style = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = styleId;
    document.head.appendChild(style);
  }
  style.textContent = css;
}

function removeCss() {
  const style = document.getElementById(styleId);
  if (style) style.remove();
}

function applyPatches(patches: typeof appliedPatches) {
  const failed: string[] = [];
  patches.forEach(({ selector, replace, outer }) => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        if (outer) {
          const temp = document.createElement('div');
          temp.innerHTML = replace;
          el.replaceWith(...temp.childNodes);
        } else {
          (el as HTMLElement).innerHTML = replace;
        }
      });
    } catch {
      failed.push(selector);
    }
  });
  return failed;
}

function observeSpa(patches: typeof appliedPatches) {
  if (observer) observer.disconnect();
  observer = new MutationObserver(() => {
    insertCss(appliedCss);
    applyPatches(patches);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function undo() {
  removeCss();
  location.reload();
}

chrome?.runtime?.onMessage.addListener((msg: unknown, sender: unknown, sendResponse: (resp: any) => void) => {
  try {
    // Проверка готовности content script
    if ((msg as any)?.type === 'ping') {
      sendResponse({ type: 'pong' });
      return true;
    }
    
    if (ApplyPatchSchema.safeParse(msg).success) {
      const { css, patches } = msg as { css: string; patches?: typeof appliedPatches };
      appliedCss = css; // Сохраняем CSS для MutationObserver
      insertCss(css);
      if (patches) {
        appliedPatches = patches;
        const failed = applyPatches(patches);
        observeSpa(patches);
        sendResponse({ type: 'ack', success: failed.length === 0, error: failed.length ? failed.join(',') : undefined });
      } else {
        sendResponse({ type: 'ack', success: true });
      }
      return true;
    }
    if ((msg as any)?.type === 'undo') {
      undo();
      sendResponse({ type: 'ack', success: true });
      return true;
    }
  } catch (error) {
    console.error('ApplyPatch error:', error);
    sendResponse({ type: 'ack', success: false, error: 'Internal error' });
  }
  return false;
});

// Сигнализируем что content script загружен
if (typeof window !== 'undefined') {
  window.postMessage({ type: 'GPT_STYLER_CONTENT_READY' }, '*');
} 