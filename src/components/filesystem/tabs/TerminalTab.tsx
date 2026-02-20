import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useE2BSandbox } from '@/contexts/E2BSandboxContext';
import { 
  TerminalSquare, 
  Plus, 
  X, 
  Loader2, 
  Play,
  CloudOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

import '@xterm/xterm/css/xterm.css';

interface TerminalInstance {
  id: string;
  name: string;
  xterm: XTerm | null;
  fitAddon: FitAddon | null;
  isReady: boolean;
}

export function TerminalTab() {
  const {
    isConnected,
    isConnecting,
    hasApiKey,
    createSandbox,
    createTerminal,
    sendTerminalInput,
    resizeTerminal,
    closeTerminal,
  } = useE2BSandbox();

  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [terminals, setTerminals] = useState<TerminalInstance[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<string | null>(null);
  const [terminalCounter, setTerminalCounter] = useState(1);
  
  const xtermInstancesRef = useRef<Map<string, { xterm: XTerm; fitAddon: FitAddon }>>(new Map());

  const createNewTerminal = useCallback(async () => {
    if (!isConnected) return;

    const terminalId = `terminal-${Date.now()}`;
    const terminalName = `Terminal ${terminalCounter}`;
    setTerminalCounter(prev => prev + 1);

    const newTerminal: TerminalInstance = {
      id: terminalId,
      name: terminalName,
      xterm: null,
      fitAddon: null,
      isReady: false,
    };

    setTerminals(prev => [...prev, newTerminal]);
    setActiveTerminalId(terminalId);
    setIsInitializing(terminalId);
  }, [isConnected, terminalCounter]);

  const initializeTerminal = useCallback(async (terminalId: string) => {
    const terminalDiv = terminalRefs.current.get(terminalId);
    if (!terminalDiv || xtermInstancesRef.current.has(terminalId)) return;

    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        cursorAccent: '#1e1e1e',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(terminalDiv);

    xtermInstancesRef.current.set(terminalId, { xterm, fitAddon });

    setTimeout(() => {
      fitAddon.fit();
    }, 100);

    const cols = xterm.cols;
    const rows = xterm.rows;

    const terminal = await createTerminal(terminalId, cols, rows, (data: Uint8Array) => {
      xterm.write(data);
    });

    if (terminal) {
      xterm.onData((data) => {
        sendTerminalInput(terminalId, data);
      });

      setTerminals(prev => prev.map(t => 
        t.id === terminalId ? { ...t, xterm, fitAddon, isReady: true } : t
      ));
    }

    setIsInitializing(null);
  }, [createTerminal, sendTerminalInput]);

  // Create first terminal when connected
  useEffect(() => {
    if (isConnected && terminals.length === 0) {
      createNewTerminal();
    }
  }, [isConnected, terminals.length, createNewTerminal]);

  // Initialize terminal after DOM is ready
  useEffect(() => {
    if (isInitializing) {
      const timer = setTimeout(() => {
        initializeTerminal(isInitializing);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isInitializing, initializeTerminal]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      xtermInstancesRef.current.forEach(({ xterm, fitAddon }, terminalId) => {
        fitAddon.fit();
        resizeTerminal(terminalId, xterm.cols, xterm.rows);
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resizeTerminal]);

  // Fit terminal when tab becomes active
  useEffect(() => {
    if (activeTerminalId) {
      const instance = xtermInstancesRef.current.get(activeTerminalId);
      if (instance) {
        setTimeout(() => {
          instance.fitAddon.fit();
          instance.xterm.focus();
        }, 100);
      }
    }
  }, [activeTerminalId]);

  const handleCloseTerminal = useCallback(async (terminalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const instance = xtermInstancesRef.current.get(terminalId);
    if (instance) {
      instance.xterm.dispose();
      xtermInstancesRef.current.delete(terminalId);
    }
    
    await closeTerminal(terminalId);
    terminalRefs.current.delete(terminalId);
    
    setTerminals(prev => {
      const newTerminals = prev.filter(t => t.id !== terminalId);
      if (activeTerminalId === terminalId && newTerminals.length > 0) {
        setActiveTerminalId(newTerminals[newTerminals.length - 1].id);
      } else if (newTerminals.length === 0) {
        setActiveTerminalId(null);
      }
      return newTerminals;
    });
  }, [activeTerminalId, closeTerminal]);

  const setTerminalRef = useCallback((terminalId: string, el: HTMLDivElement | null) => {
    if (el) {
      terminalRefs.current.set(terminalId, el);
    }
  }, []);

  // Not connected state
  if (!isConnected) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-[#1e1e1e]">
        <CloudOff size={48} className="mb-4 opacity-30" />
        <p className="text-sm mb-4">Connect to sandbox to access terminal</p>
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
    <div ref={containerRef} className="flex flex-col h-full bg-[#1e1e1e]">
      {/* Terminal Tabs Bar */}
      <div className="h-9 bg-[#2d2d2d] border-b border-[#333] flex items-center justify-between px-1 flex-shrink-0">
        <div className="flex items-center flex-1 overflow-x-auto no-scrollbar">
          {terminals.map((terminal) => (
            <div
              key={terminal.id}
              onClick={() => setActiveTerminalId(terminal.id)}
              className={cn(
                'flex items-center px-3 py-1.5 text-xs cursor-pointer select-none min-w-[100px] max-w-[150px] group transition-colors',
                terminal.id === activeTerminalId 
                  ? 'bg-[#1e1e1e] text-green-400 border-t-2 border-t-green-400' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-[#333]'
              )}
            >
              <TerminalSquare size={12} className="mr-1.5 flex-shrink-0" />
              <span className="truncate flex-1">{terminal.name}</span>
              {isInitializing === terminal.id && (
                <Loader2 size={10} className="animate-spin ml-1 flex-shrink-0" />
              )}
              {terminals.length > 1 && (
                <button
                  onClick={(e) => handleCloseTerminal(terminal.id, e)}
                  className="ml-1 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-[#555] rounded flex-shrink-0 transition-opacity"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
          
          <button
            onClick={createNewTerminal}
            className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-white hover:bg-[#444] rounded ml-1 flex-shrink-0 transition-colors"
            title="New Terminal"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 relative overflow-hidden">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            ref={(el) => setTerminalRef(terminal.id, el)}
            className={cn(
              'absolute inset-0 p-2',
              terminal.id === activeTerminalId ? 'block' : 'hidden'
            )}
          />
        ))}
        
        {terminals.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <TerminalSquare size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Click + to create a terminal</p>
          </div>
        )}
      </div>
    </div>
  );
}