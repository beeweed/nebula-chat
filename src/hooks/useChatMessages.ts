import { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { streamChat } from '@/lib/openrouter';

// High-performance streaming hook with RAF-based batching
export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Refs for high-performance streaming - avoid state updates on every chunk
  const streamingIdRef = useRef<string | null>(null);
  const streamingContentRef = useRef<string>('');
  const rafIdRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const pendingUpdateRef = useRef<boolean>(false);
  
  // Expose streaming content via ref for direct DOM access
  const streamingContent = useRef<string>('');
  
  // Batched state update using RAF - targets 90fps (11ms)
  const scheduleUpdate = useCallback((assistantId: string) => {
    if (pendingUpdateRef.current) return;
    
    pendingUpdateRef.current = true;
    
    const performUpdate = () => {
      const now = performance.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      
      // Target ~90fps = 11ms between updates, but batch for efficiency
      if (timeSinceLastUpdate >= 11) {
        const content = streamingContentRef.current;
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.id === assistantId && lastMsg.content !== content) {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { ...lastMsg, content };
            return newMessages;
          }
          return prev;
        });
        lastUpdateTimeRef.current = now;
        pendingUpdateRef.current = false;
      } else {
        // Schedule next frame if we're throttling
        rafIdRef.current = requestAnimationFrame(performUpdate);
      }
    };
    
    rafIdRef.current = requestAnimationFrame(performUpdate);
  }, []);

  // Cleanup RAF on unmount
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

      const assistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsStreaming(true);

      const historyMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await streamChat(
        apiKey,
        model,
        historyMessages,
        (chunk) => {
          // Accumulate in ref - NO state update per chunk
          streamingContentRef.current += chunk;
          streamingContent.current = streamingContentRef.current;
          
          // Schedule batched RAF update
          scheduleUpdate(assistantId);
        },
        () => {
          // Final update with complete content
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
          }
          
          const finalContent = streamingContentRef.current;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: finalContent } : m
            )
          );
          
          setIsStreaming(false);
          streamingIdRef.current = null;
          streamingContentRef.current = '';
          pendingUpdateRef.current = false;
        },
        (error) => {
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
          }
          
          setIsStreaming(false);
          streamingIdRef.current = null;
          streamingContentRef.current = '';
          pendingUpdateRef.current = false;
          
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `Error: ${error.message}` }
                : m
            )
          );
        }
      );
    },
    [messages, isStreaming, scheduleUpdate]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    streamingContentRef.current = '';
    streamingContent.current = '';
  }, []);

  return { 
    messages, 
    isStreaming, 
    sendMessage, 
    clearMessages,
    streamingContent, // Expose ref for direct access
  };
}
