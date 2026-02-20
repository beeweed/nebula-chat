import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, GripHorizontal, Code2, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import FileSystemPanel from './FileSystemPanel';

interface BottomPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MIN_HEIGHT = 200;
const HEADER_OFFSET = 60; // Space for the app header
const MOBILE_BREAKPOINT = 640; // sm breakpoint
const getDefaultHeight = () => Math.round(window.innerHeight * 0.75);
const isMobileView = () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

export function BottomPanel({ isOpen, onClose }: BottomPanelProps) {
  const [height, setHeight] = useState(getDefaultHeight);
  const [isResizing, setIsResizing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [maxHeight, setMaxHeight] = useState(window.innerHeight - HEADER_OFFSET);
  const [isMobile, setIsMobile] = useState(isMobileView);
  const panelRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const prevHeightRef = useRef(getDefaultHeight());

  // Update max height and mobile state on window resize
  useEffect(() => {
    const updateDimensions = () => {
      setMaxHeight(window.innerHeight - HEADER_OFFSET);
      setIsMobile(isMobileView());
    };
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // On mobile, always use full height
  const effectiveHeight = isMobile ? window.innerHeight : height;

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

  // Toggle maximize
  const toggleMaximize = useCallback(() => {
    if (isMaximized) {
      setHeight(prevHeightRef.current);
      setIsMaximized(false);
    } else {
      prevHeightRef.current = height;
      setHeight(maxHeight);
      setIsMaximized(true);
    }
  }, [isMaximized, height, maxHeight]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startYRef.current - e.clientY;
      const newHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, startHeightRef.current + deltaY));
      setHeight(newHeight);
      setIsMaximized(newHeight >= maxHeight - 10);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const deltaY = startYRef.current - e.touches[0].clientY;
      const newHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, startHeightRef.current + deltaY));
      setHeight(newHeight);
      setIsMaximized(newHeight >= maxHeight - 10);
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
  }, [isResizing, maxHeight]);

  return (
    <>
      {isResizing && isOpen && !isMobile && (
        <div 
          className="fixed inset-0 z-40 cursor-row-resize" 
          style={{ touchAction: 'none' }}
        />
      )}
      
      <div
        ref={panelRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-[#1e1e1e]',
          'sm:border-t sm:border-primary/30',
          'shadow-[0_-4px_30px_rgba(0,0,0,0.5)]',
          isAnimating && 'animate-slide-up',
          !isOpen && 'translate-y-full pointer-events-none'
        )}
        style={{ 
          height: isMobile ? '100%' : `${effectiveHeight}px`,
          transition: isResizing ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        data-design-id="bottom-panel"
      >
        {/* Resize handle - hidden on mobile */}
        {!isMobile && (
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onDoubleClick={toggleMaximize}
            className={cn(
              'absolute top-0 left-0 right-0 h-4 cursor-row-resize',
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
        )}

        <div 
          className={cn(
            'h-12 sm:h-10 bg-[#252526] border-b border-[#333] flex items-center justify-between px-3 sm:px-4',
            !isMobile && 'mt-4'
          )} 
          data-design-id="bottom-panel-header"
        >
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-primary" />
            <span className="text-sm font-medium text-gray-300" data-design-id="bottom-panel-title">Code Sandbox</span>
            <span className="text-xs text-gray-500 px-2 py-0.5 bg-[#333] rounded hidden sm:inline" data-design-id="bottom-panel-badge">E2B</span>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Only show maximize button on desktop */}
            {!isMobile && (
              <button
                onClick={toggleMaximize}
                className="p-1.5 text-gray-400 hover:text-primary hover:bg-[#444] rounded transition-colors"
                title={isMaximized ? "Restore panel" : "Maximize panel"}
                data-design-id="bottom-panel-maximize-btn"
              >
                {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 sm:p-1.5 text-gray-400 hover:text-white hover:bg-[#444] rounded transition-colors active:scale-95"
              title="Close panel"
              data-design-id="bottom-panel-close-btn"
            >
              <X size={18} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        <div 
          className="overflow-hidden" 
          style={{ height: isMobile ? 'calc(100% - 48px)' : 'calc(100% - 56px)' }}
          data-design-id="bottom-panel-content"
        >
          <FileSystemPanel />
        </div>
      </div>
    </>
  );
}