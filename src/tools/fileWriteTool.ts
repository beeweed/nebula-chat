import { ToolDefinition, FileWriteToolInput, FileWriteResult } from './types';

export const FILE_WRITE_TOOL_NAME = 'file_write';

export const fileWriteToolDefinition: ToolDefinition = {
  name: FILE_WRITE_TOOL_NAME,
  description: `Creates or overwrites a file at the specified path with the provided content. Use this tool when you need to create new files or modify existing files in the sandbox filesystem.

USAGE INSTRUCTIONS:
- Use this tool for EVERY file you need to create or write
- Provide the complete file path starting with / (e.g., /home/user/project/src/app.js)
- Include the full content of the file in the operations array
- The tool will automatically create parent directories if they don't exist
- Files are written to the E2B sandbox filesystem

EXAMPLE:
To create a file at /home/user/project/index.html with HTML content:
{
  "file_path": "/home/user/project/index.html",
  "operations": [
    {
      "type": "write",
      "content": "<!DOCTYPE html>\\n<html>\\n<head>\\n  <title>My App</title>\\n</head>\\n<body>\\n  <h1>Hello World</h1>\\n</body>\\n</html>"
    }
  ]
}`,
  parameters: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path where the file should be created or written, including filename and extension (e.g., /home/user/project/src/app.js)'
      },
      operations: {
        type: 'array',
        description: 'Array of write operations to perform on the file. Each operation has a type ("write") and content (the file content to write).'
      }
    },
    required: ['file_path', 'operations']
  }
};

export function parseFileWriteToolInput(argumentsJson: string): FileWriteToolInput | null {
  try {
    const parsed = JSON.parse(argumentsJson);
    
    if (!parsed.file_path || typeof parsed.file_path !== 'string') {
      console.error('Invalid file_path in tool input');
      return null;
    }
    
    if (!parsed.operations || !Array.isArray(parsed.operations)) {
      console.error('Invalid operations in tool input');
      return null;
    }
    
    for (const op of parsed.operations) {
      if (op.type !== 'write' || typeof op.content !== 'string') {
        console.error('Invalid operation in tool input:', op);
        return null;
      }
    }
    
    return parsed as FileWriteToolInput;
  } catch (error) {
    console.error('Failed to parse file write tool input:', error);
    return null;
  }
}

export async function executeFileWriteTool(
  input: FileWriteToolInput,
  writeFile: (path: string, content: string) => Promise<boolean>,
  makeDirectory: (path: string) => Promise<boolean>
): Promise<FileWriteResult> {
  const { file_path, operations } = input;
  
  try {
    const pathParts = file_path.split('/');
    pathParts.pop();
    const dirPath = pathParts.join('/');
    
    if (dirPath && dirPath !== '/') {
      await makeDirectory(dirPath);
    }
    
    let finalContent = '';
    for (const operation of operations) {
      if (operation.type === 'write') {
        finalContent = operation.content;
      }
    }
    
    const success = await writeFile(file_path, finalContent);
    
    if (success) {
      return {
        success: true,
        file_path,
        message: `Successfully created/wrote file: ${file_path}`,
        content: finalContent
      };
    } else {
      return {
        success: false,
        file_path,
        message: `Failed to write file: ${file_path}`
      };
    }
  } catch (error) {
    return {
      success: false,
      file_path,
      message: `Error writing file: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export function getOpenRouterToolFormat() {
  return {
    type: 'function' as const,
    function: {
      name: fileWriteToolDefinition.name,
      description: fileWriteToolDefinition.description,
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: fileWriteToolDefinition.parameters.properties.file_path.description
          },
          operations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['write'],
                  description: 'The type of operation to perform'
                },
                content: {
                  type: 'string',
                  description: 'The content to write to the file'
                }
              },
              required: ['type', 'content']
            },
            description: fileWriteToolDefinition.parameters.properties.operations.description
          }
        },
        required: fileWriteToolDefinition.parameters.required
      }
    }
  };
}