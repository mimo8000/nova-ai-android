import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Paperclip,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RefreshCw,
  Globe,
  Trash2,
  Image as ImageIcon,
  Zap,
  Cpu,
  Layers,
  ChevronDown,
  Gauge,
  CheckCircle2,
  Code2,
  Terminal,
  Download,
  FileCode,
  Wand2,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { ChatMessage, AIModelOption, AIModelType } from '../types';
import { speakText, stopSpeaking } from '../utils/mediaGenerator';
import { copyText } from '../utils/saveFile';
import { isPro } from '../utils/license';

export const AI_MODELS: AIModelOption[] = [
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    badge: 'پیش‌فرض و هوشمند ✨',
    desc: 'پاسخگویی فوق‌العاده سریع با بالاترین دقت متنی و زبانی برای چت و سوالات روزمره',
    speed: 'سرعت: ۰.۳ ثانیه (بسیار سریع)',
    icon: '✨',
  },
  {
    id: 'grok-3',
    name: 'Grok 3 (xAI Mode)',
    badge: 'هوشمند و جسور 🛸',
    desc: 'مدل Grok فوق‌العاده باهوش، سریع، شوخ‌طبع، بدون تعارف و متخصص استدلال، کدنویسی و تحلیل عمیق',
    speed: 'سرعت: ۰.۱۵ ثانیه (فوق‌العاده سریع)',
    icon: '🛸',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Flash-Lite موشکی',
    badge: 'فوق سریع و سبک 🚀',
    desc: 'کمترین زمان تاخیر با سرعت برق‌آسا برای مکالمات فوق‌سریع و پاسخ‌های کوتاه',
    speed: 'سرعت: ۰.۱ ثانیه (موشکی)',
    icon: '🚀',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    badge: 'موتور قدرتمند ⚡',
    desc: 'آخرین نسخه پایدار موتور فلش گوگل با تعادل بی‌نظیر سرعت، خلاقیت و برنامه‌نویسی',
    speed: 'سرعت: ۰.۲ ثانیه (فوری)',
    icon: '⚡',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    badge: 'استدلال عمیق و منطقی 🧠',
    desc: 'مخصوص حل مسائل بسیار پیچیده، تحلیل عمیق، کدنویسی پیشرفته و محاسبات مهندسی',
    speed: 'سرعت: استاندارد و تحلیلی',
    icon: '🧠',
  },
  {
    id: 'qwen3.8-flash',
    name: 'Qwen 3.8 Flash',
    badge: 'PRO 🐉',
    desc: 'مدل علی‌بابا با قدرت زبانی و کدنویسی عالی و پشتیبانی فوق‌العاده از فارسی (نیاز به اشتراک PRO)',
    speed: 'سرعت: بسیار سریع',
    icon: '🐉',
    pro: true,
  },
  {
    id: 'glm-5.3-flash',
    name: 'GLM 5.3 Flash',
    badge: 'PRO 🎯',
    desc: 'مدل Zhipu با تفکر گام‌به‌گام، مناسب ریاضی، منطق و تحلیل دقیق (نیاز به اشتراک PRO)',
    speed: 'سرعت: سریع (با reasoning)',
    icon: '🎯',
    pro: true,
  },
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    badge: 'PRO 💎',
    desc: 'قوی‌ترین مدل در کدنویسی، رفع باگ و استدلال فنی عمیق (نیاز به اشتراک PRO)',
    speed: 'سرعت: سریع',
    icon: '💎',
    pro: true,
  },
  {
    id: 'hy3',
    name: 'Hunyuan 3 (Tencent)',
    badge: 'PRO 🀄',
    desc: 'مدل تنسنت برای مکالمه طبیعی، ترجمه و خلاقیت متنی (نیاز به اشتراک PRO)',
    speed: 'سرعت: سریع',
    icon: '🀄',
    pro: true,
  },
  {
    id: 'mimo',
    name: 'Xiaomi MiMo 2.5',
    badge: 'PRO 🐱',
    desc: 'مدل شیائومی با تعادل عالی سرعت و کیفیت برای کارهای روزمره (نیاز به اشتراک PRO)',
    speed: 'سرعت: بسیار سریع',
    icon: '🐱',
    pro: true,
  },
];

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (
    content: string,
    images?: { data: string; mimeType: string }[],
    webSearch?: boolean,
    model?: AIModelType,
    systemPrompt?: string
  ) => Promise<void>;
  onClearChat: () => void;
  isLoading: boolean;
}

