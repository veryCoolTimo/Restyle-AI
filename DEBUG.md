# Отладка GPT Styler Extension

## Последние исправления ✅

1. **OpenAI API**: Отключен streaming (`stream: false`), теперь возвращается готовый JSON
2. **Background Service Worker**: Упрощена логика, добавлен ping-retry (10 попыток) перед injection
3. **Popup**: Убрана injection логика, теперь background сам внедряет content scripts
4. **parseGptStyleResult**: Добавлена проверка обязательного поля `css`
5. **HTML Size**: Ограничен до 80k символов (`MAX_LENGTH = 80000`)

## Как тестировать

### 1. Установка расширения
```bash
cd gpt-styler
npm run build
```
- Открыть Chrome → Extensions → Developer Mode → Load unpacked → выбрать папку `dist/`

### 2. Консоли для просмотра логов

**Background Script** (service worker):
- Chrome → Extensions → GPT Styler → "service worker" → Console

**Popup Script**:
- Открыть popup → правой кнопкой → Inspect → Console

**Content Scripts** (на странице):
- F12 на любой странице → Console

**Options Page**:
- Chrome → Extensions → GPT Styler → Details → Extension options → F12 → Console

### 3. Ожидаемые логи при успешной работе

#### Background (service worker):
```
🔧 [BACKGROUND] Processing style request...
📄 [BACKGROUND] HTML length: 45234 Style: dark mode
🔑 [BACKGROUND] API key found: true
🤖 [BACKGROUND] Starting OpenAI request...
✅ [BACKGROUND] OpenAI response parsed successfully
📤 [BACKGROUND] Sending to content script...
✅ [BACKGROUND] Content script acknowledged
```

#### Popup:
```
🚀 [POPUP] Starting handleApply...
📋 [POPUP] Active tab ID: 12345
📄 [POPUP] Requesting HTML from content script...
📄 [POPUP] HTML received: 45234 chars
📤 [POPUP] Sending to background...
✅ [POPUP] Style applied successfully
```

#### Content Scripts:
```
📝 [EXTRACT] Content script starting...
✅ [EXTRACT] Content script ready
🏓 [EXTRACT] Responding to ping
📄 [EXTRACT] Processing HTML request...
📄 [EXTRACT] Sending HTML response, length: 45234

🎨 [APPLY] Content script starting...
✅ [APPLY] Content script ready
🏓 [APPLY] Responding to ping
🎨 [APPLY] Received applyPatch message
🎨 [APPLY] Inserting CSS: 1234 chars
🎨 [APPLY] Applying 3 patches
✅ [APPLY] Patch applied successfully
```

### 4. Проверка цепочки работы

1. **Popup → Background**: HTML передается в background для OpenAI
2. **Background → OpenAI**: Запрос к API без streaming
3. **OpenAI → Background**: JSON ответ с полями `css` и `patches`
4. **Background → Content Script**: Применение стилей на странице

### 5. Если что-то не работает

**Ошибка: "Content script не отвечает"**
- Проверить что в консоли страницы есть логи `✅ [EXTRACT/APPLY] Content script ready`
- Background должен делать до 10 попыток ping перед injection

**Ошибка: "Invalid JSON from OpenAI"**
- Проверить что в консоли background есть лог с JSON preview
- Убедиться что ответ содержит поле `css`

**Ошибка: "No OpenAI key"**
- Открыть Options page → ввести API ключ → Save

## Структура проекта после исправлений

- ✅ **manifest.ts**: Убран `content_scripts`, остается только programmatic injection
- ✅ **Background**: Ping-retry логика + упрощенный OpenAI pipeline
- ✅ **Popup**: Убрана injection логика, только UI
- ✅ **Content Scripts**: Standalone файлы в IIFE обертке
- ✅ **OpenAI**: Без streaming, прямой JSON parsing
- ✅ **Build**: Vite корректно собирает все компоненты

Расширение теперь должно работать стабильно без ошибок двойного внедрения, CSP нарушений и проблем с parsing OpenAI ответов. 