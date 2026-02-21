import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useE2BSandbox } from '@/contexts/E2BSandboxContext';
import { 
  FolderPlus, 
  FilePlus,
  RefreshCw,
  Upload,
  Download,
  Loader2,
  Folder, 
  FolderOpen, 
  FileCode, 
  File, 
  ChevronRight, 
  ChevronDown,
  Play, 
  CheckCircle, 
  AlertCircle,
  Cloud,
  CloudOff,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type FileType = 'file' | 'folder';

export interface FileSystemItem {
  id: string;
  parentId: string | null;
  name: string;
  type: FileType;
  content?: string;
  isOpen?: boolean;
}

interface CreationState {
  parentId: string;
  type: 'file' | 'folder';
}

interface SyncCallbacks {
  writeFile?: (path: string, content: string) => Promise<boolean>;
  makeDirectory?: (path: string) => Promise<boolean>;
  deleteFile?: (path: string) => Promise<boolean>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INITIAL_FILES: FileSystemItem[] = [
  {
    id: 'root',
    parentId: null,
    name: 'root',
    type: 'folder',
    isOpen: true,
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getLanguageFromFileName = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'json': 'json',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'md': 'markdown',
    'py': 'python',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'dockerfile': 'dockerfile',
    'gitignore': 'plaintext',
    'env': 'plaintext',
  };
  return languageMap[ext] || 'plaintext';
};

// ============================================================================
// HOOKS
// ============================================================================

const useFileSystem = () => {
  const [files, setFiles] = useState<FileSystemItem[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const syncCallbacksRef = useRef<SyncCallbacks>({});

  const setSyncCallbacks = useCallback((callbacks: SyncCallbacks) => {
    syncCallbacksRef.current = callbacks;
  }, []);

  const getFilePath = useCallback((fileId: string, fileList?: FileSystemItem[]): string => {
    const currentFiles = fileList || files;
    const file = currentFiles.find(f => f.id === fileId);
    if (!file) return '';
    
    const pathParts: string[] = [file.name];
    let currentParentId = file.parentId;
    
    while (currentParentId && currentParentId !== 'root') {
      const parent = currentFiles.find(f => f.id === currentParentId);
      if (parent) {
        pathParts.unshift(parent.name);
        currentParentId = parent.parentId;
      } else {
        break;
      }
    }
    
    return '/home/user/' + pathParts.join('/');
  }, [files]);

  // Find file ID by path in a given file list
  const findFileIdByPath = useCallback((path: string, fileList: FileSystemItem[]): string | null => {
    for (const file of fileList) {
      if (file.type === 'file') {
        const filePath = (() => {
          const pathParts: string[] = [file.name];
          let currentParentId = file.parentId;
          
          while (currentParentId && currentParentId !== 'root') {
            const parent = fileList.find(f => f.id === currentParentId);
            if (parent) {
              pathParts.unshift(parent.name);
              currentParentId = parent.parentId;
            } else {
              break;
            }
          }
          
          return '/home/user/' + pathParts.join('/');
        })();
        
        if (filePath === path) {
          return file.id;
        }
      }
    }
    return null;
  }, []);

  const openFileById = useCallback((id: string) => {
    setOpenFiles(prev => {
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });
    setActiveFileId(id);
  }, []);

  const createFile = useCallback(async (parentId: string, name: string, type: 'file' | 'folder') => {
    const newFile: FileSystemItem = {
      id: `${Date.now()}`,
      parentId,
      name,
      type,
      content: type === 'file' ? '' : undefined,
      isOpen: type === 'folder' ? true : undefined,
    };
    
    setFiles(prev => [...prev, newFile]);
    
    const filePath = (() => {
      const pathParts: string[] = [name];
      let currentParentId = parentId;
      
      const currentFiles = [...files, newFile];
      while (currentParentId && currentParentId !== 'root') {
        const parent = currentFiles.find(f => f.id === currentParentId);
        if (parent) {
          pathParts.unshift(parent.name);
          currentParentId = parent.parentId;
        } else {
          break;
        }
      }
      
      return '/home/user/' + pathParts.join('/');
    })();

    if (type === 'folder' && syncCallbacksRef.current.makeDirectory) {
      setIsSyncing(true);
      await syncCallbacksRef.current.makeDirectory(filePath);
      setIsSyncing(false);
    } else if (type === 'file' && syncCallbacksRef.current.writeFile) {
      setIsSyncing(true);
      await syncCallbacksRef.current.writeFile(filePath, '');
      setIsSyncing(false);
      openFileById(newFile.id);
    }
    
    if (type === 'file') {
      openFileById(newFile.id);
    }
  }, [files, openFileById]);

  const updateFileContent = useCallback(async (id: string, newContent: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content: newContent } : f));
    
    const file = files.find(f => f.id === id);
    if (file && syncCallbacksRef.current.writeFile) {
      const filePath = getFilePath(id);
      if (filePath) {
        await syncCallbacksRef.current.writeFile(filePath, newContent);
      }
    }
  }, [files, getFilePath]);

  const toggleFolder = useCallback((id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  }, []);

  const expandFolder = useCallback((id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isOpen: true } : f));
  }, []);

  const openFile = useCallback((id: string) => {
    openFileById(id);
  }, [openFileById]);

  const closeFile = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenFiles(prev => {
      const newOpen = prev.filter(fid => fid !== id);
      if (activeFileId === id) {
        setActiveFileId(newOpen.length > 0 ? newOpen[newOpen.length - 1] : null);
      }
      return newOpen;
    });
  }, [activeFileId]);

  const getActiveFile = useCallback(() => files.find(f => f.id === activeFileId), [files, activeFileId]);

  const replaceWithSandboxFiles = useCallback((newFiles: FileSystemItem[]) => {
    const root = INITIAL_FILES.find(f => f.id === 'root');
    const newFileList = [root!, ...newFiles];
    
    // Build path mappings for currently open files before replacing
    const openFilePaths: string[] = [];
    let activeFilePath: string | null = null;
    
    // Get paths of currently open files
    for (const openFileId of openFiles) {
      const path = getFilePath(openFileId, files);
      if (path) {
        openFilePaths.push(path);
      }
    }
    
    // Get path of active file
    if (activeFileId) {
      activeFilePath = getFilePath(activeFileId, files);
    }
    
    // Update files
    setFiles(newFileList);
    
    // Restore open files by finding matching paths in new file list
    const newOpenFiles: string[] = [];
    for (const path of openFilePaths) {
      const newFileId = findFileIdByPath(path, newFiles);
      if (newFileId) {
        newOpenFiles.push(newFileId);
      }
    }
    setOpenFiles(newOpenFiles);
    
    // Restore active file
    if (activeFilePath) {
      const newActiveFileId = findFileIdByPath(activeFilePath, newFiles);
      setActiveFileId(newActiveFileId);
    } else {
      setActiveFileId(null);
    }
  }, [files, openFiles, activeFileId, getFilePath, findFileIdByPath]);

  const getAllFiles = useCallback(() => {
    return files;
  }, [files]);

  return {
    files,
    activeFileId,
    openFiles,
    isSyncing,
    createFile,
    updateFileContent,
    toggleFolder,
    expandFolder,
    openFile,
    closeFile,
    setActiveFileId,
    getActiveFile,
    setSyncCallbacks,
    getFilePath,
    replaceWithSandboxFiles,
    getAllFiles,
  };
};

