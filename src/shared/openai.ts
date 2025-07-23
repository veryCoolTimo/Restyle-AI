import { SYSTEM_PROMPT, buildGptPrompt } from './gptPrompt';
import type { GptStyleResult } from './gptPrompt';

export async function fetchGptStyle({
  apiKey,
  html,
  styleName,
  onPartial,
}: {
  apiKey: string;
  html: string;
  styleName: string;
  onPartial?: (partial: string) => void;
}): Promise<string> {
  const url = 'https://api.openai.com/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  const body = JSON.stringify({
    model: 'gpt-4o',
    stream: true,
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildGptPrompt(html, styleName) },
    ],
  });

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
  });
  if (!response.body) throw new Error('No stream');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    result += chunk;
    onPartial?.(result);
    // Можно добавить парсинг SSE и остановку по закрывающей скобке JSON
  }
  return result;
}

// Парсер результата (строго JSON)
export function parseGptStyleResult(json: string): GptStyleResult | null {
  try {
    return JSON.parse(json) as GptStyleResult;
  } catch {
    return null;
  }
} 