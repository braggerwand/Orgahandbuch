import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { FileNode, LinkItem, PromptItem, User, WorkspaceState } from '../types';
import { db, isFirebaseReady, ensureAuth } from '../services/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface WorkspaceContextType extends WorkspaceState {
  currentUser: User | null;
  login: (u: string, p: string, remember: boolean) => boolean;
  logout: () => void;
  // Status
  saveStatus: 'saved' | 'saving' | 'error' | 'synced-cloud' | 'local-only';
  storageType: 'cloud' | 'local';
  // Baum Aktionen
  addFile: (parentId: string | null, type: 'file' | 'folder', name: string) => void;
  deleteNode: (id: string) => void;
  renameNode: (id: string, newName: string) => void;
  moveNode: (nodeId: string, targetFolderId: string | null) => void;
  toggleFolder: (id: string) => void;
  setActiveFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  // Link Aktionen (Datei-spezifisch)
  addLink: (link: Omit<LinkItem, 'id'>) => void;
  deleteLink: (id: string) => void;
  updateLink: (link: LinkItem) => void;
  // Prompt Aktionen (Datei-spezifisch)
  addPrompt: (prompt: Omit<PromptItem, 'id'>) => void;
  deletePrompt: (id: string) => void;
  updatePrompt: (prompt: PromptItem) => void;
  // Helper
  activeNode: FileNode | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// --- INITIAL DATA ---
const INITIAL_LINKS: LinkItem[] = [
  { id: 'l-1', title: 'Bodenrichtwerte', url: 'https://www.bodenrichtwerte.de', description: 'Amtliche Werte für NRW' },
  { id: 'l-2', title: 'Baugesetzbuch', url: 'https://www.gesetze-im-internet.de/bbaugb/', description: 'Aktuelle Fassung' },
];

const INITIAL_PROMPTS: PromptItem[] = [
  { id: 'p-1', title: 'Zusammenfassen', description: 'Fasst den Text kurz zusammen', promptText: 'Fasse den folgenden Text in 3-4 prägnanten Sätzen zusammen.' },
  { id: 'p-2', title: 'Korrekturlesen', description: 'Prüft auf Rechtschreibung und Stil', promptText: 'Bitte korrigiere den folgenden Text auf Rechtschreibung, Grammatik und verbessere den Stil, damit er professioneller klingt.' },
];

