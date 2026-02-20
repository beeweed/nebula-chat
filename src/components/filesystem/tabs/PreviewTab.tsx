import React, { useState, useEffect } from 'react';
import { useE2BSandbox } from '@/contexts/E2BSandboxContext';
import { 
  Globe, 
  RefreshCw, 
  ExternalLink, 
  Monitor, 
  Tablet, 
  Smartphone,
  Loader2,
  AlertCircle,
  Play,
  CloudOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const deviceSizes: Record<DeviceMode, { width: string; label: string }> = {
  desktop: { width: '100%', label: 'Desktop' },
  tablet: { width: '768px', label: 'Tablet' },
  mobile: { width: '375px', label: 'Mobile' },
};

export function PreviewTab() {
  const {
    isConnected,
    isConnecting,
    sandboxId,
    hasApiKey,
    createSandbox,
  } = useE2BSandbox();

  const [port, setPort] = useState('3000');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (sandboxId && port) {
      const portNum = parseInt(port, 10);
      if (!isNaN(portNum) && portNum > 0 && portNum < 65536) {
        setPreviewUrl(`https://${portNum}-${sandboxId}.e2b.app`);
        setError(null);
      } else {
        setPreviewUrl(null);
        setError('Invalid port number');
      }
    } else {
      setPreviewUrl(null);
    }
  }, [sandboxId, port]);

  const handleRefresh = () => {
    setKey(prev => prev + 1);
    setIsLoading(true);
  };

  const handleOpenExternal = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load preview. Make sure your server is running on the specified port.');
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-[#1e1e1e]">
        <CloudOff size={48} className="mb-4 opacity-30" />
        <p className="text-sm mb-4">Connect to sandbox to preview your app</p>
        {hasApiKey && (
          <button
            onClick={createSandbox}
            disabled={isConnecting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Play size={14} />
                Connect to Sandbox
              </>
            )}
          </button>
        )}
        {!hasApiKey && (
          <p className="text-xs text-yellow-500">Add E2B API key in settings</p>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Toolbar */}
      <div className="h-10 bg-[#2d2d2d] border-b border-[#333] flex items-center px-3 gap-3 flex-shrink-0">
        {/* Port input */}
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-primary flex-shrink-0" />
          <span className="text-xs text-gray-400 hidden sm:inline">Port:</span>
          <input
            type="text"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            className="w-16 bg-[#1e1e1e] border border-[#444] rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-primary"
            placeholder="3000"
          />
        </div>

        {/* Device switcher */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={cn(
              'p-1.5 rounded transition-colors',
              deviceMode === 'desktop' 
                ? 'bg-primary text-white' 
                : 'text-gray-400 hover:text-white hover:bg-[#444]'
            )}
            title="Desktop view"
          >
            <Monitor size={14} />
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            className={cn(
              'p-1.5 rounded transition-colors',
              deviceMode === 'tablet' 
                ? 'bg-primary text-white' 
                : 'text-gray-400 hover:text-white hover:bg-[#444]'
            )}
            title="Tablet view"
          >
            <Tablet size={14} />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={cn(
              'p-1.5 rounded transition-colors',
              deviceMode === 'mobile' 
                ? 'bg-primary text-white' 
                : 'text-gray-400 hover:text-white hover:bg-[#444]'
            )}
            title="Mobile view"
          >
            <Smartphone size={14} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 border-l border-[#444] pl-3">
          <button
            onClick={handleRefresh}
            disabled={!previewUrl}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#444] rounded disabled:opacity-50 transition-colors"
            title="Refresh preview"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenExternal}
            disabled={!previewUrl}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#444] rounded disabled:opacity-50 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* URL Bar */}
      <div className="h-8 bg-[#252526] border-b border-[#333] flex items-center px-3">
        <div className="flex-1 bg-[#1e1e1e] border border-[#444] rounded px-2 py-1 flex items-center">
          {previewUrl ? (
            <>
              <span className="text-green-400 text-xs mr-1.5">🔒</span>
              <span className="text-xs text-gray-300 truncate">{previewUrl}</span>
            </>
          ) : (
            <span className="text-xs text-gray-500">Enter a valid port to preview</span>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden flex items-center justify-center bg-[#0f0f10] p-4">
        {error ? (
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500 opacity-50" />
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-primary hover:bg-primary/80 rounded text-sm text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : previewUrl ? (
          <div 
            className="h-full bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300 relative"
            style={{ 
              width: deviceSizes[deviceMode].width,
              maxWidth: '100%',
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] z-10">
                <Loader2 size={32} className="animate-spin text-primary" />
              </div>
            )}
            <iframe
              key={key}
              src={previewUrl}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        ) : (
          <div className="text-center">
            <Globe size={48} className="mx-auto mb-4 opacity-20 text-gray-500" />
            <p className="text-sm text-gray-500">Enter a valid port to preview your app</p>
            <p className="text-xs text-gray-600 mt-2">
              Start a server in the terminal, then enter the port here
            </p>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-[#252526] border-t border-[#333] flex items-center justify-between px-3 text-[10px] text-gray-500">
        <span>{deviceSizes[deviceMode].label}</span>
        {sandboxId && (
          <span className="truncate max-w-[200px]">
            Sandbox: {sandboxId.substring(0, 12)}...
          </span>
        )}
      </div>
    </div>
  );
}