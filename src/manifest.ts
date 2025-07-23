// Manifest V3 генерация для Chrome Extension
// https://developer.chrome.com/docs/extensions/mv3/manifest/

const manifest = {
  manifest_version: 3,
  name: 'GPT Styler',
  version: '0.1.0',
  description: 'AI-стилизация сайтов через OpenAI GPT',
  action: {
    default_popup: 'popup/index.html',
  },
  background: {
    service_worker: 'background/service_worker.js',
    type: 'module',
  },
  options_page: 'options/index.html',
  permissions: [
    'storage',
    'scripting',
    'activeTab',
  ],
  host_permissions: [
    '<all_urls>'
  ],
  icons: {
    '16': 'icons/16.png',
    '32': 'icons/32.png',
    '48': 'icons/48.png',
    '128': 'icons/128.png',
  },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'none';"
  }
};

export default manifest;
