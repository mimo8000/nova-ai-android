import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Download,
  Clapperboard,
  Camera,
  Layers,
  Wand2,
  Video as VideoIcon,
  Clock,
  Volume2,
  Loader2,
  Share2,
  CheckCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { GeneratedVideo, VideoScene } from '../types';

interface VideoGenViewProps {
  videos: GeneratedVideo[];
  onAddVideo: (vid: GeneratedVideo) => void;
}

const CAMERA_STYLES = [
  { id: 'fpv-drone', title: 'هلی‌شات هوایی FPV', icon: '🛸', desc: 'حرکت روان از فراز آسمان به سمت سوژه' },
  { id: 'cinematic-zoom', title: 'زوم سینمایی دراماتیک', icon: '🎥', desc: 'بزرگ‌نمایی عمیق روی جزئیات کلیدی' },
  { id: 'orbit-360', title: 'چرخش مداری ۳۶۰ درجه', icon: '🔄', desc: 'چرخش دوربین پیرامون سوژه مرکزی' },
  { id: 'slow-motion', title: 'اسلوموشن ۱۲۰ فریم', icon: '⏱️', desc: 'حرکت آهسته و پر از احساس' },
];

export const VideoGenView: React.FC<VideoGenViewProps> = ({ videos, onAddVideo }) => {
  const [prompt, setPrompt] = useState('');
  const [cameraStyle, setCameraStyle] = useState('cinematic-zoom');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('1080p');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<GeneratedVideo | null>(videos[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  // Animate the interactive canvas video player
  useEffect(() => {
    if (!currentVideo || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      timeRef.current = elapsed;

      const w = canvas.width;
      const h = canvas.height;
      const scenes = currentVideo.scenes;
      const totalScenes = scenes.length || 1;
      const sceneDuration = 3.5;
      const activeIdx = Math.floor((elapsed % (totalScenes * sceneDuration)) / sceneDuration);
      setCurrentSceneIndex(activeIdx);

      const scene = scenes[activeIdx] || {
        visual: currentVideo.prompt,
        camera: 'Cinematic Flow',
      };

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      const shift = Math.sin(elapsed * 0.5);
      grad.addColorStop(0, '#060B19');
      grad.addColorStop(0.5, '#1E1B4B');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Camera motion simulation (Zoom / Pan)
      ctx.save();
      const zoom = 1 + (Math.sin(elapsed * 1.2) * 0.08);
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-w / 2, -h / 2);

      // Dynamic Particle Stars & Energy Rays
      for (let i = 0; i < 60; i++) {
        const px = ((i * 73 + elapsed * 45) % w);
        const py = ((i * 137 + Math.sin(elapsed + i) * 30) % h);
        const size = (i % 3) + 1.5;
        ctx.fillStyle = i % 2 === 0 ? '#60A5FA88' : '#EC489988';
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Glowing Center Nexus
      const cx = w / 2;
      const cy = h / 2;
      const radGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, w * 0.4);
      radGlow.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
      radGlow.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)');
      radGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = radGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric Motion Ring
      ctx.beginPath();
      ctx.arc(cx, cy, 140 + Math.sin(elapsed * 2) * 20, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      // Film Grain / Vignette
      const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.65);
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      // HUD Overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`REC • ${currentVideo.resolution} 60FPS`, w - 20, 30);

      // Camera badge
      ctx.fillStyle = '#60A5FA';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`CAMERA: ${scene.camera || 'SMOOTH TRACKING'}`, 20, 30);

      // Subtitle Bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(20, h - 60, w - 40, 44);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
      ctx.strokeRect(20, h - 60, w - 40, 44);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      const sceneTxt = `بخش ${activeIdx + 1}: ${scene.visual || currentVideo.prompt}`;
      ctx.fillText(sceneTxt.length > 55 ? sceneTxt.slice(0, 52) + '...' : sceneTxt, w / 2, h - 32);

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(render);
    } else {
      render(performance.now());
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [currentVideo, isPlaying]);

  // Video Generation Handler
  const handleGenerateVideo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          resolution,
          style: cameraStyle,
        }),
      });

      const data = await response.json();
      const sb = data.storyboard || {};

      const scenes: VideoScene[] = Array.isArray(sb.scenes) && sb.scenes.length > 0
        ? sb.scenes
        : [
            { sceneNumber: 1, visual: `نمای آغازین: ${prompt}`, camera: 'Cinematic Drone', duration: '3s' },
            { sceneNumber: 2, visual: `ورود به جزئیات دراماتیک`, camera: 'Dynamic Zoom', duration: '3s' },
            { sceneNumber: 3, visual: `اوج حرکت و نورپردازی`, camera: 'High Speed Pan', duration: '3s' },
            { sceneNumber: 4, visual: `پایان‌بندی حماسی و ماندگار`, camera: 'Slow Motion Fade', duration: '3s' },
          ];

      const newVideo: GeneratedVideo = {
        id: 'vid_' + Date.now(),
        prompt,
        title: sb.title || prompt.slice(0, 30),
        synopsis: sb.synopsis || 'ویدیوی سینمایی هوش مصنوعی با جلوه‌های ویژه',
        scenes,
        aspectRatio,
        resolution,
        videoPrompt: sb.videoPrompt || prompt,
        createdAt: Date.now(),
      };

      onAddVideo(newVideo);
      setCurrentVideo(newVideo);
      setIsPlaying(true);
    } catch (err) {
      console.error('Video generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const imageURI = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageURI;
    link.download = `nova-video-frame-${Date.now()}.png`;
    link.click();
  };

  return (
    <div id="video-gen-view" className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Top Header */}
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-xs shadow-md">
            <Clapperboard className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100">استودیوی ساخت ویدیوی هوش مصنوعی</h2>
            <p className="text-[10px] text-violet-400 font-medium">کیفیت ۱۰۸۰p و ۴K • Veo Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            آماده رندر ⚡
          </span>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Active Video Player Screen */}
        <div className="bg-slate-900 rounded-3xl p-3 border border-slate-800 shadow-2xl space-y-2.5">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={720}
              height={405}
              className="w-full h-full object-contain"
            />

            {/* Floating Play/Pause Controls */}
            <div className="absolute inset-0 bg-black/20 hover:bg-black/40 transition-colors flex items-center justify-center gap-3 group">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-slate-950 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'توقف' : 'پخش'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
            </div>

            {/* Bottom Floating Bar */}
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-200 pointer-events-none">
              <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm">
                {isPlaying ? 'در حال پخش زنده' : 'متوقف'}
              </span>
              <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm font-mono">
                {currentVideo?.resolution || '1080p 60fps'}
              </span>
            </div>
          </div>

          {/* Video Metadata & Actions */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <h3 className="text-xs font-bold text-slate-100 line-clamp-1">
                {currentVideo?.title || 'ویدیوی آماده ساخت'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {currentVideo?.scenes.length || 4} سکانس سینمایی • زاویه {cameraStyle}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleDownloadVideo}
                className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1 shadow transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ذخیره ویدیو</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scene Storyboard Cards */}
        {currentVideo && currentVideo.scenes && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-violet-400" />
              <span>فیلمنامه و سکانس‌های تولید شده</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {currentVideo.scenes.map((sc, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl border transition-all text-right ${
                    currentSceneIndex === i
                      ? 'bg-violet-950/50 border-violet-500 ring-1 ring-violet-500/40'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-violet-400">سکانس {sc.sceneNumber || i + 1}</span>
                    <span className="text-[9px] text-slate-500">{sc.duration || '3s'}</span>
                  </div>
                  <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed mb-1">
                    {sc.visual}
                  </p>
                  <span className="text-[9px] text-slate-400 block truncate">🎥 {sc.camera}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Video Form */}
        <div className="bg-slate-900/90 rounded-3xl p-3.5 border border-slate-800/90 shadow-lg space-y-3">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-violet-400" />
            <span>متن و توصیف ویدیوی جدید</span>
          </label>

          <textarea
            id="video-prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="مثلاً: پرواز یک شاهین تیزپرواز بر فراز رشته‌کوه‌های دماوند در سپیده‌دم با نور ملایم طلایی و جلوه اسلوموشن..."
            rows={3}
            className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none text-xs sm:text-[13px] text-slate-100 placeholder:text-slate-500 transition-colors resize-none leading-relaxed"
          />

          {/* Quick Idea Samples */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              'حرکت قطار آینده‌نگر در شهر نورانی ژاپن',
              'غواصی در اعماق اقیانوس کنار نهنگ‌های درخشان',
              'ویدیو تبلیغاتی جذاب ساعت مچی لوکس روی سنگ مرمر',
              'انفجار رنگ‌ها و نور در فضای بی‌کران',
            ].map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(sample)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-[10px] text-slate-300 whitespace-nowrap transition-colors border border-slate-700/50 cursor-pointer"
              >
                + {sample}
              </button>
            ))}
          </div>

          {/* Camera Motion Selection */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-violet-400" />
              <span>نوع حرکت دوربین (Camera Movement)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CAMERA_STYLES.map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => setCameraStyle(cam.id)}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    cameraStyle === cam.id
                      ? 'bg-violet-950/40 border-violet-500 ring-1 ring-violet-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-base">{cam.icon}</span>
                    {cameraStyle === cam.id && <CheckCircle className="w-3 h-3 text-violet-400" />}
                  </div>
                  <div className="text-[11px] font-bold text-slate-100">{cam.title}</div>
                  <div className="text-[9px] text-slate-400 truncate">{cam.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Video Action Button */}
          <button
            type="button"
            id="start-generate-video-btn"
            onClick={() => handleGenerateVideo()}
            disabled={!prompt.trim() || isGenerating}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xl shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال ساخت سناریو و رندر سکانس‌های ویدیویی...</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4" />
                <span>تولید ویدیوی هوش مصنوعی (رایگان و بدون محدودیت)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
