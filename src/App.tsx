import React, { useState } from 'react';
import {
  Activity,
  ShieldAlert,
  Layers,
  Eye,
  Sliders,
  Volume2,
  BookOpen,
  Sun,
  Moon,
  Smartphone,
  Server,
  AlertTriangle,
  UserCheck,
  Shield,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { AppViewMode, PatientProfile, AdminUser, IncidentAlert } from './types';
import { CameraPipOverlay } from './components/CameraPipOverlay';
import { PatientView } from './components/PatientView';
import { AdminView } from './components/AdminView';
import { ArchitectureSpecView } from './components/ArchitectureSpecView';
import { ScienceEvidenceModal } from './components/ScienceEvidenceModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { speakText, dispatchEmergency } from './services/api';

export default function App() {
  const [viewMode, setViewMode] = useState<AppViewMode>('patient');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [isScienceOpen, setIsScienceOpen] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [activeEmergencyToast, setActiveEmergencyToast] = useState<IncidentAlert | null>(null);
  const [pipAlwaysVisible, setPipAlwaysVisible] = useState<boolean>(true);

  // Active Admin Session (Defaults to Lead Neurologist Admin)
  const [activeAdmin, setActiveAdmin] = useState<AdminUser | null>({
    id: 'ADM-8801',
    name: 'Dr. Sophia Martinez, MD',
    email: 'admin@neuroshield.health',
    role: 'Chief Vascular Neurologist',
    phone: '+1 (555) 911-0021',
    station: 'Neuro Intensive Care Console A',
    onDuty: true,
  });

  // Active Patient Profile
  const [patient, setPatient] = useState<PatientProfile>({
    id: 'pat-901',
    name: 'Eleanor Vance',
    age: 68,
    gender: 'Female',
    room: '304-B (South Wing)',
    strokeType: 'Ischemic (Left MCA)',
    strokeDate: '2026-09-28',
    nihssScore: 8,
    affectedSide: 'Right Hemiparesis',
    primaryCaregiver: {
      name: 'Thomas Vance',
      phone: '+1 (555) 234-8901',
      relation: 'Spouse',
    },
    assignedDoctor: 'Dr. Sophia Martinez, MD (Neurology)',
    hydrationGoalMl: 1800,
    hydrationCurrentMl: 750,
  });

  const handleManualSos = async () => {
    const adminId = activeAdmin?.id || 'ADM-8801';
    speakText(`Manual emergency distress activated! Alert dispatched directly to Admin ID ${adminId}.`);
    
    const inc = await dispatchEmergency({
      patientId: patient.id,
      patientName: patient.name,
      type: 'MANUAL_SOS',
      severity: 'CRITICAL',
      location: `Patient Room ${patient.room}`,
      targetAdminId: adminId,
      targetAdminName: activeAdmin?.name || 'Dr. Sophia Martinez, MD',
      targetAdminEmail: activeAdmin?.email || 'admin@neuroshield.health',
    });

    if (inc) {
      setActiveEmergencyToast(inc);
      setTimeout(() => setActiveEmergencyToast(null), 10000);
    }
  };

  const handleEmergencyTriggered = (incident: IncidentAlert) => {
    setActiveEmergencyToast(incident);
    setTimeout(() => setActiveEmergencyToast(null), 10000);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans ${
        highContrast ? 'bg-black text-yellow-300' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* High-Priority Emergency Toast Banner when an Alert is sent to Admin ID */}
      {activeEmergencyToast && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-2xl flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center font-black animate-bounce shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-sm tracking-wide">
                EMERGENCY ALERT ROUTED DIRECTLY TO ADMIN ID: [{activeEmergencyToast.targetAdminId || activeAdmin?.id || 'ADM-8801'}]!
              </p>
              <p className="text-xs text-red-100">
                Patient {activeEmergencyToast.patientName} • {activeEmergencyToast.type.replace(/_/g, ' ')} • {activeEmergencyToast.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setViewMode('admin');
                setActiveEmergencyToast(null);
              }}
              className="px-3 py-1.5 bg-white text-red-700 font-bold text-xs rounded-lg shadow hover:bg-red-50"
            >
              Open Admin Triage Feed
            </button>
            <button
              onClick={() => setActiveEmergencyToast(null)}
              className="p-1 hover:bg-red-700 rounded text-red-100 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Picture-In-Picture Live Camera Overlay (Draggable & dockable across all screens) */}
      {(viewMode === 'patient' || pipAlwaysVisible) && (
        <CameraPipOverlay
          highContrast={highContrast}
          targetAdminId={activeAdmin?.id || 'ADM-8801'}
          targetAdminName={activeAdmin?.name || 'Dr. Sophia Martinez, MD'}
          targetAdminEmail={activeAdmin?.email || 'admin@neuroshield.health'}
          onEmergencyTriggered={handleEmergencyTriggered}
        />
      )}

      {/* Top Navigation & System Bar */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b ${
          highContrast
            ? 'bg-black/95 border-yellow-400 text-yellow-300'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg md:text-xl tracking-tight text-white flex items-center gap-1">
                  Neuro<span className="text-cyan-400">Shield</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Stroke Rehabilitation & Eye-Blink Emergency Monitoring System
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 text-xs">
            <button
              onClick={() => {
                setViewMode('patient');
                speakText('Patient view loaded. Camera eye-blink monitoring active.');
              }}
              className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'patient'
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Patient App</span>
            </button>

            <button
              onClick={() => {
                setViewMode('admin');
                speakText('Caregiver and clinical surveillance hub loaded.');
              }}
              className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'admin'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Caregiver & CCTV</span>
            </button>

            <button
              onClick={() => setViewMode('architecture')}
              className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'architecture'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Architecture & Code</span>
            </button>
          </div>

          {/* Admin Login Status, Science, & Accessibility Controls */}
          <div className="flex items-center gap-2">
            {/* Admin Login Pill */}
            <button
              onClick={() => setIsAdminLoginOpen(true)}
              className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeAdmin
                  ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/40'
                  : 'bg-rose-950/60 hover:bg-rose-900 border-rose-500/40 text-rose-300'
              }`}
              title="Configure or Switch Admin Login"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {activeAdmin ? `Admin: ${activeAdmin.id}` : 'Admin Login'}
              </span>
            </button>

            <button
              onClick={() => setIsScienceOpen(true)}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
              title="Query PubMed Stroke Clinical Evidence"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PubMed</span>
            </button>

            {/* Float PIP Toggle */}
            <button
              onClick={() => {
                const next = !pipAlwaysVisible;
                setPipAlwaysVisible(next);
                speakText(next ? 'Floating camera overlay enabled across all views.' : 'Camera overlay restricted to patient screen.');
              }}
              className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                pipAlwaysVisible
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Toggle floating camera PIP view on/off across views"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{pipAlwaysVisible ? 'PIP: Active' : 'PIP: Hidden'}</span>
            </button>

            <button
              onClick={() => {
                const next = !highContrast;
                setHighContrast(next);
                speakText(next ? 'High contrast accessibility theme enabled.' : 'Standard theme restored.');
              }}
              className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                highContrast
                  ? 'bg-yellow-400 text-black border-yellow-300'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle WCAG AAA High Contrast Theme"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{highContrast ? 'Contrast ON' : 'Contrast'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'patient' && (
          <PatientView
            patient={patient}
            highContrast={highContrast}
            targetAdminId={activeAdmin?.id || 'ADM-8801'}
            targetAdminName={activeAdmin?.name || 'Dr. Sophia Martinez, MD'}
            onEmergencyClick={handleManualSos}
          />
        )}

        {viewMode === 'admin' && (
          <AdminView
            activeAdmin={activeAdmin}
            onOpenLoginModal={() => setIsAdminLoginOpen(true)}
            onLogoutAdmin={() => setActiveAdmin(null)}
          />
        )}

        {viewMode === 'architecture' && <ArchitectureSpecView />}
      </main>

      {/* Admin Authentication Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={(admin) => setActiveAdmin(admin)}
        currentAdmin={activeAdmin}
      />

      {/* Science Skills Grounding Modal */}
      <ScienceEvidenceModal
        isOpen={isScienceOpen}
        onClose={() => setIsScienceOpen(false)}
      />
    </div>
  );
}
