import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  language: string;
  code: string;
}

// Token types for the advanced syntax highlighter
type TokenType =
  | 'comment'
  | 'string'
  | 'keyword'
  | 'number'
  | 'class'
  | 'function'
  | 'operator'
  | 'punctuation'
  | 'variable'
  | 'tag'
  | 'attribute'
  | 'plain';

interface Token {
  type: TokenType;
  value: string;
}

const KEYWORD_SETS: Record<string, Set<string>> = {
  js: new Set(['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','class','extends','new','this','super','import','export','default','from','as','async','await','try','catch','finally','throw','typeof','instanceof','in','of','delete','void','static','get','set','yield','true','false','null','undefined']),
  ts: new Set(['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','class','extends','new','this','super','import','export','default','from','as','async','await','try','catch','finally','throw','typeof','instanceof','in','of','delete','void','static','get','set','yield','true','false','null','undefined','type','interface','enum','namespace','declare','abstract','readonly','private','protected','public','implements','keyof','infer','never','any','unknown','string','number','boolean','object','symbol']),
  py: new Set(['def','class','return','if','elif','else','for','while','in','is','not','and','or','import','from','as','try','except','finally','with','yield','lambda','pass','break','continue','raise','del','global','nonlocal','True','False','None','async','await','print','len','range','type','self','super']),
  go: new Set(['func','var','const','type','struct','interface','return','if','else','for','range','switch','case','default','break','continue','goto','defer','go','chan','select','map','package','import','true','false','nil','make','new','len','cap','append','copy','delete','close']),
  rust: new Set(['fn','let','mut','const','static','struct','enum','trait','impl','use','mod','pub','crate','super','self','where','type','dyn','async','await','move','return','if','else','loop','while','for','in','match','break','continue','true','false','None','Some','Ok','Err']),
};

function getKeywords(lang: string): Set<string> {
  const map: Record<string, string> = {
    javascript: 'js', jsx: 'js', typescript: 'ts', tsx: 'ts',
    python: 'py', go: 'go', rust: 'rust',
  };
  return KEYWORD_SETS[map[lang] || lang] || KEYWORD_SETS['js'];
}

function tokenize(code: string, lang: string): Token[] {
  const tokens: Token[] = [];
  const keywords = getKeywords(lang);
  let i = 0;

  const isHtml = ['html', 'xml', 'jsx', 'tsx'].includes(lang);
  const isCss = ['css', 'scss', 'sass', 'less'].includes(lang);

  while (i < code.length) {
    // Single-line comment //
    if ((code[i] === '/' && code[i + 1] === '/') || (lang === 'python' && code[i] === '#')) {
      const end = code.indexOf('\n', i);
      const val = end === -1 ? code.slice(i) : code.slice(i, end);
      tokens.push({ type: 'comment', value: val });
      i += val.length;
      continue;
    }

    // Multi-line comment /* */
    if (code[i] === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      const val = end === -1 ? code.slice(i) : code.slice(i, end + 2);
      tokens.push({ type: 'comment', value: val });
      i += val.length;
      continue;
    }

    // Python triple quote strings
    if (lang === 'python' && (code.slice(i, i + 3) === '"""' || code.slice(i, i + 3) === "'''")) {
      const delim = code.slice(i, i + 3);
      const end = code.indexOf(delim, i + 3);
      const val = end === -1 ? code.slice(i) : code.slice(i, end + 3);
      tokens.push({ type: 'string', value: val });
      i += val.length;
      continue;
    }

    // Strings: ", ', `
    if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      const quote = code[i];
      let j = i + 1;
      while (j < code.length) {
        if (code[j] === '\\') { j += 2; continue; }
        if (code[j] === quote) { j++; break; }
        j++;
      }
      tokens.push({ type: 'string', value: code.slice(i, j) });
      i = j;
      continue;
    }

    // HTML tags
    if (isHtml && code[i] === '<') {
      const end = code.indexOf('>', i);
      if (end !== -1) {
        tokens.push({ type: 'tag', value: code.slice(i, end + 1) });
        i = end + 1;
        continue;
      }
    }

    // CSS property: value
    if (isCss && /[a-zA-Z-]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_-]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if (code[j] === ':') {
        tokens.push({ type: 'attribute', value: word });
        i = j;
        continue;
      }
    }

    // Numbers (int, float, hex, binary)
    if (/[0-9]/.test(code[i]) || (code[i] === '.' && /[0-9]/.test(code[i + 1]))) {
      let j = i;
      if (code[i] === '0' && (code[i + 1] === 'x' || code[i + 1] === 'X')) {
        j += 2;
        while (j < code.length && /[0-9a-fA-F]/.test(code[j])) j++;
      } else if (code[i] === '0' && (code[i + 1] === 'b' || code[i + 1] === 'B')) {
        j += 2;
        while (j < code.length && /[01]/.test(code[j])) j++;
      } else {
        while (j < code.length && /[0-9._eE+\-]/.test(code[j])) j++;
      }
      tokens.push({ type: 'number', value: code.slice(i, j) });
      i = j;
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);

      // Look-ahead for function call or class definition
      const nextNonSpace = code.slice(j).match(/^(\s*)\(/);
      const prevWord = tokens.filter(t => t.type === 'keyword').pop()?.value;

      if (keywords.has(word)) {
        tokens.push({ type: 'keyword', value: word });
      } else if (/^[A-Z]/.test(word)) {
        tokens.push({ type: 'class', value: word });
      } else if (nextNonSpace) {
        tokens.push({ type: 'function', value: word });
      } else {
        tokens.push({ type: 'plain', value: word });
      }
      i = j;
      continue;
    }

    // Operators
    if (/[+\-*/%=!<>&|^~?]/.test(code[i])) {
      let j = i + 1;
      // Multi-char operators
      const two = code.slice(i, i + 2);
      if (['==','!=','<=','>=','&&','||','**','++','--','+=','-=','*=','/=','%=','**=','??','?.','->','=>'].includes(two)) {
        j = i + 2;
      }
      const three = code.slice(i, i + 3);
      if (['===','!==','...','**=','<<=','>>='].includes(three)) {
        j = i + 3;
      }
      tokens.push({ type: 'operator', value: code.slice(i, j) });
      i = j;
      continue;
    }

    // Punctuation
    if (/[()[\]{};:,.]/.test(code[i])) {
      tokens.push({ type: 'punctuation', value: code[i] });
      i++;
      continue;
    }

    // Plain
    tokens.push({ type: 'plain', value: code[i] });
    i++;
  }

  return tokens;
}

