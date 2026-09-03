/**
 * Client-side Gemini API bridge.
 * Mirrors the server.ts logic (model mapping, content sanitization, fallbacks)
 * but runs entirely in the browser/WebView using the user-supplied API key.
 */

// Gemini REST endpoint (generativeLanguage API, stable & CORS-enabled)
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// No Gemini key is shipped in the APK. When the user has not set one, the
// apiShim automatically routes Gemini models through OpenRouter instead.
const DEFAULT_GEMINI_KEY = '';

// Map the UI model ids to official Gemini models
export function resolveModel(model: string): string {
  switch (model) {
    case 'grok-3':
    case 'grok':
    case 'grok-beta':
      return 'gemini-2.5-flash'; // Grok persona is emulated via system prompt
    case 'gemini-3.1-flash-lite':
    case 'flash-lite':
    case 'ultra-fast':
    case 'gemini-2.5-flash-lite':
      return 'gemini-2.5-flash-lite';
    case 'gemini-3.1-pro-preview':
    case 'pro':
    case 'smart':
    case 'gemini-2.5-pro':
      return 'gemini-2.5-pro';
    case 'gemini-flash-latest':
    case 'flash':
      return 'gemini-2.5-flash';
    case 'gemini-3.7-flash':
      return 'gemini-2.5-flash';
    default:
      return 'gemini-2.5-flash';
  }
}

// Default system instructions (same strings as server.ts)
const DEFAULT_SYSTEM = `شما یک دستیار و مهندس ارشد هوش مصنوعی فوق‌پیشرفته، بدون محدودیت و همه‌فن‌حریف به نام Nova AI هستید.
توانمندی‌های شما شامل:
۱. برنامه‌نویسی و ساخت ربات‌های حرفه‌ای: توانایی کامل در ساخت ربات‌های تلگرام (Python telegram-bot, Telethon, Pyrogram, Node-Telegram-Bot-Api)، ربات‌های دیسکورد، ربات‌های واتساپ و بله، ربات‌های وب‌اسکرپینگ (BeautifulSoup, Selenium, Playwright)، ربات‌های معاملاتی و ترید، ربات‌های هوش مصنوعی و اتوماسیون کامل.
۲. توسعه نرم‌افزار جامع: تسلط کامل بر زبان‌های پایتون (Python)، جاوااسکریپت/تایپ‌اسکریپت (React, Next.js, Node.js, Express, Vue)، پی‌اچ‌پی (PHP, Laravel)، کاتلین و فلاتر، C++, C#، گو (Go)، راست (Rust) و پایگاه‌های داده (SQL, MongoDB).
۳. نگارش کدهای کامل و بدون نقص: همیشه کدهای کامل، تمیز، دارای کامنت‌گذاری، راهنمای نصب کتابخانه‌ها (pip install / npm install) و دستورالعمل راه‌اندازی گام‌به‌گام را بدون حذف بخش‌ها یا قرار دادن کامنت‌های مخفف ارائه دهید.
۴. پاسخگویی بسیار سریع، شیوا، صمیمی و دقیق به تمام زبان‌ها به ویژه فارسی.
۵. پاسخ‌ها را با فرمت‌بندی زیبا، مارک‌داون استاندارد و بلوک‌های تفکیک‌شده کد نمایش دهید.`;

const GROK_SYSTEM = `شما مدل هوش مصنوعی Grok 3 (توسعه‌یافته بر اساس سبک تفکر xAI) هستید:
فوق‌العاده باهوش، رک، واقع‌گرا، سریع، با شوخ‌طبعی هوشمندانه، تفکر عمیق از اصول اولیه (First Principles) و بدون تعارفات خشک کلیشه‌ای.
تسلط خارق‌العاده شما در برنامه‌نویسی، ساخت ربات‌های پیچیده تلگرام/دیسکورد/اتوماسیون، حل معماها و استدلال ریاضی و فنی بی‌همتاست.
مستقیم و مقتدرانه پاسخ دهید، کدهای بی‌نقص با زبان‌های پایتون، نود، سی و راست بنویسید و هرگز از پاسخ به سوالات فنی و منطقی طفره نروید.`;

