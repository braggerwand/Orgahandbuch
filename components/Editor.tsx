import React, { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Bold, Italic, List, AlignLeft, AlignCenter, AlignRight, Copy, Check, Save, FileText } from 'lucide-react';

const Editor: React.FC = () => {
  const { activeFileId, activeNode, updateFileContent } = useWorkspace();
  const editorRef = useRef<HTMLDivElement>(null);
  const isLocalUpdate = useRef(false);
  const savedRange = useRef<Range | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const currentContent = (activeNode && activeNode.type === 'file') ? activeNode.content || '' : '';

  useEffect(() => {
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('defaultParagraphSeparator', false, 'p');
  }, []);
  
  useEffect(() => {
    if (editorRef.current) {
        if (isLocalUpdate.current) {
            isLocalUpdate.current = false;
            return;
        }
        if (editorRef.current.innerHTML !== currentContent) {
            editorRef.current.innerHTML = currentContent;
        }
    }
  }, [activeFileId, currentContent]); 

  const handleInput = () => {
    if (editorRef.current && activeFileId && activeNode?.type === 'file') {
      isLocalUpdate.current = true;
      updateFileContent(activeFileId, editorRef.current.innerHTML);
      setIsSaved(false); 
    }
  };

  const handleManualSave = () => {
    if (editorRef.current && activeFileId && activeNode?.type === 'file') {
        updateFileContent(activeFileId, editorRef.current.innerHTML);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
            savedRange.current = range;
        }
    }
  };

  const handleBlur = () => {
    saveSelection();
    if (editorRef.current && activeFileId && activeNode?.type === 'file') {
        updateFileContent(activeFileId, editorRef.current.innerHTML);
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
        sel.removeAllRanges();
        sel.addRange(savedRange.current);
    } else {
        editorRef.current?.focus();
    }
  };

  const execCmd = (cmd: string, val: string | undefined = undefined) => {
    if (document.activeElement !== editorRef.current) {
        editorRef.current?.focus();
    }
    document.execCommand(cmd, false, val);
    handleInput();
  };

  const execCmdWithRestore = (cmd: string, val: string) => {
    restoreSelection();
    execCmd(cmd, val);
  };
  
  const handleToolbarAction = (e: React.MouseEvent, cmd: string, val?: string) => {
    e.preventDefault();
    execCmd(cmd, val);
  };

  const applyFontSize = (size: string) => {
    restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return;

    if (!range.collapsed) {
        const span = document.createElement('span');
        span.style.fontSize = size;
        try {
            const content = range.extractContents();
            span.appendChild(content);
            range.insertNode(span);
            selection.removeAllRanges();
            const newRange = document.createRange();
            newRange.selectNodeContents(span);
            selection.addRange(newRange);
        } catch (e) {
             document.execCommand('fontSize', false, '3');
        }
    } else {
        document.execCommand('fontSize', false, '3'); 
    }
    handleInput();
    editorRef.current?.focus();
  };

  const copyToClipboard = async () => {
    if (!editorRef.current) return;
    try {
        const htmlContent = editorRef.current.innerHTML;
        const textContent = editorRef.current.innerText;
        const blobHtml = new Blob([htmlContent], { type: 'text/html' });
        const blobText = new Blob([textContent], { type: 'text/plain' });
        const data = [new ClipboardItem({ ["text/html"]: blobHtml, ["text/plain"]: blobText })];
        await navigator.clipboard.write(data);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (e) {
        navigator.clipboard.writeText(editorRef.current.innerText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!activeFileId || activeNode?.type === 'folder') {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <FileText size={32} />
            </div>
            <h3 className="text-slate-600 font-semibold mb-1">Kein Dokument aktiv</h3>
            <p className="text-sm max-w-xs opacity-70">
                Wählen Sie eine Datei aus dem Explorer aus, um den Inhalt zu bearbeiten. Ordner können keine Inhalte speichern.
            </p>
        </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
      <style>{`
        .editor-content ul { list-style-type: disc !important; padding-left: 1.5em !important; margin-bottom: 1em !important; }
        .editor-content ol { list-style-type: decimal !important; padding-left: 1.5em !important; margin-bottom: 1em !important; }
        .editor-content li { display: list-item !important; color: #334155; }
        .editor-content b, .editor-content strong { font-weight: 700 !important; color: #0f172a !important; }
        .editor-content i, .editor-content em { font-style: italic !important; }
        .editor-content h1 { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25em; }
        .editor-content h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; color: #0f172a; }
        .editor-content p { margin-bottom: 0.75em; color: #334155; }
      `}</style>

      <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between shadow-sm z-10 gap-2">
        <div className="flex items-center gap-1.5 text-slate-500">
            <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 bg-white text-slate-800 w-28 cursor-pointer hover:bg-slate-50" onChange={(e) => execCmdWithRestore('fontName', e.target.value)}>
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times</option>
            </select>
            <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 bg-white text-slate-800 w-20 cursor-pointer hover:bg-slate-50" onChange={(e) => applyFontSize(e.target.value)} defaultValue="16px">
                <option value="12px">12 px</option>
                <option value="14px">14 px</option>
                <option value="16px">16 px</option>
                <option value="20px">20 px</option>
                <option value="24px">24 px</option>
            </select>
            <div className="h-5 w-px bg-slate-200 mx-1"></div>
            <button onMouseDown={(e) => handleToolbarAction(e, 'bold')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Fett"><Bold size={16}/></button>
            <button onMouseDown={(e) => handleToolbarAction(e, 'italic')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Kursiv"><Italic size={16}/></button>
            <button onMouseDown={(e) => handleToolbarAction(e, 'insertUnorderedList')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Liste"><List size={16}/></button>
            <div className="h-5 w-px bg-slate-200 mx-1"></div>
            <button onMouseDown={(e) => handleToolbarAction(e, 'justifyLeft')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><AlignLeft size={16}/></button>
            <button onMouseDown={(e) => handleToolbarAction(e, 'justifyCenter')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><AlignCenter size={16}/></button>
            <button onMouseDown={(e) => handleToolbarAction(e, 'justifyRight')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><AlignRight size={16}/></button>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={handleManualSave} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all font-bold border ${isSaved ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm'}`}>
                {isSaved ? <Check size={14}/> : <Save size={14}/>}
                <span>{isSaved ? 'Gesichert' : 'Speichern'}</span>
            </button>
            <button onClick={copyToClipboard} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all border ${copied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}>
                {copied ? <Check size={14}/> : <Copy size={14}/>}
                <span>{copied ? 'Kopiert' : 'Kopieren'}</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200" onClick={() => editorRef.current?.focus()}>
        <div 
            className="editor-content max-w-4xl mx-auto bg-white shadow-xl border border-slate-200 min-h-[800px] p-16 outline-none text-slate-800 leading-relaxed rounded-xl"
            contentEditable
            ref={editorRef}
            onInput={handleInput}
            onBlur={handleBlur}
            style={{ fontFamily: 'Inter, sans-serif' }}
        >
        </div>
      </div>
    </div>
  );
};

export default Editor;