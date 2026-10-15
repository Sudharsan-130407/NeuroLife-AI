import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Video,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  PhoneCall,
  Search,
  Filter,
  Eye,
  Sliders,
  Play,
  RotateCcw,
  Plus,
  RefreshCw,
  Bell,
  Volume2,
  Maximize2,
  Calendar,
  UserCheck,
  LogOut,
  Radio,
  Sparkles,
  Shield,
  Send,
} from 'lucide-react';
import { IncidentAlert, CctvFeed, PatientProfile, AdminUser } from '../types';
import { fetchIncidents, updateIncidentStatus, dispatchEmergency, speakText } from '../services/api';
import { HomeNearCctvModule } from './HomeNearCctvModule';

interface AdminViewProps {
  onRefresh?: () => void;
  activeAdmin: AdminUser | null;
  onOpenLoginModal: () => void;
  onLogoutAdmin: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  activeAdmin,
  onOpenLoginModal,
  onLogoutAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'surveillance' | 'patients'>('incidents');
  const [incidents, setIncidents] = useState<IncidentAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterOnlyMyAlerts, setFilterOnlyMyAlerts] = useState<boolean>(false);

  // Load incidents from API
  const loadIncidents = async () => {
    setIsLoading(true);
    const data = await fetchIncidents(filterOnlyMyAlerts && activeAdmin ? activeAdmin.id : undefined);
    setIncidents(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadIncidents();
    const interval = setInterval(loadIncidents, 6000);
    return () => clearInterval(interval);
  }, [filterOnlyMyAlerts, activeAdmin]);

  const handleStatusChange = async (id: string, status: IncidentAlert['status'], notes?: string) => {
    await updateIncidentStatus(id, status, notes);
    speakText(`Incident ${status.toLowerCase()} by Admin ${activeAdmin?.id || 'Console'}.`);
    loadIncidents();
  };

  // Test trigger: sends simulated emergency directly to active admin ID
  const handleSimulateAlertToAdmin = async () => {
    const targetId = activeAdmin?.id || 'ADM-8801';
    const targetName = activeAdmin?.name || 'Dr. Sophia Martinez, MD';
    const targetEmail = activeAdmin?.email || 'admin@neuroshield.health';

    speakText(`Simulating emergency alert sent directly to Admin ID ${targetId}.`);
    await dispatchEmergency({
      patientId: 'pat-901',
      patientName: 'Eleanor Vance',
      type: 'EYE_BLINK_DISTRESS',
      severity: 'CRITICAL',
      earValue: 0.11,
      blinkPattern: 'Triple Eye-Blink Sequence (<1.3s)',
      location: 'Patient Bedside South Wing',
      targetAdminId: targetId,
      targetAdminName: targetName,
      targetAdminEmail: targetEmail,
    });
    loadIncidents();
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) return false;
    if (filterOnlyMyAlerts && activeAdmin) {
      return inc.targetAdminId === activeAdmin.id;
    }
    return true;
  });

  const pendingCount = incidents.filter((i) => i.status === 'PENDING').length;
  const myAlertsCount = activeAdmin ? incidents.filter((i) => i.targetAdminId === activeAdmin.id).length : 0;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Admin Authentication & Console Header */}
      <div className="bg-slate-900/95 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 border border-cyan-500/40 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">Clinical & Admin Command Hub</h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE RELAY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct incident triage for stroke emergency alerts, CCTV streams, and patient care routines.
              </p>
            </div>
          </div>

          {/* Admin Login State Badge & Actions */}
          <div className="flex items-center gap-2">
            {activeAdmin ? (
              <div className="flex items-center gap-3 bg-slate-800/90 border border-cyan-500/40 p-2.5 rounded-2xl shadow">
                <div className="w-9 h-9 rounded-xl bg-cyan-600/30 text-cyan-300 flex items-center justify-center font-bold text-xs border border-cyan-500/40">
                  {activeAdmin.id.slice(0, 3)}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{activeAdmin.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      ID: {activeAdmin.id}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {activeAdmin.role} • <span className="text-emerald-400 font-semibold">Alerts Directed Here</span>
                  </p>
                </div>

                <div className="flex items-center gap-1 pl-2 border-l border-slate-700">
                  <button
                    onClick={onOpenLoginModal}
                    className="p-1.5 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-700"
                    title="Switch Admin Profile"
                  >
                    Switch
                  </button>
                  <button
                    onClick={onLogoutAdmin}
                    className="p-1.5 text-xs text-rose-400 hover:text-rose-300 rounded-lg hover:bg-slate-700"
                    title="Log Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="py-2.5 px-5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>Admin Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Emergency Alert Routing Information Bar */}
        <div className="p-3 bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900 rounded-xl border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-slate-300">
              <strong className="text-white">Active Emergency Alert Channel:</strong> Any patient emergency signal (Eye-Blink EAR, Voice SOS, or Manual SOS) is routed directly to{' '}
              <strong className="text-cyan-300 underline font-mono">
                Admin ID: {activeAdmin?.id || 'ADM-8801'} ({activeAdmin?.name || 'Dr. Sophia Martinez'})
              </strong>.
            </span>
          </div>

          <button
            onClick={handleSimulateAlertToAdmin}
            className="py-1.5 px-3 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-bold text-[11px] flex items-center gap-1.5 shadow shrink-0 active:scale-95 transition-all"
          >
            <Send className="w-3 h-3" />
            <span>Simulate Alert to {activeAdmin?.id || 'ADM-8801'}</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`py-2 px-4 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'incidents'
                ? 'bg-rose-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Emergency Incident Feed ({pendingCount} Active)</span>
          </button>
          <button
            onClick={() => setActiveTab('surveillance')}
            className={`py-2 px-4 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'surveillance'
                ? 'bg-cyan-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Smart IP/CCTV Surveillance</span>
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`py-2 px-4 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'patients'
                ? 'bg-cyan-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Patient Management</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INCIDENT DASHBOARD */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-400">Filter:</span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${
                    filterSeverity === sev
                      ? 'bg-cyan-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}

              <button
                onClick={() => setFilterOnlyMyAlerts(!filterOnlyMyAlerts)}
                className={`text-xs px-3 py-1 rounded-lg font-bold border transition-all flex items-center gap-1.5 ${
                  filterOnlyMyAlerts
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <span>Sent to My Admin ID ({activeAdmin?.id || 'ADM-8801'})</span>
              </button>
            </div>

            <button
              onClick={loadIncidents}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Alert Feed</span>
            </button>
          </div>

          {/* Incident Alert Cards */}
          <div className="space-y-3">
            {filteredIncidents.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-400" />
                <p className="font-semibold text-sm">No active emergency incidents</p>
                <p className="text-xs text-slate-500">
                  All stroke patient telemetry streams are within stable baselines.
                </p>
              </div>
            ) : (
              filteredIncidents.map((incident) => {
                const isTargetedToMe = activeAdmin && incident.targetAdminId === activeAdmin.id;
                return (
                  <div
                    key={incident.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      incident.status === 'PENDING'
                        ? 'bg-slate-900/95 border-red-500 ring-2 ring-red-500/40 shadow-xl shadow-red-950/30'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase ${
                            incident.severity === 'CRITICAL'
                              ? 'bg-red-600 text-white animate-pulse'
                              : incident.severity === 'HIGH'
                              ? 'bg-amber-600 text-white'
                              : 'bg-cyan-600 text-white'
                          }`}
                        >
                          {incident.severity}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {new Date(incident.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {incident.patientName}
                        </span>

                        {/* Explicit Admin ID Routing Badge */}
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                          🚨 Routed to Admin ID: {incident.targetAdminId || 'ADM-8801'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{incident.type.replace(/_/g, ' ')}</span>
                      </h3>

                      <p className="text-xs text-slate-300">
                        {incident.blinkPattern || 'Distress signal detected.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                        <span>Location: {incident.location}</span>
                        {incident.earValue && <span>EAR: {incident.earValue.toFixed(2)}</span>}
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded ${
                            incident.status === 'PENDING'
                              ? 'text-red-400 bg-red-950/40'
                              : incident.status === 'ACKNOWLEDGED'
                              ? 'text-amber-400 bg-amber-950/40'
                              : 'text-emerald-400 bg-emerald-950/40'
                          }`}
                        >
                          Status: {incident.status}
                        </span>
                      </div>

                      {/* Notification Routing Audit Info */}
                      <div className="text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-0.5">
                        <div>
                          <strong className="text-slate-300">Admin Notification:</strong> Dispatched to {incident.targetAdminName || 'Dr. Sophia Martinez'} ({incident.targetAdminEmail || 'admin@neuroshield.health'})
                        </div>
                        <div>
                          <strong className="text-slate-300">Delivery Channel:</strong> {incident.adminChannel || 'Direct Admin Pager / Push Notification & Audio Siren'}
                        </div>
                      </div>
                    </div>

                    {/* Triage Actions */}
                    <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                      {incident.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusChange(
                                incident.id,
                                'ACKNOWLEDGED',
                                `Caregiver acknowledged by Admin ID: ${activeAdmin?.id || 'ADM-8801'}`
                              )
                            }
                            className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition-all active:scale-95"
                          >
                            Acknowledge ({activeAdmin?.id || 'Admin'})
                          </button>
                          <button
                            onClick={() => {
                              speakText(`Dispatching emergency 911 stroke team to ${incident.location}.`);
                              handleStatusChange(
                                incident.id,
                                'DISPATCHED',
                                `EMS 911 summoned by Admin ${activeAdmin?.id || 'ADM-8801'}`
                              );
                            }}
                            className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Dispatch Code Stroke 911</span>
                          </button>
                        </>
                      )}

                      {incident.status === 'ACKNOWLEDGED' && (
                        <button
                          onClick={() =>
                            handleStatusChange(
                              incident.id,
                              'RESOLVED',
                              `Patient checked and confirmed safe by Admin ID: ${activeAdmin?.id || 'ADM-8801'}`
                            )
                          }
                          className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                        >
                          Mark as Resolved
                        </button>
                      )}

                      {incident.status === 'RESOLVED' && (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Resolved by {incident.targetAdminId || 'Admin'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SMART IP/CCTV SURVEILLANCE */}
      {activeTab === 'surveillance' && (
        <HomeNearCctvModule
          isAdminView={true}
          targetAdminId={activeAdmin?.id || 'ADM-8801'}
          targetAdminName={activeAdmin?.name || 'Dr. Sophia Martinez, MD'}
        />
      )}

      {/* TAB 3: PATIENT MANAGEMENT */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Patient Roster & Rehabilitation Regimen Setup
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <span className="text-xs text-slate-400">Assigned Neurologist (Admin)</span>
                <p className="text-base font-bold text-white">
                  {activeAdmin?.name || 'Dr. Sophia Martinez, MD, FAHA'}
                </p>
                <p className="text-xs text-cyan-400 font-mono">
                  Admin ID: {activeAdmin?.id || 'ADM-8801'} • Direct Line: {activeAdmin?.phone || '+1 (555) 911-0021'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <span className="text-xs text-slate-400">Emergency Caregiver Contact</span>
                <p className="text-base font-bold text-white">Thomas Vance (Spouse / Caregiver)</p>
                <p className="text-xs text-cyan-400 font-mono">+1 (555) 234-8901 • Instant Push Active</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-300">
                Exercise Regimen Intensity Tuning
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400">Mirror Therapy Frequency</span>
                  <p className="text-sm font-bold text-cyan-300">2x Daily (15 mins)</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400">Hand Grasp Target</span>
                  <p className="text-sm font-bold text-cyan-300">15 Reps / Session</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400">Blink Distress Sensitivity</span>
                  <p className="text-sm font-bold text-cyan-300">EAR Threshold 0.21</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
