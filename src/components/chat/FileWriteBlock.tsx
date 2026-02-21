import { useState, useEffect, useRef } from 'react';
import { FileCode, ChevronDown, ChevronRight, Check, X, Copy, CheckCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileWriteBlockProps {
  filePath: string;
  content: string;
  success: boolean;
  message?: string;
  isStreaming?: boolean;
  streamedContent?: string;
}

export function FileWriteBlock({ filePath, content, success, message, isStreaming, streamedContent }: FileWriteBlockProps) {
  const [isExpanded, setIsExpanded] = useState(isStreaming || false);
  const [copied, setCopied] = useState(false);
  const codeContainerRef = useRef<HTMLDivElement>(null);

  const fileName = filePath.split('/').pop() || filePath;
  const fileExtension = fileName.split('.').pop() || '';
  
  const displayContent = isStreaming ? (streamedContent || '') : content;

  useEffect(() => {
    if (isStreaming) {
      setIsExpanded(true);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (isStreaming && codeContainerRef.current) {
      codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
    }
  }, [isStreaming, streamedContent]);
  
  const getLanguage = (ext: string): string => {
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'dockerfile': 'dockerfile',
      'toml': 'toml',
      'ini': 'ini',
      'env': 'bash',
    };
    return langMap[ext.toLowerCase()] || 'plaintext';
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const lineCount = displayContent.split('\n').length;

  const getBorderClass = () => {
    if (isStreaming) return 'border-blue-500/30 bg-blue-500/5';
    return success ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5';
  };

  const getHoverClass = () => {
    if (isStreaming) return 'hover:bg-blue-500/10';
    return success ? 'hover:bg-green-500/10' : 'hover:bg-red-500/10';
  };

  const getIconBgClass = () => {
    if (isStreaming) return 'bg-blue-500/20';
    return success ? 'bg-green-500/20' : 'bg-red-500/20';
  };

  const getIconClass = () => {
    if (isStreaming) return 'text-blue-400';
    return success ? 'text-green-400' : 'text-red-400';
  };

  const getStatusBadgeClass = () => {
    if (isStreaming) return 'bg-blue-500/20 text-blue-400';
    return success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
  };

  const getStatusText = () => {
    if (isStreaming) return 'Writing...';
    return success ? 'Created' : 'Failed';
  };

  return (
    <div className={cn(
      'my-3 rounded-xl border overflow-hidden transition-all duration-200',
      getBorderClass()
    )}>
      <div 
        className={cn(
          'flex items-center justify-between px-4 py-3 cursor-pointer transition-colors',
          getHoverClass()
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            getIconBgClass()
          )}>
            {isStreaming ? (
              <Loader2 size={16} className="text-blue-400 animate-spin" />
            ) : (
              <FileCode size={16} className={getIconClass()} />
            )}
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{fileName}</span>
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded flex items-center gap-1',
                getStatusBadgeClass()
              )}>
                {isStreaming && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                )}
                {getStatusText()}
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">{filePath}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isStreaming ? `${lineCount} lines...` : `${lineCount} lines`}
          </span>
          {isStreaming ? (
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          ) : success ? (
            <Check size={16} className="text-green-400" />
          ) : (
            <X size={16} className="text-red-400" />
          )}
          {isExpanded ? (
            <ChevronDown size={16} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={16} className="text-muted-foreground" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-border/50">
          <div className="flex items-center justify-between px-4 py-2 bg-black/20">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{getLanguage(fileExtension)}</span>
              {isStreaming && (
                <span className="text-xs text-blue-400 flex items-center gap-1">
                  <Loader2 size={10} className="animate-spin" />
                  streaming...
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-white/5"
              disabled={isStreaming}
            >
              {copied ? (
                <>
                  <CheckCheck size={12} className="text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          
          <div ref={codeContainerRef} className="max-h-96 overflow-auto scroll-smooth">
            <pre className="p-4 text-sm font-mono text-foreground/90 whitespace-pre-wrap break-all">
              <code>
                {displayContent}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 ml-0.5 bg-blue-400 animate-pulse" />
                )}
              </code>
            </pre>
          </div>
          
          {isStreaming && (
            <div className="px-4 py-2 text-xs border-t bg-blue-500/10 text-blue-400 border-blue-500/20 flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" />
              Writing file content...
            </div>
          )}
          
          {!isStreaming && message && (
            <div className={cn(
              'px-4 py-2 text-xs border-t',
              success 
                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            )}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}