// ============================================================================
// COMPONENTS
// ============================================================================

interface EditorProps {
  file: FileSystemItem | undefined;
  onChange: (id: string, content: string) => void;
}

const CodeEditor: React.FC<EditorProps> = ({ file, onChange }) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });
  }, []);

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monaco.editor.setModelMarkers(editor.getModel()!, 'owner', []);
    editor.focus();
  }, []);

  const handleChange = useCallback((value: string | undefined) => {
    if (file && value !== undefined) {
      onChange(file.id, value);
    }
  }, [file, onChange]);

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#1e1e1e] h-full">
        <FileCode size={48} className="mb-4 opacity-20" />
        <p className="text-sm">Select a file to start editing</p>
      </div>
    );
  }

  const language = getLanguageFromFileName(file.name);

  return (
    <div className="h-full w-full overflow-hidden">
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={file.content || ''}
        theme="vs-dark"
        onChange={handleChange}
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 13,
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          lineNumbers: 'on',
          renderLineHighlight: 'none',
          highlightActiveIndentGuide: false,
          occurrencesHighlight: 'off',
          selectionHighlight: false,
          renderValidationDecorations: 'off',
          guides: {
            indentation: false,
            highlightActiveIndentation: false,
            bracketPairs: false,
            bracketPairsHorizontal: false,
          },
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          padding: { top: 12, bottom: 12 },
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          bracketPairColorization: { enabled: false },
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          hover: { enabled: false },
          quickSuggestions: false,
          parameterHints: { enabled: false },
          suggestOnTriggerCharacters: false,
          folding: true,
          glyphMargin: false,
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-400">
            <Loader2 className="animate-spin mr-2" size={16} />
            <span>Loading editor...</span>
          </div>
        }
      />
    </div>
  );
};

