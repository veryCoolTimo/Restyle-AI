// ApplyPatch Content Script (standalone)
(function() {
console.log('🎨 [APPLY] Content script starting...');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chrome = (window as any).chrome;
let styleId = 'gpt-styler';
let appliedPatches: { selector: string; replace: string; outer?: boolean }[] = [];
let appliedCss = '';
let observer: MutationObserver | null = null;

function insertCss(css: string) {
  console.log('💄 [APPLY] Inserting CSS, length:', css.length);
  console.log('💄 [APPLY] CSS preview:', css.substring(0, 200) + '...');
  let style = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!style) {
    console.log('💄 [APPLY] Creating new style element');
    style = document.createElement('style');
    style.id = styleId;
    document.head.appendChild(style);
  } else {
    console.log('💄 [APPLY] Updating existing style element');
  }
  style.textContent = css;
  console.log('💄 [APPLY] CSS applied to DOM');
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

// Listener для сообщений
if (!(window as any).gptStylerApplyPatchInjected) {
  console.log('🎨 [APPLY] Setting up message listener...');
  (window as any).gptStylerApplyPatchInjected = true;
  
  chrome?.runtime?.onMessage.addListener((msg: unknown, sender: unknown, sendResponse: (resp: any) => void) => {
    try {
      console.log('🎨 [APPLY] Received message:', msg);
      
      // Проверка готовности
      if ((msg as any)?.type === 'ping') {
        console.log('🏓 [APPLY] Responding to ping');
        sendResponse({ type: 'pong' });
        return true;
      }
      
      if ((msg as any)?.type === 'applyPatch') {
        console.log('🎨 [APPLY] Processing apply patch request...');
        const { css, patches } = msg as { css: string; patches?: typeof appliedPatches };
        appliedCss = css;
        insertCss(css);
        
        if (patches) {
          console.log('🔧 [APPLY] Applying', patches.length, 'DOM patches...');
          appliedPatches = patches;
          const failed = applyPatches(patches);
          observeSpa(patches);
          console.log('✅ [APPLY] Patches applied, failed:', failed.length);
          sendResponse({ 
            type: 'ack', 
            success: failed.length === 0, 
            error: failed.length ? failed.join(',') : undefined 
          });
        } else {
          console.log('✅ [APPLY] CSS applied without DOM patches');
          sendResponse({ type: 'ack', success: true });
        }
        return true;
      }
      
      if ((msg as any)?.type === 'undo') {
        console.log('↩️ [APPLY] Processing undo request...');
        undo();
        sendResponse({ type: 'ack', success: true });
        return true;
      }
      
      console.log('🎨 [APPLY] Unknown message type:', (msg as any)?.type);
    } catch (error) {
      console.error('❌ [APPLY] Error:', error);
      sendResponse({ type: 'ack', success: false, error: 'Internal error' });
    }
    return false;
  });
  
  // Сигнал готовности
  console.log('✅ [APPLY] Content script ready');
  window.postMessage({ type: 'GPT_STYLER_APPLY_READY' }, '*');
} else {
  console.log('⚠️ [APPLY] Already injected, skipping setup');
}

})(); // End IIFE 