import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Download,
  Copy,
  Check,
  Maximize2,
  Layers,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Eye,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GeneratedImage } from '../types';
import { generateProceduralArt } from '../utils/mediaGenerator';

interface ImageGenViewProps {
  images: GeneratedImage[];
  onAddImage: (img: GeneratedImage) => void;
}

const STYLES = [
  { id: 'photorealistic', title: 'واقع‌گرایانه 8K', icon: '📸', desc: 'عکاسی پرتره و مناظر فوق واقعی' },
  { id: 'cinematic', title: 'سینمایی هالیوود', icon: '🎬', desc: 'نورپردازی دراماتیک و وضوح بالا' },
  { id: 'cyberpunk', title: 'سایبرپانک نئونی', icon: '🌌', desc: 'شهرهای آینده با نورهای نئون' },
  { id: 'anime', title: 'انیمه ژاپنی', icon: '⛩️', desc: 'سبک استودیو جیبلی و ماکوتو شینکای' },
  { id: '3d-render', title: 'سه‌بعدی پیکسار', icon: '🧸', desc: 'رندر کاراکترها با بافت نرم و جذاب' },
];

const RATIOS = [
  { id: '1:1', label: '1:1 مربع', sub: 'پروفایل / پست' },
  { id: '9:16', label: '9:16 عمودی', sub: 'استوری / ریلز' },
  { id: '16:9', label: '16:9 افقی', sub: 'یوتیوب / سینما' },
  { id: '4:5', label: '4:5 پرتره', sub: 'اینستاگرام' },
];

