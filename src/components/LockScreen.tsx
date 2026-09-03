import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Lock,
  Sparkles,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Crown,
} from 'lucide-react';
import { motion } from 'motion/react';
import { verifyCode, saveLicense, License } from '../utils/license';

interface LockScreenProps {
  onUnlock: (license: License) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setCurrentDate(
        now.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setErrorMsg('لطفاً کد اشتراک خود را وارد کنید');
      return;
    }
    if (isChecking) return;
    setIsChecking(true);
    setErrorMsg('');

    const result = await verifyCode(trimmed);
    setIsChecking(false);

    if (!result.ok) {
      setErrorMsg('کد اشتراک نامعتبر یا منقضی است. برای خرید کد با مدیر برنامه تماس بگیرید.');
      if (navigator.vibrate) navigator.vibrate(200);
      return;
    }

    const lic: License = {
      id: result.id,
      code: trimmed.toUpperCase(),
      admin: result.admin,
      quota: result.quota,
      used: 0,
    };
    saveLicense(lic);
    setIsAdmin(result.admin);
    setIsUnlocked(true);
    setTimeout(() => onUnlock(lic), 600);
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

      {/* Subscription Code Input */}
      <div className="flex flex-col items-center justify-center my-auto z-10 w-full max-w-sm mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-200">ورود با کد اشتراک</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              LICENSE
            </span>
          </div>

          <form onSubmit={handleCodeSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="subscription-code-input" className="block text-[11px] text-slate-300 font-medium mb-1.5 text-right">
                کد اشتراک خود را وارد کنید:
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="subscription-code-input"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="NOVA-XXXXX-XXXXX"
                  autoFocus
                  autoComplete="off"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-100 text-center font-mono text-sm sm:text-base placeholder:text-slate-600 transition-all shadow-inner"
                />
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
              disabled={!code.trim() || isChecking}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:cursor-not-allowed"
            >
              {isChecking ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>بررسی کد اشتراک...</span>
                </>
              ) : isUnlocked ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>{isAdmin ? 'ورود مدیر تایید شد' : 'کد معتبر — در حال ورود...'}</span>
                </>
              ) : (
                <>
                  <span>تایید و ورود</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col items-center gap-2 text-[10px] text-slate-500">
            <a
              href="https://t.me/SasaX60"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 transition-colors cursor-pointer"
            >
              <Crown className="w-3 h-3 text-amber-400" />
              <span>برای دریافت کد اشتراک به مدیر پیام بده: @SasaX60</span>
            </a>
          </div>
        </motion.div>
      </div>

      {/* Bottom Footer */}
      <div className="flex items-center justify-center z-10">
        <span className="text-[10px] text-slate-500 font-mono">Nova AI v4.0 Licensed</span>
      </div>
    </div>
  );
};
