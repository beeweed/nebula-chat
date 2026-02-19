import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  disabled: boolean;
}

export function ChatInput({ onSend, isStreaming, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  };

  const canSend = value.trim().length > 0 && !isStreaming && !disabled;

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="neon-divider mb-3" />
      <div
        className={cn(
          'relative flex items-end gap-3 glass-panel rounded-2xl px-4 py-3 transition-all duration-300',
          'border',
          canSend
            ? 'border-primary/50 shadow-glow-orange-sm'
            : 'border-border'
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={
            disabled
              ? 'Add your OpenRouter API key in Settings to start chatting...'
              : 'Send a message... (Shift+Enter for new line)'
          }
          disabled={disabled || isStreaming}
          rows={1}
          className={cn(
            'flex-1 bg-transparent resize-none outline-none text-sm text-foreground',
            'placeholder:text-muted-foreground/50 leading-relaxed py-0.5 max-h-40',
            'scrollbar-thin disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
            'transition-all duration-300',
            canSend
              ? 'btn-neon cursor-pointer'
              : 'bg-muted text-muted-foreground cursor-not-allowed opacity-40'
          )}
        >
          {isStreaming ? (
            <Square size={16} fill="currentColor" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground/40 mt-2">
        AI can make mistakes. Verify important information.
      </p>
    </div>
  );
}