const CreationForm: React.FC<{
  type: 'file' | 'folder';
  level: number;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}> = ({ type, level, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    } else {
      onCancel();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="flex items-center px-2 py-1 bg-[#2a2a2b] border-l-2 border-primary"
      style={{ paddingLeft: `${level * 12 + 8}px` }}
      onClick={e => e.stopPropagation()}
    >
      <span className="mr-2 text-gray-400">
        {type === 'folder' ? <Folder size={14} className="text-yellow-500"/> : <File size={14} className="text-blue-400"/>}
      </span>
      <input
        ref={inputRef}
        type="text"
        className="bg-transparent text-white outline-none w-full text-xs placeholder-gray-500"
        placeholder={type === 'folder' ? "Folder name..." : "File name..."}
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
             onCancel();
          }
        }}
      />
    </form>
  );
};

interface FileTreeProps {
  parentId: string | null;
  level?: number;
  files: FileSystemItem[];
  activeFileId: string | null;
  creationState: CreationState | null;
  onToggleFolder: (id: string) => void;
  onOpenFile: (id: string) => void;
  onStartCreating: (parentId: string, type: 'file' | 'folder') => void;
  onCancelCreating: () => void;
  onCreate: (parentId: string, name: string, type: 'file' | 'folder') => void;
}

