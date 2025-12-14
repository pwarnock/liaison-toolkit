/**
 * Permanent registry of free models for OpenCode integration
 */

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  context: number;
  cost: { input: number; output: number };
  bestFor: string[];
  free: boolean;
}

export const FREE_MODELS: Record<string, ModelInfo> = {
  'big-pickle': {
    id: 'openrouter/z-ai/glm-4.6',
    name: 'Big Pickle (GLM 4.6)',
    provider: 'openrouter',
    context: 200000,
    cost: { input: 0.40, output: 1.75 },
    bestFor: ['research', 'analysis', 'documentation'],
    free: true
  },
  'grok-fast': {
    id: 'openrouter/x-ai/grok-code-fast-1',
    name: 'Grok Code Fast 1',
    provider: 'openrouter',
    context: 256000,
    cost: { input: 0.20, output: 1.50 },
    bestFor: ['code-review', 'quick-analysis', 'security'],
    free: true
  },
  'kat-coder': {
    id: 'openrouter/kwaipilot/kat-coder-pro-v1:free',
    name: 'KAT-Coder-Pro V1 (Free)',
    provider: 'openrouter',
    context: 100000,
    cost: { input: 0, output: 0 },
    bestFor: ['documentation', 'code-generation', 'tutorials'],
    free: true
  }
};

export function getModel(modelId: string): ModelInfo | undefined {
  return FREE_MODELS[modelId];
}

export function listModels(freeOnly = true): ModelInfo[] {
  return Object.values(FREE_MODELS).filter(model => !freeOnly || model.free);
}

export function getModelAliases(): Record<string, string> {
  return {
    'big-pickle': 'openrouter/z-ai/glm-4.6',
    'grok-fast': 'openrouter/x-ai/grok-code-fast-1',
    'kat-coder': 'openrouter/kwaipilot/kat-coder-pro-v1:free',
    'glm-4.6': 'openrouter/z-ai/glm-4.6',
    'grok-code-fast-1': 'openrouter/x-ai/grok-code-fast-1'
  };
}