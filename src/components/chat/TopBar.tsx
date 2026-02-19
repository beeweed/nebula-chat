import { Settings, Bot, Trash2, MessageSquare, Code2 } from 'lucide-react';
import { OpenRouterModel } from '@/types/chat';
import { ModelSelector } from './ModelSelector';
import { cn } from '@/lib/utils';

interface TopBarProps {
  models: OpenRouterModel[];
  selectedModel: string;
  onModelSelect: (id: string) => void;
  modelsLoading: boolean;
  onSettingsOpen: () => void;
  onClearChat: () => void;
  onCodeSandboxOpen: () => void;
  messageCount: number;
  selectedModelInfo?: OpenRouterModel;
}

export function TopBar({
  models,
  selectedModel,
  onModelSelect,
  modelsLoading,
  onSettingsOpen,
  onClearChat,
  onCodeSandboxOpen,
  messageCount,
  selectedModelInfo,
}: TopBarProps) {
  return (
    <header className="flex-shrink-0 z-10">
      <div className="flex items-center justify-between px-4 py-3 glass-panel border-b border-border">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center shadow-glow-orange-sm">
            <Bot size={18} className="text-primary" />
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-semibold text-foreground tracking-tight">
              Neural<span className="text-primary">Chat</span>
            </span>
          </div>
        </div>

        {/* Center: Model info badge */}
        {selectedModelInfo?.description && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/50 border border-border max-w-[300px]">
            <MessageSquare size={12} className="text-accent flex-shrink-0" />
            <p className="text-xs text-muted-foreground truncate">
              {selectedModelInfo.description}
            </p>
          </div>
        )}

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <ModelSelector
            models={models}
            selectedModel={selectedModel}
            onSelect={onModelSelect}
            loading={modelsLoading}
          />

          {messageCount > 0 && (
            <button
              onClick={onClearChat}
              title="Clear chat"
              className={cn(
                'w-9 h-9 rounded-xl glass-panel glow-border flex items-center justify-center',
                'text-muted-foreground hover:text-destructive transition-all duration-200'
              )}
            >
              <Trash2 size={16} />
            </button>
          )}

          <button
            onClick={onCodeSandboxOpen}
            title="Open Code Sandbox"
            className={cn(
              'w-9 h-9 rounded-xl glass-panel glow-border flex items-center justify-center',
              'text-muted-foreground hover:text-primary transition-all duration-200'
            )}
            data-design-id="code-sandbox-toggle-btn"
          >
            <Code2 size={16} />
          </button>

          <button
            onClick={onSettingsOpen}
            className={cn(
              'w-9 h-9 rounded-xl glass-panel glow-border flex items-center justify-center',
              'text-muted-foreground hover:text-primary transition-all duration-200'
            )}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Model description bar for mobile */}
      {selectedModelInfo?.description && (
        <div className="md:hidden flex items-center gap-2 px-4 py-1.5 border-b border-border bg-muted/20">
          <MessageSquare size={11} className="text-accent flex-shrink-0" />
          <p className="text-xs text-muted-foreground truncate">
            {selectedModelInfo.description}
          </p>
        </div>
      )}
    </header>
  );
}
