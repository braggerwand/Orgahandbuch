import React, { useState, useMemo } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { FileNode } from '../types';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown, Trash2, Edit2, GripVertical, Search, X, Check } from 'lucide-react';

const FileTreeNode: React.FC<{ 
    node: FileNode; 
    level: number; 
    selectedId: string | null;
    onSelect: (id: string) => void;
    onToggle: (id: string) => void;
    onAdd: (parentId: string, type: 'file'|'folder', name: string) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, name: string) => void;
    onMove: (nodeId: string, targetId: string | null) => void;
}> = ({ node, level, selectedId, onSelect, onToggle, onAdd, onDelete, onRename, onMove }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
        onRename(node.id, renameValue);
        setIsRenaming(false);
    } else {
        setIsRenaming(false);
        setRenameValue(node.name);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/nodeId', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.type === 'folder') {
        setIsDragOver(true);
        e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('application/nodeId');
    if (draggedId && draggedId !== node.id && node.type === 'folder') {
        onMove(draggedId, node.id);
        if (!node.isOpen) {
            onToggle(node.id);
        }
    }
  };

  const isSelected = selectedId === node.id;

  return (
    <div className="select-none relative">
      <div 
        className={`group flex items-center gap-1.5 px-3 py-1.5 cursor-pointer text-sm transition-all border-l-2
            ${isDragOver ? 'bg-blue-50 border-blue-500' : ''}
            ${!isDragOver && isSelected ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'border-transparent hover:bg-slate-50 text-slate-600'}
        `}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); if(isConfirmingDelete) setIsConfirmingDelete(false); }}
        onClick={() => {
            if (!isRenaming && !isConfirmingDelete) {
                onSelect(node.id);
                if (node.type === 'folder') onToggle(node.id);
            }
        }}
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className={`text-slate-300 cursor-grab active:cursor-grabbing ${isHovered && !isConfirmingDelete ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
            <GripVertical size={12} />
        </span>

        <span className="text-slate-400 shrink-0 w-4 flex justify-center">
          {node.type === 'folder' ? (
             node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : null}
        </span>
        
        <span className={`shrink-0 ${node.type === 'folder' ? 'text-blue-500' : 'text-slate-400'}`}>
            {node.type === 'folder' ? (node.isOpen ? <FolderOpen size={16} /> : <Folder size={16} />) : <FileText size={16} />}
        </span>

        {isRenaming ? (
            <div className="flex items-center gap-1 flex-1 ml-1" onClick={e => e.stopPropagation()}>
                <input 
                    type="text" 
                    value={renameValue} 
                    onChange={e => setRenameValue(e.target.value)}
                    className="w-full text-xs px-2 py-1 border border-blue-500 rounded bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    autoFocus
                    onBlur={handleRenameSubmit}
                    onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameSubmit();
                        if (e.key === 'Escape') {
                            setIsRenaming(false);
                            setRenameValue(node.name);
                        }
                    }}
                />
            </div>
        ) : (
            <span className="truncate flex-1 ml-1" title={node.name}>{node.name}</span>
        )}

        {isHovered && !isRenaming && (
            <div 
                className={`flex items-center gap-0.5 opacity-100 bg-white shadow-lg rounded border border-slate-200 px-1 py-0.5 absolute right-2 ${isConfirmingDelete ? 'bg-red-50 border-red-100' : ''}`} 
                onClick={e => e.stopPropagation()}
            >
                {isConfirmingDelete ? (
                    <>
                        <span className="text-[10px] text-red-600 font-bold px-1">Löschen?</span>
                        <button 
                            onClick={() => { onDelete(node.id); setIsConfirmingDelete(false); }} 
                            title="Ja" 
                            className="p-1 bg-red-100 hover:bg-red-200 rounded text-red-600 transition-colors"
                        >
                            <Check size={12} strokeWidth={3} />
                        </button>
                        <button 
                            onClick={() => setIsConfirmingDelete(false)} 
                            title="Nein" 
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                        >
                            <X size={12} strokeWidth={3} />
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => setIsRenaming(true)} title="Umbenennen" className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={12}/></button>
                        <button onClick={() => setIsConfirmingDelete(true)} title="Löschen" className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={12}/></button>
                    </>
                )}
            </div>
        )}
      </div>

      {node.type === 'folder' && node.isOpen && node.children && (
        <div>
          {node.children.map(child => (
            <FileTreeNode 
                key={child.id} 
                node={child} 
                level={level + 1} 
                selectedId={selectedId}
                onSelect={onSelect}
                onToggle={onToggle}
                onAdd={onAdd}
                onDelete={onDelete}
                onRename={onRename}
                onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC = () => {
  const { files, activeFileId, toggleFolder, setActiveFile, addFile, deleteNode, renameNode, moveNode } = useWorkspace();
  const [isRootDragOver, setIsRootDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRootDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsRootDragOver(true); };
  const handleRootDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsRootDragOver(false); };
  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootDragOver(false);
    const draggedId = e.dataTransfer.getData('application/nodeId');
    if (draggedId) moveNode(draggedId, null);
  };

  const filterNodes = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;
    const lowerQuery = query.toLowerCase();
    return nodes.reduce((acc, node) => {
        const nameMatch = node.name.toLowerCase().includes(lowerQuery);
        const filteredChildren = node.children ? filterNodes(node.children, query) : [];
        if (nameMatch || filteredChildren.length > 0) {
            acc.push({ ...node, children: filteredChildren, isOpen: true });
        }
        return acc;
    }, [] as FileNode[]);
  };

  const displayedFiles = useMemo(() => searchQuery.trim() ? filterNodes(files, searchQuery) : files, [files, searchQuery]);

  return (
    <div className={`h-full flex flex-col bg-white border-r border-slate-200 w-72 shrink-0 transition-colors ${isRootDragOver ? 'bg-blue-50' : ''}`} onDragOver={handleRootDragOver} onDragLeave={handleRootDragLeave} onDrop={handleRootDrop}>
      <div className="p-4 border-b border-slate-100 bg-white flex flex-col gap-3 z-10">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search size={14} />
            </div>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Suchen..." className="w-full pl-8 pr-8 py-1.5 text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg outline-none transition-all text-slate-800" />
            {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-800">
                    <X size={14} />
                </button>
            )}
        </div>
        <div className="flex justify-between items-center">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Explorer</h2>
            <div className="flex gap-1">
                <button onClick={() => addFile(null, 'folder', 'Neuer Ordner')} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Neuer Ordner"><FolderOpen size={16} /></button>
                <button onClick={() => addFile(null, 'file', 'Dokument.txt')} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Neue Datei"><FileText size={16} /></button>
            </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-200">
        {displayedFiles.length > 0 ? displayedFiles.map(node => (
            <FileTreeNode key={node.id} node={node} level={0} selectedId={activeFileId} onSelect={setActiveFile} onToggle={toggleFolder} onAdd={addFile} onDelete={deleteNode} onRename={renameNode} onMove={moveNode} />
        )) : <div className="px-4 py-8 text-center text-xs text-slate-400 italic">{searchQuery ? 'Keine Ergebnisse.' : 'Leer'}</div>}
      </div>
    </div>
  );
};

export default Sidebar;