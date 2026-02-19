import { useState, useCallback, useRef } from 'react';
import { Message } from '@/types/chat';
import { streamChat } from '@/lib/openrouter';

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingIdRef = useRef<string | null>(null);

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
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          );
        },
        () => {
          setIsStreaming(false);
          streamingIdRef.current = null;
        },
        (error) => {
          setIsStreaming(false);
          streamingIdRef.current = null;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `❌ Error: ${error.message}` }
                : m
            )
          );
        }
      );
    },
    [messages, isStreaming]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isStreaming, sendMessage, clearMessages };
}
