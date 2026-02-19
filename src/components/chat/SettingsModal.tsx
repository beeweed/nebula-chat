import { useState } from 'react';
import { Settings, X, Key, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  apiKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
  modelCount: number;
  modelsLoading: boolean;
}

export function SettingsModal({
  apiKey,
  onSave,
  onClose,
  modelCount,
  modelsLoading,
}: SettingsModalProps) {
  const [inputValue, setInputValue] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const trimmed = inputValue.trim();
    onSave(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isValid = inputValue.trim().startsWith('sk-');
  const hasKey = apiKey.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="glass-panel rounded-2xl border border-primary/30 shadow-glow-orange overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Settings size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Settings</h2>
                <p className="text-xs text-muted-foreground">Configure your AI connection</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* API Key */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Key size={14} className="text-primary" />
                OpenRouter API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className={cn(
                    'w-full input-neon rounded-xl px-4 py-3 text-sm font-mono',
                    'text-foreground placeholder:text-muted-foreground/40',
                    'pr-10'
                  )}
                />
                {inputValue && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValid ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : (
                      <AlertCircle size={16} className="text-destructive/70" />
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  openrouter.ai/keys
                </a>
                . Keys are stored locally in your browser.
              </p>
            </div>

            {/* Status */}
            {hasKey && (
              <div className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border',
                modelsLoading
                  ? 'bg-muted/30 border-border'
                  : modelCount > 0
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-destructive/10 border-destructive/20'
              )}>
                <RefreshCw
                  size={14}
                  className={cn(
                    modelsLoading
                      ? 'text-muted-foreground animate-spin'
                      : modelCount > 0
                      ? 'text-green-400'
                      : 'text-destructive'
                  )}
                />
                <span className={cn(
                  'text-sm',
                  modelsLoading
                    ? 'text-muted-foreground'
                    : modelCount > 0
                    ? 'text-green-400'
                    : 'text-destructive'
                )}>
                  {modelsLoading
                    ? 'Loading models...'
                    : modelCount > 0
                    ? `${modelCount} models available`
                    : 'Failed to load models. Check your API key.'}
                </span>
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!inputValue.trim()}
              className={cn(
                'w-full py-3 rounded-xl font-medium text-sm transition-all duration-300',
                inputValue.trim()
                  ? saved
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                    : 'btn-neon'
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
              )}
            >
              {saved ? '✓ Saved & Models Reloading...' : 'Save & Fetch Models'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
