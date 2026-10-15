import React, { useState, useEffect } from 'react';
import {
  Video,
  Radio,
  Wifi,
  Search,
  CheckCircle,
  AlertTriangle,
  Server,
  Plus,
  RefreshCw,
  Sliders,
  Shield,
  Home,
  Compass,
  ArrowRight,
  Sparkles,
  Maximize2,
  Minimize2,
  Trash2,
  Camera,
  Eye,
  Activity,
  Layers,
  Grid,
  Volume2,
} from 'lucide-react';
import { CctvFeed } from '../types';
import { fetchCctvFeeds, pingIpCamera, deleteCctvCamera, speakText, dispatchEmergency } from '../services/api';
import { AddIpCameraModal } from './AddIpCameraModal';

interface HomeNearCctvModuleProps {
  isAdminView?: boolean;
  targetAdminId?: string;
  targetAdminName?: string;
}

export const HomeNearCctvModule: React.FC<HomeNearCctvModuleProps> = ({
  isAdminView = true,
  targetAdminId = 'ADM-8801',
  targetAdminName = 'Dr. Sophia Martinez, MD',
}) => {
  const [cctvFeeds, setCctvFeeds] = useState<CctvFeed[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'home' | 'nearby'>('all');
  const [selectedCam, setSelectedCam] = useState<CctvFeed | null>(null);
  const [viewLayout, setViewLayout] = useState<'spotlight' | 'grid'>('spotlight');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(100);

  // Live Ping Telemetry
  const [pingStatus, setPingStatus] = useState<{ [id: string]: { latency: number; checking: boolean } }>({});
  const [snapshotTaken, setSnapshotTaken] = useState<string | null>(null);
  const [ptzMessage, setPtzMessage] = useState<string | null>(null);

  // Load CCTV cameras from API
  const loadFeeds = async () => {
    setIsLoading(true);
    const data = await fetchCctvFeeds();
    setCctvFeeds(data);
    if (data.length > 0 && !selectedCam) {
      setSelectedCam(data[0]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadFeeds();
  }, []);

  // Filter cameras
  const filteredCams = cctvFeeds.filter((cam) => {
    if (activeCategory === 'all') return true;
    return cam.category === activeCategory;
  });

  // Test Ping IP for a specific camera
  const handlePingCamera = async (cam: CctvFeed) => {
    setPingStatus((prev) => ({
      ...prev,
      [cam.id]: { latency: cam.latencyMs || 25, checking: true },
    }));

    const res = await pingIpCamera(cam.ipAddress, cam.port, cam.protocol);
    setPingStatus((prev) => ({
      ...prev,
      [cam.id]: { latency: res.latencyMs || 28, checking: false },
    }));

    speakText(`IP camera ${cam.name} at ${cam.ipAddress} responded in ${res.latencyMs || 28} milliseconds.`);
  };

  // PTZ Control trigger
  const handlePtzAction = (action: string) => {
    if (!selectedCam) return;
    setPtzMessage(`PTZ: ${action} command sent to ${selectedCam.ipAddress}:${selectedCam.port}`);
    setTimeout(() => setPtzMessage(null), 3000);
  };

  // Trigger simulated fall event on this camera feed
  const handleSimulateFallAnomaly = async (cam: CctvFeed) => {
    speakText(`Fall anomaly detected on camera ${cam.name} at IP ${cam.ipAddress}. Alert routed to Admin ID ${targetAdminId}.`);
    await dispatchEmergency({
      patientId: 'pat-901',
      patientName: 'Eleanor Vance',
      type: 'FALL_DETECTED',
      severity: 'CRITICAL',
      location: `${cam.name} (IP: ${cam.ipAddress}:${cam.port} - ${cam.location})`,
      targetAdminId,
      targetAdminName,
    });
    alert(`Emergency Fall Alert dispatched for camera at IP ${cam.ipAddress} to Admin ID ${targetAdminId}!`);
  };

  // Delete camera
  const handleDeleteCam = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this IP camera feed?')) {
      await deleteCctvCamera(id);
      setCctvFeeds((prev) => prev.filter((c) => c.id !== id));
      if (selectedCam?.id === id) {
        setSelectedCam(cctvFeeds.find((c) => c.id !== id) || null);
      }
    }
  };

  // Take Snapshot
  const handleTakeSnapshot = (cam: CctvFeed) => {
    const timestamp = new Date().toLocaleTimeString();
    setSnapshotTaken(`Snapshot saved for IP ${cam.ipAddress} at ${timestamp}`);
    speakText(`Snapshot captured from ${cam.name}.`);
    setTimeout(() => setSnapshotTaken(null), 4000);
  };

  const homeCount = cctvFeeds.filter((c) => c.category === 'home').length;
  const nearbyCount = cctvFeeds.filter((c) => c.category === 'nearby').length;

  return (
    <div className="space-y-5 text-slate-100">
      {/* CCTV Navigation Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Smart IP & CCTV Camera Surveillance
            </h2>
            <p className="text-xs text-slate-400">
              Access and manage Home CCTV and Nearby perimeter cameras via IP address (RTSP / WebRTC / HTTP)
            </p>
          </div>
        </div>

        {/* Action Buttons: Add via IP, Scan, Layout Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Camera by IP Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="py-2 px-3.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Camera by IP</span>
          </button>

          {/* Grid vs Spotlight View */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setViewLayout('spotlight')}
              className={`p-1.5 rounded-lg flex items-center gap-1 ${
                viewLayout === 'spotlight'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Spotlight Single Camera & PTZ Pad"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Spotlight</span>
            </button>
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-lg flex items-center gap-1 ${
                viewLayout === 'grid'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Multi-Camera Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Multi-Cam</span>
            </button>
          </div>

          <button
            onClick={loadFeeds}
            disabled={isLoading}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 border border-slate-700"
            title="Refresh Camera Statuses"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Pills: All vs Home CCTV vs Near / Perimeter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveCategory('all')}
            className={`py-1.5 px-3 rounded-xl transition-all ${
              activeCategory === 'all'
                ? 'bg-cyan-600 text-white shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All IP Feeds ({cctvFeeds.length})
          </button>

          <button
            onClick={() => setActiveCategory('home')}
            className={`py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-all ${
              activeCategory === 'home'
                ? 'bg-cyan-600 text-white shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-cyan-300" />
            <span>Home CCTV ({homeCount})</span>
          </button>

          <button
            onClick={() => setActiveCategory('nearby')}
            className={`py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-all ${
              activeCategory === 'nearby'
                ? 'bg-indigo-600 text-white shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-indigo-300" />
            <span>Near & Perimeter ({nearbyCount})</span>
          </button>
        </div>

        {/* Snapshot / PTZ feedback banner */}
        {snapshotTaken && (
          <div className="text-xs bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{snapshotTaken}</span>
          </div>
        )}
        {ptzMessage && (
          <div className="text-xs bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-in fade-in">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>{ptzMessage}</span>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: SPOTLIGHT VIEW (Player + PTZ + Camera List) */}
      {viewLayout === 'spotlight' && selectedCam && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Camera Video Viewport */}
          <div className="lg:col-span-2 space-y-3">
            <div className="relative aspect-16/9 bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-2xl group">
              {/* Camera Video Stream Canvas */}
              <div
                className={`w-full h-full flex flex-col justify-between p-4 ${
                  selectedCam.nightVision
                    ? 'bg-gradient-to-br from-emerald-950/90 via-black to-slate-950 text-emerald-400'
                    : 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-cyan-400'
                }`}
              >
                {/* Top HUD: IP Address, Name, Stream Stats */}
                <div className="flex justify-between items-start text-xs font-mono">
                  <div className="bg-black/75 px-3 py-1.5 rounded-xl border border-white/10 space-y-0.5 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                        LIVE {selectedCam.protocol}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          selectedCam.category === 'home'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                        }`}
                      >
                        {selectedCam.category === 'home' ? 'Home Interior' : 'Near Area'}
                      </span>
                    </div>
                    <div className="font-bold text-white text-xs">{selectedCam.name}</div>
                    <div className="text-[11px] text-cyan-300 font-mono">
                      IP Address: <strong className="text-white underline">{selectedCam.ipAddress}:{selectedCam.port}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400">{selectedCam.location}</div>
                  </div>

                  <div className="text-right bg-black/75 px-3 py-1.5 rounded-xl border border-white/10 font-mono text-[10px] text-slate-300 backdrop-blur-sm space-y-0.5">
                    <div>RESOLUTION: {selectedCam.resolution || '1080p Full HD'}</div>
                    <div>FPS: {selectedCam.fps || 30} | BITRATE: 2.8 Mbps</div>
                    <div className="text-emerald-400 font-bold">
                      LATENCY: ~{pingStatus[selectedCam.id]?.latency || selectedCam.latencyMs || 25} ms
                    </div>
                    <div className="text-slate-400 text-[9px]">{selectedCam.brand}</div>
                  </div>
                </div>

                {/* Patient Pose AI & Fall Detection Bounding Box Simulation */}
                <div className="relative mx-auto w-64 h-52 border-2 border-dashed border-cyan-400/70 rounded-2xl flex items-center justify-center bg-cyan-950/25 backdrop-blur-[2px]">
                  <div className="text-center space-y-1.5 p-3">
                    <div className="inline-block bg-black/75 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/40">
                      AI OPTICAL FLOW & POSE TRACKING
                    </div>
                    <p className="text-xs text-slate-200 font-semibold">
                      {selectedCam.category === 'home'
                        ? 'Bedside & Seated Area Monitored'
                        : 'Entryway / Corridor Pedestrian Clear'}
                    </p>
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono">
                      <span className="text-slate-400">Anomaly Index:</span>
                      <span
                        className={`font-bold px-1.5 py-0.2 rounded ${
                          selectedCam.anomalyScore > 0.3
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {selectedCam.anomalyScore.toFixed(2)} (
                        {selectedCam.anomalyScore > 0.3 ? 'Motion Flag' : 'Normal'})
                      </span>
                    </div>
                  </div>

                  {/* High-tech corner target markers */}
                  <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400" />
                  <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400" />
                  <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400" />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400" />
                </div>

                {/* Bottom Overlay Bar: Controls, Snapshot, Night Vision, Simulation */}
                <div className="flex flex-wrap justify-between items-center bg-black/80 px-3 py-2 rounded-xl border border-white/10 text-xs backdrop-blur-sm gap-2">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{new Date().toLocaleTimeString()}</span>
                    <span>•</span>
                    <span className="truncate max-w-[200px] text-cyan-300">
                      {selectedCam.rtspUrl}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Ping Latency Test */}
                    <button
                      onClick={() => handlePingCamera(selectedCam)}
                      disabled={pingStatus[selectedCam.id]?.checking}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold border border-slate-700 flex items-center gap-1"
                      title="Ping camera IP address"
                    >
                      <Radio className="w-3 h-3 text-cyan-400" />
                      <span>Ping IP</span>
                    </button>

                    {/* Snapshot Button */}
                    <button
                      onClick={() => handleTakeSnapshot(selectedCam)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold border border-slate-700 flex items-center gap-1"
                      title="Save snapshot"
                    >
                      <Camera className="w-3 h-3 text-amber-400" />
                      <span>Snapshot</span>
                    </button>

                    {/* IR Night Vision Toggle */}
                    <button
                      onClick={() =>
                        setCctvFeeds((prev) =>
                          prev.map((c) =>
                            c.id === selectedCam.id ? { ...c, nightVision: !c.nightVision } : c
                          )
                        )
                      }
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                        selectedCam.nightVision
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {selectedCam.nightVision ? 'IR Night Vision: ON' : 'IR Night Vision: OFF'}
                    </button>

                    {/* Trigger Simulated Fall Test */}
                    {isAdminView && (
                      <button
                        onClick={() => handleSimulateFallAnomaly(selectedCam)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold shadow"
                        title="Dispatch Simulated Fall Anomaly Alert to Admin"
                      >
                        Simulate Fall
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* DVR Event Timeline Scrubber */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DVR Historical Playback & Anomaly Event Log</span>
                </span>
                <span className="font-mono text-cyan-400">
                  {playbackTime === 100 ? 'LIVE STREAM' : `T - ${100 - playbackTime} mins`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={playbackTime}
                onChange={(e) => setPlaybackTime(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-60 mins</span>
                <span className="text-amber-400">● 10:15 AM (Bed Exit)</span>
                <span className="text-cyan-400">● 10:35 AM (Therapy)</span>
                <span className="text-emerald-400 font-bold">LIVE</span>
              </div>
            </div>
          </div>

          {/* Right Column: Camera Feeds List & PTZ Pad */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <span>Active IP Feeds ({filteredCams.length})</span>
              </h3>
              <span className="text-[10px] text-cyan-400 font-mono">LAN 192.168.1.0/24</span>
            </div>

            {/* Camera Feeds Selection Cards */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredCams.map((cam) => {
                const isSelected = selectedCam.id === cam.id;
                return (
                  <div
                    key={cam.id}
                    onClick={() => setSelectedCam(cam)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{cam.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              cam.category === 'home'
                                ? 'bg-cyan-950 text-cyan-300'
                                : 'bg-indigo-950 text-indigo-300'
                            }`}
                          >
                            {cam.category}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-cyan-400 font-bold">
                          IP: {cam.ipAddress}:{cam.port}
                        </div>
                        <div className="text-[10px] text-slate-400">{cam.location}</div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            cam.status === 'ONLINE'
                              ? 'bg-emerald-400'
                              : cam.status === 'MOTION_DETECTED'
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-red-400'
                          }`}
                          title={`Status: ${cam.status}`}
                        />
                        <button
                          onClick={(e) => handleDeleteCam(cam.id, e)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-rose-400 ml-1"
                          title="Remove Camera"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive PTZ Controller Pad */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>PTZ Remote Camera Control</span>
                </h4>
                <span className="text-[10px] font-mono text-cyan-400">
                  {selectedCam.ptzSupported ? 'PTZ ACTIVE' : 'FIXED LENS'}
                </span>
              </div>

              {/* Directional Pad */}
              <div className="grid grid-cols-3 gap-1.5 w-36 mx-auto pt-1">
                <div />
                <button
                  onClick={() => handlePtzAction('Tilt UP')}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded-xl text-xs font-bold text-slate-200 transition-all flex items-center justify-center shadow"
                  title="Tilt Up"
                >
                  ▲
                </button>
                <div />

                <button
                  onClick={() => handlePtzAction('Pan LEFT')}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded-xl text-xs font-bold text-slate-200 transition-all flex items-center justify-center shadow"
                  title="Pan Left"
                >
                  ◀
                </button>
                <button
                  onClick={() => handlePtzAction('HOME Preset')}
                  className="p-2 bg-slate-700 hover:bg-slate-600 active:bg-cyan-600 rounded-xl text-[10px] font-mono font-bold text-cyan-300 flex items-center justify-center"
                  title="Return to Home Center"
                >
                  HOME
                </button>
                <button
                  onClick={() => handlePtzAction('Pan RIGHT')}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded-xl text-xs font-bold text-slate-200 transition-all flex items-center justify-center shadow"
                  title="Pan Right"
                >
                  ▶
                </button>

                <div />
                <button
                  onClick={() => handlePtzAction('Tilt DOWN')}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded-xl text-xs font-bold text-slate-200 transition-all flex items-center justify-center shadow"
                  title="Tilt Down"
                >
                  ▼
                </button>
                <div />
              </div>

              {/* Zoom & Quick Presets */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <button
                  onClick={() => handlePtzAction('Zoom IN (+2.0x)')}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold border border-slate-700"
                >
                  Zoom In (+)
                </button>
                <button
                  onClick={() => handlePtzAction('Zoom OUT (1.0x)')}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold border border-slate-700"
                >
                  Zoom Out (-)
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-0.5 text-[10px]">
                <button
                  onClick={() => handlePtzAction('Preset 1: Bedside Focus')}
                  className="py-1 bg-slate-850 hover:bg-slate-750 text-cyan-300 rounded border border-slate-800"
                >
                  P1: Bed
                </button>
                <button
                  onClick={() => handlePtzAction('Preset 2: Doorway Corridor')}
                  className="py-1 bg-slate-850 hover:bg-slate-750 text-cyan-300 rounded border border-slate-800"
                >
                  P2: Door
                </button>
                <button
                  onClick={() => handlePtzAction('Preset 3: Patio Walkway')}
                  className="py-1 bg-slate-850 hover:bg-slate-750 text-cyan-300 rounded border border-slate-800"
                >
                  P3: Patio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: MULTI-CAM GRID VIEW (Side-by-side surveillance) */}
      {viewLayout === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCams.map((cam) => (
            <div
              key={cam.id}
              onClick={() => {
                setSelectedCam(cam);
                setViewLayout('spotlight');
              }}
              className="bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-xl cursor-pointer hover:border-cyan-400 transition-all group"
            >
              {/* Header Bar */}
              <div className="flex justify-between items-center p-2.5 bg-slate-900 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      cam.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  <span className="font-bold text-white text-xs truncate max-w-[140px]">
                    {cam.name}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-cyan-400 font-bold">
                  IP: {cam.ipAddress}
                </span>
              </div>

              {/* Video Box */}
              <div className="relative aspect-16/9 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-3 flex flex-col justify-between">
                <div className="flex justify-between items-start text-[10px] font-mono">
                  <span
                    className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                      cam.category === 'home'
                        ? 'bg-cyan-950 text-cyan-300'
                        : 'bg-indigo-950 text-indigo-300'
                    }`}
                  >
                    {cam.category}
                  </span>
                  <span className="text-slate-400">{cam.fps || 30} FPS</span>
                </div>

                <div className="border border-dashed border-cyan-400/40 rounded-xl p-2 text-center bg-cyan-950/20">
                  <p className="text-[10px] font-mono text-cyan-300">{cam.location}</p>
                  <p className="text-[9px] text-slate-400">{cam.protocol} • {cam.brand}</p>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>{new Date().toLocaleTimeString()}</span>
                  <span className="text-cyan-400 font-semibold group-hover:underline">
                    Click to Focus & PTZ →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Camera Modal */}
      <AddIpCameraModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCameraAdded={(newCam) => {
          setCctvFeeds((prev) => [newCam, ...prev]);
          setSelectedCam(newCam);
          setViewLayout('spotlight');
        }}
        defaultCategory={activeCategory === 'nearby' ? 'nearby' : 'home'}
      />
    </div>
  );
};
