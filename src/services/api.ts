import { IncidentAlert, MedicalAnalysisResult, PubMedArticle, AdminUser, CctvFeed } from '../types';

export async function loginAdmin(credentials: {
  email?: string;
  password?: string;
  adminId?: string;
}): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Login connection failed' };
  }
}

export async function fetchAdminList(): Promise<AdminUser[]> {
  try {
    const res = await fetch('/api/admin/list');
    if (!res.ok) return [];
    const data = await res.json();
    return data.admins || [];
  } catch (err) {
    return [];
  }
}

export async function fetchIncidents(adminId?: string): Promise<IncidentAlert[]> {
  try {
    const url = adminId ? `/api/incidents?adminId=${encodeURIComponent(adminId)}` : '/api/incidents';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    const data = await res.json();
    return data.incidents || [];
  } catch (err) {
    console.error('Error loading incidents:', err);
    return [];
  }
}

export async function dispatchEmergency(payload: {
  patientId: string;
  patientName: string;
  type: IncidentAlert['type'];
  severity: IncidentAlert['severity'];
  earValue?: number;
  blinkPattern?: string;
  location?: string;
  snapshotUrl?: string;
  targetAdminId?: string;
  targetAdminName?: string;
  targetAdminEmail?: string;
}): Promise<IncidentAlert | null> {
  try {
    const res = await fetch('/api/incidents/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Dispatch failed');
    const data = await res.json();
    return data.incident;
  } catch (err) {
    console.error('Emergency dispatch error:', err);
    return null;
  }
}

export async function updateIncidentStatus(
  id: string,
  status: IncidentAlert['status'],
  notes?: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/incidents/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    return res.ok;
  } catch (err) {
    console.error('Update status error:', err);
    return false;
  }
}

export async function analyzeMedicalDocument(payload: {
  documentText?: string;
  imageBase64?: string;
  mimeType?: string;
}): Promise<{ success: boolean; analysis: MedicalAnalysisResult; isSimulated?: boolean }> {
  const res = await fetch('/api/analyze-medical-doc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Analysis failed: ${errText}`);
  }
  return await res.json();
}

export async function speakText(text: string, voiceName = 'Kore'): Promise<void> {
  if (!text) return;

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: voiceName }),
    });

    const data = await res.json();
    if (data.success && data.audioDataUrl) {
      const audio = new Audio(data.audioDataUrl);
      await audio.play();
      return;
    }
  } catch (err) {
    console.warn('Backend TTS failed, using Web Speech API fallback:', err);
  }

  // Native Web Speech fallback
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for stroke patients
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

export async function fetchPubMedStrokeResearch(query = 'stroke rehabilitation mirror therapy eye tracking'): Promise<PubMedArticle[]> {
  try {
    const res = await fetch(`/api/science/pubmed-stroke-trials?term=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('PubMed query failed');
    const data = await res.json();
    return data.articles || [];
  } catch (err) {
    console.error('PubMed fetch error:', err);
    return [];
  }
}

// CCTV IP Camera Services
export async function fetchCctvFeeds(category?: 'home' | 'nearby'): Promise<CctvFeed[]> {
  try {
    const url = category ? `/api/cctv/cameras?category=${category}` : '/api/cctv/cameras';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load CCTV feeds');
    const data = await res.json();
    return data.cameras || [];
  } catch (err) {
    console.error('Fetch CCTV feeds error:', err);
    return [];
  }
}

export async function pingIpCamera(
  ipAddress: string,
  port = 554,
  protocol = 'RTSP'
): Promise<{ success: boolean; online?: boolean; latencyMs?: number; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/cctv/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ipAddress, port, protocol }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'IP ping failed' };
  }
}

export async function addCctvCamera(cameraData: Partial<CctvFeed>): Promise<{ success: boolean; camera?: CctvFeed; error?: string }> {
  try {
    const res = await fetch('/api/cctv/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cameraData),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add camera' };
  }
}

export async function discoverNearbyIpCameras(subnet = '192.168.1'): Promise<any[]> {
  try {
    const res = await fetch('/api/cctv/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subnet }),
    });
    const data = await res.json();
    return data.discovered || [];
  } catch (err) {
    console.error('Discovery error:', err);
    return [];
  }
}

export async function deleteCctvCamera(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/cctv/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    return false;
  }
}

