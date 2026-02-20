import { useState, useEffect, useCallback, useRef } from 'react';
import { TopBar } from '@/components/chat/TopBar';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { SettingsModal } from '@/components/chat/SettingsModal';
import { BottomPanel } from '@/components/filesystem/BottomPanel';
import { useModels } from '@/hooks/useModels';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useE2BSandbox } from '@/contexts/E2BSandboxContext';

const STORAGE_KEY_API = 'neuralchat_apikey';
const STORAGE_KEY_MODEL = 'neuralchat_model';

const Index = () => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(STORAGE_KEY_API) || '');
  const [selectedModel, setSelectedModel] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY_MODEL) || ''
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);
  const sandboxCreatedRef = useRef(false);

  const { models, loading: modelsLoading, loadModels } = useModels();
  const { messages, isStreaming, sendMessage } = useChatMessages();
  
  const {
    apiKey: e2bApiKey,
    setApiKey: setE2bApiKey,
    isConnected: e2bConnected,
    isConnecting: e2bConnecting,
    createSandbox,
    hasApiKey: hasE2bApiKey,
  } = useE2BSandbox();

  // Load models on mount if API key exists
  useEffect(() => {
    if (apiKey) loadModels(apiKey);
  }, []);

  // Auto-select first model if none selected
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      const first = models[0].id;
      setSelectedModel(first);
      localStorage.setItem(STORAGE_KEY_MODEL, first);
    }
  }, [models, selectedModel]);

  // Open settings if no API keys
  useEffect(() => {
    if (!apiKey || !hasE2bApiKey) {
      setSettingsOpen(true);
    }
  }, []);

  const handleSaveSettings = useCallback(
    (openRouterKey: string, e2bKey: string) => {
      // Save OpenRouter API key
      setApiKey(openRouterKey);
      localStorage.setItem(STORAGE_KEY_API, openRouterKey);
      if (openRouterKey) loadModels(openRouterKey);

      // Save E2B API key
      setE2bApiKey(e2bKey);
    },
    [loadModels, setE2bApiKey]
  );

  const handleModelSelect = useCallback((id: string) => {
    setSelectedModel(id);
    localStorage.setItem(STORAGE_KEY_MODEL, id);
  }, []);

  const handleSend = useCallback(
    async (content: string) => {
      if (!apiKey || !selectedModel || !hasE2bApiKey) return;

      // Create sandbox on first message if not already connected
      if (!e2bConnected && !e2bConnecting && !sandboxCreatedRef.current) {
        sandboxCreatedRef.current = true;
        await createSandbox();
      }

      sendMessage(content, apiKey, selectedModel);
    },
    [apiKey, selectedModel, hasE2bApiKey, e2bConnected, e2bConnecting, createSandbox, sendMessage]
  );

  const selectedModelInfo = models.find((m) => m.id === selectedModel);
  const canChat = !!apiKey && !!selectedModel && hasE2bApiKey;

  return (
    <div className="relative flex flex-col h-screen-safe overflow-hidden" style={{ background: '#000' }}>

      {/* App shell */}
      <div className="relative z-10 flex flex-col h-full max-w-4xl mx-auto w-full px-safe">
        <TopBar
          models={models}
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
          modelsLoading={modelsLoading}
          onSettingsOpen={() => setSettingsOpen(true)}
          onCodeSandboxOpen={() => setBottomPanelOpen(true)}
          selectedModelInfo={selectedModelInfo}
        />

        <ChatMessages
          messages={messages}
          isStreaming={isStreaming}
        />

        <ChatInput
          onSend={handleSend}
          isStreaming={isStreaming}
          disabled={!canChat}
          placeholder={
            !hasE2bApiKey
              ? "Add E2B API key in settings to start chatting..."
              : !apiKey
              ? "Add OpenRouter API key in settings..."
              : !selectedModel
              ? "Select a model to start chatting..."
              : "Type your message..."
          }
        />
      </div>

      {settingsOpen && (
        <SettingsModal
          apiKey={apiKey}
          e2bApiKey={e2bApiKey}
          onSave={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
          modelCount={models.length}
          modelsLoading={modelsLoading}
          e2bConnected={e2bConnected}
          e2bConnecting={e2bConnecting}
        />
      )}

      <BottomPanel
        isOpen={bottomPanelOpen}
        onClose={() => setBottomPanelOpen(false)}
      />
    </div>
  );
};

export default Index;