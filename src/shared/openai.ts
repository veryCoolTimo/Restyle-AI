import { SYSTEM_PROMPT, buildGptPrompt } from './gptPrompt';
import type { GptStyleResult } from './gptPrompt';

export async function fetchGptStyle({
  apiKey,
  html,
  styleName,
}: {
  apiKey: string;
  html: string;
  styleName: string;
}): Promise<GptStyleResult> {
  const url = 'https://api.openai.com/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  const body = JSON.stringify({
    model: 'gpt-4o',
    stream: false,
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildGptPrompt(html, styleName) },
    ],
  });

  const resp = await fetch(url, { method: 'POST', headers, body });
  if (!resp.ok) {
    throw new Error(`OpenAI error: ${resp.status}`);
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in OpenAI response');
  }
  const parsed = parseGptStyleResult(content);
  if (!parsed) throw new Error('Invalid JSON from OpenAI');
  return parsed;
}

// Парсер результата (строго JSON)
export function parseGptStyleResult(raw: string): GptStyleResult | null {
  try {
    let jsonStr = raw.trim();
    // Убираем markdown-блоки ```json ... ```
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```[a-zA-Z]*[\r\n]+/u, '').replace(/```\s*$/u, '').trim();
    }
    // Дополнительно оставляем только часть от первой { до последней }
    const first = jsonStr.indexOf('{');
    const last = jsonStr.lastIndexOf('}');
    if (first !== -1 && last !== -1) {
      jsonStr = jsonStr.slice(first, last + 1);
    }

    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed.css !== 'string' || !parsed.css.trim()) {
      console.error('❌ [PARSE] Missing or empty css field');
      return null;
    }
    return parsed as GptStyleResult;
  } catch (error) {
    console.error('❌ [PARSE] JSON parse error:', error);
    return null;
  }
} 