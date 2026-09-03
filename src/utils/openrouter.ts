/**
 * OpenRouter chat bridge for non-Gemini models (Qwen, GLM, DeepSeek, Hunyuan).
 * Sends OpenAI-compatible requests directly from the browser using the
 * user-supplied API key (stored in localStorage as 'nova_ai_or_key').
 */

const BASE = 'https://openrouter.ai/api/v1/chat/completions';

// Built-in OpenRouter key (used when the user has not set their own in Settings).
// WARNING: this ships inside the APK and is extractable by a determined user.
// Replace it with your own key, or remove it and let users enter their own.
const DEFAULT_OR_KEY = 'sk-or-v1…b72b';

// Map our UI model ids to real OpenRouter model ids
export function resolveOpenRouterModel(model: string): string | null {
  switch (model) {
    case 'qwen3.8-flash':
      return 'qwen/qwen3.8-flash';
    case 'glm-5.3-flash':
      return 'z-ai/glm-5.3-flash';
    case 'deepseek-v4-flash':
      return 'deepseek/deepseek-v4-flash';
    case 'hy3':
      return 'tencent/hunyuan-a13b-instruct';
    case 'mimo':
      return 'xiaomi/mimo-v2.5';
    case 'gemini-2.5-flash':
    case 'gemini-3.7-flash':
    case 'gemini-flash-latest':
      return 'google/gemini-2.5-flash';
    case 'gemini-2.5-pro':
    case 'gemini-3.1-pro-preview':
      return 'google/gemini-2.5-pro';
    case 'gemini-2.5-flash-lite':
    case 'gemini-3.1-flash-lite':
      return 'google/gemini-2.5-flash-lite';
    default:
      return null; // not an OpenRouter model
  }
}

function getKey(): string {
  return localStorage.getItem('nova_ai_or_key') || DEFAULT_OR_KEY;
}

function buildMessages(messages: any[], systemPrompt?: string): any[] {
  const out: any[] = [];
  if (systemPrompt) {
    out.push({ role: 'system', content: systemPrompt });
  }
  for (const m of messages) {
    if (!m || !m.content) continue;
    if (typeof m.content === 'string' && (m.content.startsWith('⚠️') || m.content.startsWith('Error:'))) continue;
    const role = m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user';
    out.push({ role, content: m.content });
  }
  if (out.length === 0) out.push({ role: 'user', content: 'سلام' });
  return out;
}

export async function orChatGenerate(opts: {
  messages: any[];
  systemPrompt?: string;
  model: string;
  temperature?: number;
}): Promise<{ text: string; model: string }> {
  const key = getKey();
  if (!key) throw new Error('کلید OpenRouter تنظیم نشده است (بخش تنظیمات > کلید API).');
  const orModel = resolveOpenRouterModel(opts.model)!;
  const body = {
    model: orModel,
    messages: buildMessages(opts.messages, opts.systemPrompt),
    temperature: opts.temperature ?? 0.7,
    stream: false,
  };
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': 'https://nova.ai', 'X-Title': 'Nova AI' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenRouter (${res.status}): ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const msg = data?.choices?.[0]?.message || {};
  const text = msg.content || msg.reasoning || 'پاسخی دریافت نشد.';
  return { text, model: opts.model };
}

export async function orChatStream(opts: {
  messages: any[];
  systemPrompt?: string;
  model: string;
  temperature?: number;
  onChunk: (c: { text?: string; done?: boolean; fullText?: string; model?: string; error?: string }) => void;
}): Promise<void> {
  const key = getKey();
  if (!key) {
    opts.onChunk({ error: 'کلید OpenRouter تنظیم نشده است (بخش تنظیمات > کلید API).' });
    return;
  }
  const orModel = resolveOpenRouterModel(opts.model)!;
  const body = {
    model: orModel,
    messages: buildMessages(opts.messages, opts.systemPrompt),
    temperature: opts.temperature ?? 0.7,
    stream: true,
  };
  try {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': 'https://nova.ai', 'X-Title': 'Nova AI' },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      const t = await res.text();
      throw new Error(`OpenRouter (${res.status}): ${t.slice(0, 200)}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let full = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        const s = line.trim();
        if (!s.startsWith('data:')) continue;
        const json = s.slice(5).trim();
        if (!json || json === '[DONE]') continue;
        try {
          const d = JSON.parse(json);
          const delta = d?.choices?.[0]?.delta?.content || d?.choices?.[0]?.delta?.reasoning || '';
          if (delta) {
            full += delta;
            opts.onChunk({ text: delta });
          }
        } catch {
          /* ignore partial */
        }
      }
    }
    opts.onChunk({ done: true, fullText: full, model: opts.model });
  } catch (err: any) {
    opts.onChunk({ error: err?.message || 'خطا در ارتباط با OpenRouter' });
  }
}
