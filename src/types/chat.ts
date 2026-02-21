export interface FileWriteEvent {
  id: string;
  filePath: string;
  content: string;
  success: boolean;
  message: string;
  isStreaming?: boolean;
  streamedContent?: string;
}

export interface CommandExecutionEvent {
  id: string;
  command: string;
  description: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  success: boolean;
  isRunning: boolean;
  isBackground: boolean;
  timedOut: boolean;
  message: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  fileWrites?: FileWriteEvent[];
  commandExecutions?: CommandExecutionEvent[];
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