const PERSONAS = [
  {
    id: 'bot-builder',
    title: '🤖 سازنده ربات و اتوماسیون',
    icon: '🤖',
    prompt: 'شما یک معمار و برنامه‌نویس ارشد متخصص ساخت انواع ربات‌های تلگرام (python-telegram-bot, Telethon, Pyrogram)، ربات‌های دیسکورد، وب اسکرپرها و اسکریپت‌های اتوماسیون هوشمند هستید. کدهای کامل، بدون نقص و آماده اجرا به همراه راهنمای مرحله‌به‌مرحله راه‌اندازی ارائه دهید.',
  },
  {
    id: 'grok-persona',
    title: '🛸 هوش Grok (شوخ و تیزبین)',
    icon: '🛸',
    prompt: 'شما دستیار Grok 3 با رویکرد تفکر از اصول اولیه (First Principles)، شوخ‌طبعی هوشمندانه، لحن رک و واقع‌بین و قدرت کدنویسی و تحلیل فنی فوق‌العاده هستید.',
  },
  {
    id: 'coder',
    title: '💻 برنامه‌نویس و مهندس ارشد',
    icon: '💻',
    prompt: 'شما یک مهندس نرم‌افزار ارشد فول‌استک با تسلط کامل بر پایتون، جاوااسکریپت، ری‌اکت، نود، دیتابیس‌ها و حل خطاهای پیچیده هستید. کدهای بهینه، مدرن و خوانا بنویسید.',
  },
  {
    id: 'all',
    title: '🌟 هوش مصنوعی همه‌کاره',
    icon: '🌟',
    prompt: 'شما یک دستیار هوش مصنوعی اندرویدی فوق‌پیشرفته، بدون محدودیت و همه‌فن‌حریف به نام Nova AI هستید.',
  },
  {
    id: 'director',
    title: '🎬 کارگردان سناریو و پرامپت',
    icon: '🎬',
    prompt: 'شما متخصص تولید سناریوهای سینمایی و پرامپت‌های خارق‌العاده و حرفه‌ای 8K برای ساخت عکس و ویدیو هستید.',
  },
  {
    id: 'writer',
    title: '✍️ نویسنده و ادیب خلاق',
    icon: '✍️',
    prompt: 'شما نویسنده، ایده‌پرداز و ادیب خلاق هستید که متن‌های ادبی، سناریو و متون بازاریابی گیرا می‌نویسید.',
  },
];

