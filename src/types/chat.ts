export interface FileWriteEvent {
  id: string;
  filePath: string;
  content: string;
  success: boolean;
  message: string;
  isStreaming?: boolean;
  streamedContent?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  fileWrites?: FileWriteEvent[];
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
