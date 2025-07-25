// System prompt для OpenAI
export const SYSTEM_PROMPT = `Ты — веб-дизайнер. Получишь HTML и описание стиля. Верни JSON с полями css и patches.

ПРАВИЛА:
• НЕ используй черный фон (background: black)
• Сохраняй читаемость текста
• css — без inline-стилей
• patches — макс 20 шт.

ФОРМАТ:
{
  "css": "body { background: #1a1a2e; color: #eee; }",
  "patches": [{"selector": ".header", "replace": "New content"}]
}

Только JSON, без комментариев.`;


export interface GptStyleResult {
  css: string;
  patches: Array<{
    selector: string;
    replace: string;
    outer?: boolean;
  }>;
}

export function buildGptPrompt(html: string, styleName: string): string {
  return `HTML страницы (без <script>/<style>):\n\n${html}\n\nСтиль: ${styleName}\n\nВерни JSON строго по инструкции выше.`;
} 