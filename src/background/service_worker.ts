import { StyleRequestSchema, ProgressSchema, ApplyPatchSchema } from '../shared/messaging';
import { fetchGptStyle, parseGptStyleResult } from '../shared/openai';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chrome = (self as any).chrome || (globalThis as any).chrome;

const MAX_JSON_SIZE = 5 * 1024 * 1024; // 5 МБ

chrome?.runtime?.onMessage.addListener(async (msg: unknown, sender: any, sendResponse: (resp: any) => void) => {
  if (StyleRequestSchema.safeParse(msg).success) {
    const { html, styleName } = msg as { html: string; styleName: string };
    // Получаем ключ из storage
    chrome.storage.local.get(['openaiKey'], async (result: { openaiKey?: string }) => {
      const apiKey = result.openaiKey;
      if (!apiKey) {
        sendResponse({ type: 'progress', error: 'No OpenAI key' });
        return;
      }
      try {
        let partial = '';
        let closed = false;
        await fetchGptStyle({
          apiKey,
          html,
          styleName,
          onPartial: (chunk) => {
            partial = chunk;
            // Проверяем, не превысили ли лимит
            if (partial.length > MAX_JSON_SIZE && !closed) {
              closed = true;
              sendResponse({ type: 'progress', error: 'responseTooLarge' });
              return;
            }
            // Проверяем, закрыт ли JSON (по последней } вне строки)
            if (!closed && /\}\s*$/.test(partial)) {
              closed = true;
              const jsonStart = partial.indexOf('{');
              const json = partial.slice(jsonStart);
              const parsed = parseGptStyleResult(json);
              if (parsed) {
                chrome.tabs.sendMessage(sender.tab.id, {
                  type: 'applyPatch',
                  css: parsed.css,
                  patches: parsed.patches,
                });
                sendResponse({ type: 'progress', message: 'done' });
              } else {
                sendResponse({ type: 'progress', error: 'Invalid JSON' });
              }
            }
          },
        });
      } catch (e: any) {
        sendResponse({ type: 'progress', error: e.message || 'OpenAI error' });
      }
    });
    return true; // async
  }
});
