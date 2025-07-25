// ExtractHTML Content Script (standalone)
(function() {
console.log('📝 [EXTRACT] Content script starting...');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chrome = (window as any).chrome;
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
  console.log('📄 [EXTRACT] Starting HTML extraction...');
  const clone = document.documentElement.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('script,style').forEach(el => el.remove());
  maskTextNodes(clone);
  let html = clone.outerHTML;
  console.log('📄 [EXTRACT] Original HTML length:', html.length);
  if (html.length > MAX_LENGTH) {
    html = html.slice(0, MAX_LENGTH);
    console.log('📄 [EXTRACT] HTML truncated to:', html.length);
  }
  return html;
}

// Listener для сообщений
if (!(window as any).gptStylerExtractHtmlInjected) {
  console.log('📝 [EXTRACT] Setting up message listener...');
  (window as any).gptStylerExtractHtmlInjected = true;
  
  chrome?.runtime?.onMessage.addListener((msg: unknown, sender: unknown, sendResponse: (resp: any) => void) => {
    try {
      console.log('📝 [EXTRACT] Received message:', msg);
      
      // Проверка готовности
      if ((msg as any)?.type === 'ping') {
        console.log('🏓 [EXTRACT] Responding to ping');
        sendResponse({ type: 'pong' });
        return true;
      }
      
      if ((msg as any)?.type === 'requestHtml') {
        console.log('📄 [EXTRACT] Processing HTML request...');
        const html = extractHtml();
        console.log('📄 [EXTRACT] Sending HTML response, length:', html.length);
        sendResponse({ type: 'html', html });
        return true;
      }
      
      console.log('📝 [EXTRACT] Unknown message type:', (msg as any)?.type);
    } catch (error) {
      console.error('❌ [EXTRACT] Error:', error);
      sendResponse({ type: 'html', html: '' });
    }
    return false;
  });
  
  // Сигнал готовности
  console.log('✅ [EXTRACT] Content script ready');
  window.postMessage({ type: 'GPT_STYLER_EXTRACT_READY' }, '*');
} else {
  console.log('⚠️ [EXTRACT] Already injected, skipping setup');
}

})(); // End IIFE 