import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { LinkItem, PromptItem } from '../types';
import { Link as LinkIcon, Sparkles, ExternalLink, Plus, Trash2, Edit2, X, Check, FileQuestion } from 'lucide-react';

const ToolsPanel: React.FC = () => {
  const { activeNode, addLink, deleteLink, addPrompt, deletePrompt, updateLink, updatePrompt } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'links' | 'prompts'>('links');
  
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '', description: '' });
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editLinkData, setEditLinkData] = useState({ title: '', url: '', description: '' });
  
  const [isAddingPrompt, setIsAddingPrompt] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ title: '', description: '', promptText: '' });
  
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);

  const activeLinks = (activeNode && activeNode.type === 'file' && activeNode.links) ? activeNode.links : [];
  const activePrompts = (activeNode && activeNode.type === 'file' && activeNode.prompts) ? activeNode.prompts : [];
  const isFileActive = activeNode && activeNode.type === 'file';

  const ensureProtocol = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  const handleOpenGemini = (promptText: string, id: string) => {
    let copySuccess = false;
    try {
        const textArea = document.createElement("textarea");
        textArea.value = promptText;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        copySuccess = document.execCommand('copy');
        document.body.removeChild(textArea);
    } catch (err) { console.error(err); }

    if (copySuccess) {
        setCopyFeedbackId(id);
        setTimeout(() => setCopyFeedbackId(null), 5000);
    }
    window.open('https://gemini.google.com/app', '_blank');
  };

  if (!isFileActive) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col items-center justify-center p-8 text-center h-full shrink-0 shadow-lg z-20">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4 text-slate-300">
            <FileQuestion size={24} />
        </div>
        <h4 className="text-sm font-bold text-slate-600 mb-2">Keine Datei gewählt</h4>
        <p className="text-xs text-slate-400 leading-relaxed">
            Links und Prompts sind direkt an Dokumente gebunden. Wählen Sie eine Datei im Explorer aus, um deren Werkzeuge zu sehen.
        </p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 shadow-lg z-20">
      <div className="flex border-b border-slate-100 bg-slate-50">
        <button 
            type="button"
            onClick={() => setActiveTab('links')}
            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                ${activeTab === 'links' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}
            `}
        >
            <LinkIcon size={14} /> Links
        </button>
        <button 
            type="button"
            onClick={() => setActiveTab('prompts')}
            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                ${activeTab === 'prompts' ? 'text-purple-600 border-b-2 border-purple-600 bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}
            `}
        >
            <Sparkles size={14} /> Prompts
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-white scrollbar-thin scrollbar-thumb-slate-200">
        
        {activeTab === 'links' && (
            <div className="space-y-3">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Favoriten für {activeNode?.name}</h3>
                    <button type="button" onClick={() => setIsAddingLink(true)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                        <Plus size={14} />
                    </button>
                </div>

                {isAddingLink && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 shadow-sm animate-in slide-in-from-top-2">
                        <input className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 mb-2 text-slate-900 focus:ring-1 focus:ring-blue-500" placeholder="Titel" value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} />
                        <input className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 mb-2 text-slate-900 focus:ring-1 focus:ring-blue-500" placeholder="URL" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} />
                        <div className="flex justify-end gap-2 mt-2">
                            <button type="button" onClick={() => setIsAddingLink(false)} className="text-[10px] font-bold text-slate-400 px-2">Abbrechen</button>
                            <button type="button" onClick={() => { addLink(newLink); setIsAddingLink(false); setNewLink({title:'',url:'',description:''}); }} className="text-[10px] font-bold bg-blue-600 text-white rounded-lg px-3 py-1.5 shadow-sm">Hinzufügen</button>
                        </div>
                    </div>
                )}

                {activeLinks.length > 0 ? activeLinks.map(link => (
                    <div key={link.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-all group relative">
                        {editingLinkId === link.id ? (
                            <div className="space-y-2">
                                <input className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900" value={editLinkData.title} onChange={e => setEditLinkData({...editLinkData, title: e.target.value})} />
                                <div className="flex justify-end gap-1">
                                    <button onClick={() => setEditingLinkId(null)} className="p-1 text-slate-400 hover:text-slate-600"><X size={14}/></button>
                                    <button onClick={() => { updateLink({id: link.id, ...editLinkData}); setEditingLinkId(null); }} className="p-1 text-emerald-600"><Check size={14}/></button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-slate-800 text-xs truncate pr-4">{link.title}</h4>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => {setEditingLinkId(link.id); setEditLinkData(link);}} className="text-slate-400 hover:text-blue-600"><Edit2 size={10}/></button>
                                        <button onClick={() => deleteLink(link.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={10}/></button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 mb-3 line-clamp-1">{link.description || link.url}</p>
                                <a href={ensureProtocol(link.url)} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors">
                                    <ExternalLink size={10} /> Link öffnen
                                </a>
                            </>
                        )}
                    </div>
                )) : (
                    <div className="py-8 text-center text-[10px] text-slate-400 italic">Keine Links für dieses Dokument hinterlegt.</div>
                )}
            </div>
        )}

        {activeTab === 'prompts' && (
            <div className="space-y-3">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Vorlagen für {activeNode?.name}</h3>
                    <button type="button" onClick={() => setIsAddingPrompt(true)} className="p-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
                        <Plus size={14} />
                    </button>
                </div>

                {isAddingPrompt && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 shadow-sm">
                        <input className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 mb-2 text-slate-900" placeholder="Name" value={newPrompt.title} onChange={e => setNewPrompt({...newPrompt, title: e.target.value})} />
                        <textarea className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 mb-2 text-slate-900 h-20" placeholder="Prompt..." value={newPrompt.promptText} onChange={e => setNewPrompt({...newPrompt, promptText: e.target.value})} />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAddingPrompt(false)} className="text-[10px] font-bold text-slate-400 px-2">Abbrechen</button>
                            <button onClick={() => { addPrompt(newPrompt); setIsAddingPrompt(false); setNewPrompt({title:'', description:'', promptText:''}); }} className="text-[10px] font-bold bg-purple-600 text-white rounded-lg px-3 py-1.5 shadow-sm">Speichern</button>
                        </div>
                    </div>
                )}
                
                {activePrompts.length > 0 ? activePrompts.map(prompt => (
                    <div key={prompt.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-purple-200 transition-all group">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-800 text-xs">{prompt.title}</h4>
                            <button onClick={() => deletePrompt(prompt.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-all"><Trash2 size={10}/></button>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-3 line-clamp-2">{prompt.description || 'Keine Beschreibung'}</p>
                        
                        <button 
                            onClick={() => handleOpenGemini(prompt.promptText, prompt.id)}
                            className={`text-[10px] font-bold flex items-center gap-1.5 transition-all ${copyFeedbackId === prompt.id ? 'text-emerald-600' : 'text-purple-600 hover:text-purple-800'}`}
                        >
                            {copyFeedbackId === prompt.id ? <Check size={10} /> : <ExternalLink size={10} />}
                            {copyFeedbackId === prompt.id ? 'Kopiert!' : 'In Gemini öffnen'}
                        </button>
                    </div>
                )) : (
                    <div className="py-8 text-center text-[10px] text-slate-400 italic">Keine Prompts für dieses Dokument hinterlegt.</div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ToolsPanel;