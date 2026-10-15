import React, { useState } from 'react';
import {
  Layers,
  Database,
  Code2,
  Cpu,
  Copy,
  Check,
  Smartphone,
  Eye,
  Server,
  Network,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const ArchitectureSpecView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'architecture' | 'schema' | 'python-ear' | 'wireframes'>('architecture');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const pythonEarCode = `"""
NeuroShield - Real-Time Eye Aspect Ratio (EAR) Blink Distress Detection Pipeline
Production-Grade Python implementation using OpenCV and Google MediaPipe Face Mesh.

Calculates Euclidean EAR for 6 landmarks per eye:
    EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
Dispatches emergency signal when 3 rapid blinks occur within 1.5 seconds,
or if prolonged closure (> 2.5s) is observed in stroke/locked-in patients.
"""

import cv2
import mediapipe as mp
import numpy as np
import time
import requests
import json
from collections import deque

# MediaPipe Eye Landmark Indices (468/478 mesh model)
# Left Eye: 33 (p1), 160 (p2), 158 (p3), 133 (p4), 153 (p5), 144 (p6)
# Right Eye: 362 (p1), 385 (p2), 387 (p3), 263 (p4), 373 (p5), 380 (p6)
LEFT_EYE_LANDMARKS = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_LANDMARKS = [362, 385, 387, 263, 373, 380]

# Calibration Parameters
EAR_THRESHOLD = 0.21              # Blink closure threshold
RAPID_BLINK_WINDOW_SEC = 1.5      # Temporal window for distress sequence
REQUIRED_RAPID_BLINKS = 3         # 3 rapid blinks triggers SOS
PROLONGED_CLOSURE_SEC = 2.5       # Locked-in / unconsciousness alert
DISPATCH_API_URL = "http://localhost:3000/api/incidents/dispatch"


def calculate_euclidean_distance(ptA, ptB):
    """Calculates Euclidean distance between two 2D/3D points."""
    return np.linalg.norm(np.array(ptA) - np.array(ptB))


def calculate_ear(eye_points):
    """
    Computes Eye Aspect Ratio (EAR).
    eye_points format: [p1, p2, p3, p4, p5, p6]
    """
    # Vertical distances
    dist_v1 = calculate_euclidean_distance(eye_points[1], eye_points[5])
    dist_v2 = calculate_euclidean_distance(eye_points[2], eye_points[4])
    # Horizontal distance
    dist_h = calculate_euclidean_distance(eye_points[0], eye_points[3])

    if dist_h == 0:
        return 0.0
    return (dist_v1 + dist_v2) / (2.0 * dist_h)


def dispatch_emergency(pattern_type, ear_val, patient_id="pat-901"):
    """Dispatches emergency distress payload to backend websocket/webhook."""
    payload = {
        "patientId": patient_id,
        "type": "EYE_BLINK_DISTRESS",
        "severity": "CRITICAL",
        "earValue": float(ear_val),
        "blinkPattern": pattern_type,
        "location": "Bedside Computer Vision Stream",
    }
    try:
        res = requests.post(DISPATCH_API_URL, json=payload, timeout=2.0)
        print(f"[EMERGENCY DISPATCHED] Status: {res.status_code} | Payload: {payload}")
    except Exception as err:
        print(f"[DISPATCH ERROR] Could not contact emergency server: {err}")


def run_pipeline():
    mp_face_mesh = mp.solutions.face_mesh
    cap = cv2.VideoCapture(0)

    # State tracking
    eye_closed = False
    closed_start_time = 0
    blink_history = deque()
    last_emergency_trigger = 0

    with mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.6,
        min_tracking_confidence=0.6
    ) as face_mesh:
        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break

            now = time.time()
            h, w, _ = frame.shape
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)

            if results.multi_face_landmarks:
                mesh = results.multi_face_landmarks[0]

                # Extract pixel coordinates
                def get_pts(indices):
                    return [(mesh.landmark[idx].x * w, mesh.landmark[idx].y * h) for idx in indices]

                left_pts = get_pts(LEFT_EYE_LANDMARKS)
                right_pts = get_pts(RIGHT_EYE_LANDMARKS)

                left_ear = calculate_ear(left_pts)
                right_ear = calculate_ear(right_pts)
                avg_ear = (left_ear + right_ear) / 2.0

                # 1. Check Closure State
                if avg_ear < EAR_THRESHOLD:
                    if not eye_closed:
                        eye_closed = True
                        closed_start_time = now
                    else:
                        # Prolonged closure check
                        duration = now - closed_start_time
                        if duration > PROLONGED_CLOSURE_SEC and (now - last_emergency_trigger > 10):
                            dispatch_emergency(f"Prolonged Eye Closure ({duration:.1f}s)", avg_ear)
                            last_emergency_trigger = now
                else:
                    if eye_closed:
                        # Eye has opened -> Register valid blink
                        blink_duration = now - closed_start_time
                        eye_closed = False

                        if 0.05 <= blink_duration <= 0.60:
                            blink_history.append(now)

                            # Prune blinks outside window
                            while blink_history and (now - blink_history[0] > RAPID_BLINK_WINDOW_SEC):
                                blink_history.popleft()

                            # 2. Check 3 Rapid Blinks Distress Trigger
                            if len(blink_history) >= REQUIRED_RAPID_BLINKS:
                                if now - last_emergency_trigger > 8:
                                    dispatch_emergency("3 Rapid Eye Blinks (<1.5s) Distress Sequence", avg_ear)
                                    last_emergency_trigger = now
                                    blink_history.clear()

                # Visual HUD Overlay
                cv2.putText(frame, f"EAR: {avg_ear:.3f}", (30, 50),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0) if avg_ear >= EAR_THRESHOLD else (0, 0, 255), 2)
                cv2.putText(frame, f"Rapid Blinks: {len(blink_history)}", (30, 90),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)

            cv2.imshow("NeuroShield EAR Emergency Monitor", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    run_pipeline()
`;

  const sqlSchema = `-- =========================================================================
-- NEUROSHIELD POSTGRESQL PRODUCTION RELATIONAL SCHEMA
-- Stroke Patient Rehabilitation & Emergency Monitoring System
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    room_number VARCHAR(50),
    stroke_classification VARCHAR(100) NOT NULL, -- e.g. 'Ischemic (Left MCA)'
    stroke_on_set_timestamp TIMESTAMP WITH TIME ZONE,
    baseline_nihss_score SMALLINT CHECK (baseline_nihss_score BETWEEN 0 AND 42),
    affected_hemisphere VARCHAR(50) NOT NULL, -- 'Right Hemiparesis', 'Left Hemiparesis'
    ear_baseline_threshold NUMERIC(4, 3) DEFAULT 0.210,
    hydration_target_ml INTEGER DEFAULT 1800,
    primary_caregiver_id UUID,
    assigned_neurologist_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Admins & Caregivers Table
CREATE TABLE caregivers_and_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'NEUROLOGIST', 'PHYSIOTHERAPIST', 'NURSE', 'FAMILY_CAREGIVER')),
    full_name VARCHAR(200) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    fcm_push_token TEXT,
    on_duty_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Medical Documents & AI Analysis Table
CREATE TABLE medical_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    document_title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('DISCHARGE_SUMMARY', 'BRAIN_MRI_CT', 'NEURO_CONSULT', 'PRESCRIPTION')),
    file_storage_url TEXT NOT NULL,
    ocr_raw_text TEXT,
    ai_stroke_subtype VARCHAR(100),
    ai_extracted_nihss VARCHAR(50),
    ai_deficits_json JSONB,
    ai_medications_reconciliation JSONB,
    ai_rehab_protocol JSONB,
    ai_precautions JSONB,
    pubmed_citations JSONB,
    reviewed_by_clinician_id UUID REFERENCES caregivers_and_admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Daily Routines & Care Schedule Table
CREATE TABLE daily_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    scheduled_time TIME NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('MEDICATION', 'HYDRATION', 'MEAL', 'EXERCISE', 'VITALS', 'REST')),
    dosage_info VARCHAR(150),
    instructions TEXT,
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('CRITICAL', 'NORMAL')),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by_user_id UUID,
    audio_tts_prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Incident & Emergency Logs Table (EAR Triggers, Falls, SOS)
CREATE TABLE incident_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN ('EYE_BLINK_DISTRESS', 'PROLONGED_CLOSURE', 'FALL_DETECTED', 'MANUAL_SOS', 'MISSED_CRITICAL_MED')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM')),
    ear_reading NUMERIC(4, 3),
    blink_cadence_pattern VARCHAR(255),
    incident_location VARCHAR(200) NOT NULL,
    snapshot_evidence_url TEXT,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACKNOWLEDGED', 'DISPATCHED', 'RESOLVED', 'FALSE_ALARM')),
    acknowledged_by UUID REFERENCES caregivers_and_admins(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    triage_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_patients_active ON patients(is_active);
CREATE INDEX idx_routines_patient_time ON daily_routines(patient_id, scheduled_time);
CREATE INDEX idx_incidents_patient_status ON incident_logs(patient_id, status);
CREATE INDEX idx_incidents_created ON incident_logs(created_at DESC);
`;

  const nosqlSchema = `// =========================================================================
// NEUROSHIELD FIRESTORE / NOSQL DOCUMENT SCHEMAS
// Collection & Subcollection JSON Blueprint
// =========================================================================

// 1. Collection: "patients"
// Document ID: "pat_901"
{
  "id": "pat_901",
  "fullName": "Eleanor Vance",
  "dob": "1958-04-12",
  "gender": "Female",
  "roomNumber": "304-B",
  "strokeClassification": "Acute Ischemic Infarct (Left MCA Superior Division)",
  "baselineNihss": 8,
  "affectedHemisphere": "Right Hemiparesis",
  "earCalibration": {
    "baselineThreshold": 0.21,
    "rapidBlinkCountThreshold": 3,
    "prolongedClosureSeconds": 2.5
  },
  "hydration": {
    "goalMl": 1800,
    "currentMl": 750
  },
  "contacts": {
    "caregiverId": "cg_101",
    "caregiverName": "Thomas Vance",
    "caregiverPhone": "+1-555-234-8901",
    "emergencyStationChannel": "neuro-ward-south"
  },
  "createdAt": "2026-10-14T09:00:00Z"
}

// 2. Collection: "incidents"
// Document ID: "inc_78291"
{
  "id": "inc_78291",
  "patientId": "pat_901",
  "patientName": "Eleanor Vance",
  "type": "EYE_BLINK_DISTRESS",
  "severity": "CRITICAL",
  "earMetrics": {
    "earValue": 0.12,
    "pattern": "3 Rapid Blinks < 1.4s (EAR < 0.20)",
    "samplingFps": 30
  },
  "location": "Bedside Camera Stream - South Wing",
  "status": "PENDING", // "PENDING" | "ACKNOWLEDGED" | "DISPATCHED" | "RESOLVED"
  "dispatchedAt": "2026-10-14T09:52:10Z",
  "acknowledgedBy": null,
  "snapshotUrl": "https://storage.neuroshield.health/snapshots/inc_78291.jpg",
  "auditHistory": [
    {
      "timestamp": "2026-10-14T09:52:10Z",
      "action": "EAR_ALGORITHM_DISPATCH",
      "actor": "EdgeVisionDaemon"
    }
  ]
}

// 3. Collection: "patients/{patientId}/routines"
// Document ID: "rt_8001"
{
  "id": "rt_8001",
  "time": "08:00 AM",
  "category": "MEDICATION",
  "title": "Morning Stroke Prophylaxis",
  "dosage": "Clopidogrel 75mg + Aspirin 81mg",
  "priority": "CRITICAL",
  "isCompleted": true,
  "completedTimestamp": "2026-10-14T08:14:00Z",
  "audioReminderUrl": "https://neuroshield.health/tts/cache/rt_8001.wav"
}

// 4. Collection: "medical_documents"
// Document ID: "doc_552"
{
  "id": "doc_552",
  "patientId": "pat_901",
  "title": "Neurology Inpatient Discharge Summary",
  "strokeClassification": "Acute Ischemic Stroke (Left MCA)",
  "nihssScore": 8,
  "medications": [
    { "name": "Clopidogrel", "dosage": "75mg daily", "purpose": "Antiplatelet" },
    { "name": "Atorvastatin", "dosage": "80mg qHS", "purpose": "Plaque stabilization" }
  ],
  "rehabProtocols": [
    { "module": "Mirror Therapy", "frequency": "2x daily 15 mins", "pmid": "29999182" },
    { "module": "Lip Closure & Dysarthria Drills", "frequency": "3x daily 10 reps", "pmid": "32185412" }
  ]
}
`;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">
                Principal Software Architect & Lead Full-Stack Blueprint
              </h1>
              <p className="text-xs text-slate-400">
                Production-grade architectural specifications, PostgreSQL/Firestore schemas, and Python/OpenCV/MediaPipe EAR algorithms.
              </p>
            </div>
          </div>

          {/* Navigation Pills */}
          <div className="flex flex-wrap gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setActiveSection('architecture')}
              className={`py-2 px-3 rounded-xl font-bold transition-all ${
                activeSection === 'architecture' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              System Architecture
            </button>
            <button
              onClick={() => setActiveSection('schema')}
              className={`py-2 px-3 rounded-xl font-bold transition-all ${
                activeSection === 'schema' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Database Schemas
            </button>
            <button
              onClick={() => setActiveSection('python-ear')}
              className={`py-2 px-3 rounded-xl font-bold transition-all ${
                activeSection === 'python-ear' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Python / MediaPipe EAR
            </button>
            <button
              onClick={() => setActiveSection('wireframes')}
              className={`py-2 px-3 rounded-xl font-bold transition-all ${
                activeSection === 'wireframes' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mobile Wireframes & PIP
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: HIGH-LEVEL ARCHITECTURE */}
      {activeSection === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              High-Level End-to-End System Architecture
            </h2>

            {/* Interactive Architecture Flow Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              {/* Layer 1: Client Edge */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-[11px]">
                  <Smartphone className="w-4 h-4" /> Layer 1: Client Edge
                </div>
                <ul className="space-y-2 text-slate-300">
                  <li className="p-2 bg-slate-900 rounded border border-slate-700/60 font-semibold text-white">
                    Flutter / React Native Cross-Platform App
                  </li>
                  <li className="p-2 bg-slate-900 rounded border border-slate-700/60">
                    <strong>Persistent PIP Window:</strong> Native Android WindowManager / iOS PictureInPicture overlay.
                  </li>
                  <li className="p-2 bg-slate-900 rounded border border-slate-700/60">
                    <strong>Accessibility UI:</strong> Large 64px touch targets, WCAG AAA high contrast, voice guidance.
                  </li>
                </ul>
              </div>

              {/* Layer 2: Edge Vision */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[11px]">
                  <Eye className="w-4 h-4" /> Layer 2: Vision Pipeline
                </div>
                <ul className="space-y-2 text-slate-300">
                  <li className="p-2 bg-slate-900 rounded border border-slate-700/60 font-semibold text-white">
                    OpenCV + MediaPipe Face Mesh
                  </li>
                  <li className="p-2 bg-slate-900 rounded border border-slate-700/60">
                    <strong>EAR Euclidean Engine:</strong> 6 landmarks per eye @ 30 FPS.
                  </li>
                  <li className="p-2 bg-slate-900 rounded border border-slate-700/60">
                    <strong>Distress Classifier:</strong> 3 blinks &lt; 1.5s or prolonged closure &gt; 2.5s.
                  </li>
                </ul>
              </div>

              {/* Layer 3: Backend Services */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[11px]">
                  <Server className="w-4 h-4" /> Layer 3: Backend Orchestrator
                </div>
                <ul className="space-y-2 text-slate-300">
                  <li className="p-2 bg-slate-900 rounded border border-slate-700/60 font-semibold text-white">
                    Node.js Express / Python FastAPI
                  </li>
                  <li className="p-2 bg-slate-900 rounded border border-slate-700/60">
                    <strong>WebRTC / RTSP Relay:</strong> MediaMTX or go2rtc live camera streaming.
                  </li>
                  <li className="p-2 bg-slate-900 rounded border border-slate-700/60">
                    <strong>Real-time Message Bus:</strong> WebSockets / Firebase Cloud Messaging (FCM).
                  </li>
                </ul>
              </div>

              {/* Layer 4: Intelligence & Data */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-purple-400 font-bold uppercase text-[11px]">
                  <Sparkles className="w-4 h-4" /> Layer 4: AI & Knowledge
                </div>
                <ul className="space-y-2 text-slate-300">
                  <li className="p-2 bg-slate-900 rounded border border-slate-700/60 font-semibold text-white">
                    Gemini 3.8 / Gemini 4 Argon
                  </li>
                  <li className="p-2 bg-slate-900 rounded border border-slate-700/60">
                    <strong>Medical OCR & Parser:</strong> Discharge note analysis + drug interactions.
                  </li>
                  <li className="p-2 bg-slate-900 rounded border border-slate-700/60">
                    <strong>Science Grounding:</strong> PubMed E-Utilities & Cochrane stroke trials.
                  </li>
                </ul>
              </div>
            </div>

            {/* Technical Specifications Deep Dive */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-base font-bold text-white">Architectural Decision Records (ADRs)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                  <span className="font-bold text-cyan-400">1. Real-Time Camera PIP Overlay</span>
                  <p className="text-slate-300 leading-relaxed">
                    In native Flutter / React Native, persistent floating overlays require foreground service capabilities:
                    On Android, uses <code>SYSTEM_ALERT_WINDOW</code> with <code>WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY</code> to maintain floating preview while patient switches between exercise routines.
                    On iOS, utilizes <code>AVPictureInPictureController</code> with custom video source sample buffer renderer.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                  <span className="font-bold text-cyan-400">2. Low-Latency CCTV Streaming</span>
                  <p className="text-slate-300 leading-relaxed">
                    Home security RTSP feeds are transcoded via an edge gateway into low-latency WebRTC streams (&lt; 200ms latency). Caregivers view synchronized bedside feeds without buffering lag during emergency triage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: DATABASE SCHEMAS */}
      {activeSection === 'schema' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  Relational PostgreSQL Schema (Production DDL)
                </h2>
                <p className="text-xs text-slate-400">
                  Complete DDL covering Patients, Caregivers, Medical Documents, Daily Routines, and Incident Logs.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(sqlSchema, 'sql')}
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedCode === 'sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'sql' ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-96">
              {sqlSchema}
            </pre>
          </div>

          <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-400" />
                  NoSQL Firestore Document Schema (JSON Blueprint)
                </h2>
                <p className="text-xs text-slate-400">
                  Denormalized subcollection structure for real-time document sync and offline edge caching.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(nosqlSchema, 'nosql')}
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedCode === 'nosql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'nosql' ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto max-h-96">
              {nosqlSchema}
            </pre>
          </div>
        </div>
      )}

      {/* SECTION 3: PYTHON / OPENCV / MEDIAPIPE EAR ALGORITHM */}
      {activeSection === 'python-ear' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-cyan-400" />
                  Production Python / OpenCV / MediaPipe EAR Algorithm
                </h2>
                <p className="text-xs text-slate-400">
                  Euclidean Eye Aspect Ratio calculation, 6 landmarks per eye, temporal blink queue, distress pattern detector.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(pythonEarCode, 'python')}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg"
              >
                {copiedCode === 'python' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode === 'python' ? 'Copied Python Script!' : 'Copy Complete Python Code'}</span>
              </button>
            </div>

            <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700 text-xs space-y-1">
              <span className="font-bold text-cyan-300">Algorithm Highlights:</span>
              <p className="text-slate-300">
                1. <strong>Landmark Extraction:</strong> Samples indices [33, 160, 158, 133, 153, 144] for Left Eye and [362, 385, 387, 263, 373, 380] for Right Eye.
              </p>
              <p className="text-slate-300">
                2. <strong>Euclidean Formula:</strong> <code>EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)</code>
              </p>
              <p className="text-slate-300">
                3. <strong>Distress State Machine:</strong> Detects 3 rapid blinks within 1.5 seconds, or prolonged eye closure &gt; 2.5 seconds (Locked-In distress), instantly dispatching payload via HTTP POST / WebSocket.
              </p>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-[500px]">
              {pythonEarCode}
            </pre>
          </div>
        </div>
      )}

      {/* SECTION 4: MOBILE WIREFRAMES & PIP ARCHITECTURE */}
      {activeSection === 'wireframes' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              Core Component Hierarchy & Wireframe Layouts
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Patient App Structure */}
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  Patient Mobile Application Layout
                </h3>
                <div className="space-y-2 font-mono text-[11px] bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300">
                  <div>AppRoot</div>
                  <div className="pl-3">├── FloatingCameraPipOverlay (Top-Right Fixed)</div>
                  <div className="pl-6">│   ├── NativeCameraSurfaceView</div>
                  <div className="pl-6">│   ├── LandmarksCanvasDrawer</div>
                  <div className="pl-6">│   └── EarTelemetryBadge</div>
                  <div className="pl-3">├── AccessibleHeaderBanner</div>
                  <div className="pl-6">│   ├── PatientVitalsBadge</div>
                  <div className="pl-6">│   └── BigEmergencySosButton</div>
                  <div className="pl-3">├── OneTouchQuickNeedsGrid</div>
                  <div className="pl-3">├── NavigationTabBar</div>
                  <div className="pl-3">└── TabContainer</div>
                  <div className="pl-6">    ├── RehabilitationLibraryScreen</div>
                  <div className="pl-6">    ├── DailyRoutineTimelineScreen</div>
                  <div className="pl-6">    └── MedicalDocAiAnalyzerScreen</div>
                </div>
              </div>

              {/* Admin Console Structure */}
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-400" />
                  Admin & Caregiver Command Console Layout
                </h3>
                <div className="space-y-2 font-mono text-[11px] bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300">
                  <div>AdminStationRoot</div>
                  <div className="pl-3">├── TopAppBar</div>
                  <div className="pl-6">│   ├── ActiveIncidentCounterBadge</div>
                  <div className="pl-6">│   └── GlobalSirenAudioAlert</div>
                  <div className="pl-3">├── IncidentTriageFeed</div>
                  <div className="pl-6">│   ├── RealTimeAlertCards</div>
                  <div className="pl-6">│   ├── AcknowledgeAndDispatchActions</div>
                  <div className="pl-6">│   └── EmsEmergencyCallHook</div>
                  <div className="pl-3">├── MultiCamSurveillanceGrid</div>
                  <div className="pl-6">│   ├── WebRtcRtspPlayer</div>
                  <div className="pl-6">│   ├── FallRiskMeshTracker</div>
                  <div className="pl-6">│   └── DvrTimelinePlaybackScrubber</div>
                  <div className="pl-3">└── PatientManagementConsole</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
