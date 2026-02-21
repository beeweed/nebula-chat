import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

export interface TerminalInstance {
  id: string;
  name: string;
  isReady: boolean;
}

interface TerminalContextType {
  terminals: TerminalInstance[];
  activeTerminalId: string | null;
  terminalCounter: number;
  isInitializing: string | null;
  xtermInstances: Map<string, { xterm: XTerm; fitAddon: FitAddon }>;
  terminalRefs: Map<string, HTMLDivElement>;
  addTerminal: (terminal: TerminalInstance) => void;
  updateTerminal: (id: string, updates: Partial<TerminalInstance>) => void;
  removeTerminal: (id: string) => void;
  setActiveTerminalId: (id: string | null) => void;
  setIsInitializing: (id: string | null) => void;
  incrementCounter: () => number;
  setXtermInstance: (id: string, xterm: XTerm, fitAddon: FitAddon) => void;
  getXtermInstance: (id: string) => { xterm: XTerm; fitAddon: FitAddon } | undefined;
  removeXtermInstance: (id: string) => void;
  setTerminalRef: (id: string, el: HTMLDivElement | null) => void;
  getTerminalRef: (id: string) => HTMLDivElement | undefined;
}

const TerminalContext = createContext<TerminalContextType | null>(null);

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const [terminals, setTerminals] = useState<TerminalInstance[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [terminalCounter, setTerminalCounter] = useState(1);
  const [isInitializing, setIsInitializing] = useState<string | null>(null);
  
  const xtermInstancesRef = useRef<Map<string, { xterm: XTerm; fitAddon: FitAddon }>>(new Map());
  const terminalRefsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const addTerminal = useCallback((terminal: TerminalInstance) => {
    setTerminals(prev => [...prev, terminal]);
  }, []);

  const updateTerminal = useCallback((id: string, updates: Partial<TerminalInstance>) => {
    setTerminals(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const removeTerminal = useCallback((id: string) => {
    setTerminals(prev => {
      const newTerminals = prev.filter(t => t.id !== id);
      return newTerminals;
    });
  }, []);

  const incrementCounter = useCallback(() => {
    const current = terminalCounter;
    setTerminalCounter(prev => prev + 1);
    return current;
  }, [terminalCounter]);

  const setXtermInstance = useCallback((id: string, xterm: XTerm, fitAddon: FitAddon) => {
    xtermInstancesRef.current.set(id, { xterm, fitAddon });
  }, []);

  const getXtermInstance = useCallback((id: string) => {
    return xtermInstancesRef.current.get(id);
  }, []);

  const removeXtermInstance = useCallback((id: string) => {
    const instance = xtermInstancesRef.current.get(id);
    if (instance) {
      instance.xterm.dispose();
      xtermInstancesRef.current.delete(id);
    }
  }, []);

  const setTerminalRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      terminalRefsRef.current.set(id, el);
    } else {
      terminalRefsRef.current.delete(id);
    }
  }, []);

  const getTerminalRef = useCallback((id: string) => {
    return terminalRefsRef.current.get(id);
  }, []);

  const value: TerminalContextType = {
    terminals,
    activeTerminalId,
    terminalCounter,
    isInitializing,
    xtermInstances: xtermInstancesRef.current,
    terminalRefs: terminalRefsRef.current,
    addTerminal,
    updateTerminal,
    removeTerminal,
    setActiveTerminalId,
    setIsInitializing,
    incrementCounter,
    setXtermInstance,
    getXtermInstance,
    removeXtermInstance,
    setTerminalRef,
    getTerminalRef,
  };

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
}