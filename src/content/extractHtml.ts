import { RequestHtmlSchema } from '../shared/messaging';
import type { HtmlResponse } from '../shared/messaging';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chrome = (window as any).chrome;

// Маскировать текстовые узлы? (privacy-toggle)
const PRIVACY_MASK = true;
const MAX_LENGTH = 80000;

function maskTextNodes(node: Node) {
  if (node.nodeType === Node.TEXT_NODE && node.textContent) {
    node.textContent = PRIVACY_MASK ? 'XXXX' : node.textContent;
  } else if (node.hasChildNodes()) {
    node.childNodes.forEach(maskTextNodes);
  }
}

function extractHtml(): string {
  const clone = document.documentElement.cloneNode(true) as HTMLElement;
  // Удаляем <script> и <style>
  clone.querySelectorAll('script,style').forEach(el => el.remove());
  // Маскируем текстовые узлы
  maskTextNodes(clone);
  // Сериализация
  let html = clone.outerHTML;
  // Усечение
  if (html.length > MAX_LENGTH) {
    html = html.slice(0, MAX_LENGTH);
  }
  return html;
}

// Слушаем сообщения
chrome?.runtime?.onMessage.addListener((msg: unknown, sender: unknown, sendResponse: (resp: HtmlResponse) => void) => {
  if (RequestHtmlSchema.safeParse(msg).success) {
    const html = extractHtml();
    const response: HtmlResponse = { type: 'html', html };
    sendResponse(response);
    return true; // async
  }
}); 