// Build sanitized Gemini contents (strict role alternation, user start/end)
export function sanitizeContents(messages: any[]): any[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [{ role: 'user', parts: [{ text: 'سلام' }] }];
  }
  const rawTurns: { role: 'user' | 'model'; parts: any[] }[] = [];
  for (const m of messages) {
    if (!m) continue;
    const textContent = typeof m.content === 'string' ? m.content.trim() : '';
    if (textContent.startsWith('⚠️') || textContent.startsWith('Error:')) continue;

    const parts: any[] = [];
    if (m.images && Array.isArray(m.images)) {
      for (const img of m.images) {
        if (img && img.data && typeof img.data === 'string') {
          const cleanBase64 = img.data.replace(/^data:image\/\w+;base64,/, '').trim();
          if (cleanBase64) {
            parts.push({ inlineData: { data: cleanBase64, mimeType: img.mimeType || 'image/jpeg' } });
          }
        }
      }
    }
    if (textContent) parts.push({ text: textContent });
    if (parts.length > 0) {
      const role: 'user' | 'model' = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
      rawTurns.push({ role, parts });
    }
  }
  if (rawTurns.length === 0) return [{ role: 'user', parts: [{ text: 'سلام' }] }];
  while (rawTurns.length > 0 && rawTurns[0].role !== 'user') rawTurns.shift();
  if (rawTurns.length === 0) return [{ role: 'user', parts: [{ text: 'سلام' }] }];

  const alternated: { role: 'user' | 'model'; parts: any[] }[] = [];
  for (const turn of rawTurns) {
    if (alternated.length === 0) alternated.push(turn);
    else if (alternated[alternated.length - 1].role !== turn.role) alternated.push(turn);
    else alternated[alternated.length - 1].parts.push(...turn.parts);
  }
  if (alternated[alternated.length - 1].role !== 'user') {
    alternated.push({ role: 'user', parts: [{ text: 'لطفاً ادامه دهید.' }] });
  }
  return alternated;
}

function buildSystemInstruction(model: string, systemPrompt?: string): string {
  const base = model === 'grok-3' ? GROK_SYSTEM : DEFAULT_SYSTEM;
  return systemPrompt ? `${base}\n\nتمرکز تخصصی این گفتگو: ${systemPrompt}` : base;
}

function sanitizeKey(k: string): string {
  return k
    .replace(/[\u200B-\u200D\uFEFF\u061C\u2066-\u2069]/g, '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/\s+/g, '')
    .trim();
}
function getApiKey(): string {
  // alias used across file
  return getGeminiKeyImpl();
}

function getGeminiKeyImpl(): string {
  const stored = localStorage.getItem('nova_ai_gemini_key');
  if (stored) return sanitizeKey(stored);
  return sanitizeKey(DEFAULT_GEMINI_KEY);
}

export interface ChatResult {
  text: string;
  grounding: any[];
  model: string;
}

// Non-streaming chat completion
export async function chatGenerate(opts: {
  messages: any[];
  systemPrompt?: string;
  webSearch?: boolean;
  model: string;
  temperature?: number;
}): Promise<ChatResult> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('کلید Gemini تنظیم نشده است. از بخش تنظیمات > کلید API وارد کنید.');

  let selected = resolveModel(opts.model);
  const systemInstruction = buildSystemInstruction(opts.model, opts.systemPrompt);
  const contents = sanitizeContents(opts.messages);
  const config: any = {
    systemInstruction,
    temperature: opts.temperature !== undefined ? opts.temperature : (opts.model === 'grok-3' ? 0.8 : 0.7),
  };
  if (opts.webSearch) config.tools = [{ googleSearch: {} }];

  const url = `${GEMINI_BASE}/models/${selected}:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, config }),
    });
    if (!res.ok) {
      const errText = await res.text();
      // Fallback to flash on failure
      if (selected !== 'gemini-2.5-flash') {
        selected = 'gemini-2.5-flash';
        return chatGenerate({ ...opts, model: 'gemini-2.5-flash' });
      }
      throw new Error(`Gemini خطا (${res.status}): ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || 'پاسخی دریافت نشد.';
    const grounding = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text, grounding, model: selected };
  } catch (err: any) {
    if (selected !== 'gemini-2.5-flash') {
      return chatGenerate({ ...opts, model: 'gemini-2.5-flash' });
    }
    throw err;
  }
}