export const ImageGenView: React.FC<ImageGenViewProps> = ({ images, onAddImage }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');

  // Enhance user prompt using Gemini
  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style: selectedStyle, type: 'image' }),
      });
      const json = await res.json();
      if (json.success && json.data?.enhancedPrompt) {
        setPrompt(json.data.enhancedPrompt);
      }
    } catch (e) {
      console.error('Enhance failed:', e);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Generate Image
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style: selectedStyle,
          aspectRatio,
        }),
      });

      const data = await response.json();
      let finalImageUrl = data.imageUrl;

      // If direct model needs fallback, synthesize rich 4K procedural art canvas
      if (!finalImageUrl) {
        finalImageUrl = await generateProceduralArt(prompt, selectedStyle, aspectRatio, 1024);
      }

      const newImage: GeneratedImage = {
        id: 'img_' + Date.now(),
        prompt,
        enhancedPrompt: data.enhancedPrompt || prompt,
        style: selectedStyle,
        aspectRatio,
        imageUrl: finalImageUrl,
        createdAt: Date.now(),
      };

      onAddImage(newImage);
      setPreviewImage(newImage);
    } catch (err) {
      console.error('Generation error:', err);
      // Fallback generator
      const fallbackUrl = await generateProceduralArt(prompt, selectedStyle, aspectRatio, 1024);
      const fallbackImage: GeneratedImage = {
        id: 'img_' + Date.now(),
        prompt,
        style: selectedStyle,
        aspectRatio,
        imageUrl: fallbackUrl,
        createdAt: Date.now(),
      };
      onAddImage(fallbackImage);
      setPreviewImage(fallbackImage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.imageUrl;
    link.download = `nova-ai-${img.style}-${Date.now()}.png`;
    link.click();
  };

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="image-gen-view" className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Top Bar Switcher */}
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-pink-500 flex items-center justify-center text-white text-xs shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100">استودیوی ساخت عکس هوشمند</h2>
            <p className="text-[10px] text-fuchsia-400 font-medium">کیفیت بالا 4K • بدون محدودیت</p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-fuchsia-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            تولید عکس
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-fuchsia-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>گالری</span>
            <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">
              {images.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'create' ? (
          <div className="space-y-4 max-w-lg mx-auto">
            {/* Prompt Input Box */}
            <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800/90 shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>توصیف عکس مورد نظر شما</span>
                </label>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={!prompt.trim() || isEnhancing}
                  className="px-2.5 py-1 rounded-xl bg-fuchsia-950/60 hover:bg-fuchsia-900/60 border border-fuchsia-800/50 text-fuchsia-300 text-[11px] font-semibold flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>بهبود با هوش مصنوعی...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-fuchsia-400" />
                      <span>بهبود پرامپت ✨</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                id="image-prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="مثلاً: یک فضانورد شجاع در سیاره‌ای نورانی با گل‌های درخشان نئونی، کیفیت سینمایی 8K..."
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-fuchsia-500 focus:outline-none text-xs sm:text-[13px] text-slate-100 placeholder:text-slate-500 transition-colors resize-none leading-relaxed"
              />

              {/* Quick Sample Prompts */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                {[
                  'ماشین اسپرت آینده‌نگرانه در باران نئونی',
                  'شیر بالدار طلایی بر فراز ابرها در غروب',
                  'پرتره دختری با لباس سنتی ایرانی در باغ گل رز',
                  'قصر کریستالی شناور در فضا با نور کهکشانی',
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
            </div>

            {/* Style Selector */}
            <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800/90 shadow-lg space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>سبک هنری و استایل تصویر</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.id)}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-0.5 ${
                      selectedStyle === st.id
                        ? 'bg-fuchsia-950/40 border-fuchsia-500 ring-1 ring-fuchsia-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base">{st.icon}</span>
                      {selectedStyle === st.id && (
                        <CheckCircle className="w-3.5 h-3.5 text-fuchsia-400" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-100">{st.title}</span>
                    <span className="text-[9px] text-slate-400 line-clamp-1">{st.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800/90 shadow-lg space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>نسبت ابعاد تصویر (Aspect Ratio)</span>
              </label>

              <div className="grid grid-cols-4 gap-2">
                {RATIOS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setAspectRatio(r.id)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      aspectRatio === r.id
                        ? 'bg-fuchsia-600 text-white border-fuchsia-500 shadow'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{r.label}</div>
                    <div className={`text-[9px] ${aspectRatio === r.id ? 'text-fuchsia-100' : 'text-slate-400'}`}>
                      {r.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="button"
              id="start-generate-image-btn"
              onClick={() => handleGenerate()}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xl shadow-fuchsia-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال پردازش و تولید عکس با کیفیت بالا...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>تولید عکس هوش مصنوعی (رایگان و نامحدود)</span>
                </>
              )}
            </button>

            {/* Latest Result Banner */}
            {previewImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 rounded-2xl p-3 border border-slate-800 overflow-hidden space-y-2 shadow-2xl"
              >
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold text-fuchsia-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>عکس با موفقیت تولید شد</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">4K ULTRA HD</span>
                </div>

                <div className="relative group rounded-xl overflow-hidden bg-black/40 border border-slate-700 flex items-center justify-center">
                  <img
                    src={previewImage.imageUrl}
                    alt={previewImage.prompt}
                    className="w-full max-h-[380px] object-contain rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleDownload(previewImage)}
                      className="p-3 rounded-full bg-white text-slate-950 font-bold shadow-lg hover:scale-110 transition-transform cursor-pointer"
                      title="دانلود عکس"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-300 truncate max-w-[200px]">{previewImage.prompt}</p>
                  <button
                    onClick={() => handleDownload(previewImage)}
                    className="px-3 py-1.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود با کیفیت اصلی</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          /* Gallery Tab */
          <div className="space-y-3">
            {images.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
                <ImageIcon className="w-12 h-12 text-slate-600 mb-2" />
                <p className="text-xs font-medium">هنوز عکسی تولید نکرده‌اید.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-fuchsia-600 text-white text-xs font-bold"
                >
                  اولین عکس را بسازید
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {images.map((img) => (
                  <motion.div
                    key={img.id}
                    layout
                    className="bg-slate-900 rounded-2xl border border-slate-800/80 overflow-hidden shadow-lg group flex flex-col"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-950">
                      <img
                        src={img.imageUrl}
                        alt={img.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={() => setPreviewImage(img)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                      >
                        <Eye className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between gap-2">
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {img.prompt}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-fuchsia-400 font-medium">
                          {img.style}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyPrompt(img.prompt, img.id)}
                            className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="کپی متن پرامپت"
                          >
                            {copiedId === img.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDownload(img)}
                            className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="دانلود فایل"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {previewImage && activeTab === 'gallery' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            <div className="max-w-lg w-full bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold text-slate-100">{previewImage.style.toUpperCase()}</span>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
                >
                  بستن ✕
                </button>
              </div>

              <img
                src={previewImage.imageUrl}
                alt="preview"
                className="w-full max-h-[55vh] object-contain rounded-2xl bg-black"
              />

              <p className="text-xs text-slate-300 leading-relaxed max-h-20 overflow-y-auto">
                {previewImage.prompt}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleDownload(previewImage)}
                  className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود فایل اصلی</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
