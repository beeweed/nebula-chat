import { OpenRouterModel } from '@/types/chat';
import { SYSTEM_PROMPT } from '@/config/prompts';
import { getAllTools, MAX_TOOL_ITERATIONS, ToolCall, FileWriteResult } from '@/tools';
import { FILE_WRITE_TOOL_NAME, parseFileWriteToolInput, executeFileWriteTool } from '@/tools/fileWriteTool';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export interface ToolCallEvent {
  toolCallId: string;
  toolName: string;
  filePath: string;
  content: string;
  result: FileWriteResult;
}

export interface StreamingToolCallEvent {
  toolCallId: string;
  toolName: string;
  filePath: string;
  streamedContent: string;
  isComplete: boolean;
}

function extractPartialFileWrite(partialArgs: string): { filePath: string; content: string } | null {
  try {
    const filePathMatch = partialArgs.match(/"file_path"\s*:\s*"([^"]+)"/);
    const filePath = filePathMatch ? filePathMatch[1] : '';
    
    if (!filePath) return null;

    const contentMatch = partialArgs.match(/"content"\s*:\s*"([\s\S]*?)(?:"|$)/);
    let content = '';
    
    if (contentMatch) {
      content = contentMatch[1];
      try {
        content = JSON.parse(`"${content}"`);
      } catch {
        content = content
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r')
          .replace(/\\\\/g, '\\')
          .replace(/\\"/g, '"');
      }
    }
    
    return { filePath, content };
  } catch {
    return null;
  }
}

export async function fetchModels(apiKey: string): Promise<OpenRouterModel[]> {
  const response = await fetch(`${OPENROUTER_BASE}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.data || []) as OpenRouterModel[];
}

interface StreamChatOptions {
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string | null; tool_calls?: ToolCall[]; tool_call_id?: string }>;
  onChunk: (text: string) => void;
  onToolCall?: (event: ToolCallEvent) => void;
  onStreamingToolCall?: (event: StreamingToolCallEvent) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  writeFile: (path: string, content: string) => Promise<boolean>;
  makeDirectory: (path: string) => Promise<boolean>;
}

async function makeStreamRequest(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string | null; tool_calls?: ToolCall[]; tool_call_id?: string }>,
  useTools: boolean = true
): Promise<Response> {
  const tools = useTools ? getAllTools() : undefined;
  
  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Nebula Chat',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      stream: true,
      ...(tools && tools.length > 0 ? { tools } : {}),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || response.statusText);
  }

  return response;
}

interface StreamResult {
  content: string;
  toolCalls: ToolCall[];
  finishReason: string | null;
}

interface ProcessStreamOptions {
  response: Response;
  onChunk: (text: string) => void;
  onStreamingToolCall?: (event: StreamingToolCallEvent) => void;
}

async function processStream(options: ProcessStreamOptions): Promise<StreamResult> {
  const { response, onChunk, onStreamingToolCall } = options;
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  const toolCalls: ToolCall[] = [];
  let finishReason: string | null = null;
  const toolCallsMap: Map<number, { id: string; type: string; function: { name: string; arguments: string } }> = new Map();
  
  let lastStreamingUpdate = 0;
  const STREAMING_THROTTLE_MS = 50;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const choice = json.choices?.[0];
        
        if (choice?.finish_reason) {
          finishReason = choice.finish_reason;
        }
        
        const delta = choice?.delta;
        if (delta?.content) {
          content += delta.content;
          onChunk(delta.content);
        }
        
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const index = tc.index ?? 0;
            
            if (!toolCallsMap.has(index)) {
              toolCallsMap.set(index, {
                id: tc.id || `call_${Date.now()}_${index}`,
                type: 'function',
                function: {
                  name: tc.function?.name || '',
                  arguments: tc.function?.arguments || ''
                }
              });
            } else {
              const existing = toolCallsMap.get(index)!;
              if (tc.id) existing.id = tc.id;
              if (tc.function?.name) existing.function.name += tc.function.name;
              if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
            }
            
            if (onStreamingToolCall) {
              const now = performance.now();
              if (now - lastStreamingUpdate >= STREAMING_THROTTLE_MS) {
                lastStreamingUpdate = now;
                const toolCallData = toolCallsMap.get(index);
                if (toolCallData && toolCallData.function.name === FILE_WRITE_TOOL_NAME) {
                  const partial = extractPartialFileWrite(toolCallData.function.arguments);
                  if (partial && partial.filePath) {
                    onStreamingToolCall({
                      toolCallId: toolCallData.id,
                      toolName: toolCallData.function.name,
                      filePath: partial.filePath,
                      streamedContent: partial.content,
                      isComplete: false,
                    });
                  }
                }
              }
            }
          }
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  for (const tc of toolCallsMap.values()) {
    toolCalls.push(tc as ToolCall);
  }

  return { content, toolCalls, finishReason };
}

export async function streamChat(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): Promise<void> {
  await streamChatWithTools({
    apiKey,
    model,
    messages,
    onChunk,
    onDone,
    onError,
    writeFile: async () => false,
    makeDirectory: async () => false,
  });
}

export async function streamChatWithTools(options: StreamChatOptions): Promise<void> {
  const {
    apiKey,
    model,
    messages,
    onChunk,
    onToolCall,
    onStreamingToolCall,
    onDone,
    onError,
    writeFile,
    makeDirectory,
  } = options;

  try {
    const conversationMessages = [...messages];
    let iteration = 0;
    
    while (iteration < MAX_TOOL_ITERATIONS) {
      iteration++;
      
      const response = await makeStreamRequest(apiKey, model, conversationMessages);
      const result = await processStream({
        response,
        onChunk,
        onStreamingToolCall,
      });
      
      if (result.toolCalls.length === 0) {
        onDone();
        return;
      }
      
      const assistantMessage: { role: string; content: string | null; tool_calls?: ToolCall[] } = {
        role: 'assistant',
        content: result.content || null,
      };
      
      if (result.toolCalls.length > 0) {
        assistantMessage.tool_calls = result.toolCalls;
      }
      
      conversationMessages.push(assistantMessage);
      
      for (const toolCall of result.toolCalls) {
        const toolName = toolCall.function.name;
        
        if (toolName === FILE_WRITE_TOOL_NAME) {
          const input = parseFileWriteToolInput(toolCall.function.arguments);
          
          if (input) {
            const toolResult = await executeFileWriteTool(input, writeFile, makeDirectory);
            
            if (onToolCall) {
              onToolCall({
                toolCallId: toolCall.id,
                toolName,
                filePath: input.file_path,
                content: input.operations[0]?.content || '',
                result: toolResult,
              });
            }
            
            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                success: toolResult.success,
                message: toolResult.message,
                file_path: toolResult.file_path,
              }),
            });
          } else {
            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                success: false,
                message: 'Failed to parse tool input',
              }),
            });
          }
        } else {
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              success: false,
              message: `Unknown tool: ${toolName}`,
            }),
          });
        }
      }
    }
    
    onChunk('\n\n[Max tool iterations reached]');
    onDone();
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
