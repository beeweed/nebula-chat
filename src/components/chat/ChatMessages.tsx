import React, { useRef, useEffect } from 'react';
import { Bot, User, Copy, Check } from 'lucide-react';
import { Message } from '@/types/chat';
import { TypingIndicator } from './TypingIndicator';
import { CodeBlock } from './CodeBlock';
import { cn } from '@/lib/utils';

interface ChatMessagesProps {
  messages: Message[];
  isStreaming: boolean;
  streamingMessageId?: string;
}

function parseContent(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      parts.push(<InlineText key={key++} text={text} />);
    }
    parts.push(
      <CodeBlock key={key++} language={match[1] || 'text'} code={match[2].trim()} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(<InlineText key={key++} text={content.slice(lastIndex)} />);
  }

  return parts;
}

function InlineText({ text }: { text: string }) {
  // Inline code
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="font-mono text-sm px-1.5 py-0.5 rounded bg-black/40 border border-primary/20 text-primary"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return (
          <span key={i} className="whitespace-pre-wrap break-words">
            {part}
          </span>
        );
      })}
    </span>
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const lastMsg = messages[messages.length - 1];
  const showTyping =
    isStreaming && lastMsg?.role === 'assistant' && lastMsg?.content === '';

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl glass-panel border border-primary/30 flex items-center justify-center mb-6 shadow-glow-orange-sm">
            <Bot size={36} className="text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            How can I assist you today?
          </h2>
          <p className="text-muted-foreground max-w-md text-sm">
            Select a model from the top bar and enter your OpenRouter API key in Settings to start chatting.
          </p>
        </div>
      )}

      {messages.map((msg, i) => (
        <MessageRow key={msg.id} message={msg} isLatest={i === messages.length - 1} isStreaming={isStreaming} />
      ))}

      {showTyping && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}

function MessageRow({
  message,
  isLatest,
  isStreaming,
}: {
  message: Message;
  isLatest: boolean;
  isStreaming: boolean;
}) {
  const isUser = message.role === 'user';
  const isStreamingThis = isLatest && isStreaming && !isUser;

  return (
    <div
      className={cn(
        'flex gap-3 animate-message-in group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
          isUser
            ? 'bg-primary shadow-glow-orange-sm'
            : 'glass-panel border border-accent/30 shadow-glow-cyan-sm'
        )}
      >
        {isUser ? (
          <User size={16} className="text-primary-foreground" />
        ) : (
          <Bot size={16} className="text-accent" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'relative max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'chat-bubble-user rounded-tr-sm'
            : 'chat-bubble-assistant rounded-tl-sm'
        )}
      >
        {/* Copy button */}
        {!isUser && message.content && (
          <div className="absolute top-2 right-2">
            <CopyButton text={message.content} />
          </div>
        )}

        {isUser ? (
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            {parseContent(message.content)}
            {isStreamingThis && (
              <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
