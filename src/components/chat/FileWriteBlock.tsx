import { useState } from 'react';
import { FileCode, ChevronDown, ChevronRight, Check, X, Copy, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileWriteBlockProps {
  filePath: string;
  content: string;
  success: boolean;
  message?: string;
}

export function FileWriteBlock({ filePath, content, success, message }: FileWriteBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileName = filePath.split('/').pop() || filePath;
  const fileExtension = fileName.split('.').pop() || '';
  
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

  const lineCount = content.split('\n').length;

  return (
    <div className={cn(
      'my-3 rounded-xl border overflow-hidden transition-all duration-200',
      success 
        ? 'border-green-500/30 bg-green-500/5' 
        : 'border-red-500/30 bg-red-500/5'
    )}>
      <div 
        className={cn(
          'flex items-center justify-between px-4 py-3 cursor-pointer transition-colors',
          success ? 'hover:bg-green-500/10' : 'hover:bg-red-500/10'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            success ? 'bg-green-500/20' : 'bg-red-500/20'
          )}>
            <FileCode size={16} className={success ? 'text-green-400' : 'text-red-400'} />
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{fileName}</span>
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded',
                success 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              )}>
                {success ? 'Created' : 'Failed'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">{filePath}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{lineCount} lines</span>
          {success ? (
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
            <span className="text-xs text-muted-foreground">{getLanguage(fileExtension)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-white/5"
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
          
          <div className="max-h-96 overflow-auto">
            <pre className="p-4 text-sm font-mono text-foreground/90 whitespace-pre-wrap break-all">
              <code>{content}</code>
            </pre>
          </div>
          
          {message && (
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