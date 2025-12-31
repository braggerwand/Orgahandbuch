import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Building2, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

/**
 * Login-Komponente im High-Fidelity Design.
 * Fokus auf Conversion-Aesthetics, Dark Mode und Glassmorphismus.
 */
const Login: React.FC = () => {
  const { login } = useWorkspace();
  const [username, setUsername] = useState('SVKiefer');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulation einer kurzen Verzögerung für ein besseres UX-Gefühl
    setTimeout(() => {
        if (!login(username, password, false)) {
            setError('Zugangsdaten ungültig. (Tipp: SVKiefer / ImmoKiefer)');
            setIsLoading(false);
        }
    }, 800);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#020617] font-sans selection:bg-blue-500/30 selection:text-blue-100">
      
      {/* Hintergrund-Bild mit Overlay (Platzhalter für Shutterstock-Bild) */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop" 
          alt="Europäische Architektur" 
          className="w-full h-full object-cover opacity-40 scale-105"
        />
        {/* Mehrschichtiger Gradient für Tiefenwirkung */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] via-[#020617]/90 to-blue-900/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent"></div>
      </div>

      {/* Login Container mit Glassmorphismus */}
      <div className="relative z-10 w-full max-w-md px-6 animate-in fade-in zoom-in duration-700">
        
        {/* Branding oben */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-600/20 ring-1 ring-white/20">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight text-center font-serif">
            Kiefer & Kollegen
          </h1>
          <div className="flex items-center gap-1.5 mt-2 text-blue-400/60 uppercase tracking-[0.2em] text-[10px] font-bold">
            <ShieldCheck size={12} />
            <span>Digitales Organisationshandbuch</span>
          </div>
        </div>

        {/* Die Login-Karte */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
          
          {/* Subtile Lichtkante oben */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-2">Anmeldung</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Bitte authentifizieren Sie sich für den Zugriff auf interne Kanzlei-Ressourcen.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl animate-in slide-in-from-top-2">
                <p className="text-xs text-red-400 font-medium text-center">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">Benutzername</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-slate-800/40 border border-white/5 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all shadow-inner"
                  placeholder="Ihr Benutzername"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Passwort</label>
                <button type="button" className="text-[10px] font-medium text-blue-400 hover:text-blue-300 transition-colors text-right">Vergessen?</button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-slate-800/40 border border-white/5 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-blue-600/20 group/btn active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Anmelden</span>
                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer-Info */}
        <div className="mt-12 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">
            © 2025 Kiefer & Kollegen · Kanzlei für Immobilienbewertung
          </p>
          <p className="text-[9px] text-slate-600 mt-2">
            Systemversion 2.5.0-v1 · Gesichert durch AES-256
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;