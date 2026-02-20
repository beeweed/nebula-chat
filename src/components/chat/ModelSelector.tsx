import { useState, KeyboardEvent, useEffect, useRef } from 'react';
import { Search, ChevronDown, Zap, Brain, Cpu } from 'lucide-react';
import { OpenRouterModel } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  models: OpenRouterModel[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
  loading: boolean;
}

function getModelIcon(modelId: string) {
  if (modelId.includes('gpt') || modelId.includes('o1') || modelId.includes('o3')) return Zap;
  if (modelId.includes('claude') || modelId.includes('gemini')) return Brain;
  return Cpu;
}

function formatPrice(price: string | undefined) {
  if (!price) return null;
  const num = parseFloat(price) * 1_000_000;
  if (num === 0) return 'Free';
  return `$${num.toFixed(2)}/M`;
}

export function ModelSelector({ models, selectedModel, onSelect, loading }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase())
  );

  const selected = models.find((m) => m.id === selectedModel);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open]);

  const handleSelect = (modelId: string) => {
    onSelect(modelId);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  };

  const Icon = selected ? getModelIcon(selected.id) : Cpu;

  return (
    <div ref={dropdownRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading || models.length === 0}
        className={cn(
          'flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl glass-panel glow-border',
          'text-sm font-medium text-foreground min-w-[120px] sm:min-w-[180px] max-w-[180px] sm:max-w-[260px]',
          'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
          open && 'border-primary/50 shadow-glow-orange-sm'
        )}
      >
        <Icon size={14} className="text-primary flex-shrink-0" />
        <span className="truncate flex-1 text-left text-sm">
          {loading
            ? 'Loading models...'
            : selected
            ? selected.name
            : models.length === 0
            ? 'No models – add API key'
            : 'Select model...'}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'text-muted-foreground transition-transform flex-shrink-0',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 w-[calc(100vw-2rem)] sm:w-[360px] max-w-[360px] z-50 animate-scale-in">
          <div className="glass-panel rounded-2xl border border-primary/20 shadow-glow-orange-sm overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
                <Search size={14} className="text-muted-foreground flex-shrink-0" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search models..."
                  className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/50"
                />
                {search && (
                  <span className="text-xs text-muted-foreground">
                    {filtered.length} found
                  </span>
                )}
              </div>
            </div>

            {/* Model list */}
            <div className="max-h-72 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No models found
                </div>
              ) : (
                filtered.map((model) => {
                  const ModelIcon = getModelIcon(model.id);
                  const isSelected = model.id === selectedModel;
                  const promptPrice = formatPrice(model.pricing?.prompt);
                  const compPrice = formatPrice(model.pricing?.completion);

                  return (
                    <button
                      key={model.id}
                      onClick={() => handleSelect(model.id)}
                      className={cn(
                        'w-full flex items-start gap-3 px-4 py-3 text-left',
                        'transition-all duration-150 hover:bg-primary/10',
                        isSelected && 'bg-primary/15 border-l-2 border-primary'
                      )}
                    >
                      <ModelIcon
                        size={16}
                        className={cn(
                          'mt-0.5 flex-shrink-0',
                          isSelected ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-sm font-medium truncate',
                              isSelected ? 'text-primary' : 'text-foreground'
                            )}
                          >
                            {model.name}
                          </span>
                          {promptPrice && (
                            <span className="model-badge px-1.5 py-0.5 rounded flex-shrink-0">
                              {promptPrice}
                            </span>
                          )}
                        </div>
                        {model.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {model.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {model.context_length && (
                            <span className="text-xs text-muted-foreground/60">
                              {(model.context_length / 1000).toFixed(0)}k ctx
                            </span>
                          )}
                          {compPrice && compPrice !== promptPrice && (
                            <span className="text-xs text-muted-foreground/60">
                              out: {compPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
