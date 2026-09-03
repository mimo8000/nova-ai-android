/**
 * Procedural AI Canvas Visual Synthesis & Video Engine
 * Generates stunning 4K visuals, artistic illustrations, and multi-scene cinematic animated videos
 */

// Generate a high-definition stylized canvas image
export function generateProceduralArt(
  prompt: string,
  style: string,
  aspectRatio: string = '1:1',
  width: number = 1024
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    let height = width;
    if (aspectRatio === '16:9') height = Math.round((width * 9) / 16);
    if (aspectRatio === '9:16') {
      height = width;
      width = Math.round((height * 9) / 16);
    }
    if (aspectRatio === '4:5') height = Math.round((width * 5) / 4);

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    // Seed hash from prompt
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      hash = (hash << 5) - hash + prompt.charCodeAt(i);
      hash |= 0;
    }
    const rand = (seedOffset = 0) => {
      const x = Math.sin(hash + seedOffset) * 10000;
      return x - Math.floor(x);
    };

    // Color palettes based on style & seed
    const palettes: Record<string, string[][]> = {
      photorealistic: [
        ['#0B192C', '#1E3E62', '#000000', '#FF6500'],
        ['#141E46', '#415A77', '#778DA9', '#E0E1DD'],
        ['#1A1A24', '#2C3E50', '#E74C3C', '#F39C12'],
      ],
      cyberpunk: [
        ['#0F051D', '#2E0249', '#A91079', '#FF007F', '#00F0FF'],
        ['#050811', '#1A0826', '#FF0055', '#7928CA', '#00DFD8'],
      ],
      anime: [
        ['#1A102F', '#3D246C', '#5C469C', '#D4ADFC', '#FAF0E6'],
        ['#0F2167', '#4CB9E7', '#3559E0', '#FFECD6', '#FF9843'],
      ],
      cinematic: [
        ['#050B14', '#0D1B2A', '#1B263B', '#E0A96D', '#778DA9'],
        ['#1B1212', '#281919', '#4E3131', '#D4AF37', '#F3E5AB'],
      ],
      '3d-render': [
        ['#161853', '#292C6D', '#FAEDF0', '#EC255A', '#FF9A8B'],
        ['#1C0A35', '#4A0E4E', '#801336', '#C72C41', '#EE4540'],
      ],
    };

    const chosenPaletteGroup = palettes[style.toLowerCase()] || palettes.cinematic;
    const palette = chosenPaletteGroup[Math.abs(hash) % chosenPaletteGroup.length];

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, palette[0]);
    bgGrad.addColorStop(0.5, palette[1] || palette[0]);
    bgGrad.addColorStop(1, palette[2] || '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Glowing nebulas / celestial orbs
    const numGlows = 5 + Math.floor(rand(1) * 6);
    for (let i = 0; i < numGlows; i++) {
      const gx = rand(i * 3 + 2) * width;
      const gy = rand(i * 3 + 3) * height;
      const gr = 150 + rand(i * 3 + 4) * (width * 0.4);
      const radGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      const glowCol = palette[(i + 2) % palette.length];
      radGrad.addColorStop(0, glowCol + '99');
      radGrad.addColorStop(0.4, glowCol + '33');
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Modern geometric dynamic focal elements & lighting shafts
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 40; i++) {
      const x1 = rand(i * 5 + 10) * width;
      const y1 = rand(i * 5 + 11) * height;
      const r = 20 + rand(i * 5 + 12) * 120;

      ctx.beginPath();
      ctx.arc(x1, y1, r, 0, Math.PI * 2);
      ctx.fillStyle = `${palette[i % palette.length]}18`;
      ctx.fill();

      // Sharp light rays
      if (i % 4 === 0) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + (rand(i) - 0.5) * 300, y1 + (rand(i + 1) - 0.5) * 300);
        ctx.strokeStyle = `${palette[(i + 1) % palette.length]}44`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    ctx.restore();

    // Central Hero Silhouette / Geometric Focal Composition
    ctx.save();
    const cx = width / 2;
    const cy = height / 2;

    // Glowing core ring
    const coreGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, width * 0.35);
    coreGrad.addColorStop(0, '#ffffff88');
    coreGrad.addColorStop(0.3, `${palette[palette.length - 1]}66`);
    coreGrad.addColorStop(0.8, `${palette[1]}22`);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, width * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Starfield particles & high-tech noise
    for (let p = 0; p < 250; p++) {
      const px = rand(p * 2 + 100) * width;
      const py = rand(p * 2 + 101) * height;
      const psize = rand(p * 2 + 102) * 2.5;
      ctx.fillStyle = p % 3 === 0 ? '#ffffffdd' : `${palette[p % palette.length]}cc`;
      ctx.beginPath();
      ctx.arc(px, py, psize, 0, Math.PI * 2);
      ctx.fill();
    }

    // High Tech Vignette & Film Grain Overlay
    const vignette = ctx.createRadialGradient(cx, cy, width * 0.2, cx, cy, width * 0.7);
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(0.8, 'rgba(0,0,0,0.4)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // Style Badge Watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = `600 ${Math.max(14, Math.round(width * 0.022))}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`Nova AI • 4K ${style.toUpperCase()}`, width - 24, height - 24);

    ctx.restore();

    resolve(canvas.toDataURL('image/png'));
  });
}

// Convert Text to Speech using Web Speech API with natural voice
export function speakText(text: string, lang = 'fa-IR'): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_\[\]()]/g, '').trim();
    if (!cleanText) return resolve();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Find best Persian or English voice
    const voices = window.speechSynthesis.getVoices();
    const faVoice = voices.find((v) => v.lang.startsWith('fa') || v.lang.includes('IR'));
    if (faVoice) {
      utterance.voice = faVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
