import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, GripHorizontal, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import FileSystemPanel from './FileSystemPanel';

interface BottomPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MIN_HEIGHT = 200;
const MAX_HEIGHT = 800;
const DEFAULT_HEIGHT = 400;

export function BottomPanel({ isOpen, onClose }: BottomPanelProps) {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startYRef.current = e.clientY;
    startHeightRef.current = height;
  }, [height]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startYRef.current = e.touches[0].clientY;
    startHeightRef.current = height;
  }, [height]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startYRef.current - e.clientY;
      const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeightRef.current + deltaY));
      setHeight(newHeight);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const deltaY = startYRef.current - e.touches[0].clientY;
      const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeightRef.current + deltaY));
      setHeight(newHeight);
    };

    const handleEnd = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('touchcancel', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleEnd);
    };
  }, [isResizing]);

  if (!isOpen) return null;

  return (
    <>
      {isResizing && (
        <div 
          className="fixed inset-0 z-40 cursor-row-resize" 
          style={{ touchAction: 'none' }}
        />
      )}
      
      <div
        ref={panelRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-[#1e1e1e] border-t border-primary/30',
          'shadow-[0_-4px_30px_rgba(0,0,0,0.5)]',
          isAnimating && 'animate-slide-up'
        )}
        style={{ 
          height: `${height}px`,
          transition: isResizing ? 'none' : 'height 0.1s ease-out'
        }}
        data-design-id="bottom-panel"
      >
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={cn(
            'absolute top-0 left-0 right-0 h-3 cursor-row-resize',
            'flex items-center justify-center group',
            'bg-gradient-to-b from-[#333] to-transparent',
            'hover:from-primary/30 transition-colors',
            isResizing && 'from-primary/50'
          )}
          data-design-id="bottom-panel-resize-handle"
        >
          <div className={cn(
            'w-12 h-1 rounded-full transition-colors',
            isResizing ? 'bg-primary' : 'bg-gray-600 group-hover:bg-primary/70'
          )}>
            <GripHorizontal 
              size={12} 
              className={cn(
                'mx-auto -mt-0.5 transition-colors',
                isResizing ? 'text-primary' : 'text-gray-500 group-hover:text-primary/70'
              )} 
            />
          </div>
        </div>

        <div className="h-10 bg-[#252526] border-b border-[#333] flex items-center justify-between px-4 mt-3" data-design-id="bottom-panel-header">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-primary" />
            <span className="text-sm font-medium text-gray-300" data-design-id="bottom-panel-title">Code Sandbox</span>
            <span className="text-xs text-gray-500 px-2 py-0.5 bg-[#333] rounded" data-design-id="bottom-panel-badge">E2B</span>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#444] rounded transition-colors"
            title="Close panel"
            data-design-id="bottom-panel-close-btn"
          >
            <X size={16} />
          </button>
        </div>

        <div 
          className="overflow-hidden" 
          style={{ height: `calc(100% - 52px)` }}
          data-design-id="bottom-panel-content"
        >
          <FileSystemPanel />
        </div>
      </div>
    </>
  );
}