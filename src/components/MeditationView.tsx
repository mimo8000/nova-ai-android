import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, Brain, Waves, Moon, Sun, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Real meditation frequency generator using the Web Audio API.
 * - Binaural beats: two slightly different tones per ear (needs headphones)
 *   -> the brain perceives the difference frequency (the "beat").
 * - Isochronic/solfeggio: single pure tone at the chosen frequency.
 * No fake claims: this generates actual audio tones.
 */

interface Preset {
  id: string;
  title: string;
  desc: string;
  base: number;   // carrier frequency (Hz)
  beat: number;   // binaural difference (Hz)
  brainwave: string;
  icon: string;
  color: string;
}

const PRESETS: Preset[] = [
  { id: 'delta', title: 'خواب عمیق (Delta)', desc: '۲ هرتز — خواب بی‌عمق و بازسازی بدن', base: 200, beat: 2, brainwave: 'Delta 0.5–4Hz', icon: '🌙', color: 'from-indigo-600 to-blue-700' },
  { id: 'theta', title: 'مدیتیشن عمیق (Theta)', desc: '۶ هرتز — آرامش عمیق و خلاقیت', base: 180, beat: 6, brainwave: 'Theta 4–8Hz', icon: '🧘', color: 'from-purple-600 to-indigo-600' },
  { id: 'alpha', title: 'آرامش هوشیار (Alpha)', desc: '۱۰ هرتز — ریلکس ولی بیدار، کاهش استرس', base: 220, beat: 10, brainwave: 'Alpha 8–13Hz', icon: '🍃', color: 'from-emerald-600 to-teal-600' },
  { id: 'focus', title: 'تمرکز (Beta)', desc: '۱۸ هرتز — تمرکز ذهنی و مطالعه', base: 250, beat: 18, brainwave: 'Beta 13–30Hz', icon: '🎯', color: 'from-blue-600 to-cyan-600' },
  { id: 'solfeggio-528', title: 'فرکانس ۵۲۸ هرتز', desc: '«معجزه» — تون خالص سلفژیو', base: 528, beat: 0, brainwave: 'Solfeggio', icon: '💚', color: 'from-green-600 to-emerald-700' },
  { id: 'solfeggio-432', title: 'فرکانس ۴۳۲ هرتز', desc: 'کوک طبیعی — تون خالص آرام', base: 432, beat: 0, brainwave: 'Verdi A', icon: '🌿', color: 'from-teal-600 to-green-600' },
  { id: 'solfeggio-396', title: 'فرکانس ۳۹۶ هرتز', desc: 'رهایی از ترس و گناه', base: 396, beat: 0, brainwave: 'Solfeggio', icon: '🔓', color: 'from-red-600 to-rose-700' },
  { id: 'solfeggio-741', title: 'فرکانس ۷۴۱ هرتز', desc: 'پاکسازی و بیان', base: 741, beat: 0, brainwave: 'Solfeggio', icon: '🗣️', color: 'from-amber-600 to-orange-600' },
];

