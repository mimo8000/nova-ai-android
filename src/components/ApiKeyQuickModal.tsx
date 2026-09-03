import React, { useState, useEffect } from 'react';
import { X, KeyRound, Check, AlertCircle, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function sanitizeKey(k: string): string {
  return k
    .replace(/[\u200B-\u200D\uFEFF\u061C\u2066-\u2069]/g, '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/\s+/g, '')
    .trim();
}

/**
 * Quick API-key switcher. Opens from the floating button so the user can
 * paste a fresh key the moment the old one runs out — no need to navigate
 * to Settings. Keys persist in localStorage (permanent on the device).
 */

interface Props {
  open: boolean;
  onClose: () => void;
}

const GEMINI_KEY = '***';
const OR_KEY = '***';

export const ApiKeyQuickModal: React.FC<Props> = ({ open, onClose }) => {
  const [gemini, setGemini] = useState('');
  const [or, setOr] = useState('');
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setGemini(localStorage.getItem(GEMINI_KEY) || '');
      setOr(localStorage.getItem(OR_KEY) || '');
      setSaved(false);
    }
  }, [open]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (gemini.trim()) localStorage.setItem(GEMINI_KEY, sanitizeKey(gemini));
    else localStorage.removeItem(GEMINI_KEY);
    if (or.trim()) localStorage.setItem(OR_KEY, sanitizeKey(or));
    else localStorage.removeItem(OR_KEY);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const hasGemini = !!localStorage.getItem(GEMINI_KEY);
  const hasOr = !!localStorage.getItem(OR_KEY);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">تغییر کلید API</h3>
                  <p className="text-[10px] text-slate-400">هر وقت کلید تمام شد، کلید جدید بچسبان</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* OpenRouter key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-200">کلید OpenRouter (کیو‌ون، دیپ‌سیک، GLM، های‌یوان، میمو)</label>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${hasOr ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {hasOr ? 'فعال ✓' : 'پیش‌فرض'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    value={or}
                    onChange={(e) => setOr(e.target.value)}
                    placeholder="sk-or-v1-..."
                    dir="ltr"
                    className="w-full px-3 py-2.5 pl-10 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs text-slate-100 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute left-2 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-blue-400 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>دریافت کلید از openrouter.ai/keys</span>
                </a>
              </div>

              {/* Gemini key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-200">کلید Gemini (مدل‌های گوگل + سناریوی ویدیو)</label>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${hasGemini ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {hasGemini ? 'فعال ✓' : 'تنظیم نشده'}
                  </span>
                </div>
                <input
                  type={show ? 'text' : 'password'}
                  value={gemini}
                  onChange={(e) => setGemini(e.target.value)}
                  placeholder="AIza..."
                  dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs text-slate-100 font-mono"
                />
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-blue-400 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>دریافت کلید از aistudio.google.com</span>
                </a>
              </div>

              <div className="flex items-start gap-1.5 text-[10px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span>کلید فقط روی همین گوشی ذخیره می‌شود و به هیچ سروری ارسال نمی‌شود. با عوض کردن کلید، اپ دوباره کار می‌کند.</span>
              </div>

              {saved && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5" />
                  <span>کلیدها ذخیره شدند ✓</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                ذخیره کلیدها
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
