import React, { useState } from 'react';
import {
  ShieldAlert,
  UserCheck,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Stethoscope,
} from 'lucide-react';
import { AdminUser } from '../types';
import { loginAdmin, speakText } from '../services/api';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (admin: AdminUser) => void;
  currentAdmin: AdminUser | null;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentAdmin,
}) => {
  const [emailOrId, setEmailOrId] = useState<string>('admin@neuroshield.health');
  const [password, setPassword] = useState<string>('admin');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (overrideIdOrEmail?: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    const credential = overrideIdOrEmail || emailOrId;
    const res = await loginAdmin({
      email: credential.includes('@') ? credential : undefined,
      adminId: !credential.includes('@') ? credential : undefined,
      password: password || 'admin',
    });

    setIsLoading(false);

    if (res.success && res.admin) {
      speakText(`Welcome, ${res.admin.name}. You are logged in as Admin ID: ${res.admin.id}. All emergency alerts are routed to your console.`);
      onLoginSuccess(res.admin);
      onClose();
    } else {
      setErrorMessage(res.error || 'Authentication failed. Please check credentials.');
    }
  };

  const quickAdminProfiles: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    station: string;
  }> = [
    {
      id: 'ADM-8801',
      name: 'Dr. Sophia Martinez, MD',
      email: 'admin@neuroshield.health',
      role: 'Chief Vascular Neurologist',
      station: 'Neuro Intensive Care Console A',
    },
    {
      id: 'ADM-402',
      name: 'Nurse Thomas Vance, RN',
      email: 'nurse.vance@neuroshield.health',
      role: 'Triage Nurse Supervisor',
      station: 'Rapid Response Unit 4',
    },
    {
      id: 'ADM-999',
      name: 'Clinical Admin',
      email: 'samstalin1307@gmail.com',
      role: 'Super Admin',
      station: 'Central Command Station',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="max-w-md w-full bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-5">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                Admin & Clinical Sign-In
              </h3>
              <p className="text-xs text-slate-400">
                Authorize terminal to receive bedside emergency alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Current status if already logged in */}
        {currentAdmin && (
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs flex justify-between items-center">
            <div>
              <span className="text-slate-400 block text-[10px]">Active Session:</span>
              <span className="font-bold text-white">{currentAdmin.name}</span>
              <span className="text-cyan-400 font-mono block text-[10px]">
                Target Admin ID: {currentAdmin.id}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              ON DUTY
            </span>
          </div>
        )}

        {/* Quick Demo 1-Click Login Cards */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Quick Admin Profiles (1-Click Login)
          </span>

          <div className="space-y-1.5">
            {quickAdminProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => handleLogin(p.email)}
                className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                  currentAdmin?.id === p.id
                    ? 'bg-cyan-950/40 border-cyan-400 text-white ring-1 ring-cyan-400/40'
                    : 'bg-slate-800/60 border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white group-hover:text-cyan-300">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-cyan-400 border border-slate-700">
                      ID: {p.id}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.role}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* Manual Login Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-3 pt-2 border-t border-slate-800"
        >
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Admin ID or Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={emailOrId}
                onChange={(e) => setEmailOrId(e.target.value)}
                placeholder="ADM-8801 or admin@neuroshield.health"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4" />
            <span>{isLoading ? 'Verifying Credentials...' : 'Sign In as Admin'}</span>
          </button>
        </form>

        <p className="text-[10px] text-slate-500 text-center">
          Any emergency signals from Eye-Blink tracking, Prolonged Closure, or Voice SOS will be
          automatically dispatched to this authenticated Admin ID.
        </p>
      </div>
    </div>
  );
};