export const MeditationView: React.FC = () => {
  const [active, setActive] = useState<Preset>(PRESETS[1]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [elapsed, setElapsed] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ oscL: OscillatorNode; oscR: OscillatorNode; panL: StereoPannerNode; panR: StereoPannerNode; gain: GainNode } | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopAudio = useCallback(() => {
    if (nodesRef.current) {
      const { oscL, oscR, gain } = nodesRef.current;
      try {
        gain.gain.setTargetAtTime(0, ctxRef.current!.currentTime, 0.05);
        setTimeout(() => {
          try { oscL.stop(); oscR.stop(); } catch { /* already stopped */ }
        }, 200);
      } catch { /* ignore */ }
      nodesRef.current = null;
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAudio = useCallback(
    (preset: Preset) => {
      stopAudio();
      if (!ctxRef.current) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        ctxRef.current = new AC();
      }
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(ctx.destination);

      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const panL = ctx.createStereoPanner();
      const panR = ctx.createStereoPanner();
      panL.pan.value = -1;
      panR.pan.value = 1;

      if (preset.beat > 0) {
        // Binaural: left = base - beat/2, right = base + beat/2
        oscL.frequency.value = preset.base - preset.beat / 2;
        oscR.frequency.value = preset.base + preset.beat / 2;
      } else {
        // Pure solfeggio tone in both ears
        oscL.frequency.value = preset.base;
        oscR.frequency.value = preset.base;
      }
      oscL.type = 'sine';
      oscR.type = 'sine';

      oscL.connect(panL).connect(gain);
      oscR.connect(panR).connect(gain);
      oscL.start();
      oscR.start();

      // fade in
      gain.gain.setTargetAtTime(volume * 0.35, ctx.currentTime, 0.4);
      nodesRef.current = { oscL, oscR, panL, panR, gain };

      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    },
    [stopAudio, volume],
  );

  // live volume change
  useEffect(() => {
    if (nodesRef.current && ctxRef.current) {
      nodesRef.current.gain.gain.setTargetAtTime(volume * 0.35, ctxRef.current.currentTime, 0.1);
    }
  }, [volume]);

  // switch preset while playing
  useEffect(() => {
    if (isPlaying) startAudio(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.id]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (ctxRef.current) ctxRef.current.close();
    };
  }, [stopAudio]);

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      startAudio(active);
      setIsPlaying(true);
    }
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div id="meditation-view" className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
            <Waves className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100">مرکز آرامش و فرکانس مدیتیشن</h2>
            <p className="text-[10px] text-emerald-400 font-medium">صدای واقعی • هدفون توصیه می‌شود 🎧</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
          {fmt(elapsed)}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Player card */}
        <div className={`rounded-3xl p-4 bg-gradient-to-br ${active.color} shadow-2xl space-y-3`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span className="text-xl">{active.icon}</span>
                <span>{active.title}</span>
              </h3>
              <p className="text-[11px] text-white/80 mt-0.5">{active.desc}</p>
            </div>
            <div className="text-left">
              <div className="text-[10px] text-white/70 font-mono">{active.brainwave}</div>
              <div className="text-lg font-black text-white font-mono" dir="ltr">
                {active.beat > 0 ? `${active.base}Hz ± ${active.beat}` : `${active.base}Hz`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              id="meditation-play-btn"
              className="w-12 h-12 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-white/80 shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-white"
                  dir="ltr"
                />
              </div>
              <p className="text-[10px] text-white/70 mt-1">
                {active.beat > 0
                  ? 'بینaural: هر گوش صدای متفاوت می‌شنود — حتماً با هدفون گوش دهید'
                  : 'تون خالص — بدون هدفون هم موثر است'}
              </p>
            </div>
          </div>
        </div>

        {/* Preset grid */}
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              id={`meditation-preset-${p.id}`}
              onClick={() => setActive(p)}
              className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col gap-0.5 ${
                active.id === p.id
                  ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500/50'
                  : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{p.icon}</span>
                {active.id === p.id && isPlaying && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-[9px] text-emerald-400 font-bold"
                  >
                    در حال پخش
                  </motion.span>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-100 mt-1">{p.title}</span>
              <span className="text-[9px] text-slate-400 line-clamp-2">{p.desc}</span>
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="bg-slate-900/70 rounded-2xl p-3.5 border border-slate-800 space-y-1.5">
          <h4 className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-emerald-400" />
            <span>راهنما</span>
          </h4>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            فرکانس‌های مغزی: دلتا (خواب)، تتا (مدیتیشن)، آلفا (آرامش)، بتا (تمرکز). امواج بینaural
            با ایجاد اختلاف فرکانس بین دو گوش کار می‌کنند و نیاز به هدفون دارند.
          </p>
          <p className="text-[10px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>۲۰ تا ۳۰ دقیقه استفاده مداوم توصیه می‌شود</span>
          </p>
        </div>
      </div>
    </div>
  );
};
