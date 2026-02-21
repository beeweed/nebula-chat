// Bash Tool - Executes bash commands in the E2B sandbox

// Constants
export const DEFAULT_TIMEOUT = 60;
export const MAX_TIMEOUT = 180;
export const BASH_TOOL_NAME = 'bash';

// Tool description
export const BASH_TOOL_DESCRIPTION = `Executes a bash command in the E2B sandbox terminal.

Usage notes:
- Write a clear, concise description of what this command does in 5-10 words
- To run multiple commands, join them with ';' or '&&'. Do not use newlines
- For long-running tasks (e.g., starting servers), set wait_for_output to false
- You can specify an optional timeout in seconds (up to ${MAX_TIMEOUT} seconds). If not specified, commands will timeout after ${DEFAULT_TIMEOUT} seconds
- After running a command, the output will be returned to you so you can see the result
- When starting a dev server, use wait_for_output: false, then check if it's running

Examples:
- List files: { "command": "ls -la", "description": "Lists files in current directory" }
- Install deps: { "command": "npm install", "description": "Installs npm dependencies", "timeout": 120 }
- Start server: { "command": "npm run dev", "description": "Starts development server", "wait_for_output": false }
- Check running: { "command": "curl -s http://localhost:3000 || echo 'Server not ready'", "description": "Check if server is running" }
`;

// Tool schema for OpenRouter/OpenAI function calling
export const BASH_TOOL_SCHEMA = {
  type: 'function' as const,
  function: {
    name: BASH_TOOL_NAME,
    description: BASH_TOOL_DESCRIPTION,
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The bash command to execute.',
        },
        description: {
          type: 'string',
          description:
            "Clear, concise description of what this command does in 5-10 words. Examples: 'Lists files in current directory', 'Installs npm dependencies', 'Starts development server'",
        },
        timeout: {
          type: 'integer',
          description: `The timeout for the command in seconds. Maximum is ${MAX_TIMEOUT} seconds. Default is ${DEFAULT_TIMEOUT} seconds.`,
          default: DEFAULT_TIMEOUT,
        },
        wait_for_output: {
          type: 'boolean',
          description:
            'If true, wait for the command to finish and return its output (up to the timeout). If false, run in background and return immediately.',
          default: true,
        },
      },
      required: ['command', 'description'],
    },
  },
};

// Input type for the bash tool
export interface BashToolInput {
  command: string;
  description: string;
  timeout?: number;
  wait_for_output?: boolean;
}

// Result type for bash execution
export interface BashToolResult {
  success: boolean;
  command: string;
  description: string;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  timed_out: boolean;
  is_background: boolean;
  message: string;
}

// Command execution result from E2B sandbox
interface CommandResult {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}

// Parse tool input from JSON string
export function parseBashToolInput(argsJson: string): BashToolInput | null {
  try {
    const parsed = JSON.parse(argsJson);
    if (!parsed.command || typeof parsed.command !== 'string') {
      return null;
    }
    return {
      command: parsed.command,
      description: parsed.description || 'Executing command',
      timeout: Math.min(parsed.timeout || DEFAULT_TIMEOUT, MAX_TIMEOUT),
      wait_for_output: parsed.wait_for_output !== false,
    };
  } catch (error) {
    console.error('Failed to parse bash tool input:', error);
    return null;
  }
}

// Execute bash command in E2B sandbox
export async function executeBashTool(
  input: BashToolInput,
  runCommand: (command: string, background?: boolean) => Promise<CommandResult | null>
): Promise<BashToolResult> {
  const { command, description, timeout = DEFAULT_TIMEOUT, wait_for_output = true } = input;

  try {
    if (!wait_for_output) {
      // Run in background - don't wait for completion
      const result = await runCommand(command, true);
      
      return {
        success: true,
        command,
        description,
        stdout: 'Command started in background',
        stderr: '',
        exit_code: null,
        timed_out: false,
        is_background: true,
        message: `Background process started. Command: ${command}`,
      };
    }

    // Execute command and wait for output
    const timeoutMs = timeout * 1000;
    
    const result = await Promise.race([
      runCommand(command, false),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Command timed out')), timeoutMs)
      ),
    ]);

    if (result === null) {
      return {
        success: false,
        command,
        description,
        stdout: '',
        stderr: 'Command timed out',
        exit_code: null,
        timed_out: true,
        is_background: false,
        message: `Command timed out after ${timeout} seconds`,
      };
    }

    const stdout = result?.stdout || '';
    const stderr = result?.stderr || '';
    const exitCode = result?.exitCode ?? 0;
    const success = exitCode === 0;

    // Truncate output if too long
    const maxOutputLength = 10000;
    const truncatedStdout = stdout.length > maxOutputLength 
      ? stdout.slice(0, maxOutputLength) + '\n... [output truncated]'
      : stdout;
    const truncatedStderr = stderr.length > maxOutputLength
      ? stderr.slice(0, maxOutputLength) + '\n... [output truncated]'
      : stderr;

    return {
      success,
      command,
      description,
      stdout: truncatedStdout,
      stderr: truncatedStderr,
      exit_code: exitCode,
      timed_out: false,
      is_background: false,
      message: success 
        ? `Command executed successfully` 
        : `Command failed with exit code ${exitCode}`,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = errorMessage === 'Command timed out';
    
    return {
      success: false,
      command,
      description,
      stdout: '',
      stderr: isTimeout ? 'Command timed out' : errorMessage,
      exit_code: null,
      timed_out: isTimeout,
      is_background: false,
      message: isTimeout 
        ? `Command timed out after ${timeout} seconds` 
        : `Command failed: ${errorMessage}`,
    };
  }
}