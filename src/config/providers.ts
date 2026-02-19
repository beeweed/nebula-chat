export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  modelsEndpoint: string;
  chatEndpoint: string;
  requiresApiKey: boolean;
  headers?: Record<string, string>;
}

export const PROVIDERS: Record<string, ProviderConfig> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    modelsEndpoint: '/models',
    chatEndpoint: '/chat/completions',
    requiresApiKey: true,
  },
  
  // Future providers can be added here:
  // openai: {
  //   id: 'openai',
  //   name: 'OpenAI',
  //   baseUrl: 'https://api.openai.com/v1',
  //   modelsEndpoint: '/models',
  //   chatEndpoint: '/chat/completions',
  //   requiresApiKey: true,
  // },
  
  // anthropic: {
  //   id: 'anthropic',
  //   name: 'Anthropic',
  //   baseUrl: 'https://api.anthropic.com/v1',
  //   modelsEndpoint: '/models',
  //   chatEndpoint: '/messages',
  //   requiresApiKey: true,
  // },
  
  // ollama: {
  //   id: 'ollama',
  //   name: 'Ollama (Local)',
  //   baseUrl: 'http://localhost:11434/api',
  //   modelsEndpoint: '/tags',
  //   chatEndpoint: '/chat',
  //   requiresApiKey: false,
  // },
} as const;

export type ProviderId = keyof typeof PROVIDERS;

export const DEFAULT_PROVIDER: ProviderId = 'openrouter';

export function getProvider(id: ProviderId = DEFAULT_PROVIDER): ProviderConfig {
  return PROVIDERS[id];
}

export function getProviderList(): ProviderConfig[] {
  return Object.values(PROVIDERS);
}