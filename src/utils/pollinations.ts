/**
 * Live AI image generation via Pollinations (no API key, free, real diffusion).
 * Returns a direct image URL — the component loads it with an <img> tag, which
 * works inside the Android WebView without CORS/fetch restrictions.
 */

const POLL_HOST = 'https://image.pollinations.ai/prompt';

function cleanPrompt(p: string): string {
  return p
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);
}

export function pollinationsImageUrl(
  prompt: string,
  aspectRatio = '1:1',
  style = 'photorealistic'
): string {
  const p = cleanPrompt(`${prompt}, ${style} style, highly detailed, 8k`);
  const [w, h] =
    aspectRatio === '9:16' ? [576, 1024] :
    aspectRatio === '16:9' ? [1024, 576] :
    aspectRatio === '4:5' ? [768, 960] :
    [1024, 1024];
  return `${POLL_HOST}/${encodeURIComponent(p)}?width=${w}&height=${h}&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1e9)}`;
}

/** Preload an image URL and resolve only when it actually decoded. */
export function preloadImage(url: string, timeoutMs = 90000): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const t = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    img.onload = () => { clearTimeout(t); resolve(url); };
    img.onerror = () => { clearTimeout(t); reject(new Error('image failed')); };
    img.src = url;
  });
}

/** Backwards-compatible helper (used by VideoGenView scene builder). */
export async function generatePollinationsImage(
  prompt: string,
  aspectRatio = '1:1',
  style = 'photorealistic'
): Promise<string> {
  const url = pollinationsImageUrl(prompt, aspectRatio, style);
  return preloadImage(url);
}
