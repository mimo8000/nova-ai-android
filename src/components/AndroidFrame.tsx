import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Sparkles, Smartphone, Maximize2 } from 'lucide-react';
import { AppTheme } from '../types';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTab?: string;
  isLocked?: boolean;
  theme?: AppTheme;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  isLocked = false,
  theme = 'black',
}) => {
  const [currentTime, setCurrentTime] = useState('');
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Normalize theme
  const activeTheme: 'pink' | 'black' | 'blue' | 'white' =
    theme === 'pink' || theme === 'cyber-neon'
      ? 'pink'
      : theme === 'white'
      ? 'white'
      : theme === 'blue' || theme === 'pure-midnight' || theme === 'material-dark'
      ? 'blue'
      : 'black';

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  const getShellThemeStyles = () => {
    switch (activeTheme) {
      case 'pink':
        return {
          container: 'bg-[#10040e]',
          shell: 'bg-[#190717] md:border-pink-900/60 md:shadow-[0_25px_60px_-15px_rgba(244,63,94,0.3)]',
          statusBar: 'bg-[#190717]/90 text-pink-200 border-pink-500/20',
          badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
          body: 'bg-gradient-to-b from-[#190717] via-[#2a0c27] to-[#120410]',
          gesture: 'bg-[#190717]/95',
          pill: 'bg-pink-500/50',
          isLight: false,
        };
      case 'blue':
        return {
          container: 'bg-[#04091a]',
          shell: 'bg-[#08122c] md:border-blue-900/70 md:shadow-[0_25px_60px_-15px_rgba(59,130,246,0.3)]',
          statusBar: 'bg-[#08122c]/90 text-blue-200 border-blue-500/20',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          body: 'bg-gradient-to-b from-[#08122c] via-[#0d1d45] to-[#050b1b]',
          gesture: 'bg-[#08122c]/95',
          pill: 'bg-blue-500/50',
          isLight: false,
        };
      case 'white':
        return {
          container: 'bg-slate-200 text-slate-900',
          shell: 'bg-slate-50 md:border-slate-300 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] text-slate-900',
          statusBar: 'bg-white/95 text-slate-700 border-slate-200',
          badge: 'bg-blue-100 text-blue-700 border-blue-200',
          body: 'bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900',
          gesture: 'bg-white/95',
          pill: 'bg-slate-400',
          isLight: true,
        };
      case 'black':
      default:
        return {
          container: 'bg-black',
          shell: 'bg-black md:border-neutral-800 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)]',
          statusBar: 'bg-black/95 text-slate-300 border-neutral-900',
          badge: 'bg-neutral-800 text-slate-300 border-neutral-700',
          body: 'bg-black',
          gesture: 'bg-black',
          pill: 'bg-neutral-600',
          isLight: false,
        };
    }
  };

  const themeStyle = getShellThemeStyles();

  return (
    <div
      id="android-app-container"
      data-theme={activeTheme}
      className={`min-h-screen ${themeStyle.container} flex flex-col items-center justify-center p-0 md:p-3 select-none overflow-hidden font-sans transition-colors duration-300`}
      dir="rtl"
    >
      {/* Desktop Top Bar Switcher */}
      <div className={`hidden md:flex items-center justify-between w-full max-w-md mb-2 px-3.5 py-1.5 ${themeStyle.isLight ? 'bg-white/90 border-slate-300 text-slate-700' : 'bg-slate-900/80 border-slate-800/80 text-slate-300'} border rounded-2xl backdrop-blur-md shadow-lg text-xs`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${activeTheme === 'pink' ? 'bg-pink-500' : activeTheme === 'white' ? 'bg-blue-600' : activeTheme === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`} />
          <span className={`font-bold ${activeTheme === 'pink' ? 'text-pink-400' : activeTheme === 'white' ? 'text-blue-700' : activeTheme === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`}>
            Nova AI Android 15
          </span>
          <span className="opacity-40">|</span>
          <span className="text-[11px] opacity-75">تم: {activeTheme === 'pink' ? 'صورتی 🌸' : activeTheme === 'white' ? 'سفید ⚪' : activeTheme === 'blue' ? 'آبی 🔵' : 'سیاه ⚫'}</span>
        </div>
        <button
          id="toggle-frame-mode-btn"
          onClick={() => setIsPhoneFrame(!isPhoneFrame)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl ${themeStyle.isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/50'} transition-colors border cursor-pointer`}
          title="تغییر حالت نمایش (گوشی / تمام‌صفحه)"
        >
          {isPhoneFrame ? (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>تمام صفحه</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5" />
              <span>قالب موبایل</span>
            </>
          )}
        </button>
      </div>

      {/* Android Device Shell */}
      <div
        className={`w-full transition-all duration-300 flex flex-col relative ${themeStyle.shell} ${
          isPhoneFrame
            ? 'max-w-[430px] h-[100dvh] md:h-[880px] md:max-h-[92vh] md:rounded-[44px] md:border-[8px] ring-1 ring-white/10'
            : 'max-w-4xl h-[100dvh] md:h-[90vh] md:rounded-3xl md:border shadow-2xl'
        } overflow-hidden`}
      >
        {/* Android Status Bar */}
        <div
          id="android-status-bar"
          className={`w-full h-9 px-5 pt-1.5 flex items-center justify-between text-xs font-semibold ${themeStyle.statusBar} backdrop-blur-md z-30 select-none border-b`}
        >
          {/* Time & App Indicator */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[13px]">{currentTime || '12:30'}</span>
            <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${themeStyle.badge}`}>
              <Sparkles className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>AI</span>
            </div>
          </div>

          {/* Android Punch Hole Camera */}
          <div className="w-4 h-4 rounded-full bg-black border border-slate-700/80 shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
          </div>

          {/* Right Status Icons (5G, WiFi, Battery) */}
          <div className="flex items-center gap-2" dir="ltr">
            <span className="text-[10px] font-bold opacity-75 tracking-tighter">5G</span>
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-mono">98%</span>
              <Battery className="w-4 h-4 text-emerald-500 fill-emerald-500/30" />
            </div>
          </div>
        </div>

        {/* App Main Body */}
        <div className={`flex-1 flex flex-col relative overflow-hidden ${themeStyle.body}`}>
          {children}
        </div>

        {/* Android Bottom Navigation Pill */}
        {!isLocked && (
          <div
            id="android-gesture-bar"
            className={`w-full h-5 flex items-center justify-center ${themeStyle.gesture} backdrop-blur-md z-20`}
          >
            <div className={`w-32 h-1 rounded-full ${themeStyle.pill} hover:opacity-80 transition-colors cursor-pointer`} />
          </div>
        )}
      </div>
    </div>
  );
};
