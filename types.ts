export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string; // Für Dateien
  children?: FileNode[]; // Für Ordner
  isOpen?: boolean; // Für Ordner UI-Status
  links?: LinkItem[]; // Dateispezifische Links
  prompts?: PromptItem[]; // Dateispezifische Prompts
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  description: string;
}

export interface PromptItem {
  id: string;
  title: string;
  description: string;
  promptText: string;
}

export interface User {
  username: string;
  name: string;
}

export interface WorkspaceState {
  files: FileNode[];
  activeFileId: string | null;
}