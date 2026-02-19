import { useState, useEffect, useCallback } from 'react';
import heroBg from '@/assets/hero-bg.jpg';
import { TopBar } from '@/components/chat/TopBar';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { SettingsModal } from '@/components/chat/SettingsModal';
import { useModels } from '@/hooks/useModels';
import { useChatMessages } from '@/hooks/useChatMessages';

const STORAGE_KEY_API = 'neuralchat_apikey';
const STORAGE_KEY_MODEL = 'neuralchat_model';

const Index = () => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(STORAGE_KEY_API) || '');
  const [selectedModel, setSelectedModel] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY_MODEL) || ''
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { models, loading: modelsLoading, loadModels } = useModels();
  const { messages, isStreaming, sendMessage, clearMessages } = useChatMessages();

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

  // Open settings if no API key
  useEffect(() => {
    if (!apiKey) {
      setSettingsOpen(true);
    }
  }, []);

  const handleSaveApiKey = useCallback(
    (key: string) => {
      setApiKey(key);
      localStorage.setItem(STORAGE_KEY_API, key);
      if (key) loadModels(key);
    },
    [loadModels]
  );

  const handleModelSelect = useCallback((id: string) => {
    setSelectedModel(id);
    localStorage.setItem(STORAGE_KEY_MODEL, id);
  }, []);

  const handleSend = useCallback(
    (content: string) => {
      if (!apiKey || !selectedModel) return;
      sendMessage(content, apiKey, selectedModel);
    },
    [apiKey, selectedModel, sendMessage]
  );

  const selectedModelInfo = models.find((m) => m.id === selectedModel);
  const canChat = !!apiKey && !!selectedModel;

  return (
    <div
      className="relative flex flex-col h-screen overflow-hidden bg-background"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background/92 backdrop-blur-[2px]" />

      {/* Ambient glow accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/4 rounded-full blur-3xl pointer-events-none" />

      {/* App shell */}
      <div className="relative z-10 flex flex-col h-full max-w-4xl mx-auto w-full">
        <TopBar
          models={models}
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
          modelsLoading={modelsLoading}
          onSettingsOpen={() => setSettingsOpen(true)}
          onClearChat={clearMessages}
          messageCount={messages.length}
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
        />
      </div>

      {settingsOpen && (
        <SettingsModal
          apiKey={apiKey}
          onSave={handleSaveApiKey}
          onClose={() => setSettingsOpen(false)}
          modelCount={models.length}
          modelsLoading={modelsLoading}
        />
      )}
    </div>
  );
};

export default Index;
