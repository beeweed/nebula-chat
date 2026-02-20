import React, { useRef, useEffect, useCallback } from 'react';
import { Bot, User, Copy, Check } from 'lucide-react';
import { Message } from '@/types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FileWriteBlock } from './FileWriteBlock';
import { cn } from '@/lib/utils';

interface ChatMessagesProps {
  messages: Message[];
  isStreaming: boolean;
}

// Typing dots animation shown before first chunk arrives
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1 h-6">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-accent animate-typing-dot"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground"
    >
      {copied ? (
        <Check size={14} className="text-green-400" />
      ) : (
        <Copy size={14} />
      )}
    </button>
  );
}

export function ChatMessages({ messages, isStreaming }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserNearBottomRef = useRef(true);
  const scrollRAFRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(0);

  // Check if user is near the bottom of the scroll container
  const checkIfNearBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;
    
    const threshold = 150; // pixels from bottom to consider "near bottom"
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < threshold;
  }, []);

  // Smooth scroll to bottom with throttling
  const scrollToBottom = useCallback((force = false) => {
    const container = containerRef.current;
    if (!container) return;
    
    // Only auto-scroll if user is near bottom or forced
    if (!force && !isUserNearBottomRef.current) return;
    
    // Throttle scroll updates during streaming (every 50ms)
    const now = performance.now();
    if (now - lastScrollTimeRef.current < 50) {
      // Schedule a scroll at the end of the throttle period
      if (!scrollRAFRef.current) {
        scrollRAFRef.current = requestAnimationFrame(() => {
          scrollRAFRef.current = null;
          scrollToBottom(force);
        });
      }
      return;
    }
    lastScrollTimeRef.current = now;
    
    // Use scrollTop for smoother control
    const targetScroll = container.scrollHeight - container.clientHeight;
    container.scrollTop = targetScroll;
  }, []);

  // Track user scroll position
  const handleScroll = useCallback(() => {
    isUserNearBottomRef.current = checkIfNearBottom();
  }, [checkIfNearBottom]);

  // Scroll on new messages - uses messages.length intentionally to avoid 
  // triggering on every streaming content update
  const messagesLength = messages.length;
  const lastMsgRole = messages[messagesLength - 1]?.role;
  
  useEffect(() => {
    // Force scroll when a new user message arrives
    if (lastMsgRole === 'user') {
      isUserNearBottomRef.current = true;
      scrollToBottom(true);
    }
  }, [messagesLength, lastMsgRole, scrollToBottom]);

  // Smooth scroll during streaming
  useEffect(() => {
    if (isStreaming) {
      scrollToBottom();
    }
  }, [messages, isStreaming, scrollToBottom]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (scrollRAFRef.current) {
        cancelAnimationFrame(scrollRAFRef.current);
      }
    };
  }, []);

  const lastMsg = messages[messages.length - 1];
  // Show typing dots only when streaming has started but no content yet
  const showTypingDots =
    isStreaming && lastMsg?.role === 'assistant' && lastMsg?.content === '';

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 scroll-smooth">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-center animate-fade-in px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl glass-panel border border-primary/30 flex items-center justify-center mb-4 sm:mb-6 shadow-glow-orange-sm">
            <Bot size={28} className="sm:w-9 sm:h-9 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
            How can I assist you today?
          </h2>
          <p className="text-muted-foreground max-w-md text-xs sm:text-sm">
            Select a model and enter your OpenRouter API key in Settings to start chatting.
          </p>
        </div>
      )}

      {messages.map((msg, i) => (
        <MessageRow
          key={msg.id}
          message={msg}
          isLatest={i === messages.length - 1}
          isStreaming={isStreaming}
          showTypingDots={showTypingDots && i === messages.length - 1}
        />
      ))}

      {/* Spacer for scroll padding */}
      <div className="h-4" aria-hidden="true" />
    </div>
  );
}

function MessageRow({
  message,
  isLatest,
  isStreaming,
  showTypingDots,
}: {
  message: Message;
  isLatest: boolean;
  isStreaming: boolean;
  showTypingDots: boolean;
}) {
  const isUser = message.role === 'user';
  const isStreamingThis = isLatest && isStreaming && !isUser;

  return (
    <div
      className={cn(
        'flex gap-2 sm:gap-3 animate-message-in group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center',
          isUser
            ? 'bg-primary shadow-glow-orange-sm'
            : 'glass-panel border border-accent/30 shadow-glow-cyan-sm'
        )}
      >
        {isUser ? (
          <User size={14} className="sm:w-4 sm:h-4 text-primary-foreground" />
        ) : (
          <Bot size={14} className="sm:w-4 sm:h-4 text-accent" />
        )}
      </div>

      {/* Content */}
      {isUser ? (
        /* User: chat bubble */
        <div className="relative max-w-[85%] sm:max-w-[75%] rounded-xl sm:rounded-2xl rounded-tr-sm px-3 sm:px-4 py-2 sm:py-3 text-sm leading-relaxed chat-bubble-user">
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
        </div>
      ) : (
        /* Assistant: NO bubble — plain text on dark background */
        <div className="relative flex-1 min-w-0 text-sm leading-relaxed text-foreground/90 pt-0.5 sm:pt-1">
          {/* Copy button */}
          {message.content && (
            <div className="absolute top-0 right-0 opacity-0 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={message.content} />
            </div>
          )}

          {showTypingDots ? (
            <TypingDots />
          ) : (
            <>
              <div className="prose-content pr-6 sm:pr-8">
                <MarkdownRenderer content={message.content} isStreaming={isStreamingThis} />
              </div>
              
              {/* File Write Blocks */}
              {message.fileWrites && message.fileWrites.length > 0 && (
                <div className="mt-4 space-y-2">
                  {message.fileWrites.map((fw) => (
                    <FileWriteBlock
                      key={fw.id}
                      filePath={fw.filePath}
                      content={fw.content}
                      success={fw.success}
                      message={fw.message}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