// Helper to trigger code file download
const downloadCodeFile = (code: string, language: string = 'txt') => {
  const extMap: Record<string, string> = {
    python: 'py',
    py: 'py',
    javascript: 'js',
    js: 'js',
    typescript: 'ts',
    ts: 'ts',
    tsx: 'tsx',
    jsx: 'jsx',
    html: 'html',
    css: 'css',
    json: 'json',
    bash: 'sh',
    sh: 'sh',
    sql: 'sql',
    php: 'php',
    cpp: 'cpp',
    c: 'c',
    java: 'java',
    kotlin: 'kt',
  };
  const ext = extMap[language.toLowerCase()] || 'txt';
  const filename = `nova_bot_code_${Date.now()}.${ext}`;
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  isLoading,
}) => {
  const [input, setInput] = useState('');
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [selectedModel, setSelectedModel] = useState<AIModelOption>(() => {
    try {
      const saved = localStorage.getItem('nova_ai_selected_model');
      const found = AI_MODELS.find((m) => m.id === saved);
      if (found) return found;
    } catch {}
    return AI_MODELS[0];
  });
  useEffect(() => {
    try { localStorage.setItem('nova_ai_selected_model', selectedModel.id); } catch {}
  }, [selectedModel]);
  const [showModelModal, setShowModelModal] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [attachedImages, setAttachedImages] = useState<{ data: string; mimeType: string; preview: string }[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Voice speech-to-text setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'fa-IR';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('مرورگر شما از ورودی صوتی پشتیبانی نمی‌کند.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachedImages.length === 0) || isLoading) return;

    const userText = input.trim();
    const imgsToSend = attachedImages.map((img) => ({
      data: img.data,
      mimeType: img.mimeType,
    }));

    setInput('');
    setAttachedImages([]);

    await onSendMessage(
      userText,
      imgsToSend.length > 0 ? imgsToSend : undefined,
      useWebSearch,
      selectedModel.id,
      selectedPersona.prompt
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Data = uploadEvent.target?.result as string;
        setAttachedImages((prev) => [
          ...prev,
          {
            data: base64Data,
            mimeType: file.type || 'image/jpeg',
            preview: base64Data,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    copyText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyCode = (codeText: string, key: string) => {
    copyText(codeText);
    setCopiedCodeIdx(key);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  const handleSpeak = async (text: string, id: string) => {
    if (playingMessageId === id) {
      stopSpeaking();
      setPlayingMessageId(null);
    } else {
      setPlayingMessageId(id);
      await speakText(text, 'fa-IR');
      setPlayingMessageId(null);
    }
  };

  return (
    <div id="chat-view" className="flex-1 flex flex-col h-full bg-slate-950/60 overflow-hidden relative">
      {/* Chat Top Header with Model Selector Button */}
      <div className="px-3.5 py-2.5 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          {/* AI Model Switcher Button */}
          <button
            id="open-model-selector-btn"
            onClick={() => setShowModelModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-gradient-to-r from-blue-950/80 to-indigo-950/80 hover:from-blue-900/80 hover:to-indigo-900/80 border border-blue-500/40 text-blue-300 transition-all cursor-pointer shadow-sm group"
          >
            <span className="text-sm">{selectedModel.icon}</span>
            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-100 flex items-center gap-1">
                <span>{selectedModel.name}</span>
                <ChevronDown className="w-3 h-3 text-blue-400 group-hover:translate-y-0.5 transition-transform" />
              </div>
              <p className="text-[9px] text-blue-400 font-medium">{selectedModel.badge}</p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Web Search Toggle */}
          <button
            id="toggle-web-search-btn"
            onClick={() => setUseWebSearch(!useWebSearch)}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
              useWebSearch
                ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="جستجوی زنده در اینترنت"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">وب زنده</span>
          </button>

          {/* Clear chat */}
          <button
            id="clear-chat-history-btn"
            onClick={onClearChat}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 border border-slate-700 text-slate-400 transition-colors cursor-pointer"
            title="پاک‌سازی تاریخچه چت"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Model Selection Modal */}
      <AnimatePresence>
        {showModelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100">انتخاب مدل هوش مصنوعی</h3>
                    <p className="text-[10px] text-slate-400">تمام مدل‌ها به صورت خودکار پشتیبانی و سوئیچ می‌شوند</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModelModal(false)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                >
                  بستن
                </button>
              </div>

              {/* Models List */}
              <div className="space-y-2.5">
                {AI_MODELS.map((m) => {
                  const isSelected = selectedModel.id === m.id;
                  const locked = !!m.pro && !isPro();
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        if (locked) {
                          alert('این مدل فقط با اشتراک PRO باز می‌شود. برای خرید کد PRO به @SasaX60 پیام دهید.');
                          return;
                        }
                        setSelectedModel(m);
                        setShowModelModal(false);
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-950/60 border-blue-500 ring-1 ring-blue-500/50 shadow-md'
                          : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{m.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-100">{m.name}</h4>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                              m.pro
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold'
                                : isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-blue-300'
                            }`}>
                              {m.pro ? '⭐ PRO' : m.badge}
                            </span>
                            {locked && <Lock className="w-3 h-3 text-rose-400" />}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{m.desc}</p>
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-400 font-medium">
                            <Gauge className="w-3 h-3" />
                            <span>{m.speed}</span>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persona Horizontal Selector */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/40 border-b border-slate-800/40 overflow-x-auto no-scrollbar">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            id={`persona-${p.id}`}
            onClick={() => setSelectedPersona(p)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
              selectedPersona.id === p.id
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>{p.title}</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 my-auto">
            <div className="w-14 h-14 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-3 text-blue-400 shadow-xl shadow-blue-500/10">
              <Bot className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 mb-1">دستیار مهندس و برنامه‌نویس هوشمند Nova AI ⚡</h3>
            <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed mb-4">
              آماده برای ساخت ربات‌های تلگرام، دیسکورد، اسکریپت‌های پایتون، تحلیل داده و پاسخ به تمام سوالات شما
            </p>

            {/* Quick Prompts For Bot & Coding */}
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm text-right">
              {[
                { label: '🤖 ساخت ربات تلگرام حرفه‌ای با پایتون و دکمه‌های شیشه‌ای', icon: '🤖' },
                { label: '🎮 کد کامل ربات دیسکورد با دستورات پیشرفته', icon: '🎮' },
                { label: '🌐 اسکریپت وب اسکرپینگ برای استخراج خودکار داده‌ها', icon: '🌐' },
                { label: '💻 ساخت یک وب‌اپلیکیشن کامل با ری‌اکت و تیلویند', icon: '💻' },
                { label: '⚡ اسکریپت اتوماسیون پایتون برای پردازش فایل‌ها', icon: '⚡' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(item.label.replace(/^.+?\s/, ''));
                  }}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-200 text-right transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${isUser ? 'justify-start flex-row-reverse' : 'justify-start'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs shadow mt-0.5 ${
                    isUser
                      ? 'bg-gradient-to-tr from-blue-500 to-indigo-600 text-white'
                      : 'bg-gradient-to-tr from-purple-600 to-indigo-700 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3 sm:p-4 text-xs sm:text-[13px] leading-relaxed shadow-md ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* Model tag for assistant */}
                  {!isUser && msg.model && (
                    <div className="text-[10px] text-blue-400 font-mono mb-1.5 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>{msg.model}</span>
                    </div>
                  )}

                  {/* Attached Images in user message */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {msg.images.map((img, i) => (
                        <img
                          key={i}
                          src={img.data}
                          alt="attached"
                          className="w-24 h-24 object-cover rounded-xl border border-white/20"
                        />
                      ))}
                    </div>
                  )}

                  {/* Message Content with Markdown & Code Block Handling */}
                  {isUser ? (
                    <div className="whitespace-pre-wrap select-text">{msg.content}</div>
                  ) : (
                    <div className="markdown-body text-slate-100 select-text overflow-hidden space-y-2">
                      <Markdown
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeString = String(children).replace(/\n$/, '');
                            const lang = match ? match[1] : '';

                            if (!inline && codeString) {
                              const blockKey = `${msg.id}_${codeString.slice(0, 15)}`;
                              return (
                                <div className="my-3 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
                                  {/* Code Block Header */}
                                  <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                                    <div className="flex items-center gap-1.5 text-blue-400">
                                      <Code2 className="w-3.5 h-3.5" />
                                      <span>{lang ? lang.toUpperCase() : 'CODE'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => downloadCodeFile(codeString, lang)}
                                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[10px] transition-colors cursor-pointer"
                                        title="دانلود فایل اسکریپت"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>دانلود فایل</span>
                                      </button>
                                      <button
                                        onClick={() => handleCopyCode(codeString, blockKey)}
                                        className="px-2 py-0.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white flex items-center gap-1 text-[10px] transition-colors cursor-pointer"
                                        title="کپی کردن کد"
                                      >
                                        {copiedCodeIdx === blockKey ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-300" />
                                            <span>کپی شد!</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span>کپی کد</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  {/* Code Block Content */}
                                  <div className="p-3 overflow-x-auto text-left font-mono text-[11px] sm:text-xs text-emerald-300 bg-slate-950/90 leading-relaxed no-scrollbar" dir="ltr">
                                    <code>{codeString}</code>
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <code
                                className="px-1.5 py-0.5 rounded-lg bg-slate-800 font-mono text-[11px] text-amber-300 border border-slate-700/70"
                                dir="ltr"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          p({ children }) {
                            return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
                          },
                          ul({ children }) {
                            return <ul className="list-disc list-inside space-y-1 my-1.5 pr-2">{children}</ul>;
                          },
                          ol({ children }) {
                            return <ol className="list-decimal list-inside space-y-1 my-1.5 pr-2">{children}</ol>;
                          },
                          h1({ children }) {
                            return <h1 className="text-sm font-bold text-slate-100 my-2">{children}</h1>;
                          },
                          h2({ children }) {
                            return <h2 className="text-xs font-bold text-slate-100 my-1.5">{children}</h2>;
                          },
                          h3({ children }) {
                            return <h3 className="text-xs font-bold text-blue-400 my-1">{children}</h3>;
                          },
                        }}
                      >
                        {msg.content}
                      </Markdown>
                    </div>
                  )}

                  {/* Search Grounding links */}
                  {msg.grounding && msg.grounding.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
                      <span className="font-semibold text-blue-400">منابع اینترنتی:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {msg.grounding.map((g: any, i: number) => {
                          if (!g.web?.uri) return null;
                          return (
                            <a
                              key={i}
                              href={g.web.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 truncate max-w-[180px] inline-block"
                            >
                              {g.web.title || g.web.uri}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action buttons for assistant message */}
                  {!isUser && (
                    <div className="flex items-center justify-end gap-1 mt-2 pt-1 border-t border-slate-800/60 text-slate-400">
                      <button
                        onClick={() => handleSpeak(msg.content, msg.id)}
                        className="p-1 hover:text-slate-200 transition-colors cursor-pointer"
                        title="پخش صوتی"
                      >
                        {playingMessageId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="p-1 hover:text-slate-200 transition-colors cursor-pointer"
                        title="کپی کل پیام"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
            <div className="w-6 h-6 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="flex items-center gap-1">
              <span>{selectedModel.name} در حال نگارش و کامپایل پاسخ</span>
              <span className="animate-bounce">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form & Action Bar */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 backdrop-blur-lg z-10 space-y-2">
        {/* Attached image preview chips */}
        {attachedImages.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {attachedImages.map((img, i) => (
              <div key={i} className="relative group">
                <img
                  src={img.preview}
                  alt="preview"
                  className="w-12 h-12 object-cover rounded-xl border border-slate-700"
                />
                <button
                  onClick={() =>
                    setAttachedImages((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* File attachment input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer shrink-0"
            title="ارسال تصویر برای تحلیل"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice input button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-2.5 rounded-2xl border transition-colors cursor-pointer shrink-0 ${
              isListening
                ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="تایپ صوتی هوشمند"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Chat text input */}
          <input
            type="text"
            id="chat-input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`دستور ساخت ربات، برنامه یا پیام به ${selectedModel.name}...`}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            id="send-message-btn"
            disabled={(!input.trim() && attachedImages.length === 0) || isLoading}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4 rtl:rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
