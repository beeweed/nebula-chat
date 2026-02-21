import React, { createContext, useContext, useState, useCallback } from 'react';

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface PreviewContextType {
  port: string;
  deviceMode: DeviceMode;
  refreshKey: number;
  isLoading: boolean;
  error: string | null;
  setPort: (port: string) => void;
  setDeviceMode: (mode: DeviceMode) => void;
  refresh: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const PreviewContext = createContext<PreviewContextType | null>(null);

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [port, setPort] = useState('3000');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    setIsLoading(true);
  }, []);

  const value: PreviewContextType = {
    port,
    deviceMode,
    refreshKey,
    isLoading,
    error,
    setPort,
    setDeviceMode,
    refresh,
    setIsLoading,
    setError,
  };

  return (
    <PreviewContext.Provider value={value}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error('usePreview must be used within a PreviewProvider');
  }
  return context;
}