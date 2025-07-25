import { StyleRequestSchema, ProgressSchema, ApplyPatchSchema } from '../shared/messaging';
import { fetchGptStyle, parseGptStyleResult } from '../shared/openai';

// Внедряем content scripts программно

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chrome = (self as any).chrome || (globalThis as any).chrome;

console.log('🛠️ [BACKGROUND] Service worker loaded');

const MAX_JSON_SIZE = 5 * 1024 * 1024; // 5 МБ

// Helper: ping content script
async function pingContent(tabId: number): Promise<boolean> {
  return new Promise((res) => {
    chrome.tabs.sendMessage(tabId, { type: 'ping' }, () => {
      res(!chrome.runtime.lastError);
    });
  });
}

async function injectScriptsIfNeeded(tabId: number) {
  for (let i = 0; i < 10; i++) {
    if (await pingContent(tabId)) return;
    await chrome.scripting.executeScript({ target: { tabId }, files: ['assets/extractHtml-standalone.js'] });
    await chrome.scripting.executeScript({ target: { tabId }, files: ['assets/applyPatch-standalone.js'] });
    await new Promise(r => setTimeout(r, 200));
  }
}

chrome.runtime.onMessage.addListener((msg: any, sender: any, sendResponse: (response: any) => void) => {
  console.log('📩 [BACKGROUND] onMessage:', msg);
  const validation = StyleRequestSchema.safeParse(msg);
  console.log('📑 [BACKGROUND] StyleRequestSchema result:', validation.success);
  if (!validation.success) {
    console.warn('⚠️ [BACKGROUND] Unknown or invalid message');
    return;
  }
  const { html, styleName, tabId: msgTabId } = msg as { html: string; styleName: string; tabId?: number };
  let tabId = msgTabId ?? sender.tab?.id;
  console.log('🆔 [BACKGROUND] TabId:', tabId);
  if (tabId == null) {
    console.error('❌ [BACKGROUND] No tabId provided');
    sendResponse({ type: 'progress', error: 'No tabId' });
    return;
  }

  (async () => {
    try {
      await injectScriptsIfNeeded(tabId);
      const { openaiKey } = await new Promise<{ openaiKey?: string }>((res) => chrome.storage.local.get(['openaiKey'], res));
      if (!openaiKey) throw new Error('No OpenAI key');
      console.log('🔑 [BACKGROUND] Got OpenAI key, calling API...');
      const result = await fetchGptStyle({ apiKey: openaiKey, html, styleName });
      console.log('🎨 [BACKGROUND] Got result, sending to content script');
      await chrome.tabs.sendMessage(tabId, { type: 'applyPatch', css: result.css, patches: result.patches });
      console.log('✅ [BACKGROUND] Patches sent, responding to popup');
      sendResponse({ type: 'progress', message: 'done' });
    } catch (e: any) {
      console.error('❌ [BACKGROUND] Error pipeline:', e);
      sendResponse({ type: 'progress', error: e.message });
    }
  })();
  console.log('⏳ [BACKGROUND] Listener async started, keeping port open');
  return true; // keep port open
});
