import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import Sidebar from './Sidebar';
import Editor from './Editor';
import ToolsPanel from './ToolsPanel';
import { Building2, LogOut } from 'lucide-react';

const Layout: React.FC = () => {
  const { logout } = useWorkspace();

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden text-slate-900">
      {/* Top Header - Light Glass */}
      <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-lg shadow-blue-600/20">
              <Building2 size={18} />
            </div>
            <span className="font-bold text-slate-800 text-sm tracking-tight">Organisationshandbuch</span>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
                onClick={logout}
                className="text-slate-400 hover:text-slate-800 transition-all p-2 rounded-full hover:bg-slate-100 group"
                title="Abmelden"
            >
                <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <main className="flex-1 flex overflow-hidden">
        <Sidebar />
        <Editor />
        <ToolsPanel />
      </main>
    </div>
  );
};

export default Layout;