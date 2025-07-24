// System prompt для OpenAI
export const SYSTEM_PROMPT = `Ты движок. На входе HTML (без script/style) и название стиля. Верни строго JSON:
{
  css:  "<полный CSS>",
  patches: [
    { selector:"...", replace:"<innerHTML|outerHTML>" }
  ]
}
Не добавляй комментарии вне JSON.

• css — должна работать без inline-стилей (CSP-дружелюбно).
• patches — максимум 30 шт., каждая ≤ 500 символов.`;


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