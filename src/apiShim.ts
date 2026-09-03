/**
 * Local API shim.
 *
 * The original app talks to an Express server via fetch('/api/...').
 * In the standalone APK there is no server, so we intercept those requests
 * inside the browser/WebView and call the Gemini REST API directly using the
 * user-supplied key (stored in localStorage as 'nova_ai_gemini_key').
 *
 * The UI code is left untouched — it still does fetch('/api/chat') etc. and
 * gets back the exact same response shape (SSE stream or JSON).
 */

import {
  chatGenerate,
  chatStream,
  enhancePrompt,
  generateImage,
  generateVideo,
  tts,
} from './utils/gemini';

const enc = new TextEncoder();

function jsonResponse(obj: any, ok = true): Response {
  return new Response(JSON.stringify(obj), {
    status: ok ? 200 : 500,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
}

function emit(controller: ReadableStreamDefaultController, data: any) {
  controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
}

async function handleChat(body: any): Promise<Response> {
  const { messages, systemPrompt, webSearch, model = 'gemini-2.5-flash', temperature, stream = false } = body;
  if (stream) {
    const streamObj = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          await chatStream({
            messages,
            systemPrompt,
            webSearch,
            model,
            temperature,
            onChunk: (c) => {
              if (c.error) {
                emit(controller, { error: c.error });
              } else if (c.done) {
                emit(controller, { done: true, fullText: c.fullText, grounding: c.grounding, model: c.model });
              } else if (c.text) {
                emit(controller, { text: c.text, model });
              }
            },
          });
        } catch (err: any) {
          emit(controller, { error: err?.message || 'خطا در ارتباط با هوش مصنوعی' });
        } finally {
          controller.close();
        }
      },
    });
    return sseResponse(streamObj);
  }

  // Non-streaming
  try {
    const r = await chatGenerate({ messages, systemPrompt, webSearch, model, temperature });
    return jsonResponse({ success: true, text: r.text, grounding: r.grounding, model: r.model });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message || 'خطا در ارتباط با هوش مصنوعی' }, false);
  }
}

async function handleEnhance(body: any): Promise<Response> {
  try {
    const data = await enhancePrompt(body.prompt, body.type === 'video' ? 'video' : 'image', body.style);
    return jsonResponse({ success: true, data });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message || 'خطا در بهبود پرامپت' }, false);
  }
}

async function handleImage(body: any): Promise<Response> {
  try {
    const r = await generateImage(body.prompt, body.aspectRatio, body.style, body.seedImage);
    return jsonResponse({
      success: true,
      imageUrl: r.imageUrl,
      enhancedPrompt: r.enhancedPrompt,
      model: r.model,
      ...(r.fallbackRequired ? { fallbackRequired: true } : {}),
    });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message || 'خطا در ساخت عکس' }, false);
  }
}

async function handleVideo(body: any): Promise<Response> {
  try {
    const r = await generateVideo(body.prompt, body.aspectRatio, body.resolution, body.startingImage, body.style);
    return jsonResponse({
      success: true,
      operationName: '',
      storyboard: r.storyboard,
      prompt: r.prompt,
      aspectRatio: r.aspectRatio,
      resolution: r.resolution,
      ...(r.videoUrl ? { videoUrl: r.videoUrl } : {}),
    });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message || 'خطا در ساخت ویدیو' }, false);
  }
}

async function handleTts(body: any): Promise<Response> {
  try {
    const r = await tts(body.text, body.voice);
    if (r.fallback) return jsonResponse({ success: false, fallback: true });
    return jsonResponse({ success: true, audioBase64: r.audioBase64 });
  } catch {
    return jsonResponse({ success: false, fallback: true });
  }
}

function installShim() {
  const origFetch = window.fetch.bind(window);
  // @ts-ignore
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url = typeof input === 'string' ? input : (input as any).url || '';
    if (url.startsWith('/api/')) {
      let body: any = {};
      if (init?.body) {
        try {
          body = JSON.parse(typeof init.body === 'string' ? init.body : new TextDecoder().decode(init.body as any));
        } catch {
          body = {};
        }
      }
      if (url === '/api/health') {
        return jsonResponse({ status: 'ok', time: new Date().toISOString() });
      }
      if (url === '/api/chat') return handleChat(body);
      if (url === '/api/enhance-prompt') return handleEnhance(body);
      if (url === '/api/generate-image') return handleImage(body);
      if (url === '/api/generate-video') return handleVideo(body);
      if (url === '/api/tts') return handleTts(body);
      return jsonResponse({ success: false, error: 'unknown endpoint' }, false);
    }
    return origFetch(input as any, init);
  };
}

installShim();
