/**
 * Live AI image generation via Pollinations (no API key, free, real diffusion).
 * Used by ImageGenView as the actual image source. Falls back to procedural
 * art only if the network request fails.
 */

const POLL_HOST = 'https://image.pollinations.ai/prompt';

function cleanPrompt(p: string): string {
  return p
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);
}

export async function generatePollinationsImage(
  prompt: string,
  aspectRatio = '1:1',
  style = 'photorealistic'
): Promise<string> {
  const p = cleanPrompt(`${prompt}, ${style} style, highly detailed, 8k`);
  const [w, h] =
    aspectRatio === '9:16' ? [576, 1024] :
    aspectRatio === '16:9' ? [1024, 576] :
    aspectRatio === '4:5' ? [768, 960] :
    [1024, 1024];
  const url = `${POLL_HOST}/${encodeURIComponent(p)}?width=${w}&height=${h}&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1e9)}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error(`تصویرساز (${res.status})`);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('خطا در تبدیل تصویر'));
    reader.readAsDataURL(blob);
  });
}
