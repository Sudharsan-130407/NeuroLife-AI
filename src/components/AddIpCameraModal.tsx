import React, { useState } from 'react';
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
} from 'lucide-react';
import { CctvFeed } from '../types';
import { addCctvCamera, pingIpCamera, discoverNearbyIpCameras, speakText } from '../services/api';

interface AddIpCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCameraAdded: (camera: CctvFeed) => void;
  defaultCategory?: 'home' | 'nearby';
}

export const AddIpCameraModal: React.FC<AddIpCameraModalProps> = ({
  isOpen,
  onClose,
  onCameraAdded,
  defaultCategory = 'home',
}) => {
  const [tab, setTab] = useState<'manual' | 'discover'>('manual');

  // Manual IP Form State
  const [name, setName] = useState<string>('');
  const [ipAddress, setIpAddress] = useState<string>('192.168.1.');
  const [port, setPort] = useState<number>(554);
  const [category, setCategory] = useState<'home' | 'nearby'>(defaultCategory);
  const [protocol, setProtocol] = useState<'RTSP' | 'HTTP_MJPEG' | 'WebRTC' | 'ONVIF'>('RTSP');
  const [location, setLocation] = useState<string>('');
  const [brand, setBrand] = useState<string>('Hikvision IP Pro');
  const [streamPath, setStreamPath] = useState<string>('/live/ch0');
  const [ptzSupported, setPtzSupported] = useState<boolean>(true);
  const [nightVision, setNightVision] = useState<boolean>(false);

  // Ping / Handshake State
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message?: string;
  } | null>(null);

  // Discovery State
  const [subnet, setSubnet] = useState<string>('192.168.1');
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [discoveredCams, setDiscoveredCams] = useState<any[]>([]);

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Protocol Change auto-updating default ports
  const handleProtocolChange = (prot: 'RTSP' | 'HTTP_MJPEG' | 'WebRTC' | 'ONVIF') => {
    setProtocol(prot);
    if (prot === 'RTSP') {
      setPort(554);
      setStreamPath('/live/ch0');
    } else if (prot === 'HTTP_MJPEG') {
      setPort(8080);
      setStreamPath('/video/mjpeg');
    } else if (prot === 'WebRTC') {
      setPort(8554);
      setStreamPath('/live/webrtc');
    } else if (prot === 'ONVIF') {
      setPort(8000);
      setStreamPath('/onvif/device_service');
    }
  };

  // Test IP Ping
  const handleTestPing = async () => {
    if (!ipAddress || ipAddress === '192.168.1.') {
      setErrorMsg('Please specify a complete IP address to test');
      return;
    }
    setErrorMsg(null);
    setIsPinging(true);
    setPingResult(null);

    const res = await pingIpCamera(ipAddress, port, protocol);
    setIsPinging(false);
    if (res.success && res.online) {
      setPingResult({
        success: true,
        latencyMs: res.latencyMs,
        message: res.message,
      });
      speakText(`Ping success. IP camera at ${ipAddress} responded in ${res.latencyMs} milliseconds.`);
    } else {
      setPingResult({
        success: false,
        message: res.error || 'Failed to reach IP camera at this address.',
      });
    }
  };

  // Submit manual camera
  const handleSaveCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Camera name is required');
      return;
    }
    if (!ipAddress.trim() || ipAddress === '192.168.1.') {
      setErrorMsg('Valid IP address is required (e.g. 192.168.1.120)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await addCctvCamera({
      name: name.trim(),
      ipAddress: ipAddress.trim(),
      port,
      category,
      protocol,
      location: location.trim() || (category === 'home' ? 'Home Room' : 'Nearby Perimeter'),
      brand,
      streamPath,
      ptzSupported,
      nightVision,
    });

    setIsSubmitting(false);

    if (res.success && res.camera) {
      speakText(`Camera ${res.camera.name} at IP ${res.camera.ipAddress} added successfully.`);
      onCameraAdded(res.camera);
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to register IP camera');
    }
  };

  // Discover local LAN cameras
  const handleRunDiscovery = async () => {
    setIsDiscovering(true);
    setErrorMsg(null);
    const results = await discoverNearbyIpCameras(subnet);
    setDiscoveredCams(results);
    setIsDiscovering(false);
    speakText(`Scan complete. Found ${results.length} active IP cameras on local subnet.`);
  };

  // 1-Click add discovered camera
  const handleAddDiscovered = async (discovered: any) => {
    setIsSubmitting(true);
    const res = await addCctvCamera({
      name: discovered.name,
      ipAddress: discovered.ipAddress,
      port: discovered.port,
      category: discovered.category,
      protocol: discovered.protocol,
      location: discovered.location,
      brand: discovered.brand,
      ptzSupported: true,
      nightVision: false,
    });
    setIsSubmitting(false);

    if (res.success && res.camera) {
      speakText(`Connected to ${res.camera.name} at ${res.camera.ipAddress}.`);
      onCameraAdded(res.camera);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="max-w-xl w-full bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Add CCTV Camera via IP Address
              </h3>
              <p className="text-xs text-slate-400">
                Connect home interior and nearby perimeter cameras on your local network
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        {/* Tab Switcher: Manual IP vs Scan Subnet */}
        <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              tab === 'manual' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Enter IP Address Manually</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('discover');
              if (discoveredCams.length === 0) handleRunDiscovery();
            }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              tab === 'discover' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Scan & Discover Nearby IP Cams</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: MANUAL IP ENTRY */}
        {tab === 'manual' && (
          <form onSubmit={handleSaveCamera} className="space-y-4 text-xs">
            {/* Category: Home vs Nearby */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block">
                Camera Zone / Scope:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('home')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    category === 'home'
                      ? 'bg-cyan-950/60 border-cyan-400 text-white ring-1 ring-cyan-400/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Home className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-bold">Home CCTV Camera</div>
                    <div className="text-[10px] text-slate-400">Bedside, Living Room, Gym, Kitchen</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('nearby')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    category === 'nearby'
                      ? 'bg-indigo-950/60 border-indigo-400 text-white ring-1 ring-indigo-400/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Compass className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="font-bold">Near / Nearby Camera</div>
                    <div className="text-[10px] text-slate-400">Entrance, Corridor, Porch, Caregiver</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Camera Name & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Camera Name *</label>
                <input
                  type="text"
                  required
                  placeholder={category === 'home' ? 'e.g. Bedside Left Cam' : 'e.g. Near Front Gate Intercom'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Physical Location</label>
                <input
                  type="text"
                  placeholder={category === 'home' ? 'e.g. South Bedroom Bedside' : 'e.g. Near EMS Ambulance Ramp'}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* IP Address & Port */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="font-semibold text-slate-300 block mb-1">
                  Camera IP Address * <span className="text-cyan-400 font-mono">(IPv4)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="192.168.1.120"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Protocol & Stream Path */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Stream Protocol</label>
                <select
                  value={protocol}
                  onChange={(e) => handleProtocolChange(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="RTSP">RTSP (Port 554 - H.264 / H.265)</option>
                  <option value="HTTP_MJPEG">HTTP / MJPEG (Port 80/8080)</option>
                  <option value="WebRTC">WebRTC Real-Time Relay (Port 8554)</option>
                  <option value="ONVIF">ONVIF Profile S (Port 8000)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Stream Path / Channel</label>
                <input
                  type="text"
                  value={streamPath}
                  onChange={(e) => setStreamPath(e.target.value)}
                  placeholder="/live/ch0"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Camera Model & Hardware Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Camera Brand / Model</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Hikvision AcuSense Smart Cam">Hikvision AcuSense (AI Fall Detection)</option>
                  <option value="Dahua WizMind AI IP Cam">Dahua WizMind AI (Thermal + Optical)</option>
                  <option value="Reolink 4K PTZ Cam">Reolink 4K (Pan-Tilt-Zoom)</option>
                  <option value="Axis Communications Dome">Axis M-Series HD Dome</option>
                  <option value="Amcrest Smart Doorway Intercom">Amcrest Smart Intercom</option>
                  <option value="Wyze v3 Cam RTSP">Wyze Cam (RTSP Firmware)</option>
                  <option value="Generic ONVIF IP Camera">Generic ONVIF IP Camera</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ptzSupported}
                    onChange={(e) => setPtzSupported(e.target.checked)}
                    className="accent-cyan-400 rounded w-4 h-4"
                  />
                  <span>PTZ Enabled</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nightVision}
                    onChange={(e) => setNightVision(e.target.checked)}
                    className="accent-cyan-400 rounded w-4 h-4"
                  />
                  <span>IR Night Vision</span>
                </label>
              </div>
            </div>

            {/* Generated RTSP / HTTP Stream URL Preview & Ping Test */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-mono">Stream Endpoint URL:</span>
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={isPinging}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-cyan-500/30 transition-all"
                >
                  <Radio className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                  <span>{isPinging ? 'Pinging IP...' : 'Test IP Handshake'}</span>
                </button>
              </div>

              <p className="font-mono text-cyan-300 text-[11px] truncate">
                {protocol === 'HTTP_MJPEG' ? 'http://' : 'rtsp://'}
                {ipAddress || '192.168.1.x'}:{port}
                {streamPath}
              </p>

              {pingResult && (
                <div
                  className={`p-2 rounded-lg text-[10px] flex items-center gap-1.5 ${
                    pingResult.success
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                  }`}
                >
                  {pingResult.success ? (
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  )}
                  <span>
                    {pingResult.message} ({pingResult.latencyMs}ms latency)
                  </span>
                </div>
              )}
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Connecting...' : 'Add IP Camera Feed'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: LAN SUBNET SCAN & AUTO DISCOVERY */}
        {tab === 'discover' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Target LAN Subnet
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={subnet}
                    onChange={(e) => setSubnet(e.target.value)}
                    placeholder="192.168.1"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs w-36"
                  />
                  <span className="text-slate-400 font-mono text-[11px]">.0 / 24</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunDiscovery}
                disabled={isDiscovering}
                className="py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
                <span>{isDiscovering ? 'Scanning Subnet...' : 'Scan Nearby IP Cams'}</span>
              </button>
            </div>

            {/* Discovered Cameras List */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Discovered IP Camera Devices ({discoveredCams.length}):</span>
                <span className="text-cyan-400">ONVIF / RTSP Protocol</span>
              </div>

              {discoveredCams.length === 0 ? (
                <div className="p-6 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400">
                  <Search className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
                  <p className="font-semibold">Click "Scan Nearby IP Cams" to probe your local subnet</p>
                  <p className="text-[10px] text-slate-500">
                    Probes port 554 (RTSP), 8000 (ONVIF), and 8080 (HTTP) across {subnet}.x
                  </p>
                </div>
              ) : (
                discoveredCams.map((cam, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{cam.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            cam.category === 'home'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                          }`}
                        >
                          {cam.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 flex items-center gap-2 font-mono">
                        <span className="text-cyan-400 font-bold">IP: {cam.ipAddress}:{cam.port}</span>
                        <span>•</span>
                        <span>{cam.brand}</span>
                        <span>•</span>
                        <span className="text-emerald-400">{cam.latencyMs}ms ping</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{cam.location}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddDiscovered(cam)}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
