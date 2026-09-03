import React, { useState } from 'react';
import { copyText } from '../utils/saveFile';
import {
  Wand2,
  Code,
  Languages,
  BookOpen,
  Image as ImageIcon,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  FileText,
} from 'lucide-react';

interface ToolsViewProps {
  onUsePromptInChat: (promptText: string) => void;
  onUsePromptInImage: (promptText: string) => void;
  onUsePromptInVideo: (promptText: string) => void;
}

const TOOLS = [
  {
    id: 'bot-builder',
    title: 'سازنده ربات تلگرام و دیسکورد',
    desc: 'تولید کدهای صفر تا صد ربات با پایتون، دکمه‌های شیشه‌ای، پایگاه داده و پنل مدیریت',
    icon: '🤖',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'code-debugger',
    title: 'برنامه‌نویس و باگ‌یاب ارشد',
    desc: 'کدنویسی انواع نرم‌افزار، اسکریپت، رفع خطاهای پیچیده و بهینه‌سازی سرعت',
    icon: '💻',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'web-scraper',
    title: 'ربات اسکرپینگ و اتوماسیون',
    desc: 'تولید اسکریپت‌های وب‌اسکرپینگ، ربات استخراج داده، سلنیوم و پردازش خودکار',
    icon: '⚡',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'prompt-architect',
    title: 'مهندس پرامپت طلایی',
    desc: 'ایده شما را به پرامپت فوق حرفه‌ای 8K برای ساخت عکس و ویدیو تبدیل می‌کند',
    icon: '✨',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'video-storyboard',
    title: 'سناریونویس فیلم و ریلز',
    desc: 'نگارش سناریو همراه با دیالوگ، زاویه دوربین و توضیحات صداگذاری',
    icon: '🎬',
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'translator-pro',
    title: 'مترجم ادبی و اصطلاحات',
    desc: 'ترجمه دقیق و روان متون و اصطلاحات تخصصی انگلیسی و فارسی',
    icon: '🌍',
    color: 'from-rose-500 to-pink-600',
  },
];

export const ToolsView: React.FC<ToolsViewProps> = ({
  onUsePromptInChat,
  onUsePromptInImage,
  onUsePromptInVideo,
}) => {
  const [selectedTool, setSelectedTool] = useState(TOOLS[0]);
  const [inputVal, setInputVal] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRunTool = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    setIsLoading(true);
    setResult('');

    let promptQuery = '';
    if (selectedTool.id === 'bot-builder') {
      promptQuery = `به عنوان یک معمار و مهندس ارشد ربات‌سازی، کد کامل و بدون نقص ربات زیر را با پایتون و توضیحات کامل مراحل نصب کتابخانه‌ها و اجرا بنویس: "${inputVal}"`;
    } else if (selectedTool.id === 'code-debugger') {
      promptQuery = `به عنوان یک مهندس ارشد نرم‌افزار، کدهای زیر را بررسی کن، مشکلات را رفع کن و بهترین پیاده‌سازی بهینه را ارائه بده: "${inputVal}"`;
    } else if (selectedTool.id === 'web-scraper') {
      promptQuery = `یک اسکریپت کامل پایتون برای وب‌اسکرپینگ یا اتوماسیون بر اساس این نیاز بنویس با پکیج‌های BeautifulSoup یا Playwright/Selenium: "${inputVal}"`;
    } else if (selectedTool.id === 'prompt-architect') {
      promptQuery = `به عنوان یک پرامپت آرشیتکت برتر هوش مصنوعی، این ایده را به یک پرامپت مسترپیس انگلیسی با تمام جزئیات نور، دوربین، بافت و سبک تبدیل کن و سپس ترجمه و نحوه استفاده را به فارسی بگو: "${inputVal}"`;
    } else if (selectedTool.id === 'video-storyboard') {
      promptQuery = `یک سناریوی کامل، هیجان‌انگیز و استاندارد برای ویدیوی اینستاگرام یا تبلیغاتی بر اساس این موضوع بنویس. شامل سکانس به سکانس، حرکت دوربین و صداگذاری: "${inputVal}"`;
    } else {
      promptQuery = `این متن را با بالاترین کیفیت ادبی و محاوره‌ای به زبان مقصد ترجمه کن و اصطلاحات مهم را به زبان ساده شرح بده: "${inputVal}"`;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: promptQuery }],
        }),
      });
      const data = await response.json();
      setResult(data.text || 'پاسخی دریافت نشد.');
    } catch (err: any) {
      setResult('خطا در اجرای ابزار. لطفاً مجدداً امتحان کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    copyText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="tools-view" className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Top Bar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100">جعبه‌ابزار تخصصی هوش مصنوعی</h2>
            <p className="text-[10px] text-amber-400 font-medium">پرامپت‌نویسی • سناریو • کدنویسی</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tool Cards */}
        <div className="grid grid-cols-2 gap-2">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTool(t);
                setResult('');
              }}
              className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                selectedTool.id === t.id
                  ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/50 shadow-md'
                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-xl mb-1">{t.icon}</div>
              <div>
                <h3 className="text-xs font-bold text-slate-100">{t.title}</h3>
                <p className="text-[9px] text-slate-400 line-clamp-2 mt-0.5">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Tool Form */}
        <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <span className="text-lg">{selectedTool.icon}</span>
            <span>{selectedTool.title}</span>
          </div>

          <textarea
            id="tool-input"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="موضوع یا متن مورد نظرتان را اینجا بنویسید..."
            rows={3}
            className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs sm:text-[13px] text-slate-100 placeholder:text-slate-500 transition-colors resize-none leading-relaxed"
          />

          <button
            onClick={() => handleRunTool()}
            disabled={!inputVal.trim() || isLoading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال پردازش هوشمند...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>اجرا و تولید نتیجه</span>
              </>
            )}
          </button>
        </div>

        {/* Result Container */}
        {result && (
          <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>نتیجه تولید شده</span>
              </span>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'کپی شد' : 'کپی'}</span>
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap select-text">
              {result}
            </div>

            {/* Quick Actions to jump to Image or Video generation */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
              <button
                onClick={() => onUsePromptInImage(result)}
                className="flex-1 py-2 rounded-xl bg-fuchsia-950/60 hover:bg-fuchsia-900/60 border border-fuchsia-800/50 text-fuchsia-300 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>ارسال به ساخت عکس</span>
              </button>

              <button
                onClick={() => onUsePromptInVideo(result)}
                className="flex-1 py-2 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 border border-violet-800/50 text-violet-300 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>ارسال به ساخت ویدیو</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
