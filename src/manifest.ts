// Manifest V3 генерация для Chrome Extension
// https://developer.chrome.com/docs/extensions/mv3/manifest/

const manifest = {
  manifest_version: 3,
  name: 'GPT Styler',
  version: '0.1.0',
  description: 'AI-стилизация сайтов через OpenAI GPT',
  action: {
    default_popup: 'popup.html',
  },
  background: {
    service_worker: 'src/background/service_worker.ts',
    type: 'module',
  },
  options_page: 'options.html',
  // content_scripts будут внедряться программно через background script
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
