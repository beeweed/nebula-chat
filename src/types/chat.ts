export interface FileWriteEvent {
  id: string;
  filePath: string;
  content: string;
  success: boolean;
  message: string;
  isStreaming?: boolean;
  streamedContent?: string;
}

export interface FileReadEvent {
  id: string;
  filePath: string;
  content: string;
  success: boolean;
  message: string;
  lineCount?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  fileWrites?: FileWriteEvent[];
  fileReads?: FileReadEvent[];
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
