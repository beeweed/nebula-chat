export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
  architecture?: {
    modality?: string;
  };
}

export interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  selectedModel: string;
  apiKey: string;
}
