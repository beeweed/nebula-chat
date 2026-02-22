import { useState } from 'react';
import { FileListEvent } from '@/types/chat';
import { ChevronDown, ChevronRight, FolderTree, File, CheckCircle2, XCircle } from 'lucide-react';

interface FileListBlockProps {
  fileList: FileListEvent;
}

export function FileListBlock({ fileList }: FileListBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  
  const maxInitialFiles = 15;
  const hasMoreFiles = fileList.files.length > maxInitialFiles;
  const displayedFiles = showAll ? fileList.files : fileList.files.slice(0, maxInitialFiles);

  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const iconClasses = "w-3.5 h-3.5 flex-shrink-0";
    
    const extColors: Record<string, string> = {
      tsx: 'text-blue-400',
      ts: 'text-blue-400',
      jsx: 'text-yellow-400',
      js: 'text-yellow-400',
      json: 'text-green-400',
      css: 'text-pink-400',
      scss: 'text-pink-400',
      html: 'text-orange-400',
      md: 'text-gray-400',
      py: 'text-green-400',
      go: 'text-cyan-400',
      rs: 'text-orange-400',
      vue: 'text-green-400',
      svelte: 'text-orange-400',
    };
    
    const color = extColors[ext || ''] || 'text-zinc-500';
    return <File className={`${iconClasses} ${color}`} />;
  };

  const getFileName = (filePath: string) => {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  };

  const getDirectory = (filePath: string) => {
    const parts = filePath.split('/');
    parts.pop();
    return parts.join('/');
  };

  return (
    <div className="my-3 rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          )}
          <FolderTree className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="text-sm font-medium text-zinc-200 truncate">
            File List
          </span>
          <span className="text-xs text-zinc-500 truncate">
            {fileList.basePath}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
            {fileList.totalCount} files
          </span>
          {fileList.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-zinc-800">
          <div className="max-h-80 overflow-y-auto">
            <div className="p-2 space-y-0.5">
              {displayedFiles.map((filePath, index) => (
                <div
                  key={`${filePath}-${index}`}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-800/50 transition-colors group"
                >
                  {getFileIcon(filePath)}
                  <span className="text-xs text-zinc-400 truncate flex-1 font-mono">
                    <span className="text-zinc-600">{getDirectory(filePath)}/</span>
                    <span className="text-zinc-200">{getFileName(filePath)}</span>
                  </span>
                </div>
              ))}
            </div>
            
            {hasMoreFiles && !showAll && (
              <div className="px-3 pb-2">
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full text-xs text-zinc-500 hover:text-zinc-300 py-1.5 rounded bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  Show {fileList.files.length - maxInitialFiles} more files...
                </button>
              </div>
            )}
            
            {showAll && hasMoreFiles && (
              <div className="px-3 pb-2">
                <button
                  onClick={() => setShowAll(false)}
                  className="w-full text-xs text-zinc-500 hover:text-zinc-300 py-1.5 rounded bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  Show less
                </button>
              </div>
            )}
          </div>
          
          {!fileList.success && (
            <div className="px-3 pb-2">
              <div className="text-xs text-red-400 bg-red-500/10 rounded px-2 py-1.5">
                {fileList.message}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}