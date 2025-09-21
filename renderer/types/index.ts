import type { SelectProps } from 'naive-ui';

export type Model = { id: number, name: string; description: string; };

export type SelectValue = SelectProps['value'];

export interface Conversation {
  id: number;
  title: string;
  selectedModel: string;
  createdAt: number;
  updatedAt: number;
  providerId: number;
  pinned: boolean;
  type?: 'divider' | 'conversation';
}

export type MessageStatus = 'loading' | 'streaming' | 'success' | 'error';
export interface Message {
  id: number;
  content: string;
  type: 'question' | 'answer';
  createdAt: number;
  updatedAt?: number;
  status?: MessageStatus
  conversationId: number;
}

export interface Provider {
  id: number;
  name: string;
  visible?: boolean;
  title?: string;
  type?: 'OpenAI';
  openAISetting?: {
    baseURL?: string;
    apiKey?: string;
  };
  createdAt: number;
  updatedAt: number;
  models: string[];
}