// Streaming chat completion — yields chunks via onChunk callback
export async function chatStream(opts: {
  messages: any[];
  systemPrompt?: string;
  webSearch?: boolean;
  model: string;
  temperature?: number;
  onChunk: (chunk: { text?: string; done?: boolean; fullText?: string; grounding?: any[]; model?: string; error?: string }) => void;
}): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) {
    opts.onChunk({ error: 'کلید Gemini تنظیم نشده است. از بخش تنظیمات > کلید API وارد کنید.' });
    return;
  }

  let selected = resolveModel(opts.model);
  const systemInstruction = buildSystemInstruction(opts.model, opts.systemPrompt);
  const contents = sanitizeContents(opts.messages);
  const config: any = {
    systemInstruction,
    temperature: opts.temperature !== undefined ? opts.temperature : (opts.model === 'grok-3' ? 0.8 : 0.7),
  };
  if (opts.webSearch) config.tools = [{ googleSearch: {} }];

  const url = `${GEMINI_BASE}/models/${selected}:streamGenerateContent?alt=sse&key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, config }),
    });
    if (!res.ok || !res.body) {
      // Fallback to non-streaming
      try {
        const r = await chatGenerate({ ...opts, model: selected });
        opts.onChunk({ text: r.text, done: true, fullText: r.text, grounding: r.grounding, model: r.model });
        return;
      } catch (fbErr: any) {
        opts.onChunk({ error: fbErr.message || 'خطا در ارتباط با هوش مصنوعی' });
        return;
      }
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let grounding: any[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.replace('data:', '').trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          const data = JSON.parse(jsonStr);
          const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
          if (data.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            grounding = data.candidates[0].groundingMetadata.groundingChunks;
          }
          if (text) {
            fullText += text;
            opts.onChunk({ text });
          }
        } catch {
          // ignore partial
        }
      }
    }
    opts.onChunk({ done: true, fullText, grounding, model: selected });
  } catch (err: any) {
    opts.onChunk({ error: err.message || 'خطا در ارتباط با هوش مصنوعی' });
  }
}

// Prompt enhancer (translate/expand idea into detailed prompt)
export async function enhancePrompt(prompt: string, type: 'image' | 'video', style?: string): Promise<any> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('کلید Gemini تنظیم نشده است.');
  const instruction =
    type === 'video'
      ? `You are an expert Hollywood AI video prompt director. Expand the user's idea into an ultra-detailed, cinematic prompt suitable for Veo/Sora video generators. Describe camera motion (e.g. tracking shot, 4k 60fps, bokeh, cinematic lighting, photorealistic textures). Return JSON with fields: "enhancedPrompt" (English master prompt), "title" (Persian short title), "sceneBreakdown" (Persian description of camera and lighting).`
      : `You are an expert AI digital artist and prompt engineer. Expand the user's idea into an ultra-detailed, 8K masterpiece image generation prompt. Include details about lighting (volumetric, ray tracing), camera lens (85mm f/1.4), texture, color palette, and ${style || 'photorealistic'} style. Return JSON with fields: "enhancedPrompt" (English prompt), "title" (Persian short title), "persianDescription" (Persian summary).`;

  const url = `${GEMINI_BASE}/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: `Idea: "${prompt}" (Style: ${style || 'Realistic'})`,
      config: { systemInstruction: instruction, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) throw new Error(`خطای بهبود پرامپت (${res.status})`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
  try {
    return JSON.parse(text);
  } catch {
    return { enhancedPrompt: text || prompt, title: prompt, persianDescription: '' };
  }
}

// Image generation (Gemini image model) -> base64 data URL or fallback flag
export async function generateImage(prompt: string, aspectRatio = '1:1', style = 'photorealistic', seedImage?: string): Promise<{ imageUrl: string; enhancedPrompt: string; model: string; fallbackRequired?: boolean }> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('کلید Gemini تنظیم نشده است.');

  // enhance first
  let finalPrompt = prompt;
  try {
    const enh = await enhancePrompt(prompt, 'image', style);
    if (enh?.enhancedPrompt) finalPrompt = `${enh.enhancedPrompt}, ${style} style, masterpiece, 8k resolution, photorealistic, intricate details, cinematic lighting, sharp focus`;
  } catch { /* ignore, use raw */ }

  const tryModels = ['gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation'];
  for (const model of tryModels) {
    try {
      const payload: any = {
        contents: {
          parts: seedImage
            ? [{ inlineData: { data: seedImage.replace(/^data:image\/\w+;base64,/, ''), mimeType: 'image/jpeg' } }, { text: `Modify and enhance based on: ${finalPrompt}` }]
            : [{ text: finalPrompt }],
        },
        config: { imageConfig: { aspectRatio: aspectRatio as any } },
      };
      const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          return { imageUrl: `data:image/png;base64,${part.inlineData.data}`, enhancedPrompt: finalPrompt, model };
        }
      }
    } catch { /* try next model */ }
  }
  // No usable image model (likely needs paid access) -> let UI synthesize procedural art
  return { imageUrl: '', enhancedPrompt: finalPrompt, model: 'fallback', fallbackRequired: true };
}

// Video generation: build storyboard via Gemini, attempt Veo if available
export async function generateVideo(prompt: string, aspectRatio = '16:9', resolution = '720p', startingImage?: string, style = 'Cinematic'): Promise<{ storyboard: any; prompt: string; aspectRatio: string; resolution: string; videoUrl?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('کلید Gemini تنظیم نشده است.');

  const url = `${GEMINI_BASE}/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: `Create a complete cinematic 4-scene video storyboard with camera angles, visual atmosphere, lighting, sound effects, and motion flow for: "${prompt}" (Style: ${style}). Return JSON with: "title", "synopsis", "scenes": [{"sceneNumber": 1, "visual": "...", "camera": "...", "duration": "2s", "audio": "..."}], "videoPrompt": "master english video prompt for Veo", "tags": ["..."]`,
      config: { responseMimeType: 'application/json' },
    }),
  });
  let storyboard: any = {};
  if (res.ok) {
    try {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '{}';
      storyboard = JSON.parse(text);
    } catch {
      storyboard = { title: prompt, synopsis: 'ویدیوی سینمایی تولید شده با هوش مصنوعی', scenes: [] };
    }
  } else {
    storyboard = { title: prompt, synopsis: 'ویدیوی سینمایی تولید شده با هوش مصنوعی', scenes: [] };
  }

  // Attempt Veo (preview). Most keys lack access; we still try and capture videoUrl if present.
  let videoUrl: string | undefined;
  try {
    const veoRes = await fetch(`${GEMINI_BASE}/models/veo-2.0-generate-001:predict?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: storyboard.videoPrompt || prompt }],
        parameters: { aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9', resolution: resolution === '1080p' ? '1080p' : '720p' },
      }),
    });
    if (veoRes.ok) {
      const vdata = await veoRes.json();
      videoUrl = vdata?.prediction?.video?.uri || vdata?.videos?.[0]?.uri;
    }
  } catch { /* veo unavailable */ }

  return { storyboard, prompt, aspectRatio, resolution, videoUrl };
}

// Text-to-Speech via Gemini Flash TTS -> returns audio base64 or fallback flag
export async function tts(text: string, voice = 'Kore'): Promise<{ audioBase64?: string; fallback?: boolean }> {
  const apiKey = getApiKey();
  if (!apiKey) return { fallback: true };
  try {
    const res = await fetch(`${GEMINI_BASE}/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }),
    });
    if (!res.ok) return { fallback: true };
    const data = await res.json();
    const audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audio) return { audioBase64: audio };
  } catch { /* ignore */ }
  return { fallback: true };
}
