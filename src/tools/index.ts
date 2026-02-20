export * from './types';
export * from './fileWriteTool';

import { getOpenRouterToolFormat } from './fileWriteTool';

export const MAX_TOOL_ITERATIONS = 100;

export function getAllTools() {
  return [getOpenRouterToolFormat()];
}