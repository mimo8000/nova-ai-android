import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Sparkles,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Crown,
  Key,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LockScreenProps {
  onUnlock: () => void;
  savedPin: string;
  savedHint: string;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, savedPin, savedHint }) => {
  const [accessKey, setAccessKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('fa-IR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = accessKey.trim();

    if (!trimmed) {
      triggerError('لطفاً رمز اشتراکی یا رمز عبور را بنویسید');
      return;
    }

    // Admin key or custom saved key or default keys
    if (trimmed.toLowerCase() === 'reza43') {
      setIsAdminUnlocked(true);
      triggerSuccess('ورود ادمین مجاز تایید شد');
    } else if (trimmed === savedPin || trimmed === '2025') {
      triggerSuccess();
    } else {
      triggerError('رمز عبور یا کلید اشتراکی نامعتبر است');
    }
  };

  const triggerSuccess = (msg?: string) => {
    setIsUnlocked(true);
    setTimeout(() => {
      onUnlock();
    }, 500);
  };

  const triggerError = (msg: string) => {
    setIsError(true);
    setErrorMsg(msg);
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    setTimeout(() => {
      setIsError(false);
    }, 1500);
  };

  const handleQuickKeyFill = (keyToFill: string) => {
    setAccessKey(keyToFill);
    setErrorMsg('');
  };

  return (
    <div
      id="android-lock-screen"
      className="flex-1 flex flex-col justify-between p-5 sm:p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 select-none relative overflow-hidden h-full"
    >
      {/* Background Animated Atmosphere */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Clock */}
      <div className="flex flex-col items-center text-center mt-2 z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-xl shadow-blue-500/20 mb-2.5"
        >
          <div className="w-full h-full bg-slate-950/90 backdrop-blur-md rounded-[14px] flex items-center justify-center">
            {isUnlocked ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400 animate-bounce" />
            ) : (
              <Lock className="w-6 h-6 text-blue-400 animate-pulse" />
            )}
          </div>
        </motion.div>

        <h1 className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white mb-1">
          {currentTime || '12:00'}
        </h1>
        <p className="text-xs text-slate-400 font-medium mb-2">{currentDate}</p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>سامانه هوش مصنوعی اختصاصی Nova AI</span>
        </div>
      </div>

      {/* Center Key Input & Subscription Key Form */}
      <div className="flex flex-col items-center justify-center my-auto z-10 w-full max-w-sm mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-200">ورود با کلید اشتراکی و رمز</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              SECURE
            </span>
          </div>

          <form onSubmit={handleKeySubmit} className="space-y-3.5">
            <div>
              <label htmlFor="shared-access-key" className="block text-[11px] text-slate-300 font-medium mb-1.5 text-right">
                رمز یا کلید اشتراکی اختصاصی را تایپ کنید:
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="shared-access-key"
                  value={accessKey}
                  onChange={(e) => {
                    setAccessKey(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="مثلاً reza43 یا رمز عبور..."
                  autoFocus
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-100 text-center font-mono text-sm sm:text-base placeholder:text-slate-500 transition-all shadow-inner"
                />
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 text-[11px] text-rose-300 bg-rose-500/15 p-2 rounded-xl border border-rose-500/30"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            <button
              type="submit"
              id="unlock-submit-btn"
              disabled={!accessKey.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:cursor-not-allowed"
            >
              {isUnlocked ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>درحال بازگشایی سامانه...</span>
                </>
              ) : (
                <>
                  <span>تایید و ورود به هوش مصنوعی</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Keys / Admin Shortcut */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
            <p className="text-[10px] text-slate-400 text-center">کلیدهای دسترسی سریع:</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                id="fill-admin-key-btn"
                onClick={() => handleQuickKeyFill('reza43')}
                className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span>رمز ادمین: reza43</span>
              </button>

              <button
                type="button"
                id="fill-default-key-btn"
                onClick={() => handleQuickKeyFill(savedPin || '2025')}
                className="px-2.5 py-1 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3 h-3 text-blue-400" />
                <span>رمز پیش‌فرض: {savedPin || '2025'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Footer Info */}
      <div className="flex flex-col items-center gap-2 z-10">
        <div className="flex items-center justify-between w-full max-w-sm text-[11px] text-slate-400 px-2">
          <button
            id="show-hint-btn"
            onClick={() => setShowHint(!showHint)}
            className="hover:text-blue-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>راهنمای کلید ورود</span>
          </button>
          <span className="text-[10px] text-slate-500 font-mono">Nova AI v3.5 Pro</span>
        </div>

        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 text-center leading-relaxed"
          >
            {savedHint || 'رمز ادمین: reza43 | رمز پیش‌فرض: 2025'}
          </motion.div>
        )}
      </div>
    </div>
  );
};
