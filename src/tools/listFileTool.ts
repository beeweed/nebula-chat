export const LIST_FILE_TOOL_NAME = 'list_file';
export const LIST_FILE_DISPLAY_NAME = 'list_file';

export const LIST_FILE_DESCRIPTION = `List all file paths from the E2B sandbox file system. This tool returns a list of file paths without file contents.

Usage:
- Use this tool when you need to explore the project structure or find specific files
- Use this tool before reading or writing files to understand the codebase layout
- Use "list_all_files": true to get a complete view of all files in the sandbox
- Use "directory_path" to list files from a specific directory only

Examples:
- To list all files: {"list_all_files": true}
- To list files in a specific folder: {"list_all_files": false, "directory_path": "/home/user/project/src"}`;

export interface ListFileInput {
  list_all_files: boolean;
  directory_path?: string;
}

export interface ListFileResult {
  success: boolean;
  message: string;
  files: string[];
  total_count: number;
  base_path: string;
}

export function getListFileOpenRouterToolFormat() {
  return {
    type: 'function' as const,
    function: {
      name: LIST_FILE_TOOL_NAME,
      description: LIST_FILE_DESCRIPTION,
      parameters: {
        type: 'object',
        properties: {
          list_all_files: {
            type: 'boolean',
            description: 'Set true to list all files from the entire file system.',
          },
          directory_path: {
            type: 'string',
            description: 'Provide a directory path to list files from a specific folder.',
          },
        },
        additionalProperties: false,
      },
    },
  };
}

export function parseListFileToolInput(argsJson: string): ListFileInput | null {
  try {
    const parsed = JSON.parse(argsJson);
    return {
      list_all_files: parsed.list_all_files === true,
      directory_path: parsed.directory_path || undefined,
    };
  } catch (error) {
    console.error('Failed to parse list_file tool input:', error);
    return null;
  }
}

async function listFilesRecursive(
  path: string,
  listFiles: (path: string) => Promise<any[]>,
  result: string[] = []
): Promise<string[]> {
  try {
    const files = await listFiles(path);
    
    for (const file of files) {
      const fullPath = path === '/' ? `/${file.name}` : `${path}/${file.name}`;
      const isDirectory = file.type === 'dir';
      
      if (isDirectory) {
        await listFilesRecursive(fullPath, listFiles, result);
      } else {
        result.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Failed to list files at ${path}:`, error);
  }
  
  return result;
}

export async function executeListFileTool(
  input: ListFileInput,
  listFiles: (path: string) => Promise<any[]>
): Promise<ListFileResult> {
  try {
    let basePath: string;
    
    if (input.list_all_files) {
      basePath = '/home/user';
    } else if (input.directory_path) {
      basePath = input.directory_path;
    } else {
      basePath = '/home/user';
    }
    
    const files = await listFilesRecursive(basePath, listFiles);
    
    const sortedFiles = files.sort((a, b) => a.localeCompare(b));
    
    return {
      success: true,
      message: `Successfully listed ${sortedFiles.length} files from ${basePath}`,
      files: sortedFiles,
      total_count: sortedFiles.length,
      base_path: basePath,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to list files: ${error.message || 'Unknown error'}`,
      files: [],
      total_count: 0,
      base_path: input.directory_path || '/home/user',
    };
  }
}