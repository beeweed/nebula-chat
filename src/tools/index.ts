export * from './types';
export * from './fileWriteTool';
export * from './bashTool';

import { getOpenRouterToolFormat } from './fileWriteTool';
import { BASH_TOOL_SCHEMA } from './bashTool';

export const MAX_TOOL_ITERATIONS = 100;

export function getAllTools() {
  return [getOpenRouterToolFormat(), BASH_TOOL_SCHEMA];
}