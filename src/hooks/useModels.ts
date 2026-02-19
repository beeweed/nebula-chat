import { useState, useCallback } from 'react';
import { OpenRouterModel } from '@/types/chat';
import { fetchModels } from '@/lib/openrouter';

export function useModels() {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async (apiKey: string) => {
    if (!apiKey.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchModels(apiKey);
      // Sort by name
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
      setModels(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { models, loading, error, loadModels };
}
