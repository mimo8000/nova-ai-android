import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Image as ImageIcon,
  Film,
  Sparkles,
  Settings,
  Shield,
  Key,
  Waves,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AndroidFrame } from './components/AndroidFrame';
import { LockScreen } from './components/LockScreen';
import { ChatView } from './components/ChatView';
import { ImageGenView } from './components/ImageGenView';
import { VideoGenView } from './components/VideoGenView';
import { ToolsView } from './components/ToolsView';
import { MeditationView } from './components/MeditationView';
import { SettingsModal } from './components/SettingsModal';
import { ApiKeyQuickModal } from './components/ApiKeyQuickModal';
import { getLicense, isAdmin, License } from './utils/license';
import {
  ChatMessage,
  GeneratedImage,
  GeneratedVideo,
  TabType,
  AppTheme,
  AIModelType,
} from './types';

export default function App() {
  const [license, setLicense] = useState<License | null>(() => getLicense());
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('nova_ai_theme');
    if (saved) return saved as AppTheme;
    return 'pink';
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('nova_ai_chat');
    return saved ? JSON.parse(saved) : [];
  });
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [images, setImages] = useState<GeneratedImage[]>(() => {
    const saved = localStorage.getItem('nova_ai_images');
    return saved ? JSON.parse(saved) : [];
  });

  const [videos, setVideos] = useState<GeneratedVideo[]>(() => {
    const saved = localStorage.getItem('nova_ai_videos');
    return saved ? JSON.parse(saved) : [];
  });

  // Save theme changes
  useEffect(() => {
    localStorage.setItem('nova_ai_theme', theme);
  }, [theme]);

  // Save chat messages
  useEffect(() => {
    localStorage.setItem('nova_ai_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Save images
  useEffect(() => {
    localStorage.setItem('nova_ai_images', JSON.stringify(images));
  }, [images]);

  // Save videos
  useEffect(() => {
    localStorage.setItem('nova_ai_videos', JSON.stringify(videos));
  }, [videos]);

  // Fast Chat Send Handler with Model Selection & Resilient Streaming
  const handleSendMessage = async (
    content: string,
    imagesToSend?: { data: string; mimeType: string }[],
    webSearch?: boolean,
    model: AIModelType = 'gemini-3.7-flash',
    systemPrompt?: string
  ) => {
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content,
      timestamp: Date.now(),
      images: imagesToSend,
      model,
    };

    // Filter out previous error bubbles from history
    const cleanHistory = chatMessages.filter(
      (m) => m && m.content && !m.content.startsWith('⚠️')
    );
    const newHistory = [...cleanHistory, userMsg];
    setChatMessages((prev) => [...prev.filter((m) => m.content && !m.content.startsWith('⚠️')), userMsg]);
    setIsChatLoading(true);

    const assistantMsgId = 'msg_' + (Date.now() + 1);

    try {
      // 1. Try Streaming First for Real-time Generation
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          webSearch,
          model,
          systemPrompt,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`پاسخ سرور با کد ${response.status} دریافت شد`);
      }

      // Add placeholder for assistant message
      const initialAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        model,
      };
      setChatMessages((prev) => [...prev, initialAssistantMsg]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let groundingData: any = [];
      let hadStreamError = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);
              if (data.error) {
                hadStreamError = true;
              } else if (data.done) {
                if (data.fullText) accumulatedText = data.fullText;
                if (data.grounding) groundingData = data.grounding;
              } else if (data.text) {
                accumulatedText += data.text;
              }

              // Update the assistant message in state live
              setChatMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        content: accumulatedText,
                        grounding: groundingData.length > 0 ? groundingData : msg.grounding,
                        model: data.model || model,
                      }
                    : msg
                )
              );
            } catch {
              // Ignore partial stream line parse errors
            }
          }
        }
      }

      // If stream was empty or failed, try standard fallback fetch
      if (!accumulatedText.trim() || hadStreamError) {
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newHistory,
            webSearch,
            model,
            systemPrompt,
            stream: false,
          }),
        });
        const fbData = await fallbackRes.json();
        if (fbData.success && fbData.text) {
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: fbData.text,
                    grounding: fbData.grounding || [],
                    model: fbData.model || model,
                  }
                : msg
            )
          );
        } else {
          throw new Error(fbData.error || 'خطا در دریافت پاسخ هوش مصنوعی');
        }
      }
    } catch (err: any) {
      console.warn('Attempting standard API fallback after stream error...', err);
      try {
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newHistory,
            webSearch,
            model: 'gemini-2.5-flash',
            systemPrompt,
            stream: false,
          }),
        });
        const fbData = await fallbackRes.json();
        if (fbData.success && fbData.text) {
          const directMsg: ChatMessage = {
            id: assistantMsgId,
            role: 'assistant',
            content: fbData.text,
            timestamp: Date.now(),
            model: 'gemini-2.5-flash',
            grounding: fbData.grounding,
          };
          setChatMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== assistantMsgId);
            return [...filtered, directMsg];
          });
          return;
        }
      } catch (nestedErr: any) {
        console.error('All chat attempts failed:', nestedErr);
      }

      const errorMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: `⚠️ اتصال برقرار نشد: ${err.message || 'لطفاً دوباره پیام خود را بفرستید'}.`,
        timestamp: Date.now(),
        model,
      };
      setChatMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== assistantMsgId);
        return [...filtered, errorMsg];
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('آیا مایل به پاک کردن گفتگوها هستید؟')) {
      setChatMessages([]);
      localStorage.removeItem('nova_ai_chat');
    }
  };

  const handleAddImage = (newImg: GeneratedImage) => {
    setImages((prev) => [newImg, ...prev]);
  };

  const handleAddVideo = (newVid: GeneratedVideo) => {
    setVideos((prev) => [newVid, ...prev]);
  };

  const handleLockNow = () => {
    setLicense(null);
    setActiveTab('chat');
  };

  const handleUnlock = (lic: License) => {
    setLicense(lic);
  };

  const handleClearAllData = () => {
    setChatMessages([]);
    setImages([]);
    setVideos([]);
    localStorage.removeItem('nova_ai_chat');
    localStorage.removeItem('nova_ai_images');
    localStorage.removeItem('nova_ai_videos');
  };

  // Resolve active theme style helpers
  const isPinkTheme = theme === 'pink' || theme === 'cyber-neon';
  const isWhiteTheme = theme === 'white';
  const isBlueTheme = theme === 'blue' || theme === 'pure-midnight' || theme === 'material-dark';

  const navContainerClass = isPinkTheme
    ? 'bg-[#190717]/95 border-pink-950 text-pink-200'
    : isWhiteTheme
    ? 'bg-white/95 border-slate-200 text-slate-800'
    : isBlueTheme
    ? 'bg-[#08122c]/95 border-blue-950 text-blue-200'
    : 'bg-black/95 border-neutral-900 text-neutral-200';

  const activeIndicatorClass = isPinkTheme
    ? 'bg-pink-500/20 border border-pink-500/40 text-pink-400'
    : isWhiteTheme
    ? 'bg-blue-50 border border-blue-300 text-blue-600 shadow-sm'
    : isBlueTheme
    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
    : 'bg-neutral-800 border border-neutral-700 text-neutral-100';

  const activeTextClass = isPinkTheme
    ? 'text-pink-400'
    : isWhiteTheme
    ? 'text-blue-700 font-extrabold'
    : isBlueTheme
    ? 'text-blue-400'
    : 'text-neutral-100';

  return (
    <AndroidFrame isLocked={!license} activeTab={activeTab} theme={theme}>
      <AnimatePresence mode="wait">
        {!license ? (
          /* Lock Screen — subscription code only */
          <motion.div
            key="lock-screen-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 flex flex-col h-full"
          >
            <LockScreen onUnlock={handleUnlock} />
          </motion.div>
        ) : (
          /* Unlocked Main AI Application */
          <motion.div
            key="app-main-workspace"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full overflow-hidden relative"
          >
            {/* View Port Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {activeTab === 'chat' && (
                <ChatView
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  onClearChat={handleClearChat}
                  isLoading={isChatLoading}
                />
              )}

              {activeTab === 'image' && (
                <ImageGenView images={images} onAddImage={handleAddImage} />
              )}

              {activeTab === 'video' && (
                <VideoGenView videos={videos} onAddVideo={handleAddVideo} />
              )}

              {activeTab === 'tools' && (
                <ToolsView
                  onUsePromptInChat={(p) => {
                    setActiveTab('chat');
                    handleSendMessage(p);
                  }}
                  onUsePromptInImage={(p) => {
                    setActiveTab('image');
                  }}
                  onUsePromptInVideo={(p) => {
                    setActiveTab('video');
                  }}
                />
              )}

              {activeTab === 'meditation' && <MeditationView />}

              {activeTab === 'settings' && (
                <SettingsModal
                  onLockNow={handleLockNow}
                  theme={theme}
                  onChangeTheme={(t) => setTheme(t)}
                  onClearAllData={handleClearAllData}
                />
              )}
            </div>

            {/* Android Material 3 Bottom Navigation Bar */}
            <div
              id="android-bottom-nav"
              className={`px-2 py-1.5 ${navContainerClass} border-t backdrop-blur-xl flex items-center justify-around z-30 select-none transition-colors duration-300`}
            >
              {[
                { id: 'chat', label: 'چت AI', icon: MessageSquare, badge: '' },
                { id: 'image', label: 'عکس 4K', icon: ImageIcon, badge: '' },
                { id: 'video', label: 'ویدیو AI', icon: Film, badge: '' },
                { id: 'meditation', label: 'مدیتیشن', icon: Waves, badge: '' },
                { id: 'tools', label: 'ابزارها', icon: Sparkles, badge: '' },
                { id: 'settings', label: 'تنظیمات', icon: Key, badge: '' },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`nav-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                      isActive
                        ? activeTextClass
                        : isWhiteTheme
                        ? 'text-slate-500 hover:text-slate-900'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-indicator"
                        className={`absolute inset-0 rounded-2xl ${activeIndicatorClass}`}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <IconComponent
                      className={`w-5 h-5 relative z-10 transition-transform ${
                        isActive ? `scale-110 ${activeTextClass}` : ''
                      }`}
                    />
                    <span className="text-[10px] font-bold mt-0.5 relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Floating quick API-key button — admin only, above the chat composer */}
            {!showKeyModal && isAdmin() && (
              <button
                id="quick-key-fab"
                onClick={() => setShowKeyModal(true)}
                className="absolute bottom-[150px] right-3 z-40 w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/30 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                title="تغییر سریع کلید API"
              >
                <Key className="w-5 h-5" />
              </button>
            )}

            <ApiKeyQuickModal open={showKeyModal} onClose={() => setShowKeyModal(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </AndroidFrame>
  );
}