const TOKEN_COLORS: Record<TokenType, string> = {
  comment: 'text-zinc-500 italic',
  string: 'text-emerald-400',
  keyword: 'text-orange-400 font-medium',
  number: 'text-cyan-400',
  class: 'text-yellow-300',
  function: 'text-blue-400',
  operator: 'text-pink-400',
  punctuation: 'text-zinc-400',
  variable: 'text-zinc-200',
  tag: 'text-orange-300',
  attribute: 'text-cyan-300',
  plain: 'text-zinc-200',
};

function SyntaxHighlight({ code, lang }: { code: string; lang: string }) {
  if (!lang || lang === 'text' || lang === 'plain') {
    return <span className="text-zinc-200">{code}</span>;
  }
  const tokens = tokenize(code, lang.toLowerCase());
  return (
    <>
      {tokens.map((tok, i) => (
        <span key={i} className={TOKEN_COLORS[tok.type]}>
          {tok.value}
        </span>
      ))}
    </>
  );
}

function LineNumbers({ count }: { count: number }) {
  return (
    <div className="select-none pr-4 text-right border-r border-white/5 mr-4 flex-shrink-0">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="text-zinc-600 text-xs leading-6">
          {i + 1}
        </div>
      ))}
    </div>
  );
}

const LANG_LABELS: Record<string, string> = {
  js: 'JavaScript', javascript: 'JavaScript', jsx: 'JSX',
  ts: 'TypeScript', typescript: 'TypeScript', tsx: 'TSX',
  py: 'Python', python: 'Python',
  go: 'Go', rust: 'Rust', java: 'Java', cpp: 'C++', c: 'C',
  cs: 'C#', rb: 'Ruby', ruby: 'Ruby', php: 'PHP',
  html: 'HTML', css: 'CSS', scss: 'SCSS',
  json: 'JSON', yaml: 'YAML', yml: 'YAML',
  sh: 'Shell', bash: 'Bash', shell: 'Shell',
  sql: 'SQL', md: 'Markdown', markdown: 'Markdown',
  text: 'Text', plain: 'Text',
};

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');
  const lineCount = lines.length;
  const langLabel = LANG_LABELS[language.toLowerCase()] || language.toUpperCase();

  return (
    <div className="code-block my-3 overflow-hidden rounded-lg border border-white/8 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/6 bg-muted">
        <div className="flex items-center gap-2">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>

          <div className="w-px h-3 bg-white/10 mx-1" />

          <Terminal size={12} className="text-muted-foreground" />
          <span className="text-xs font-mono text-primary/80 font-medium">
            {langLabel}
          </span>
          <span className="text-xs text-zinc-600">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Toggle line numbers */}
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={cn(
              'text-xs px-2 py-0.5 rounded font-mono transition-colors',
              showLineNumbers
                ? 'text-accent/80 hover:text-accent'
                : 'text-zinc-600 hover:text-zinc-400'
            )}
            title="Toggle line numbers"
          >
            #
          </button>

          {/* Collapse */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-white/5 font-mono"
          >
            {copied ? (
              <>
                <Check size={11} className="text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code content */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <div className="flex p-4 min-w-0">
            {showLineNumbers && lineCount > 1 && (
              <LineNumbers count={lineCount} />
            )}
            <pre className="font-mono text-xs leading-6 flex-1 min-w-0">
              <code>
                <SyntaxHighlight code={code} lang={language} />
              </code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
