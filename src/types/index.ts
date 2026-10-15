export type AppViewMode = 'patient' | 'admin' | 'architecture';

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  room: string;
  strokeType: 'Ischemic (Left MCA)' | 'Hemorrhagic (Basal Ganglia)' | 'Brainstem Infarct' | 'TIA';
  strokeDate: string;
  nihssScore: number;
  affectedSide: 'Right Hemiparesis' | 'Left Hemiparesis' | 'Bilateral / Ataxia';
  primaryCaregiver: {
    name: string;
    phone: string;
    relation: string;
  };
  assignedDoctor: string;
  hydrationGoalMl: number;
  hydrationCurrentMl: number;
}

export interface RoutineItem {
  id: string;
  time: string;
  title: string;
  category: 'MEDICATION' | 'HYDRATION' | 'MEAL' | 'EXERCISE' | 'VITALS' | 'REST';
  description: string;
  completed: boolean;
  priority: 'CRITICAL' | 'NORMAL';
  audioPrompt?: string;
  dosage?: string;
}

export interface ExerciseItem {
  id: string;
  title: string;
  category: 'UPPER_LIMB' | 'MIRROR_THERAPY' | 'FACIAL_SPEECH' | 'MOBILITY' | 'COGNITIVE';
  targetMuscle: string;
  durationMinutes: number;
  targetReps: number;
  description: string;
  steps: string[];
  clinicalEvidence: string;
  pmidReference: string;
  videoPlaceholderUrl?: string;
  completedToday?: boolean;
}

export interface AdminUser {
  id: string; // e.g. "ADM-8801"
  name: string;
  email: string;
  role: 'Super Admin' | 'Chief Vascular Neurologist' | 'Triage Nurse Supervisor' | 'Family Caregiver Admin';
  phone?: string;
  avatarUrl?: string;
  onDuty: boolean;
  station: string;
}

export interface IncidentAlert {
  id: string;
  patientId: string;
  patientName: string;
  type: 'EYE_BLINK_DISTRESS' | 'PROLONGED_CLOSURE' | 'FALL_DETECTED' | 'MANUAL_SOS' | 'VOICE_SOS' | 'MISSED_CRITICAL_MED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  timestamp: string;
  earValue?: number;
  blinkPattern?: string;
  location: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED';
  snapshotUrl?: string;
  notes?: string;
  targetAdminId?: string;
  targetAdminName?: string;
  targetAdminEmail?: string;
  adminNotifiedAt?: string;
  adminChannel?: string;
}

export interface MedicalAnalysisResult {
  patientName?: string;
  age?: number | string;
  strokeClassification?: string;
  nihssScore?: string;
  keyDeficits?: string[];
  medications?: Array<{
    name: string;
    dosage: string;
    purpose: string;
  }>;
  rehabilitationProtocol?: Array<{
    module: string;
    frequency: string;
    clinicalRationale: string;
  }>;
  precautions?: string[];
  evidenceCitations?: Array<{
    title: string;
    source: string;
    pmid: string;
  }>;
}

export interface CctvFeed {
  id: string;
  name: string;
  ipAddress: string; // e.g. "192.168.1.101"
  port: number; // e.g. 554, 8080, 80, 8554
  category: 'home' | 'nearby'; // 'home' = inside patient home, 'nearby' = perimeter, near entrance, hallway, caregiver station
  protocol: 'RTSP' | 'HTTP_MJPEG' | 'WebRTC' | 'ONVIF';
  rtspUrl: string;
  location: string;
  status: 'ONLINE' | 'STANDBY' | 'MOTION_DETECTED' | 'FALL_RISK' | 'OFFLINE';
  nightVision: boolean;
  ptzSupported: boolean;
  anomalyScore: number;
  resolution?: string; // e.g. "1080p Full HD"
  fps?: number;
  latencyMs?: number;
  brand?: string; // e.g. "Hikvision IP Pro", "Reolink 4K", "Axis ONVIF", "Generic IP Cam"
  streamPath?: string;
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  source: string;
  pubdate: string;
  authors: string;
  doi?: string;
  url: string;
}
