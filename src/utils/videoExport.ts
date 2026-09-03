/**
 * Real video export: renders scene images into an animated WebM using
 * canvas + MediaRecorder (Ken Burns pan/zoom + crossfade + scene captions).
 * Produces an actual playable video file, not a slideshow widget.
 */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('خطا در بارگذاری فریم'));
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, scale: number, dx: number, dy: number) {
  const ir = img.width / img.height;
  const cr = w / h;
  let dw = w, dh = h;
  if (ir > cr) dh = h, dw = h * ir;
  else dw = w, dh = w / ir;
  dw *= scale; dh *= scale;
  ctx.drawImage(img, (w - dw) / 2 + dx, (h - dh) / 2 + dy, dw, dh);
}

export interface ExportProgress {
  (pct: number): void;
}

export async function exportScenesToWebm(
  sceneImages: string[],
  captions: string[],
  opts: { width?: number; height?: number; secondsPerScene?: number; onProgress?: ExportProgress },
): Promise<Blob> {
  const W = opts.width || 1280;
  const H = opts.height || 720;
  const perScene = opts.secondsPerScene || 3.5;
  const images = await Promise.all(sceneImages.filter(Boolean).map(loadImage));
  if (images.length === 0) throw new Error('فریمی برای رندر وجود ندارد');

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const stream = canvas.captureStream(30);
  const mime =
    MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' :
    MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' :
    'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
  const stopped = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
  });

  recorder.start();
  const total = images.length * perScene;
  const start = performance.now();

  await new Promise<void>((resolve) => {
    const frame = (now: number) => {
      const t = (now - start) / 1000;
      if (t >= total) { resolve(); return; }

      const idx = Math.min(images.length - 1, Math.floor(t / perScene));
      const local = (t % perScene) / perScene; // 0..1 within scene
      const img = images[idx];

      // Ken Burns: slow zoom 1.0 -> 1.12 + gentle pan
      const scale = 1 + 0.12 * local;
      const pan = Math.sin(local * Math.PI) * (W * 0.02);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      drawCover(ctx, img, W, H, scale, pan, -pan * 0.4);

      // Crossfade with next scene in the last 15%
      if (local > 0.85 && idx + 1 < images.length) {
        ctx.globalAlpha = (local - 0.85) / 0.15;
        drawCover(ctx, images[idx + 1], W, H, 1.0, 0, 0);
        ctx.globalAlpha = 1;
      }

      // Cinematic letterbox
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, 0, W, H * 0.06);
      ctx.fillRect(0, H * 0.94, W, H * 0.06);

      // Caption bar
      const cap = captions[idx] || '';
      if (cap) {
        ctx.fillStyle = 'rgba(2,6,23,0.72)';
        const bh = 54;
        ctx.fillRect(0, H - H * 0.06 - bh, W, bh);
        ctx.fillStyle = '#F8FAFC';
        ctx.font = `600 ${Math.round(W * 0.022)}px sans-serif`;
        ctx.textAlign = 'center';
        const short = cap.length > 70 ? cap.slice(0, 67) + '...' : cap;
        ctx.fillText(short, W / 2, H - H * 0.06 - bh / 2 + 8);
      }

      // Scene counter
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `bold ${Math.round(W * 0.018)}px monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(`SCENE ${idx + 1}/${images.length} • Nova AI`, W - 24, H * 0.06 + 30);

      opts.onProgress?.(Math.round((t / total) * 100));
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });

  recorder.stop();
  opts.onProgress?.(100);
  return stopped;
}
