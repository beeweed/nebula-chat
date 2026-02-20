export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
    }>;
    required: string[];
  };
}

export interface FileWriteOperation {
  type: 'write';
  content: string;
}

export interface FileWriteToolInput {
  file_path: string;
  operations: FileWriteOperation[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  content: string;
  is_error: boolean;
}

export interface FileWriteResult {
  success: boolean;
  file_path: string;
  message: string;
  content?: string;
}