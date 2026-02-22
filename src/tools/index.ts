export * from './types';
export * from './fileWriteTool';
export * from './fileReadTool';

import { getOpenRouterToolFormat } from './fileWriteTool';
import { getFileReadOpenRouterToolFormat } from './fileReadTool';

export const MAX_TOOL_ITERATIONS = 100;

export function getAllTools() {
  return [getOpenRouterToolFormat(), getFileReadOpenRouterToolFormat()];
}