const INITIAL_FILES: FileNode[] = [
  {
    id: 'root-1',
    name: 'Projekte 2025',
    type: 'folder',
    isOpen: true,
    children: [
      { id: 'f-1', name: 'Quartier Nord', type: 'folder', children: [], isOpen: false },
      { 
        id: 'file-1', 
        name: 'Meeting Notizen.txt', 
        type: 'file', 
        content: '<b>Meeting: 14.10.2025</b><br/>Teilnehmer: Herr Müller, Frau Schmidt.<br/><br/><ul><li>Diskussion über Budgetanpassung</li><li>Zeitplan genehmigt</li></ul>',
        links: INITIAL_LINKS,
        prompts: INITIAL_PROMPTS
      },
    ]
  },
  {
    id: 'root-2',
    name: 'Vorlagen',
    type: 'folder',
    isOpen: false,
    children: [
      { id: 'file-2', name: 'Exposé Template.txt', type: 'file', content: '<h1>Objekt Exposé</h1><br/>Lage:<br/>Größe:<br/>Preis:', links: [], prompts: [] },
    ]
  },
];

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'synced-cloud' | 'local-only'>('saved');
  const [storageType, setStorageType] = useState<'cloud' | 'local'>('local');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [files, setFiles] = useState<FileNode[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string | null>('file-1');

  const isMounted = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const ignoreNextCloudUpdate = useRef(false);

  // Helper: Findet einen Knoten im Baum
  const findNodeDeep = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeDeep(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const activeNode = activeFileId ? findNodeDeep(files, activeFileId) : null;

  // --- 1. DATEN LADEN ---
  useEffect(() => {
    isMounted.current = true;
    let unsub: (() => void) | null = null;

    const initData = async () => {
        const savedUser = localStorage.getItem('kiefer_user');
        if (savedUser) {
          try { setCurrentUser(JSON.parse(savedUser)); } catch (e) { console.error(e); }
        }

        if (isFirebaseReady && db) {
            const authSuccess = await ensureAuth();
            if (!authSuccess) {
                setStorageType('local');
                setSaveStatus('local-only');
                loadFromLocal();
                return;
            }
            setStorageType('cloud');
            setSaveStatus('synced-cloud');
            unsub = onSnapshot(doc(db, "workspaces", "global_v1"), (docSnap) => {
                if (ignoreNextCloudUpdate.current) { ignoreNextCloudUpdate.current = false; return; }
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFiles(data.files || []);
                } else {
                    setDoc(doc(db!, "workspaces", "global_v1"), { files: INITIAL_FILES, lastUpdated: new Date().toISOString() });
                }
                setDataLoaded(true);
            }, (error) => {
                setSaveStatus('error');
                setStorageType('local');
                loadFromLocal();
            });
        } else {
            setStorageType('local');
            setSaveStatus('local-only');
            loadFromLocal();
        }
    };
    initData();
    return () => { if (unsub) unsub(); };
  }, []);

  const loadFromLocal = () => {
    try {
        const lFiles = localStorage.getItem('kiefer_files');
        const lActive = localStorage.getItem('kiefer_active_file');
        if (lFiles) setFiles(JSON.parse(lFiles));
        if (lActive) setActiveFileId(lActive);
        setDataLoaded(true);
    } catch (e) { setDataLoaded(true); }
  };

  // --- 2. DATEN SPEICHERN ---
  useEffect(() => {
    if (!isMounted.current || !dataLoaded) return;
    localStorage.setItem('kiefer_files', JSON.stringify(files));
    if (activeFileId) localStorage.setItem('kiefer_active_file', activeFileId);

    if (storageType === 'cloud' && isFirebaseReady && db) {
        setSaveStatus('saving');
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = window.setTimeout(async () => {
            try {
                await ensureAuth();
                ignoreNextCloudUpdate.current = true;
                await setDoc(doc(db!, "workspaces", "global_v1"), { files, lastUpdated: new Date().toISOString() }, { merge: true });
                if (isMounted.current) setSaveStatus('synced-cloud');
            } catch (e) { if (isMounted.current) setSaveStatus('error'); }
        }, 2000); 
    }
  }, [files, activeFileId, dataLoaded, storageType]);

  const login = (u: string, p: string, remember: boolean = false) => {
    if (u === 'SVKiefer' && p === 'ImmoKiefer') {
      const user = { username: 'SVKiefer', name: 'Stefan V. Kiefer' };
      setCurrentUser(user);
      if (remember) localStorage.setItem('kiefer_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => { setCurrentUser(null); localStorage.removeItem('kiefer_user'); };

  // --- Tree Helpers ---
  const updateTree = (nodes: FileNode[], id: string, updater: (node: FileNode) => FileNode): FileNode[] => {
    return nodes.map(node => {
      if (node.id === id) return updater(node);
      if (node.children) return { ...node, children: updateTree(node.children, id, updater) };
      return node;
    });
  };

  const deleteFromTree = (nodes: FileNode[], id: string): FileNode[] => {
    return nodes.filter(node => node.id !== id).map(node => {
      if (node.children) return { ...node, children: deleteFromTree(node.children, id) };
      return node;
    });
  };

  const addToTree = (nodes: FileNode[], parentId: string | null, newNode: FileNode): FileNode[] => {
    if (!parentId) return [...nodes, newNode];
    return nodes.map(node => {
      if (node.id === parentId && node.type === 'folder') {
        return { ...node, children: [...(node.children || []), newNode], isOpen: true };
      }
      if (node.children) return { ...node, children: addToTree(node.children, parentId, newNode) };
      return node;
    });
  };

  const toggleFolder = useCallback((id: string) => {
    setFiles(prev => updateTree(prev, id, node => ({ ...node, isOpen: !node.isOpen })));
  }, []);

  const setActiveFile = useCallback((id: string) => { setActiveFileId(id); }, []);

  const updateFileContent = useCallback((id: string, content: string) => {
     setFiles(prev => updateTree(prev, id, node => ({ ...node, content })));
  }, []);

  const addFile = useCallback((parentId: string | null, type: 'file' | 'folder', name: string) => {
    const newNode: FileNode = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      children: type === 'folder' ? [] : undefined,
      content: type === 'file' ? '' : undefined,
      isOpen: type === 'folder' ? true : undefined,
      links: [],
      prompts: []
    };
    setFiles(prev => addToTree(prev, parentId, newNode));
    setActiveFileId(newNode.id);
  }, []);

  const deleteNode = useCallback((id: string) => {
    setFiles(prev => deleteFromTree(prev, id));
    setActiveFileId(prevId => (prevId === id ? null : prevId));
  }, []);

  const renameNode = useCallback((id: string, newName: string) => {
    setFiles(prev => updateTree(prev, id, node => ({ ...node, name: newName })));
  }, []);

  const moveNode = useCallback((nodeId: string, targetFolderId: string | null) => {
    setFiles(prevFiles => {
        const nodeToMove = findNodeDeep(prevFiles, nodeId);
        if (!nodeToMove) return prevFiles;
        if (nodeId === targetFolderId) return prevFiles;
        const filesWithoutNode = deleteFromTree(prevFiles, nodeId);
        return addToTree(filesWithoutNode, targetFolderId, nodeToMove);
    });
  }, []);

  // --- Link Aktionen (Datei-spezifisch) ---
  const addLink = useCallback((link: Omit<LinkItem, 'id'>) => {
    if (!activeFileId) return;
    setFiles(prev => updateTree(prev, activeFileId, node => ({
        ...node,
        links: [...(node.links || []), { ...link, id: Math.random().toString(36).substr(2, 9) }]
    })));
  }, [activeFileId]);

  const deleteLink = useCallback((id: string) => {
    if (!activeFileId) return;
    setFiles(prev => updateTree(prev, activeFileId, node => ({
        ...node,
        links: (node.links || []).filter(l => l.id !== id)
    })));
  }, [activeFileId]);

  const updateLink = useCallback((link: LinkItem) => {
    if (!activeFileId) return;
    setFiles(prev => updateTree(prev, activeFileId, node => ({
        ...node,
        links: (node.links || []).map(l => l.id === link.id ? link : l)
    })));
  }, [activeFileId]);

  // --- Prompt Aktionen (Datei-spezifisch) ---
  const addPrompt = useCallback((prompt: Omit<PromptItem, 'id'>) => {
    if (!activeFileId) return;
    setFiles(prev => updateTree(prev, activeFileId, node => ({
        ...node,
        prompts: [...(node.prompts || []), { ...prompt, id: Math.random().toString(36).substr(2, 9) }]
    })));
  }, [activeFileId]);

  const deletePrompt = useCallback((id: string) => {
    if (!activeFileId) return;
    setFiles(prev => updateTree(prev, activeFileId, node => ({
        ...node,
        prompts: (node.prompts || []).filter(p => p.id !== id)
    })));
  }, [activeFileId]);

  const updatePrompt = useCallback((prompt: PromptItem) => {
    if (!activeFileId) return;
    setFiles(prev => updateTree(prev, activeFileId, node => ({
        ...node,
        prompts: (node.prompts || []).map(p => p.id === prompt.id ? prompt : p)
    })));
  }, [activeFileId]);

  return (
    <WorkspaceContext.Provider value={{
      currentUser, login, logout, saveStatus, storageType,
      files, activeFileId, activeNode,
      addFile, deleteNode, renameNode, moveNode, toggleFolder, setActiveFile, updateFileContent,
      addLink, deleteLink, updateLink,
      addPrompt, deletePrompt, updatePrompt
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return context;
};