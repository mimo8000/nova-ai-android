/**
 * Save a data URL / blob URL to the device.
 * In the Capacitor WebView, anchor downloads are intercepted by Android's
 * download manager, so files land in the Downloads/Gallery folder.
 */

async function toBlob(url: string): Promise<Blob> {
  if (url.startsWith('data:')) {
    const [head, b64] = url.split(',');
    const mime = head.match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  const res = await fetch(url);
  return await res.blob();
}

export async function saveToDevice(
  url: string,
  filename: string,
  opts: { mime?: string } = {},
): Promise<{ ok: boolean; message: string }> {
  try {
    const blob = await toBlob(url);

    // Try the modern File System Access API first (Chrome/Android WebView 111+)
    const anyWin = window as any;
    if (anyWin.showSaveFilePicker) {
      try {
        const handle = await anyWin.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'Nova AI', accept: { [opts.mime || blob.type]: [filename.split('.').pop() || ''] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return { ok: true, message: 'ذخیره شد ✓' };
      } catch (e: any) {
        if (e?.name === 'AbortError') return { ok: false, message: 'لغو شد' };
        // fall through to anchor download
      }
    }

    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    return { ok: true, message: 'در پوشه دانلودها ذخیره شد ✓' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'خطا در ذخیره فایل' };
  }
}

/** Clipboard with fallback for WebViews where navigator.clipboard is unavailable. */
export function copyText(text: string): boolean {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
      return true;
    }
    return legacyCopy(text);
  } catch {
    return false;
  }
}

function legacyCopy(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}
