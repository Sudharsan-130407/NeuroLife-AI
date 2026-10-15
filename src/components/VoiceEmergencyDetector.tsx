import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  AlertTriangle,
  Volume2,
  Sparkles,
  ShieldAlert,
  Radio,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { dispatchEmergency, speakText } from '../services/api';

interface VoiceEmergencyDetectorProps {
  patientId?: string;
  patientName?: string;
  room?: string;
  targetAdminId?: string;
  targetAdminName?: string;
  onEmergencyTriggered?: (keyword: string, transcript: string) => void;
  highContrast?: boolean;
}

export const VoiceEmergencyDetector: React.FC<VoiceEmergencyDetectorProps> = ({
  patientId = 'pat-901',
  patientName = 'Eleanor Vance',
  room = '304-B',
  targetAdminId = 'ADM-8801',
  targetAdminName = 'Dr. Sophia Martinez, MD',
  onEmergencyTriggered,
  highContrast = false,
}) => {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(true);
  const [transcript, setTranscript] = useState<string>('');
  const [lastTriggerKeyword, setLastTriggerKeyword] = useState<string | null>(null);
  const [isTriggered, setIsTriggered] = useState<boolean>(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);
  const cooldownRef = useRef<boolean>(false);

  // Emergency keywords to watch for
  const EMERGENCY_KEYWORDS = [
    'emergency',
    'help',
    'help me',
    'sos',
    'call 911',
    'nurse',
    'assistance',
    'fall',
    'i fell',
  ];

  // Dispatch SOS trigger
  const triggerSos = useCallback(
    async (detectedKeyword: string, fullTranscript: string) => {
      if (cooldownRef.current) return;
      cooldownRef.current = true;
      setIsTriggered(true);
      setLastTriggerKeyword(detectedKeyword);

      // Auditory confirmation
      speakText(`Voice emergency recognized: "${detectedKeyword}". Dispatching caregiver and emergency services immediately!`);

      // Haptic feedback if supported
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([400, 200, 400]);
        } catch (_) {}
      }

      // Backend emergency dispatch
      await dispatchEmergency({
        patientId,
        patientName,
        type: 'VOICE_SOS',
        severity: 'CRITICAL',
        location: `Patient Bedside - Room ${room} (Voice STT Match: "${detectedKeyword}")`,
        targetAdminId: targetAdminId || 'ADM-8801',
        targetAdminName: targetAdminName || 'Dr. Sophia Martinez, MD',
      });

      if (onEmergencyTriggered) {
        onEmergencyTriggered(detectedKeyword, fullTranscript);
      }

      // Reset cooldown after 8 seconds to prevent duplicate spam
      setTimeout(() => {
        cooldownRef.current = false;
        setIsTriggered(false);
      }, 8000);
    },
    [patientId, patientName, room, onEmergencyTriggered]
  );

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech Recognition API is not supported in this browser.');
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setMicPermissionDenied(false);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }

        const normalized = currentTranscript.trim().toLowerCase();
        setTranscript(normalized);

        // Check if any emergency keyword is present
        for (const kw of EMERGENCY_KEYWORDS) {
          // Exact or word boundary match
          const regex = new RegExp(`\\b${kw}\\b`, 'i');
          if (regex.test(normalized)) {
            triggerSos(kw.toUpperCase(), normalized);
            break;
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setMicPermissionDenied(true);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Automatically restart listening if still enabled (browser may drop stream after silence)
        if (isListening && !isManuallyStoppedRef.current) {
          try {
            recognition.start();
          } catch (_) {}
        }
      };

      recognitionRef.current = recognition;

      if (isListening) {
        try {
          recognition.start();
        } catch (err) {
          console.warn('Could not auto-start speech recognition:', err);
        }
      }
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsSupported(false);
    }

    return () => {
      isManuallyStoppedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [triggerSos]);

  // Toggle listening state
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      isManuallyStoppedRef.current = true;
      setIsListening(false);
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      speakText('Voice emergency monitoring paused.');
    } else {
      isManuallyStoppedRef.current = false;
      setIsListening(true);
      try {
        recognitionRef.current.start();
        speakText('Voice emergency monitoring active. Listening for emergency or help.');
      } catch (_) {}
    }
  };

  // Simulation test triggers (vital for environments where mic is blocked or muted)
  const simulateVoiceInput = (keyword: string) => {
    setTranscript(`Simulated speech input: "${keyword}!"`);
    triggerSos(keyword.toUpperCase(), `I need ${keyword}!`);
  };

  return (
    <div
      className={`rounded-2xl border p-4 transition-all shadow-lg ${
        isTriggered
          ? 'bg-red-950/90 border-red-500 ring-2 ring-red-500/50 text-white animate-pulse'
          : highContrast
          ? 'bg-black border-yellow-400 text-yellow-300'
          : 'bg-slate-900/90 border-cyan-500/30 text-slate-100'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Indicator & Status */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isTriggered
                ? 'bg-red-600 text-white animate-bounce'
                : isListening
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {isListening ? (
              <Mic className="w-5 h-5 animate-pulse" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                Hands-Free Voice SOS Guard
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isTriggered
                    ? 'bg-red-600 text-white'
                    : isListening
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isTriggered
                  ? 'SOS DISPATCHED!'
                  : isListening
                  ? 'LISTENING'
                  : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Say <strong className="text-white underline">"Help"</strong>,{' '}
              <strong className="text-white underline">"Emergency"</strong>, or{' '}
              <strong className="text-white underline">"SOS"</strong> to trigger distress dispatch without touching the screen.
            </p>
          </div>
        </div>

        {/* Right: Quick Action Controls & Simulator */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick simulation test buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => simulateVoiceInput('Help')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow transition-all active:scale-95"
              title="Test triggering SOS with voice simulation 'Help'"
            >
              <Sparkles className="w-3 h-3" />
              <span>Say "Help!"</span>
            </button>

            <button
              onClick={() => simulateVoiceInput('Emergency')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs flex items-center gap-1 shadow transition-all active:scale-95"
              title="Test triggering SOS with voice simulation 'Emergency'"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Say "Emergency!"</span>
            </button>
          </div>

          {/* Toggle mic listening */}
          <button
            onClick={toggleListening}
            className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              isListening
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
            }`}
            title={isListening ? 'Mute voice detection' : 'Enable voice detection'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="hidden md:inline">{isListening ? 'Mute' : 'Listen'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Transcript & Keyword Indicator */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="text-slate-400 font-mono text-[11px] shrink-0">Live Audio Stream:</span>
          <span className="text-cyan-300 font-mono italic truncate max-w-md">
            {transcript ? `"${transcript}"` : 'Listening for vocal distress...'}
          </span>
        </div>

        {lastTriggerKeyword && isTriggered && (
          <div className="flex items-center gap-1.5 font-bold text-red-400 bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-500/40 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>Keyword Triggered: "{lastTriggerKeyword}"</span>
          </div>
        )}

        {micPermissionDenied && (
          <span className="text-amber-400 text-[11px]">
            Mic permission blocked. Use test buttons above to simulate speech.
          </span>
        )}
      </div>
    </div>
  );
};
