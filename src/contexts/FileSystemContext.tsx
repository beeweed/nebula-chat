import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type FileType = 'file' | 'folder';

export interface FileSystemItem {
  id: string;
  parentId: string | null;
  name: string;
  type: FileType;
  content?: string;
  isOpen?: boolean;
}

interface SyncCallbacks {
  writeFile?: (path: string, content: string) => Promise<boolean>;
  makeDirectory?: (path: string) => Promise<boolean>;
  deleteFile?: (path: string) => Promise<boolean>;
}

interface FileSystemContextType {
  files: FileSystemItem[];
  activeFileId: string | null;
  openFiles: string[];
  isSyncing: boolean;
  createFile: (parentId: string, name: string, type: 'file' | 'folder') => Promise<void>;
  updateFileContent: (id: string, newContent: string) => Promise<void>;
  toggleFolder: (id: string) => void;
  expandFolder: (id: string) => void;
  openFile: (id: string) => void;
  closeFile: (id: string, e: React.MouseEvent) => void;
  setActiveFileId: (id: string | null) => void;
  getActiveFile: () => FileSystemItem | undefined;
  setSyncCallbacks: (callbacks: SyncCallbacks) => void;
  getFilePath: (fileId: string, fileList?: FileSystemItem[]) => string;
  replaceWithSandboxFiles: (newFiles: FileSystemItem[]) => void;
  getAllFiles: () => FileSystemItem[];
}

const INITIAL_FILES: FileSystemItem[] = [
  {
    id: 'root',
    parentId: null,
    name: 'root',
    type: 'folder',
    isOpen: true,
  }
];

const FileSystemContext = createContext<FileSystemContextType | null>(null);

export function FileSystemProvider({ children }: { children: React.ReactNode }) {
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
    
    const openFilePaths: string[] = [];
    let activeFilePath: string | null = null;
    
    for (const openFileId of openFiles) {
      const path = getFilePath(openFileId, files);
      if (path) {
        openFilePaths.push(path);
      }
    }
    
    if (activeFileId) {
      activeFilePath = getFilePath(activeFileId, files);
    }
    
    setFiles(newFileList);
    
    const newOpenFiles: string[] = [];
    for (const path of openFilePaths) {
      const newFileId = findFileIdByPath(path, newFiles);
      if (newFileId) {
        newOpenFiles.push(newFileId);
      }
    }
    setOpenFiles(newOpenFiles);
    
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

  const value: FileSystemContextType = {
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

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystem() {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
}