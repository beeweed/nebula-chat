import React, { useState } from 'react';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  language: string;
  code: string;
}

// Very simple syntax highlighter using regex coloring
function highlightCode(code: string, lang: string): React.ReactNode {
  if (!lang || lang === 'text') {
    return <span className="text-foreground">{code}</span>;
  }

  // Basic token regex
  const tokenize = (src: string): React.ReactNode[] => {
    const rules: Array<{ pattern: RegExp; className: string }> = [
      { pattern: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/g, className: 'text-muted-foreground italic' },
      { pattern: /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g, className: 'text-green-400' },
      { pattern: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|new|this|typeof|instanceof|true|false|null|undefined|def|self|print|in|is|not|and|or|elif|pass|break|continue|try|except|finally|with|as|yield|lambda|raise|del|global|nonlocal)\b/g, className: 'text-primary font-medium' },
      { pattern: /\b(\d+\.?\d*)\b/g, className: 'text-accent' },
      { pattern: /\b([A-Z][a-zA-Z0-9_]*)\b/g, className: 'text-yellow-400' },
      { pattern: /([()[\]{};,.])/g, className: 'text-muted-foreground' },
    ];

    const result: React.ReactNode[] = [];
    let remaining = src;
    let key = 0;

    while (remaining.length > 0) {
      let matched = false;
      let earliest: { index: number; match: RegExpExecArray; className: string } | null = null;

      for (const rule of rules) {
        rule.pattern.lastIndex = 0;
        const m = rule.pattern.exec(remaining);
        if (m && (earliest === null || m.index < earliest.index)) {
          earliest = { index: m.index, match: m, className: rule.className };
        }
      }

      if (earliest) {
        if (earliest.index > 0) {
          result.push(<span key={key++} className="text-foreground">{remaining.slice(0, earliest.index)}</span>);
        }
        result.push(
          <span key={key++} className={earliest.className}>
            {earliest.match[0]}
          </span>
        );
        remaining = remaining.slice(earliest.index + earliest.match[0].length);
        matched = true;
      }

      if (!matched) {
        result.push(<span key={key++} className="text-foreground">{remaining}</span>);
        break;
      }
    }

    return result;
  };

  return <>{tokenize(code)}</>;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="code-block my-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/30 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              size={14}
              className={cn('transition-transform', collapsed && '-rotate-90')}
            />
          </button>
          <span className="text-xs font-mono text-primary/80 uppercase tracking-wider">
            {language}
          </span>
          <span className="text-xs text-muted-foreground">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-white/5"
        >
          {copied ? (
            <>
              <Check size={12} className="text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      {!collapsed && (
        <div className="overflow-x-auto p-4">
          <pre className="font-mono text-sm leading-relaxed">
            <code>{highlightCode(code, language)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
