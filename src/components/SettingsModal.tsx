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
  Sparkles,
  Crown,
  Key,
  Copy,
} from 'lucide-react';
import { AppTheme } from '../types';
import { isAdmin, generateUserCode, generateProCode, generateAdminCode, getLicense, remainingQuota, hasCustomPin, setAdminPin, verifyAdminPin } from '../utils/license';
import { copyText } from '../utils/saveFile';

interface SettingsModalProps {
  theme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  onLockNow: () => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  theme,
  onChangeTheme,
  onLockNow,
  onClearAllData,
}) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiSaved, setGeminiSaved] = useState(false);
  const [orKey, setOrKey] = useState('');
  const [orSaved, setOrSaved] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // admin code-gen
  const [genCount, setGenCount] = useState(5);
  const [genUses, setGenUses] = useState(100);
  const [genResult, setGenResult] = useState<string[]>([]);

  // whole-settings PIN gate (locked even for admin until PIN entered)
  const [pinSet, setPinSet] = useState(hasCustomPin());
  const [keyUnlocked, setKeyUnlocked] = useState(false);
  const [settingsPin, setSettingsPin] = useState('');
  const [settingsPinErr, setSettingsPinErr] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinErr, setPinErr] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPin2, setNewPin2] = useState('');

  const admin = isAdmin();
  const lic = getLicense();
  const quotaLeft = remainingQuota();
  const tierLabel = lic?.admin ? 'مدیر — نامحدود' : lic?.tier === 'pro' ? '⭐ PRO' : 'رایگان (فقط چت)';
  const quotaText = lic?.admin ? 'نامحدود (مدیر)' : `${quotaLeft} استفاده باقی‌مانده`;

  useEffect(() => {
    setGeminiKey(localStorage.getItem('nova_ai_gemini_key') || '');
    setGeminiSaved(!!localStorage.getItem('nova_ai_gemini_key'));
    setOrKey(localStorage.getItem('nova_ai_or_key') || '');
    setOrSaved(!!localStorage.getItem('nova_ai_or_key'));
  }, []);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleSaveGemini = (e: React.FormEvent) => {
    e.preventDefault();
    const k = geminiKey.trim();
    if (!k) {
      localStorage.removeItem('nova_ai_gemini_key');
      setGeminiSaved(false);
      return;
    }
    const gk = k.replace(/[^\x00-\x7F]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c) >= 0 ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(c) : '')).replace(/[^A-Za-z0-9_\-]/g, '');
    localStorage.setItem('nova_ai_gemini_key', gk);
    setGeminiSaved(true);
    flash('کلید Gemini ذخیره شد ✓');
  };

  const handleSaveOR = (e: React.FormEvent) => {
    e.preventDefault();
    const k = orKey.trim();
    if (!k) {
      localStorage.removeItem('nova_ai_or_key');
      setOrSaved(false);
      return;
    }
    const ok = k.replace(/[^\x00-\x7F]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c) >= 0 ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(c) : '')).replace(/[^A-Za-z0-9_\-]/g, '');
    localStorage.setItem('nova_ai_or_key', ok);
    setOrSaved(true);
    flash('کلید OpenRouter ذخیره شد ✓');
  };

  const handleGenerate = async () => {
    const codes: string[] = [];
    for (let i = 0; i < genCount; i++) {
      codes.push(await generateUserCode(genUses));
    }
    setGenResult(codes);
    flash(`${genCount} کد تولید شد`);
  };

  const handleGenerateAdmin = async () => {
    const c = await generateAdminCode();
    setGenResult([c]);
    flash('کد مدیر تولید شد');
  };

  const handleGeneratePro = async () => {
    const codes: string[] = [];
    for (let i = 0; i < genCount; i++) codes.push(await generateProCode(genUses));
    setGenResult(codes);
    flash(`${genCount} کد PRO تولید شد`);
  };

  const copyAll = () => {
    copyText(genResult.join('\n'));
    flash('کدها کپی شدند');
  };

  const handleUnlockKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await verifyAdminPin(pinInput)) {
      setKeyUnlocked(true);
      setPinErr('');
      setPinInput('');
    } else {
      setPinErr('رمز اشتباه است');
    }
  };

  const handleUnlockSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await verifyAdminPin(settingsPin)) {
      setKeyUnlocked(true);
      setSettingsPinErr('');
      setSettingsPin('');
    } else {
      setSettingsPinErr('رمز اشتباه است');
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) { setErrorMsg('رمز باید حداقل ۴ رقم/حرف باشد'); return; }
    if (newPin !== newPin2) { setErrorMsg('دو تکرار رمز یکی نیست'); return; }
    await setAdminPin(newPin);
    setPinSet(true);
    setKeyUnlocked(true);
    setNewPin(''); setNewPin2('');
    flash('رمز محافظ کلیدها تنظیم شد ✓');
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
            <h2 className="text-xs font-bold text-slate-100">تنظیمات و دسترسی</h2>
            <p className="text-[10px] text-slate-400 font-medium">کلیدها • تم • مدیریت</p>
          </div>
        </div>
        <button
          onClick={onLockNow}
          className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shadow transition-all cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>قفل فوری</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!keyUnlocked && (
          <form onSubmit={handleUnlockSettings} className="space-y-3 bg-slate-900/90 rounded-3xl p-4 border border-rose-500/30 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
              <Lock className="w-4 h-4" />
              <span>تنظیمات قفل است — رمز ادمین را وارد کنید</span>
            </div>
            <p className="text-[11px] text-slate-400">این بخش کاملاً قفل است. حتی ادمین باید رمز را وارد کند تا بتواند کلیدها، کدها و تم‌ها را تغییر دهد.</p>
            <div className="flex gap-2">
              <input type="password" value={settingsPin} onChange={(e) => setSettingsPin(e.target.value)}
                placeholder="رمز ادمین" dir="ltr" autoFocus
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 text-xs text-slate-100 font-mono" />
              <button type="submit" className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer">باز کردن</button>
            </div>
            {settingsPinErr && <p className="text-[10px] text-rose-400">{settingsPinErr}</p>}
          </form>
        )}
        {keyUnlocked && (<>
        {/* License status */}
        <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>وضعیت اشتراک</span>
          </div>
          <p className="text-[11px] text-slate-400">
            کد فعال: <span className="font-mono text-slate-200">{lic?.code || '—'}</span>
          </p>
          <p className="text-[11px] text-slate-400">سطح دسترسی: <span className="text-amber-300 font-bold">{tierLabel}</span></p>
          <p className="text-[11px] text-slate-400">اعتبار: <span className="text-emerald-400 font-bold">{quotaText}</span></p>
        </div>

        {/* Admin panel: generate codes */}
        {admin && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Crown className="w-4 h-4" />
              <span>پنل مدیر — تولید کد اشتراک</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">تعداد کد</label>
                <input type="number" min={1} max={500} value={genCount}
                  onChange={(e) => setGenCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">تعداد استفاده هر کد</label>
                <input type="number" min={10} max={1000} step={10} value={genUses}
                  onChange={(e) => setGenUses(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleGenerate}
                className="flex-1 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs cursor-pointer">
                کد رایگان (فقط چت)
              </button>
              <button onClick={handleGeneratePro}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs cursor-pointer shadow-lg shadow-amber-500/20">
                ⭐ کد PRO
              </button>
              <button onClick={handleGenerateAdmin}
                className="px-3 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-200 font-bold text-xs cursor-pointer">
                مدیر
              </button>
            </div>
            {genResult.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{genResult.length} کد تولید شد</span>
                  <button onClick={copyAll} className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300">
                    <Copy className="w-3 h-3" /> کپی همه
                  </button>
                </div>
                <div className="bg-slate-950 rounded-xl p-2 max-h-32 overflow-y-auto space-y-1">
                  {genResult.map((c, i) => (
                    <div key={i} className="text-[11px] font-mono text-emerald-300 flex items-center gap-1">
                      <span className="w-4 text-slate-600">{i + 1}.</span>
                      <span className="break-all">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* API Keys — locked behind admin PIN */}
        <div className="bg-slate-900/90 rounded-3xl p-4 border border-amber-500/30 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>کلیدهای API</span>
            {!keyUnlocked && <Lock className="w-3.5 h-3.5 text-rose-400" />}
          </div>

          {!keyUnlocked && (
            <form onSubmit={handleUnlockKeys} className="space-y-2">
              <p className="text-[11px] text-slate-400">این بخش با رمز ادمین قفل است. برای تغییر کلیدها رمز را وارد کنید.</p>
              <div className="flex gap-2">
                <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)}
                  placeholder="رمز ادمین" dir="ltr" autoFocus
                  className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs text-slate-100 font-mono" />
                <button type="submit" className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer">
                  باز کردن
                </button>
              </div>
              {pinErr && <p className="text-[10px] text-rose-400">{pinErr}</p>}
            </form>
          )}

          {keyUnlocked && (<>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">کلید Gemini (چت پیش‌فرض)</label>
            <form onSubmit={handleSaveGemini} className="flex gap-2">
              <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza..." dir="ltr"
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs text-slate-100 font-mono" />
              <button type="submit" className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer">
                ذخیره
              </button>
            </form>
            <span className={`text-[10px] ${geminiSaved ? 'text-emerald-400' : 'text-slate-500'}`}>
              {geminiSaved ? 'فعال ✓' : 'تنظیم نشده'}
            </span>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">کلید OpenRouter (Qwen / GLM / DeepSeek / Hunyuan / MiMo)</label>
            <form onSubmit={handleSaveOR} className="flex gap-2">
              <input type="password" value={orKey} onChange={(e) => setOrKey(e.target.value)}
                placeholder="sk-or-..." dir="ltr"
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs text-slate-100 font-mono" />
              <button type="submit" className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer">
                ذخیره
              </button>
            </form>
            <span className={`text-[10px] ${orSaved ? 'text-emerald-400' : 'text-slate-500'}`}>
              {orSaved ? 'فعال ✓' : 'تنظیم نشده (کلید پیش‌فرض اپ استفاده می‌شود)'}
            </span>
          </div>
          </>)}
        </div>

        {/* Admin: set/change the key-section PIN (visible once unlocked) */}
        {keyUnlocked && admin && (
          <div className="bg-slate-900/90 rounded-3xl p-4 border border-rose-500/30 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>{pinSet ? 'تغییر رمز محافظ کلیدها' : 'تنظیم رمز محافظ کلیدها'}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              تا وقتی رمز نگذاشته‌ای، هر کسی که وارد اپ شده می‌تواند کلید API را عوض کند. رمز بگذار تا این بخش فقط با رمز باز شود.
            </p>
            <form onSubmit={handleSetPin} className="space-y-2">
              <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)}
                placeholder="رمز جدید (حداقل ۴ کاراکتر)" dir="ltr"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 text-xs text-slate-100 font-mono" />
              <input type="password" value={newPin2} onChange={(e) => setNewPin2(e.target.value)}
                placeholder="تکرار رمز جدید" dir="ltr"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 text-xs text-slate-100 font-mono" />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer">
                {pinSet ? 'ثبت رمز جدید' : 'فعال کردن قفل رمز'}
              </button>
            </form>
          </div>
        )}

        {/* Themes */}
        <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-pink-400" />
              <span>پوسته و تم رنگی</span>
            </div>
            <span className="text-[10px] text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">۴ تم</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'pink', title: '🌸 صورتی (Pink)', subtitle: 'نئون صورتی و سرخابی', badge: 'محبوب ✨', previewClass: 'bg-gradient-to-br from-pink-900 via-rose-950 to-pink-950 border-pink-500/50 text-pink-200', activeClass: 'bg-pink-950/80 border-pink-500 ring-2 ring-pink-500/40 text-white' },
              { id: 'black', title: '⚫ سیاه (AMOLED)', subtitle: 'مشکی خالص', badge: 'OLED', previewClass: 'bg-black border-neutral-800 text-neutral-200', activeClass: 'bg-neutral-950 border-white/60 ring-2 ring-white/30 text-white' },
              { id: 'blue', title: '🔵 آبی (Cyber)', subtitle: 'آبی کهکشانی', badge: 'مدرن', previewClass: 'bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border-blue-500/50 text-blue-200', activeClass: 'bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/40 text-white' },
              { id: 'white', title: '⚪ سفید (Light)', subtitle: 'تمیز و مینیمال', badge: 'روشن', previewClass: 'bg-slate-100 border-slate-300 text-slate-800', activeClass: 'bg-white border-blue-600 ring-2 ring-blue-500/40 text-slate-950 shadow-md' },
            ].map((t) => {
              const isSelected = theme === t.id;
              return (
                <button key={t.id} id={`theme-btn-${t.id}`} onClick={() => onChangeTheme(t.id as AppTheme)}
                  className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[74px] ${isSelected ? t.activeClass : `${t.previewClass} opacity-80 hover:opacity-100 hover:scale-[1.02]`}`}>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold">{t.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/10 font-mono">{t.badge}</span>
                  </div>
                  <div className="text-[10px] opacity-80 mt-1">{t.subtitle}</div>
                  {isSelected && <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear Data */}
        <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>مدیریت حافظه</span>
          </div>
          <p className="text-[11px] text-slate-400">پاک‌سازی سوابق چت و فایل‌ها (بدون تغییر کد اشتراک)</p>
          <button onClick={() => { if (window.confirm('آیا از پاک کردن تمامی گفتگوها و فایل‌ها اطمینان دارید؟')) onClearAllData(); }}
            className="w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 text-xs font-semibold transition-colors cursor-pointer">
            پاک‌سازی کامل تاریخچه
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
            <Check className="w-3.5 h-3.5 shrink-0" /><span>{successMsg}</span>
          </div>
        )}
        </>)}
      </div>
    </div>
  );
};
