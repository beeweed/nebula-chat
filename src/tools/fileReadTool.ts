import { ToolDefinition } from './types';

export const FILE_READ_TOOL_NAME = 'file_read';
export const FILE_READ_DISPLAY_NAME = 'Read file';

export const MAX_FILE_READ_LINES = 5000;
export const MAX_LINE_LENGTH = 5000;

export interface FileReadToolInput {
  file_path: string;
}

export interface FileReadResult {
  success: boolean;
  file_path: string;
  message: string;
  content?: string;
  line_count?: number;
}

export const fileReadToolDefinition: ToolDefinition = {
  name: FILE_READ_TOOL_NAME,
  description: `Reads and returns the content of a specified file from the local filesystem. Supports text files.

Usage:
- Use this tool to read the contents of any file in the sandbox filesystem
- Provide the absolute file path starting with / (e.g., /home/user/project/src/app.js)
- The tool returns the file content as text
- Maximum ${MAX_FILE_READ_LINES} lines can be read
- Lines longer than ${MAX_LINE_LENGTH} characters are truncated

EXAMPLE:
To read a file at /home/user/project/index.html:
{
  "file_path": "/home/user/project/index.html"
}

The tool will return the file content which you can then analyze, modify, or use to understand the codebase.`,
  parameters: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Absolute path of the file to read (e.g., /home/user/project/src/app.js)'
      }
    },
    required: ['file_path']
  }
};

export function parseFileReadToolInput(argumentsJson: string): FileReadToolInput | null {
  try {
    const parsed = JSON.parse(argumentsJson);
    
    if (!parsed.file_path || typeof parsed.file_path !== 'string') {
      console.error('Invalid file_path in tool input');
      return null;
    }
    
    return parsed as FileReadToolInput;
  } catch (error) {
    console.error('Failed to parse file read tool input:', error);
    return null;
  }
}

export async function executeFileReadTool(
  input: FileReadToolInput,
  readFile: (path: string) => Promise<string | null>
): Promise<FileReadResult> {
  const { file_path } = input;
  
  try {
    const content = await readFile(file_path);
    
    if (content === null) {
      return {
        success: false,
        file_path,
        message: `Failed to read file: ${file_path}. File may not exist or is not accessible.`
      };
    }

    const lines = content.split('\n');
    let processedContent = content;
    let lineCount = lines.length;
    
    if (lines.length > MAX_FILE_READ_LINES) {
      processedContent = lines.slice(0, MAX_FILE_READ_LINES).join('\n');
      processedContent += `\n\n[... truncated: showing ${MAX_FILE_READ_LINES} of ${lines.length} lines ...]`;
      lineCount = MAX_FILE_READ_LINES;
    }

    const truncatedLines = processedContent.split('\n').map(line => {
      if (line.length > MAX_LINE_LENGTH) {
        return line.substring(0, MAX_LINE_LENGTH) + '... [line truncated]';
      }
      return line;
    });
    processedContent = truncatedLines.join('\n');
    
    return {
      success: true,
      file_path,
      message: `Successfully read file: ${file_path}`,
      content: processedContent,
      line_count: lineCount
    };
  } catch (error) {
    return {
      success: false,
      file_path,
      message: `Error reading file: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export function getFileReadOpenRouterToolFormat() {
  return {
    type: 'function' as const,
    function: {
      name: fileReadToolDefinition.name,
      description: fileReadToolDefinition.description,
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: fileReadToolDefinition.parameters.properties.file_path.description
          }
        },
        required: fileReadToolDefinition.parameters.required
      }
    }
  };
}