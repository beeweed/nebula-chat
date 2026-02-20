import { useState } from 'react';
import { Settings, X, Key, RefreshCw, CheckCircle, AlertCircle, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  apiKey: string;
  e2bApiKey: string;
  onSave: (openRouterKey: string, e2bKey: string) => void;
  onClose: () => void;
  modelCount: number;
  modelsLoading: boolean;
  e2bConnected?: boolean;
  e2bConnecting?: boolean;
}

export function SettingsModal({
  apiKey,
  e2bApiKey,
  onSave,
  onClose,
  modelCount,
  modelsLoading,
  e2bConnected = false,
  e2bConnecting = false,
}: SettingsModalProps) {
  const [openRouterValue, setOpenRouterValue] = useState(apiKey);
  const [e2bValue, setE2bValue] = useState(e2bApiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const trimmedOpenRouter = openRouterValue.trim();
    const trimmedE2b = e2bValue.trim();
    onSave(trimmedOpenRouter, trimmedE2b);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isOpenRouterValid = openRouterValue.trim().startsWith('sk-');
  const isE2bValid = e2bValue.trim().startsWith('e2b_');
  const hasOpenRouterKey = apiKey.length > 0;
  const hasE2bKey = e2bApiKey.length > 0;
  const canSave = openRouterValue.trim() && e2bValue.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md animate-scale-in">
        <div className="glass-panel rounded-t-2xl sm:rounded-2xl border border-primary/30 shadow-glow-orange overflow-hidden max-h-[90vh] sm:max-h-none overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border sticky top-0 bg-[hsl(var(--card))] z-10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Settings size={16} className="sm:w-[18px] sm:h-[18px] text-primary" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-foreground">Settings</h2>
                <p className="text-xs text-muted-foreground">Configure your AI & Sandbox</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-muted active:scale-95 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 pb-safe">
            {/* OpenRouter API Key */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Key size={14} className="text-primary" />
                OpenRouter API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={openRouterValue}
                  onChange={(e) => setOpenRouterValue(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className={cn(
                    'w-full input-neon rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-mono',
                    'text-foreground placeholder:text-muted-foreground/40',
                    'pr-10'
                  )}
                />
                {openRouterValue && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isOpenRouterValid ? (
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
              </p>
            </div>

            {/* OpenRouter Status */}
            {hasOpenRouterKey && (
              <div className={cn(
                'flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border',
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
                  'text-xs sm:text-sm',
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
                    : 'Failed to load. Check API key.'}
                </span>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-border" />

            {/* E2B API Key */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Box size={14} className="text-blue-400" />
                E2B Sandbox API Key
                <span className="text-xs text-destructive">*required</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={e2bValue}
                  onChange={(e) => setE2bValue(e.target.value)}
                  placeholder="e2b_..."
                  className={cn(
                    'w-full input-neon rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-mono',
                    'text-foreground placeholder:text-muted-foreground/40',
                    'pr-10'
                  )}
                />
                {e2bValue && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isE2bValid ? (
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
                  href="https://e2b.dev/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  e2b.dev/dashboard
                </a>
                . Required for code sandbox.
              </p>
            </div>

            {/* E2B Status */}
            {hasE2bKey && (
              <div className={cn(
                'flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border',
                e2bConnecting
                  ? 'bg-muted/30 border-border'
                  : e2bConnected
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-blue-500/10 border-blue-500/20'
              )}>
                {e2bConnecting ? (
                  <RefreshCw size={14} className="text-muted-foreground animate-spin" />
                ) : e2bConnected ? (
                  <CheckCircle size={14} className="text-green-400" />
                ) : (
                  <Box size={14} className="text-blue-400" />
                )}
                <span className={cn(
                  'text-xs sm:text-sm',
                  e2bConnecting
                    ? 'text-muted-foreground'
                    : e2bConnected
                    ? 'text-green-400'
                    : 'text-blue-400'
                )}>
                  {e2bConnecting
                    ? 'Creating sandbox...'
                    : e2bConnected
                    ? 'Sandbox connected'
                    : 'Sandbox will start on first message'}
                </span>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
              <p className="text-xs text-blue-300">
                <strong>Note:</strong> Both API keys are required. The E2B sandbox will automatically start when you send your first message.
              </p>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={cn(
                'w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm transition-all duration-300 active:scale-[0.98]',
                canSave
                  ? saved
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                    : 'btn-neon'
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
              )}
            >
              {saved ? '✓ Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}