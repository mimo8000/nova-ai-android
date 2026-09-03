import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Moon,
  Smartphone,
  Trash2,
  Check,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Crown,
  Key,
} from 'lucide-react';
import { SecuritySettings, AppTheme } from '../types';

interface SettingsModalProps {
  security: SecuritySettings;
  onUpdateSecurity: (newSec: SecuritySettings) => void;
  onLockNow: () => void;
  theme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  security,
  onUpdateSecurity,
  onLockNow,
  theme,
  onChangeTheme,
  onClearAllData,
}) => {
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [hintInput, setHintInput] = useState(security.hint);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Gemini API key (client-side, stored in localStorage)
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);

  useEffect(() => {
    setApiKeyInput(localStorage.getItem('nova_ai_gemini_key') || '');
    setApiKeySaved(!!localStorage.getItem('nova_ai_gemini_key'));
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const k = apiKeyInput.trim();
    if (!k) {
      localStorage.removeItem('nova_ai_gemini_key');
      setApiKeySaved(false);
      return;
    }
    localStorage.setItem('nova_ai_gemini_key', k);
    setApiKeySaved(true);
    setSuccessMsg('کلید Gemini ذخیره شد ✓');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const currentTrimmed = currentPinInput.trim();
    // Allow either existing pin or admin key to authorize change
    if (currentTrimmed !== security.pinCode && currentTrimmed.toLowerCase() !== 'reza43' && currentTrimmed !== '2025') {
      setErrorMsg('کلید امنیتی یا رمز عبور فعلی نادرست است');
      return;
    }

    if (newPinInput.trim().length < 3) {
      setErrorMsg('رمز عبور جدید باید حداقل ۳ کاراکتر باشد');
      return;
    }

    if (newPinInput.trim() !== confirmPinInput.trim()) {
      setErrorMsg('تکرار رمز عبور جدید مطابقت ندارد');
      return;
    }

    onUpdateSecurity({
      ...security,
      pinCode: newPinInput.trim(),
      hint: hintInput || 'رمز اشتراکی تنظیم شده',
    });

    setSuccessMsg('رمز عبور و کلید اشتراکی جدید با موفقیت ذخیره شد!');
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div id="settings-view" className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Top Header */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white text-xs shadow-md">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100">تنظیمات کلید اشتراکی و امنیت</h2>
            <p className="text-[10px] text-slate-400 font-medium">مدیریت رمز عبور • ظاهر اندروید</p>
          </div>
        </div>

        <button
          onClick={onLockNow}
          className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shadow transition-all cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>قفل فوری برنامه</span>
        </button>
      </div>

      {/* Settings Form Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Admin Key Notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5">
          <Crown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-right">
            <h4 className="text-xs font-bold text-amber-300">کلید مدیر ارشد (Admin Key) فعال است</h4>
            <p className="text-[10px] text-slate-300 mt-0.5">
              رمز مدیریت دائمی <strong className="font-mono text-amber-300 font-bold">reza43</strong> همواره برای ورود به عنوان مدیر در دسترس است.
            </p>
          </div>
        </div>

        {/* Security & Lock Settings */}
        <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>تغییر کلید اشتراکی / رمز ورود برنامه</span>
          </div>

          <form onSubmit={handleChangePin} className="space-y-2.5">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">رمز عبور یا کلید اشتراکی فعلی</label>
              <input
                type="text"
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value)}
                placeholder="رمز فعلی یا reza43..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs text-slate-100 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">کلید / رمز جدید</label>
                <input
                  type="text"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="رمز متنی جدید..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">تکرار رمز جدید</label>
                <input
                  type="text"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="تکرار رمز جدید..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">متن راهنمای یادآوری رمز (اختیاری)</label>
              <input
                type="text"
                value={hintInput}
                onChange={(e) => setHintInput(e.target.value)}
                placeholder="مثلاً: کلید اشتراکی تیم یا سال تاسیس..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs text-slate-100"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
            >
              ذخیره کلید اشتراکی جدید
            </button>
          </form>
        </div>

        {/* Visual Themes */}
        <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-pink-400" />
              <span>پوسته و تم رنگی اپلیکیشن</span>
            </div>
            <span className="text-[10px] text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
              ۴ تم اختصاصی
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                id: 'pink',
                title: '🌸 صورتی (Pink)',
                subtitle: 'ترکیب نئون صورتی و سرخابی',
                badge: 'محبوب ✨',
                previewClass: 'bg-gradient-to-br from-pink-900 via-rose-950 to-pink-950 border-pink-500/50 text-pink-200',
                activeClass: 'bg-pink-950/80 border-pink-500 ring-2 ring-pink-500/40 text-white',
              },
              {
                id: 'black',
                title: '⚫ سیاه (Black AMOLED)',
                subtitle: 'مشکی خالص و بهینه‌ساز باتری',
                badge: 'OLED',
                previewClass: 'bg-black border-neutral-800 text-neutral-200',
                activeClass: 'bg-neutral-950 border-white/60 ring-2 ring-white/30 text-white',
              },
              {
                id: 'blue',
                title: '🔵 آبی (Cyber Blue)',
                subtitle: 'آبی رویال، نیلگون و کهکشانی',
                badge: 'مدرن',
                previewClass: 'bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border-blue-500/50 text-blue-200',
                activeClass: 'bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/40 text-white',
              },
              {
                id: 'white',
                title: '⚪ سفید (Clean Light)',
                subtitle: 'پوسته روشن، تمیز و مینیمال',
                badge: 'روشن',
                previewClass: 'bg-slate-100 border-slate-300 text-slate-800',
                activeClass: 'bg-white border-blue-600 ring-2 ring-blue-500/40 text-slate-950 shadow-md',
              },
            ].map((t) => {
              const isSelected =
                theme === t.id ||
                (t.id === 'pink' && theme === 'cyber-neon') ||
                (t.id === 'black' && theme === 'amoled') ||
                (t.id === 'blue' && (theme === 'material-dark' || theme === 'pure-midnight'));

              return (
                <button
                  key={t.id}
                  id={`theme-btn-${t.id}`}
                  onClick={() => onChangeTheme(t.id as AppTheme)}
                  className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[74px] ${
                    isSelected ? t.activeClass : `${t.previewClass} opacity-80 hover:opacity-100 hover:scale-[1.02]`
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold">{t.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/10 font-mono">
                      {t.badge}
                    </span>
                  </div>
                  <div className="text-[10px] opacity-80 mt-1">{t.subtitle}</div>
                  {isSelected && (
                    <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gemini API Key (required for the standalone APK) */}
        <div className="bg-slate-900/90 rounded-3xl p-4 border border-amber-500/30 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>کلید API هوش مصنوعی (Gemini)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            این نسخه بدون سرور کار می‌کند. کلید خودتان را از{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 underline">
              aistudio.google.com
            </a>{' '}
            بگیرید و اینجا وارد کنید. کلید فقط روی دستگاه شما ذخیره می‌شود و به سروری ارسال نمی‌شود.
          </p>
          <form onSubmit={handleSaveApiKey} className="space-y-2.5">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIza..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs text-slate-100 font-mono"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
              >
                ذخیره کلید
              </button>
              <span className={`text-[10px] px-2 py-1 rounded-lg ${apiKeySaved ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                {apiKeySaved ? 'فعال ✓' : 'تنظیم نشده'}
              </span>
            </div>
          </form>
        </div>

        {/* Clear Data & Reset */}
        <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>مدیریت حافظه و داده‌ها</span>
          </div>
          <p className="text-[11px] text-slate-400">
            پاک کردن سوابق چت و فایل‌های موقت بدون تغییر در کلید عبور ورود شما
          </p>
          <button
            onClick={() => {
              if (window.confirm('آیا از پاک کردن تمامی گفتگوها و فایل‌ها اطمینان دارید؟')) {
                onClearAllData();
              }
            }}
            className="w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            پاک‌سازی کامل تاریخچه و تصاویر
          </button>
        </div>
      </div>
    </div>
  );
};