const FileTree: React.FC<FileTreeProps> = ({
  parentId,
  level = 0,
  files,
  activeFileId,
  creationState,
  onToggleFolder,
  onOpenFile,
  onStartCreating,
  onCancelCreating,
  onCreate
}) => {
  const getChildren = (pid: string | null) => {
    return files.filter(f => f.parentId === pid).sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
    });
  };

  const handleItemClick = (item: FileSystemItem) => {
    if (item.type === 'folder') {
      onToggleFolder(item.id);
    } else {
      onOpenFile(item.id);
    }
  };

  const children = getChildren(parentId);
  const isCreatingHere = creationState?.parentId === parentId;

  return (
    <div className="select-none text-xs">
      {isCreatingHere && creationState && (
        <CreationForm
          type={creationState.type}
          level={level}
          onSubmit={(name) => onCreate(parentId!, name, creationState.type)}
          onCancel={onCancelCreating}
        />
      )}

      {children.map(item => (
        <div key={item.id}>
          <div 
            className={cn(
              'flex items-center group px-2 py-1 cursor-pointer transition-colors relative',
              item.id === activeFileId 
                ? 'bg-primary/20 text-primary' 
                : 'text-gray-400 hover:bg-[#2a2a2b] hover:text-gray-200'
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => handleItemClick(item)}
          >
            <span className="mr-1 opacity-70">
              {item.type === 'folder' ? (
                item.isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
              ) : <span className="w-3 inline-block" />}
            </span>
            
            <span className={cn('mr-2', item.type === 'folder' ? 'text-yellow-500' : 'text-blue-400')}>
              {item.type === 'folder' ? (
                item.isOpen ? <FolderOpen size={14} /> : <Folder size={14} />
              ) : (
                <FileCode size={14} />
              )}
            </span>

            <span className="truncate flex-1">{item.name}</span>

            <div className="hidden group-hover:flex items-center space-x-0.5 ml-2">
              {item.type === 'folder' && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onStartCreating(item.id, 'file'); }}
                    className="p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                    title="New File"
                  >
                    <FilePlus size={12} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onStartCreating(item.id, 'folder'); }}
                    className="p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                    title="New Folder"
                  >
                    <FolderPlus size={12} />
                  </button>
                </>
              )}
            </div>
          </div>

          {item.type === 'folder' && item.isOpen && (
            <FileTree 
              parentId={item.id} 
              level={level + 1} 
              files={files} 
              activeFileId={activeFileId}
              creationState={creationState}
              onToggleFolder={onToggleFolder}
              onOpenFile={onOpenFile}
              onStartCreating={onStartCreating}
              onCancelCreating={onCancelCreating}
              onCreate={onCreate}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FilesTab() {
  const {
    files,
    activeFileId,
    openFiles,
    isSyncing: isLocalSyncing,
    createFile,
    updateFileContent,
    toggleFolder,
    expandFolder,
    openFile,
    closeFile,
    setActiveFileId,
    getActiveFile,
    setSyncCallbacks,
    getAllFiles,
    replaceWithSandboxFiles,
  } = useFileSystem();

  const {
    isConnected,
    isConnecting,
    sandboxId,
    error: sandboxError,
    isSyncing: isSandboxSyncing,
    hasApiKey,
    createSandbox,
    writeFile,
    makeDirectory,
    deleteFile,
    syncLocalToSandbox,
    syncSandboxToLocal,
  } = useE2BSandbox();

  const [creationState, setCreationState] = useState<CreationState | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeFile = getActiveFile();
  const isSyncing = isLocalSyncing || isSandboxSyncing;

  useEffect(() => {
    if (isConnected) {
      setSyncCallbacks({
        writeFile,
        makeDirectory,
        deleteFile,
      });
    }
  }, [isConnected, writeFile, makeDirectory, deleteFile, setSyncCallbacks]);

  // Auto-sync every 4 seconds when connected
  useEffect(() => {
    if (!isConnected) return;

    const autoSyncInterval = setInterval(async () => {
      if (!isSandboxSyncing && !isLocalSyncing) {
        setSyncStatus('syncing');
        const sandboxFiles = await syncSandboxToLocal();
        if (sandboxFiles.length > 0) {
          replaceWithSandboxFiles(sandboxFiles);
          setSyncStatus('success');
          setLastSyncTime(new Date());
        } else {
          setSyncStatus('idle');
        }
      }
    }, 4000);

    return () => clearInterval(autoSyncInterval);
  }, [isConnected, isSandboxSyncing, isLocalSyncing, syncSandboxToLocal, replaceWithSandboxFiles]);

  const handlePushToSandbox = useCallback(async () => {
    setSyncStatus('syncing');
    const allFiles = getAllFiles();
    const success = await syncLocalToSandbox(allFiles);
    setSyncStatus(success ? 'success' : 'error');
    if (success) setLastSyncTime(new Date());
  }, [getAllFiles, syncLocalToSandbox]);

  const handlePullFromSandbox = useCallback(async () => {
    setSyncStatus('syncing');
    const sandboxFiles = await syncSandboxToLocal();
    if (sandboxFiles.length > 0) {
      replaceWithSandboxFiles(sandboxFiles);
      setSyncStatus('success');
      setLastSyncTime(new Date());
    } else {
      setSyncStatus('error');
    }
  }, [syncSandboxToLocal, replaceWithSandboxFiles]);

  const handleStartCreating = (parentId: string, type: 'file' | 'folder') => {
    setCreationState({ parentId, type });
    if (parentId !== 'root') expandFolder(parentId);
  };

  const handleCancelCreating = () => setCreationState(null);

  const handleCreateSubmit = (parentId: string, name: string, type: 'file' | 'folder') => {
    createFile(parentId, name, type);
    setCreationState(null);
  };

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      setSidebarWidth(Math.max(150, Math.min(400, newWidth)));
    };

    const handleEnd = () => setIsResizing(false);

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
    };
  }, [isResizing]);

  return (
    <div 
      ref={containerRef}
      className="flex h-full bg-[#1e1e1e] text-gray-300"
      style={{ cursor: isResizing ? 'col-resize' : undefined }}
    >
      {isResizing && <div className="fixed inset-0 z-50" style={{ cursor: 'col-resize' }} />}
      
      {/* Sidebar */}
      <div 
        className="bg-[#252526] flex flex-col border-r border-[#333] flex-shrink-0 overflow-hidden"
        style={{ width: sidebarWidth }}
      >
        {/* Connection Status */}
        <div className="px-3 py-2 border-b border-[#333] bg-[#1e1e1e]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Cloud size={14} className="text-green-400" />
              ) : (
                <CloudOff size={14} className="text-gray-500" />
              )}
              <span className="text-xs text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {!isConnected && hasApiKey && (
              <button
                onClick={createSandbox}
                disabled={isConnecting}
                className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50 flex items-center gap-1"
              >
                {isConnecting ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
          {sandboxError && (
            <p className="text-[10px] text-red-400 mt-1 truncate">{sandboxError}</p>
          )}
        </div>

        {/* Sync Controls */}
        {isConnected && (
          <div className="px-3 py-2 border-b border-[#333]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Sync</span>
              {isSyncing && <Loader2 size={10} className="animate-spin text-primary" />}
              {syncStatus === 'success' && !isSyncing && (
                <CheckCircle size={10} className="text-green-400" />
              )}
            </div>
            <div className="flex space-x-1">
              <button
                onClick={handlePushToSandbox}
                disabled={isSyncing}
                className="flex-1 flex items-center justify-center px-2 py-1 bg-[#333] hover:bg-[#444] rounded text-[10px] disabled:opacity-50"
                title="Push to sandbox"
              >
                <Upload size={10} className="mr-1" />
                Push
              </button>
              <button
                onClick={handlePullFromSandbox}
                disabled={isSyncing}
                className="flex-1 flex items-center justify-center px-2 py-1 bg-[#333] hover:bg-[#444] rounded text-[10px] disabled:opacity-50"
                title="Pull from sandbox"
              >
                <Download size={10} className="mr-1" />
                Pull
              </button>
              <button
                onClick={handlePullFromSandbox}
                disabled={isSyncing}
                className="px-2 py-1 bg-primary hover:bg-primary/80 rounded text-[10px] disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />
              </button>
            </div>
            {lastSyncTime && (
              <p className="text-[9px] text-gray-500 mt-1 text-center">
                Last: {lastSyncTime.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}

        {/* File Explorer Header */}
        <div className="h-8 flex items-center justify-between px-3 border-b border-[#333]">
          <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Explorer</span>
          <div className="flex space-x-1">
            <button 
              onClick={() => handleStartCreating('root', 'folder')}
              className="hover:text-white text-gray-500 p-0.5" 
              title="New Folder"
            >
              <FolderPlus size={12}/>
            </button>
            <button 
              onClick={() => handleStartCreating('root', 'file')}
              className="hover:text-white text-gray-500 p-0.5" 
              title="New File"
            >
              <FilePlus size={12}/>
            </button>
          </div>
        </div>

        {/* File Tree */}
        <div className="flex-1 overflow-y-auto py-1">
          <FileTree
            parentId="root"
            files={files}
            activeFileId={activeFileId}
            creationState={creationState}
            onToggleFolder={toggleFolder}
            onOpenFile={openFile}
            onStartCreating={handleStartCreating}
            onCancelCreating={handleCancelCreating}
            onCreate={handleCreateSubmit}
          />
        </div>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={startResize}
        className={cn(
          'w-1 cursor-col-resize flex-shrink-0 transition-colors',
          isResizing ? 'bg-primary' : 'bg-[#333] hover:bg-primary/50'
        )}
      />

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab Bar */}
        {openFiles.length > 0 && (
          <div className="h-8 bg-[#2d2d2d] flex items-center border-b border-[#333] overflow-x-auto">
            {openFiles.map(fileId => {
              const file = files.find(f => f.id === fileId);
              if (!file) return null;
              const isActive = fileId === activeFileId;
              return (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={cn(
                    'flex items-center px-3 py-1 text-xs cursor-pointer select-none min-w-[80px] max-w-[150px] border-r border-[#333]',
                    isActive 
                      ? 'bg-[#1e1e1e] text-primary' 
                      : 'bg-[#2d2d2d] text-gray-500 hover:bg-[#333] hover:text-gray-300'
                  )}
                >
                  <FileCode size={12} className={cn('mr-1.5 flex-shrink-0', isActive ? 'text-primary' : 'text-blue-400')} />
                  <span className="truncate flex-1">{file.name}</span>
                  <button
                    onClick={(e) => closeFile(file.id, e)}
                    className="ml-1 hover:bg-gray-700 rounded-full p-0.5 flex-shrink-0"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor file={activeFile} onChange={updateFileContent} />
        </div>
      </div>
    </div>
  );
}