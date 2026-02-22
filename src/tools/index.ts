export * from './types';
export * from './fileWriteTool';
export * from './fileReadTool';
export * from './listFileTool';

import { getOpenRouterToolFormat } from './fileWriteTool';
import { getFileReadOpenRouterToolFormat } from './fileReadTool';
import { getListFileOpenRouterToolFormat } from './listFileTool';

export const MAX_TOOL_ITERATIONS = 100;

export function getAllTools() {
  return [getOpenRouterToolFormat(), getFileReadOpenRouterToolFormat(), getListFileOpenRouterToolFormat()];
}