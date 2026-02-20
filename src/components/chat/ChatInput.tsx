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
    <div className="px-3 sm:px-4 pb-4 pt-2 pb-safe">
      <div className="neon-divider mb-2 sm:mb-3" />
      <div
        className={cn(
          'relative flex items-end gap-2 sm:gap-3 glass-panel rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-300',
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
              ? 'Add API key in Settings...'
              : 'Send a message...'
          }
          disabled={disabled || isStreaming}
          rows={1}
          className={cn(
            'flex-1 bg-transparent resize-none outline-none text-sm sm:text-base text-foreground',
            'placeholder:text-muted-foreground/50 leading-relaxed py-0.5 max-h-32 sm:max-h-40',
            'scrollbar-thin disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            'flex-shrink-0 w-10 h-10 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center',
            'transition-all duration-300 active:scale-95',
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

      <p className="hidden sm:block text-center text-xs text-muted-foreground/40 mt-2">
        AI can make mistakes. Verify important information.
      </p>
    </div>
  );
}
