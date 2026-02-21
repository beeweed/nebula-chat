import { useState } from 'react';
import { CommandExecutionEvent } from '@/types/chat';
import { ChevronDown, ChevronRight, Terminal, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';

interface CommandBlockProps {
  execution: CommandExecutionEvent;
}

export function CommandBlock({ execution }: CommandBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusIcon = () => {
    if (execution.isRunning) {
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    }
    if (execution.timedOut) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }
    if (execution.isBackground) {
      return <Terminal className="w-4 h-4 text-purple-400" />;
    }
    if (execution.success) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (execution.isRunning) {
      return 'Running...';
    }
    if (execution.timedOut) {
      return 'Timed out';
    }
    if (execution.isBackground) {
      return 'Running in background';
    }
    if (execution.success) {
      return `Exit code: ${execution.exitCode}`;
    }
    return `Failed (exit code: ${execution.exitCode})`;
  };

  const getStatusColor = () => {
    if (execution.isRunning) {
      return 'border-blue-500/30 bg-blue-500/5';
    }
    if (execution.timedOut) {
      return 'border-yellow-500/30 bg-yellow-500/5';
    }
    if (execution.isBackground) {
      return 'border-purple-500/30 bg-purple-500/5';
    }
    if (execution.success) {
      return 'border-green-500/30 bg-green-500/5';
    }
    return 'border-red-500/30 bg-red-500/5';
  };

  const hasOutput = execution.stdout || execution.stderr;

  return (
    <div className={`my-3 rounded-lg border ${getStatusColor()} overflow-hidden`}>
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="p-0.5 hover:bg-white/10 rounded">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          )}
        </button>
        
        <Terminal className="w-4 h-4 text-zinc-400" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">
              {execution.description}
            </span>
          </div>
          <code className="text-xs text-zinc-300 font-mono block truncate">
            $ {execution.command}
          </code>
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          {getStatusIcon()}
          <span className="text-xs text-zinc-500">{getStatusText()}</span>
        </div>
      </div>

      {isExpanded && hasOutput && (
        <div className="border-t border-zinc-700/50">
          {execution.stdout && (
            <div className="px-3 py-2">
              <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                <span className="font-medium">stdout</span>
              </div>
              <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap break-all bg-black/30 rounded p-2 max-h-64 overflow-auto">
                {execution.stdout}
              </pre>
            </div>
          )}
          
          {execution.stderr && (
            <div className="px-3 py-2 border-t border-zinc-700/50">
              <div className="text-xs text-red-400 mb-1 flex items-center gap-1">
                <span className="font-medium">stderr</span>
              </div>
              <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap break-all bg-red-950/30 rounded p-2 max-h-64 overflow-auto">
                {execution.stderr}
              </pre>
            </div>
          )}
        </div>
      )}

      {isExpanded && !hasOutput && !execution.isRunning && (
        <div className="border-t border-zinc-700/50 px-3 py-2">
          <span className="text-xs text-zinc-500 italic">
            {execution.isBackground ? 'Command running in background' : 'No output'}
          </span>
        </div>
      )}

      {isExpanded && execution.isRunning && (
        <div className="border-t border-zinc-700/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
            <span className="text-xs text-zinc-500">Executing command...</span>
          </div>
        </div>
      )}
    </div>
  );
}