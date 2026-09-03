export type AIModelType =
  | 'gemini-3.7-flash'
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.1-pro-preview'
  | 'gemini-flash-latest'
  | 'grok-3'
  | 'qwen3.8-flash'
  | 'glm-5.3-flash'
  | 'deepseek-v4-flash'
  | 'hy3'
  | 'mimo';

export interface AIModelOption {
  id: AIModelType;
  name: string;
  badge: string;
  desc: string;
  speed: string;
  icon: string;
  pro?: boolean;
  locked?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  images?: { data: string; mimeType: string }[];
  grounding?: { web?: { uri?: string; title?: string } }[];
  model?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  style: string;
  aspectRatio: string;
  imageUrl: string;
  createdAt: number;
  tags?: string[];
}

export interface VideoScene {
  sceneNumber: number;
  visual: string;
  camera: string;
  duration: string;
  audio?: string;
}

export interface GeneratedVideo {
  id: string;
  prompt: string;
  title: string;
  synopsis?: string;
  scenes: VideoScene[];
  sceneImages?: string[];
  aspectRatio: string;
  resolution: string;
  videoUrl?: string;
  videoPrompt?: string;
  createdAt: number;
}

export type TabType = 'chat' | 'image' | 'video' | 'tools' | 'meditation' | 'settings';

export type AppTheme =
  | 'pink'
  | 'black'
  | 'blue'
  | 'white'
  | 'amoled'
  | 'material-dark'
  | 'cyber-neon'
  | 'pure-midnight';
