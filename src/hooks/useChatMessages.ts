import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, FileWriteEvent } from '@/types/chat';
import { streamChatWithTools, ToolCallEvent } from '@/lib/openrouter';

interface UseChatMessagesOptions {
  writeFile?: (path: string, content: string) => Promise<boolean>;
  makeDirectory?: (path: string) => Promise<boolean>;
}

export function useChatMessages(options: UseChatMessagesOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const streamingIdRef = useRef<string | null>(null);
  const streamingContentRef = useRef<string>('');
  const rafIdRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const pendingUpdateRef = useRef<boolean>(false);
  const fileWritesRef = useRef<FileWriteEvent[]>([]);
  
  const streamingContent = useRef<string>('');
  
  const scheduleUpdate = useCallback((assistantId: string) => {
    if (pendingUpdateRef.current) return;
    
    pendingUpdateRef.current = true;
    
    const performUpdate = () => {
      const now = performance.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      
      if (timeSinceLastUpdate >= 11) {
        const content = streamingContentRef.current;
        const currentFileWrites = [...fileWritesRef.current];
        
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.id === assistantId) {
            const needsUpdate = lastMsg.content !== content || 
              JSON.stringify(lastMsg.fileWrites) !== JSON.stringify(currentFileWrites);
            
            if (needsUpdate) {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { 
                ...lastMsg, 
                content,
                fileWrites: currentFileWrites.length > 0 ? currentFileWrites : undefined
              };
              return newMessages;
            }
          }
          return prev;
        });
        lastUpdateTimeRef.current = now;
        pendingUpdateRef.current = false;
      } else {
        rafIdRef.current = requestAnimationFrame(performUpdate);
      }
    };
    
    rafIdRef.current = requestAnimationFrame(performUpdate);
  }, []);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string, apiKey: string, model: string) => {
      if (!content.trim() || isStreaming || !apiKey || !model) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);

      const assistantId = crypto.randomUUID();
      streamingIdRef.current = assistantId;
      streamingContentRef.current = '';
      streamingContent.current = '';
      lastUpdateTimeRef.current = 0;
      fileWritesRef.current = [];

      const assistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        fileWrites: [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsStreaming(true);

      const historyMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const handleToolCall = (event: ToolCallEvent) => {
        const fileWriteEvent: FileWriteEvent = {
          id: event.toolCallId,
          filePath: event.filePath,
          content: event.content,
          success: event.result.success,
          message: event.result.message,
        };
        
        fileWritesRef.current = [...fileWritesRef.current, fileWriteEvent];
        scheduleUpdate(assistantId);
      };

      await streamChatWithTools({
        apiKey,
        model,
        messages: historyMessages,
        onChunk: (chunk) => {
          streamingContentRef.current += chunk;
          streamingContent.current = streamingContentRef.current;
          scheduleUpdate(assistantId);
        },
        onToolCall: handleToolCall,
        onDone: () => {
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
          }
          
          const finalContent = streamingContentRef.current;
          const finalFileWrites = [...fileWritesRef.current];
          
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId 
                ? { 
                    ...m, 
                    content: finalContent,
                    fileWrites: finalFileWrites.length > 0 ? finalFileWrites : undefined
                  } 
                : m
            )
          );
          
          setIsStreaming(false);
          streamingIdRef.current = null;
          streamingContentRef.current = '';
          pendingUpdateRef.current = false;
          fileWritesRef.current = [];
        },
        onError: (error) => {
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
          }
          
          setIsStreaming(false);
          streamingIdRef.current = null;
          streamingContentRef.current = '';
          pendingUpdateRef.current = false;
          fileWritesRef.current = [];
          
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `Error: ${error.message}` }
                : m
            )
          );
        },
        writeFile: options.writeFile || (async () => false),
        makeDirectory: options.makeDirectory || (async () => false),
      });
    },
    [messages, isStreaming, scheduleUpdate, options.writeFile, options.makeDirectory]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    streamingContentRef.current = '';
    streamingContent.current = '';
    fileWritesRef.current = [];
  }, []);

  return { 
    messages, 
    isStreaming, 
    sendMessage, 
    clearMessages,
    streamingContent,
  };
}
