import React, { useState } from 'react';
import {
  Activity,
  Heart,
  Droplet,
  Pill,
  CheckCircle,
  Clock,
  Volume2,
  FileText,
  Upload,
  Play,
  Award,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  BookOpen,
  Calendar,
  Utensils,
  ExternalLink,
  RefreshCw,
  Eye,
  Sliders,
  Check,
  Video,
} from 'lucide-react';
import { PatientProfile, RoutineItem, ExerciseItem, MedicalAnalysisResult } from '../types';
import { analyzeMedicalDocument, speakText } from '../services/api';
import { HydrationTracker } from './HydrationTracker';
import { VoiceEmergencyDetector } from './VoiceEmergencyDetector';
import { HomeNearCctvModule } from './HomeNearCctvModule';

interface PatientViewProps {
  patient: PatientProfile;
  highContrast: boolean;
  onEmergencyClick: () => void;
  targetAdminId?: string;
  targetAdminName?: string;
}

export const PatientView: React.FC<PatientViewProps> = ({
  patient,
  highContrast,
  onEmergencyClick,
  targetAdminId = 'ADM-8801',
  targetAdminName = 'Dr. Sophia Martinez, MD',
}) => {
  const [activeTab, setActiveTab] = useState<'rehab' | 'routine' | 'hydration' | 'medical-ai' | 'vitals' | 'cctv'>('rehab');

  // Daily Routine items state
  const [routines, setRoutines] = useState<RoutineItem[]>([
    {
      id: 'rt-1',
      time: '08:00 AM',
      title: 'Morning Stroke Medications',
      category: 'MEDICATION',
      dosage: 'Clopidogrel 75mg + Aspirin 81mg + Amlodipine 5mg',
      description: 'Take with full glass of water after light breakfast.',
      completed: true,
      priority: 'CRITICAL',
      audioPrompt: 'Time for your morning stroke medications. Take with water.',
    },
    {
      id: 'rt-2',
      time: '09:30 AM',
      title: 'Hydration Target (+250ml)',
      category: 'HYDRATION',
      description: 'Slow sips with chin-tuck posture to prevent aspiration.',
      completed: true,
      priority: 'NORMAL',
      audioPrompt: 'Hydration check. Please take 250 milliliters of water.',
    },
    {
      id: 'rt-3',
      time: '11:00 AM',
      title: 'Upper Limb Mirror Therapy',
      category: 'EXERCISE',
      description: '15-minute mirror box wrist & finger extension drills.',
      completed: false,
      priority: 'CRITICAL',
      audioPrompt: 'Time for mirror therapy to stimulate arm neuroplasticity.',
    },
    {
      id: 'rt-4',
      time: '01:00 PM',
      title: 'Dysphagia Lunch & Posture',
      category: 'MEAL',
      description: 'Level 4 pureed / minced soft diet. Upright 90 degree seating.',
      completed: false,
      priority: 'NORMAL',
    },
    {
      id: 'rt-5',
      time: '03:30 PM',
      title: 'Vitals & BP Logging',
      category: 'VITALS',
      description: 'Record resting blood pressure, pulse, and facial symmetry test.',
      completed: false,
      priority: 'CRITICAL',
    },
    {
      id: 'rt-6',
      time: '08:30 PM',
      title: 'Night Statin Medication',
      category: 'MEDICATION',
      dosage: 'Atorvastatin 80mg',
      description: 'Nightly plaque stabilization and LDL reduction.',
      completed: false,
      priority: 'CRITICAL',
    },
  ]);

  // Hydration tracking
  const [hydrationMl, setHydrationMl] = useState<number>(patient.hydrationCurrentMl || 750);
  const hydrationGoal = patient.hydrationGoalMl || 1800;

  const addHydration = (amount: number) => {
    const updated = hydrationMl + amount;
    setHydrationMl(updated);
    speakText(`Logged ${amount} milliliters of water. Daily total is ${updated} of ${hydrationGoal} milliliters.`);
  };

  // Rehabilitation exercises
  const [exercises, setExercises] = useState<ExerciseItem[]>([
    {
      id: 'ex-1',
      title: 'Mirror Therapy (Hemiparetic Arm)',
      category: 'MIRROR_THERAPY',
      targetMuscle: 'Contralateral Motor Cortex Reorganization',
      durationMinutes: 15,
      targetReps: 20,
      description:
        'Place affected hand behind the vertical mirror. Move the healthy hand while looking into the mirror reflection, tricking the brain into firing motor pathways in the affected hemisphere.',
      steps: [
        'Position mirror vertically along body midline between arms.',
        'Look solely at the mirror reflection of your healthy moving hand.',
        'Synchronously attempt to mimic wrist flexion and finger spread on the affected side.',
        'Breathe calmly and repeat 20 slow cycles.',
      ],
      clinicalEvidence:
        'Cochrane systematic reviews (PMID: 29999182) demonstrate moderate-quality evidence for mirror therapy significantly improving upper extremity motor function and activities of daily living.',
      pmidReference: '29999182',
      completedToday: false,
    },
    {
      id: 'ex-2',
      title: 'Paretic Hand Grasp & Cup Release',
      category: 'UPPER_LIMB',
      targetMuscle: 'Flexor Digitorum & Extensor Digitorum Communis',
      durationMinutes: 10,
      targetReps: 15,
      description:
        'Functional task training: grasping a lightweight plastic cup, lifting 2 inches off table surface, and controlled release without spastic clamping.',
      steps: [
        'Rest forearm on table in neutral pronation.',
        'Open fingers gradually, utilizing gravity if spasticity is present.',
        'Close hand around lightweight cup, lift 2 inches, hold 3 seconds.',
        'Gently lower and release grip completely.',
      ],
      clinicalEvidence:
        'Task-oriented training enhances cortical representation of distal extremities via repetitive goal-directed sensory feedback.',
      pmidReference: '31057423',
      completedToday: true,
    },
    {
      id: 'ex-3',
      title: 'Facial Symmetry & Speech Lip Seal',
      category: 'FACIAL_SPEECH',
      targetMuscle: 'Orbicularis Oris & Zygomaticus Major (Cranial Nerve VII)',
      durationMinutes: 8,
      targetReps: 12,
      description:
        'Targeting post-stroke facial droop and dysarthric articulation. Tight lip pursing, wide symmetric smiles, and vocalized vowel sounds.',
      steps: [
        'Look into front camera or mirror to monitor bilateral symmetry.',
        'Smile widely, attempting to raise the affected mouth corner symmetrically.',
        'Pucker lips tightly into an "O" shape for 5 seconds.',
        'Pronounce: "PA-TA-KA" rapidly 5 times to stimulate cerebellar timing.',
      ],
      clinicalEvidence:
        'Neuromuscular facial re-education prevents muscle atrophy and accelerates recovery of speech articulation and oral feeding competence.',
      pmidReference: '32185412',
      completedToday: false,
    },
    {
      id: 'ex-4',
      title: 'Seated Ankle Dorsiflexion & Heel Pumps',
      category: 'MOBILITY',
      targetMuscle: 'Tibialis Anterior & Deep Vein Thrombosis Prophylaxis',
      durationMinutes: 10,
      targetReps: 25,
      description:
        'Seated ankle pumps to counter drop-foot gait pattern, rebuild lower motor unit recruitment, and stimulate calf venous return pump.',
      steps: [
        'Sit tall with knees bent at 90 degrees and feet flat on floor.',
        'Pull toes upward toward shin while keeping heels planted.',
        'Hold for 2 seconds at peak dorsiflexion, then press toes down.',
        'Perform 25 fluid pumps on the affected leg.',
      ],
      clinicalEvidence:
        'Reduces foot drop severity, restores heel-strike phase of hemiparetic gait, and lowers thromboembolism risk in subacute rehabilitation.',
      pmidReference: '28742819',
      completedToday: false,
    },
  ]);

  // Active exercise practice player
  const [activeExercise, setActiveExercise] = useState<ExerciseItem | null>(null);
  const [currentReps, setCurrentReps] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  const startExercise = (ex: ExerciseItem) => {
    setActiveExercise(ex);
    setCurrentReps(0);
    setTimerSeconds(ex.durationMinutes * 60);
    setIsTimerRunning(true);
    speakText(`Starting ${ex.title}. ${ex.steps[0]}`);
  };

  const handleNextRep = () => {
    if (!activeExercise) return;
    const next = currentReps + 1;
    setCurrentReps(next);
    if (next >= activeExercise.targetReps) {
      speakText(`Congratulations! You completed ${activeExercise.targetReps} repetitions of ${activeExercise.title}. Excellent neuroplastic recovery progress!`);
      // Mark as completed
      setExercises((prev) =>
        prev.map((e) => (e.id === activeExercise.id ? { ...e, completedToday: true } : e))
      );
    } else if (next % 5 === 0) {
      speakText(`${next} repetitions completed. Keep going!`);
    }
  };

  // Medical Document AI Analyzer state
  const [documentInput, setDocumentInput] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<MedicalAnalysisResult | null>(null);

  const sampleDischargeNotes = `PATIENT HOSPITAL DISCHARGE SUMMARY
Patient: Eleanor Vance | Age: 68 | Female
Admission Diagnosis: Acute Left MCA Ischemic Infarct (Superior Division).
Baseline NIHSS: 8 on presentation (Dysarthria 1, Right Facial Palsy 1, Right Arm Motor 2, Right Leg Motor 1, Sensory 1, Language 1).
Interventions: IV Alteplase (tPA) administered within 2.8 hours. NIHSS reduced from 12 to 8.
Current Status: Residual right hemiparesis (arm weakness > leg), mild expressive aphasia, right-sided facial weakness.
Discharge Medications:
1. Clopidogrel 75mg PO daily (Antiplatelet)
2. Aspirin 81mg PO daily (DAPT for 21 days)
3. Atorvastatin 80mg PO qHS (Plaque stabilization)
4. Amlodipine 5mg PO daily (BP target < 130/80)
Rehabilitation Orders: Daily Upper Extremity Mirror Therapy, Speech/Lip closure drills, Fall precaution, Hydration monitoring (chin tuck swallow).`;

  const handleAnalyzeDocument = async (textToAnalyze?: string) => {
    const text = textToAnalyze || documentInput;
    if (!text.trim()) {
      alert('Please enter or paste medical notes first.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await analyzeMedicalDocument({ documentText: text });
      if (res.analysis) {
        setAnalysisResult(res.analysis);
        speakText('Medical document analysis complete. Stroke care recommendations and medication schedule generated.');
      }
    } catch (err: any) {
      console.error('Doc analysis error:', err);
      alert('Could not complete document analysis: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Quick 1-touch Needs Buttons for stroke patients with speech/motor impairment
  const quickNeeds = [
    { label: 'Need Water', text: 'Patient needs a cup of water with chin-tuck assistance.', icon: Droplet, color: 'bg-cyan-600 hover:bg-cyan-500' },
    { label: 'Use Restroom', text: 'Assistance requested for transfer to restroom.', icon: Heart, color: 'bg-amber-600 hover:bg-amber-500' },
    { label: 'Pain Alert', text: 'Patient is experiencing physical discomfort or headache.', icon: AlertTriangle, color: 'bg-rose-600 hover:bg-rose-500' },
    { label: 'Adjust Seating', text: 'Patient needs repositioning or wheelchair adjustment.', icon: RefreshCw, color: 'bg-purple-600 hover:bg-purple-500' },
  ];

  const handleQuickNeedClick = (need: typeof quickNeeds[0]) => {
    speakText(`Alert: ${need.text}`);
    alert(`Caregiver notified: "${need.label}"`);
  };

  const toggleRoutineItem = (id: string) => {
    setRoutines((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = !r.completed;
          if (updated) speakText(`Completed: ${r.title}`);
          return { ...r, completed: updated };
        }
        return r;
      })
    );
  };

  return (
    <div className={`space-y-6 ${highContrast ? 'text-yellow-300' : 'text-slate-100'}`}>
      {/* Patient Header Banner */}
      <div
        className={`rounded-3xl p-6 border transition-all shadow-xl ${
          highContrast
            ? 'bg-black border-yellow-400 text-yellow-300'
            : 'bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-cyan-500/30'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg border border-cyan-400/40">
              EV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {patient.name}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Room {patient.room}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                <span>{patient.strokeType}</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">{patient.affectedSide}</span>
                <span>•</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-xs">
                  NIHSS Score: {patient.nihssScore}
                </span>
                <span>•</span>
                <button
                  onClick={() => setActiveTab('hydration')}
                  className="font-mono bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Open Hydration Tracker"
                >
                  <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Hydration: {hydrationMl} / 1800 ml ({Math.min(100, Math.round((hydrationMl / hydrationGoal) * 100))}%)</span>
                </button>
              </p>
            </div>
          </div>

          {/* Big Tactile SOS Distress Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onEmergencyClick}
              className={`px-6 py-4 rounded-2xl font-black text-base md:text-lg flex items-center gap-3 shadow-2xl transition-all active:scale-95 ${
                highContrast
                  ? 'bg-yellow-400 text-black border-4 border-yellow-300 animate-pulse'
                  : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white border border-red-400/50 shadow-red-900/40'
              }`}
            >
              <ShieldAlert className="w-7 h-7" />
              <span>EMERGENCY SOS</span>
            </button>
          </div>
        </div>

        {/* 1-Touch Quick Needs Grid for non-verbal or motor impaired stroke patients */}
        <div className="mt-5 pt-5 border-t border-slate-800/80">
          <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            1-Touch Quick Caregiver Signals (Large Touch Targets)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickNeeds.map((need, i) => (
              <button
                key={i}
                onClick={() => handleQuickNeedClick(need)}
                className={`p-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 min-h-[60px] ${need.color}`}
              >
                <need.icon className="w-5 h-5 shrink-0" />
                <span>{need.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hands-Free Voice Emergency STT Detector (Speech Recognition for 'Emergency' / 'Help') */}
      <VoiceEmergencyDetector
        patientId={patient.id}
        patientName={patient.name}
        room={patient.room}
        targetAdminId={targetAdminId}
        targetAdminName={targetAdminName}
        highContrast={highContrast}
        onEmergencyTriggered={(keyword, transcript) => {
          console.log(`Voice SOS triggered with keyword "${keyword}" from transcript "${transcript}" to Admin ID: ${targetAdminId}`);
          onEmergencyClick();
        }}
      />

      {/* Primary Navigation Tabs with Large Touch Targets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('rehab')}
          className={`py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'rehab'
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Rehab</span>
        </button>
        <button
          onClick={() => setActiveTab('routine')}
          className={`py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'routine'
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Routine</span>
        </button>
        <button
          onClick={() => setActiveTab('hydration')}
          className={`py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'hydration'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg ring-1 ring-cyan-400/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Droplet className="w-4 h-4 text-cyan-300" />
          <span>Hydration</span>
        </button>
        <button
          onClick={() => setActiveTab('cctv')}
          className={`py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'cctv'
              ? 'bg-indigo-600 text-white shadow-lg ring-1 ring-indigo-400/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Video className="w-4 h-4 text-indigo-300" />
          <span>Home & Near Cams</span>
        </button>
        <button
          onClick={() => setActiveTab('medical-ai')}
          className={`py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'medical-ai'
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Medical AI</span>
        </button>
        <button
          onClick={() => setActiveTab('vitals')}
          className={`py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'vitals'
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Vitals</span>
        </button>
      </div>

      {/* TAB 1: REHABILITATION LIBRARY */}
      {activeTab === 'rehab' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Evidence-Based Stroke Rehabilitation Drills
              </h2>
              <p className="text-xs text-slate-400">
                Grounded in neuroplasticity clinical trials (PubMed / Cochrane guidelines)
              </p>
            </div>
            <button
              onClick={() => speakText('Welcome to your stroke rehabilitation library. Select an exercise to begin your motor recovery session.')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-400 border border-slate-700"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Voice Guide</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercises.map((ex) => (
              <div
                key={ex.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  ex.completedToday
                    ? 'bg-slate-900/60 border-emerald-500/40 ring-1 ring-emerald-500/20'
                    : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {ex.category.replace('_', ' ')}
                    </span>
                    {ex.completedToday && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Completed Today
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white">{ex.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{ex.description}</p>

                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-xs space-y-1">
                    <p className="text-slate-400">
                      <strong className="text-slate-200">Target:</strong> {ex.targetMuscle}
                    </p>
                    <p className="text-[11px] text-cyan-400">
                      {ex.durationMinutes} mins • {ex.targetReps} Repetitions
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-400 italic bg-black/30 p-2 rounded border-l-2 border-cyan-500">
                    "{ex.clinicalEvidence}" (PMID: {ex.pmidReference})
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-800 flex gap-2">
                  <button
                    onClick={() => startExercise(ex)}
                    className="flex-1 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Practice</span>
                  </button>
                  <button
                    onClick={() => speakText(`${ex.title}. ${ex.description}`)}
                    title="Read instructions aloud"
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Active Exercise Interactive Modal Player */}
          {activeExercise && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
              <div className="max-w-xl w-full bg-slate-900 border-2 border-cyan-500 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      Active Neuro-Rehab Session
                    </span>
                    <h3 className="text-xl font-black text-white">{activeExercise.title}</h3>
                  </div>
                  <button
                    onClick={() => setActiveExercise(null)}
                    className="text-slate-400 hover:text-white p-2"
                  >
                    ✕
                  </button>
                </div>

                {/* Big Repetition Counter for Stroke Motor Retraining */}
                <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 text-center space-y-2">
                  <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    Completed Repetitions
                  </p>
                  <div className="text-6xl font-black font-mono text-cyan-400">
                    {currentReps} <span className="text-2xl text-slate-500">/ {activeExercise.targetReps}</span>
                  </div>

                  <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (currentReps / activeExercise.targetReps) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Step Instructions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400">Step-By-Step Guidance</h4>
                  <div className="space-y-2">
                    {activeExercise.steps.map((st, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-xl text-xs text-slate-200 border border-slate-700/60"
                      >
                        <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-300 flex items-center justify-center font-bold shrink-0">
                          {i + 1}
                        </span>
                        <p>{st}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Big Tactile Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleNextRep}
                    className="py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg flex items-center justify-center gap-2 shadow-xl active:scale-95"
                  >
                    <Check className="w-6 h-6" />
                    <span>+1 REPETITION</span>
                  </button>
                  <button
                    onClick={() => speakText(`You are on step one. ${activeExercise.steps[0]}`)}
                    className="py-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-base flex items-center justify-center gap-2 border border-slate-700 active:scale-95"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>Voice Prompt</span>
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActiveExercise(null)}
                    className="text-xs text-slate-400 hover:text-slate-200 underline"
                  >
                    Finish Session & Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DAILY ROUTINE & HEALTH LOG */}
      {activeTab === 'routine' && (
        <div className="space-y-6">
          {/* Dedicated Hydration Tracking Component */}
          <HydrationTracker
            currentMl={hydrationMl}
            goalMl={hydrationGoal}
            onUpdate={setHydrationMl}
            highContrast={highContrast}
          />

          {/* Schedule Checklist */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Today's Care Schedule
            </h3>

            <div className="space-y-2">
              {routines.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleRoutineItem(item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    item.completed
                      ? 'bg-slate-900/40 border-emerald-500/30 text-slate-400'
                      : item.priority === 'CRITICAL'
                      ? 'bg-slate-900/90 border-cyan-500/40 shadow-md'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        item.completed
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400'
                          : 'border-slate-600 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          {item.time}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.category}
                        </span>
                        {item.priority === 'CRITICAL' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            REQUIRED
                          </span>
                        )}
                      </div>
                      <h4
                        className={`text-base font-bold mt-0.5 ${
                          item.completed ? 'line-through text-slate-500' : 'text-white'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {item.dosage && (
                        <p className="text-xs text-amber-300 font-mono mt-0.5">{item.dosage}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(`${item.title}. ${item.description}`);
                    }}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEDICATED HYDRATION TRACKING (1800 ML GOAL) */}
      {activeTab === 'hydration' && (
        <div className="space-y-6">
          <HydrationTracker
            currentMl={hydrationMl}
            goalMl={hydrationGoal}
            onUpdate={setHydrationMl}
            highContrast={highContrast}
          />

          {/* Clinical Hydration & Dysphagia Schedule */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Droplet className="w-5 h-5 text-cyan-400" />
              Clinical Stroke Hydration Schedule & Aspiration Safety
            </h3>
            <p className="text-xs text-slate-400">
              Optimal daily timing recommended by Stroke Rehabilitation Guidelines to maintain cerebral blood flow and prevent deep vein thrombosis:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <span className="font-bold text-cyan-300">08:00 AM - Morning Wakeup</span>
                <p className="text-slate-300">300 ml with morning antiplatelet medications.</p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <span className="font-bold text-cyan-300">11:00 AM - Post-Rehab</span>
                <p className="text-slate-300">450 ml before & after mirror therapy session.</p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <span className="font-bold text-cyan-300">03:00 PM - Mid-Afternoon</span>
                <p className="text-slate-300">600 ml paced intake with chin-tuck swallows.</p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <span className="font-bold text-cyan-300">07:00 PM - Evening Taper</span>
                <p className="text-slate-300">450 ml finishing before 8:00 PM to minimize night bathroom trips.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MEDICAL DOCUMENT AI ANALYZER */}
      {activeTab === 'medical-ai' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Medical Document AI Analyzer (Gemini + Science Grounding)
                </h3>
                <p className="text-xs text-slate-400">
                  Upload or paste hospital discharge summaries, brain MRI notes, or prescriptions.
                </p>
              </div>
            </div>

            <textarea
              rows={5}
              value={documentInput}
              onChange={(e) => setDocumentInput(e.target.value)}
              placeholder="Paste discharge summary or clinical notes here..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleAnalyzeDocument()}
                disabled={isAnalyzing}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Clinical Record...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Clinical Analysis</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setDocumentInput(sampleDischargeNotes);
                  handleAnalyzeDocument(sampleDischargeNotes);
                }}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700"
              >
                Load Sample Stroke Record
              </button>
            </div>
          </div>

          {/* Analysis Results Display */}
          {analysisResult && (
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-cyan-500/40 shadow-2xl space-y-5 animate-in fade-in">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    Clinical AI Extraction Result
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    {analysisResult.patientName} • {analysisResult.strokeClassification}
                  </h3>
                </div>
                <button
                  onClick={() =>
                    speakText(
                      `Stroke analysis for ${analysisResult.patientName}. Baseline score: ${analysisResult.nihssScore}. Primary recommendation is mirror therapy and strict medication compliance.`
                    )
                  }
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 flex items-center gap-1.5 text-xs"
                >
                  <Volume2 className="w-4 h-4" />
                  Read Summary
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-400">Identified Deficits</h4>
                  <ul className="space-y-1.5">
                    {analysisResult.keyDeficits?.map((def, i) => (
                      <li
                        key={i}
                        className="text-xs text-slate-200 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                        {def}
                      </li>
                    ))}
                  </ul>

                  <h4 className="text-xs font-bold uppercase text-slate-400 pt-2">
                    Critical Precautions
                  </h4>
                  <ul className="space-y-1.5">
                    {analysisResult.precautions?.map((prec, i) => (
                      <li
                        key={i}
                        className="text-xs text-amber-200 bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/30 flex items-center gap-2"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        {prec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-400">
                    Medication Reconciliation
                  </h4>
                  <div className="space-y-1.5">
                    {analysisResult.medications?.map((med, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 text-xs"
                      >
                        <div className="flex justify-between font-bold text-white">
                          <span>{med.name}</span>
                          <span className="text-cyan-400 font-mono">{med.dosage}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{med.purpose}</p>
                      </div>
                    ))}
                  </div>

                  <h4 className="text-xs font-bold uppercase text-slate-400 pt-2">
                    Evidence-Based Neuro-Rehab Guidelines (PubMed Grounded)
                  </h4>
                  <div className="space-y-1.5">
                    {analysisResult.rehabilitationProtocol?.map((proto, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700 text-xs"
                      >
                        <div className="font-bold text-cyan-300">{proto.module}</div>
                        <p className="text-[11px] text-slate-300">{proto.frequency}</p>
                        <p className="text-[10px] text-slate-400 italic mt-0.5">
                          {proto.clinicalRationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: HEALTH & VITALS */}
      {activeTab === 'vitals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">Resting Blood Pressure</span>
              <p className="text-3xl font-mono font-black text-emerald-400">124 / 78</p>
              <p className="text-[11px] text-slate-500">Target &lt; 130/80 mmHg (Normal)</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">Resting Heart Rate</span>
              <p className="text-3xl font-mono font-black text-cyan-400">72 bpm</p>
              <p className="text-[11px] text-slate-500">Sinus rhythm verified</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">Oxygen Saturation (SpO2)</span>
              <p className="text-3xl font-mono font-black text-indigo-400">98%</p>
              <p className="text-[11px] text-slate-500">Room air</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              FAST Stroke Recurrence Warning Signs Check
            </h3>
            <p className="text-xs text-slate-400">
              Daily rapid assessment for transient ischemic attack (TIA) or stroke progression:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                <span className="font-bold text-cyan-400">F - Face Drooping</span>
                <p className="text-slate-300 mt-1">Check smile symmetry against baseline right droop.</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                <span className="font-bold text-cyan-400">A - Arm Weakness</span>
                <p className="text-slate-300 mt-1">Can both arms be lifted for 10 seconds without drift?</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                <span className="font-bold text-cyan-400">S - Speech Difficulty</span>
                <p className="text-slate-300 mt-1">Pronounce "The sky is blue in Cincinnati".</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                <span className="font-bold text-rose-400">T - Time to Call 911</span>
                <p className="text-slate-300 mt-1">Immediate distress dispatch if acute change occurs.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: HOME & NEAR CCTV CAMERAS (Accessible by IP Address) */}
      {activeTab === 'cctv' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/40 border border-indigo-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-300" />
              <span className="text-slate-300">
                <strong className="text-white">Patient Bedside & Home Security:</strong> Check your room, living room, and nearby entrance/corridor IP cameras from bed without walking.
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-200 border border-cyan-400/30">
              IP CAMERA READY
            </span>
          </div>

          <HomeNearCctvModule
            isAdminView={false}
            targetAdminId={targetAdminId}
            targetAdminName={targetAdminName}
          />
        </div>
      )}
    </div>
  );
};
