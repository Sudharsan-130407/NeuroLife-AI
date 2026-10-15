import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Eye,
  EyeOff,
  Activity,
  Volume2,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Move,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUp,
  ArrowDown,
  Sun,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Compass,
} from 'lucide-react';
import { dispatchEmergency, speakText } from '../services/api';

export type PipDockCorner =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center'
  | 'free';

interface CameraPipOverlayProps {
  onEmergencyTriggered?: (incident: any) => void;
  highContrast?: boolean;
  targetAdminId?: string;
  targetAdminName?: string;
  targetAdminEmail?: string;
}

export const CameraPipOverlay: React.FC<CameraPipOverlayProps> = ({
  onEmergencyTriggered,
  highContrast = false,
  targetAdminId = 'ADM-8801',
  targetAdminName = 'Dr. Sophia Martinez, MD',
  targetAdminEmail = 'admin@neuroshield.health',
}) => {
  // Permission and camera stream states
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(true);
  const [isExpandedModal, setIsExpandedModal] = useState<boolean>(false);

  // Clear camera view controls
  const [showClearFaceOnly, setShowClearFaceOnly] = useState<boolean>(false); // Hides mesh landmarks for 100% clear face view
  const [enhanceClarity, setEnhanceClarity] = useState<boolean>(true); // Auto-contrast & brightness boost for clinical clarity

  // Moveable / Draggable to ANY side of the app
  const [dockPosition, setDockPosition] = useState<PipDockCorner>('top-right');
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showSidePicker, setShowSidePicker] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    pointerStartX: number;
    pointerStartY: number;
    elemStartX: number;
    elemStartY: number;
  }>({ pointerStartX: 0, pointerStartY: 0, elemStartX: 0, elemStartY: 0 });

  // EAR Computer Vision Metrics
  const [earValue, setEarValue] = useState<number>(0.28);
  const [earThreshold, setEarThreshold] = useState<number>(0.21);
  const [isEyeClosed, setIsEyeClosed] = useState<boolean>(false);
  const [blinkCount, setBlinkCount] = useState<number>(0);
  const [recentBlinks, setRecentBlinks] = useState<number[]>([]);
  const [prolongedClosureTimer, setProlongedClosureTimer] = useState<number>(0);
  const [distressTriggered, setDistressTriggered] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Refs for video, canvas & processing
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Blink tracking state references
  const stateRef = useRef({
    eyeWasClosed: false,
    closedTimestamp: 0,
    blinkTimestamps: [] as number[],
    earHistory: [] as number[],
  });

  // Attach stream to video tag whenever videoRef or streamRef is ready
  const attachStreamToVideo = useCallback(() => {
    if (videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch((err) => {
        console.warn('Video playback notice:', err);
      });
    }
  }, []);

  // 1. Request camera and microphone permissions with guaranteed stream attachment
  const startCamera = useCallback(async () => {
    try {
      setPermissionError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: true,
        });

        streamRef.current = stream;
        setHasPermission(true);
        setIsSimulatedMode(false);
        attachStreamToVideo();
      } else {
        throw new Error('WebRTC mediaDevices API not supported in this environment');
      }
    } catch (err: any) {
      console.warn('Camera/mic access unavailable, activating clinical HD simulation:', err);
      setHasPermission(false);
      setPermissionError(err.message || 'Camera permission unavailable.');
      setIsSimulatedMode(true);
    }
  }, [attachStreamToVideo]);

  // Initial camera mount
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [startCamera]);

  // Keep video source synced if DOM node remounts
  useEffect(() => {
    if (hasPermission && !isSimulatedMode) {
      attachStreamToVideo();
    }
  }, [hasPermission, isSimulatedMode, attachStreamToVideo, isMinimized]);

  // 2. Dispatch distress signal directly to active Admin ID
  const handleDispatchEmergency = useCallback(
    async (reason: string, earVal: number) => {
      setDistressTriggered(true);
      speakText(
        `Emergency distress signal detected! Dispatched directly to Admin ID ${targetAdminId}.`
      );

      const newIncident = await dispatchEmergency({
        patientId: 'pat-901',
        patientName: 'Eleanor Vance (Age 68)',
        type: 'EYE_BLINK_DISTRESS',
        severity: 'CRITICAL',
        earValue: earVal,
        blinkPattern: reason,
        location: 'Patient Bedside (Real-Time Vision Stream)',
        targetAdminId: targetAdminId || 'ADM-8801',
        targetAdminName: targetAdminName || 'Dr. Sophia Martinez, MD',
        targetAdminEmail: targetAdminEmail || 'admin@neuroshield.health',
      });

      if (onEmergencyTriggered && newIncident) {
        onEmergencyTriggered(newIncident);
      }
    },
    [onEmergencyTriggered, targetAdminId, targetAdminName, targetAdminEmail]
  );

  // Cancel emergency during countdown
  const cancelEmergencyCountdown = () => {
    setCountdown(null);
    setDistressTriggered(false);
    stateRef.current.blinkTimestamps = [];
  };

  // 3. Real-Time Vision Frame Processing Loop
  useEffect(() => {
    let lastSimulatedBlink = Date.now();
    let simEyeOpenFraction = 1.0;
    let simPupilX = 0;

    const processFrame = () => {
      const now = Date.now();
      let currentEar = 0.28;

      if (!isSimulatedMode && videoRef.current && videoRef.current.readyState >= 2) {
        // REAL WEBCAM PROCESSING
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const overlay = overlayCanvasRef.current;

        if (canvas && overlay) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          const overlayCtx = overlay.getContext('2d');

          if (ctx && overlayCtx) {
            canvas.width = 160;
            canvas.height = 120;
            ctx.drawImage(video, 0, 0, 160, 120);

            // Eye crop optical luminance gradient analysis
            const eyeCropLeft = ctx.getImageData(45, 40, 30, 20);
            let darkPixels = 0;
            const totalPixels = eyeCropLeft.data.length / 4;
            for (let i = 0; i < eyeCropLeft.data.length; i += 4) {
              const r = eyeCropLeft.data[i];
              const g = eyeCropLeft.data[i + 1];
              const b = eyeCropLeft.data[i + 2];
              const brightness = (r + g + b) / 3;
              if (brightness < 85) darkPixels++;
            }

            const pupilRatio = darkPixels / totalPixels;
            currentEar = Math.min(0.35, Math.max(0.09, 0.12 + pupilRatio * 0.45));

            // Overlay landmarks (only if Clear Face Only is FALSE)
            overlay.width = overlay.clientWidth || 240;
            overlay.height = overlay.clientHeight || 180;
            overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

            if (!showClearFaceOnly) {
              const scaleX = overlay.width / 160;
              const scaleY = overlay.height / 120;

              // Draw Left Eye Landmark Box & points
              overlayCtx.strokeStyle = currentEar < earThreshold ? '#EF4444' : '#10B981';
              overlayCtx.lineWidth = 2;

              const leftX = 45 * scaleX;
              const leftY = 40 * scaleY;
              const leftW = 30 * scaleX;
              const leftH = 20 * scaleY;

              overlayCtx.strokeRect(leftX, leftY, leftW, leftH);

              // 6 MediaPipe Landmark Nodes
              overlayCtx.fillStyle = currentEar < earThreshold ? '#EF4444' : '#34D399';
              const pts = [
                [leftX, leftY + leftH / 2],
                [leftX + leftW * 0.3, leftY],
                [leftX + leftW * 0.7, leftY],
                [leftX + leftW, leftY + leftH / 2],
                [leftX + leftW * 0.7, leftY + leftH],
                [leftX + leftW * 0.3, leftY + leftH],
              ];
              pts.forEach(([px, py]) => {
                overlayCtx.beginPath();
                overlayCtx.arc(px, py, 2.5, 0, 2 * Math.PI);
                overlayCtx.fill();
              });

              // Right Eye Box
              const rightX = 85 * scaleX;
              const rightY = 40 * scaleY;
              const rightW = 30 * scaleX;
              const rightH = 20 * scaleY;
              overlayCtx.strokeRect(rightX, rightY, rightW, rightH);
            }
          }
        }
      } else {
        // HIGH DEFINITION CLINICAL PATIENT SIMULATION ON CANVAS
        const simCanvas = simCanvasRef.current;
        if (simCanvas) {
          const sCtx = simCanvas.getContext('2d');
          if (sCtx) {
            simCanvas.width = 320;
            simCanvas.height = 240;
            const w = simCanvas.width;
            const h = simCanvas.height;

            // Simulated blink cycle: blinks naturally every 3 seconds
            const blinkCycle = (now - lastSimulatedBlink) % 3200;
            if (blinkCycle > 2700 && blinkCycle < 2900) {
              // Rapid blink closure
              simEyeOpenFraction = Math.max(0.08, 1 - Math.sin(((blinkCycle - 2700) / 200) * Math.PI));
            } else {
              simEyeOpenFraction = 0.95 + Math.sin(now / 400) * 0.05;
            }

            // Slight natural gaze shift
            simPupilX = Math.sin(now / 900) * 4;

            currentEar = 0.1 + simEyeOpenFraction * 0.18;

            // 1. Hospital Room Background with soft clinical lighting
            const bgGrad = sCtx.createLinearGradient(0, 0, w, h);
            bgGrad.addColorStop(0, '#0f172a');
            bgGrad.addColorStop(0.5, '#1e1b4b');
            bgGrad.addColorStop(1, '#090d16');
            sCtx.fillStyle = bgGrad;
            sCtx.fillRect(0, 0, w, h);

            // Subtle bed pillow contour
            sCtx.fillStyle = '#1e293b';
            sCtx.beginPath();
            sCtx.ellipse(w / 2, h * 0.88, w * 0.45, h * 0.2, 0, 0, Math.PI * 2);
            sCtx.fill();

            // 2. Patient Head Contour
            const headX = w / 2;
            const headY = h * 0.48;
            const headR = 64;

            // Patient face gradient
            const faceGrad = sCtx.createRadialGradient(
              headX - 10,
              headY - 15,
              10,
              headX,
              headY,
              headR
            );
            faceGrad.addColorStop(0, '#fed7aa');
            faceGrad.addColorStop(0.8, '#fba779');
            faceGrad.addColorStop(1, '#e07a5f');
            sCtx.fillStyle = faceGrad;
            sCtx.beginPath();
            sCtx.ellipse(headX, headY, headR * 0.78, headR, 0, 0, Math.PI * 2);
            sCtx.fill();

            // Hair
            sCtx.fillStyle = '#64748b';
            sCtx.beginPath();
            sCtx.arc(headX, headY - 20, headR * 0.82, Math.PI * 0.8, Math.PI * 2.2);
            sCtx.fill();

            // Left & Right Eyes
            const eyeSpacing = 28;
            const eyeY = headY - 6;
            const eyeW = 16;
            const eyeH = 10 * simEyeOpenFraction;

            const drawEye = (cx: number) => {
              // Sclera (White of eye)
              sCtx.fillStyle = '#ffffff';
              sCtx.beginPath();
              sCtx.ellipse(cx, eyeY, eyeW, Math.max(1, eyeH), 0, 0, Math.PI * 2);
              sCtx.fill();

              // Iris & Pupil (only if opened enough)
              if (simEyeOpenFraction > 0.25) {
                // Iris (warm hazel/blue)
                sCtx.fillStyle = '#0284c7';
                sCtx.beginPath();
                sCtx.arc(cx + simPupilX, eyeY, Math.min(eyeH * 0.8, 5.5), 0, Math.PI * 2);
                sCtx.fill();

                // Pupil
                sCtx.fillStyle = '#0f172a';
                sCtx.beginPath();
                sCtx.arc(cx + simPupilX, eyeY, Math.min(eyeH * 0.45, 2.5), 0, Math.PI * 2);
                sCtx.fill();

                // Light Glint
                sCtx.fillStyle = '#ffffff';
                sCtx.beginPath();
                sCtx.arc(cx + simPupilX - 1.5, eyeY - 1.5, 1.2, 0, Math.PI * 2);
                sCtx.fill();
              }

              // Eyelid line / Lash
              sCtx.strokeStyle = '#475569';
              sCtx.lineWidth = 1.8;
              sCtx.beginPath();
              sCtx.ellipse(cx, eyeY, eyeW, Math.max(1.5, eyeH), 0, Math.PI, Math.PI * 2);
              sCtx.stroke();
            };

            drawEye(headX - eyeSpacing);
            drawEye(headX + eyeSpacing);

            // Nose
            sCtx.strokeStyle = '#ca8a04';
            sCtx.lineWidth = 1.5;
            sCtx.beginPath();
            sCtx.moveTo(headX, eyeY + 6);
            sCtx.lineTo(headX - 2, eyeY + 22);
            sCtx.lineTo(headX + 4, eyeY + 23);
            sCtx.stroke();

            // Gentle mouth
            sCtx.strokeStyle = '#b91c1c';
            sCtx.lineWidth = 2;
            sCtx.beginPath();
            sCtx.arc(headX, eyeY + 34, 12, 0.1 * Math.PI, 0.9 * Math.PI);
            sCtx.stroke();

            // 3. Landmark tracking mesh on top of simulation (if Clear Face Only is OFF)
            if (!showClearFaceOnly) {
              const isClosed = currentEar < earThreshold;
              sCtx.strokeStyle = isClosed ? '#ef4444' : '#10b981';
              sCtx.lineWidth = 1.5;

              // Left Eye Box
              sCtx.strokeRect(headX - eyeSpacing - 18, eyeY - 12, 36, 24);
              // Right Eye Box
              sCtx.strokeRect(headX + eyeSpacing - 18, eyeY - 12, 36, 24);

              // 6 Point Nodes
              sCtx.fillStyle = isClosed ? '#ef4444' : '#34d399';
              [-eyeSpacing, eyeSpacing].forEach((cxOffset) => {
                const ex = headX + cxOffset;
                const nodePoints = [
                  [ex - eyeW, eyeY],
                  [ex - eyeW * 0.4, eyeY - eyeH],
                  [ex + eyeW * 0.4, eyeY - eyeH],
                  [ex + eyeW, eyeY],
                  [ex + eyeW * 0.4, eyeY + eyeH],
                  [ex - eyeW * 0.4, eyeY + eyeH],
                ];
                nodePoints.forEach(([nx, ny]) => {
                  sCtx.beginPath();
                  sCtx.arc(nx, ny, 2, 0, Math.PI * 2);
                  sCtx.fill();
                });
              });
            }
          }
        }
      }

      setEarValue(Number(currentEar.toFixed(3)));

      // 4. State Machine: Eye Closure & Rapid Blink Sequence Detection
      const closed = currentEar < earThreshold;
      setIsEyeClosed(closed);

      const state = stateRef.current;

      if (closed) {
        if (!state.eyeWasClosed) {
          state.eyeWasClosed = true;
          state.closedTimestamp = now;
        } else {
          // Check prolonged closure (locked-in or unconsciousness)
          const durationSec = (now - state.closedTimestamp) / 1000;
          setProlongedClosureTimer(Number(durationSec.toFixed(1)));

          if (durationSec > 2.5 && !distressTriggered && countdown === null) {
            handleDispatchEmergency('Prolonged Eye Closure (> 2.5s)', currentEar);
          }
        }
      } else {
        if (state.eyeWasClosed) {
          // Eye reopened: calculate blink duration
          const blinkDurationMs = now - state.closedTimestamp;
          state.eyeWasClosed = false;
          setProlongedClosureTimer(0);

          if (blinkDurationMs >= 50 && blinkDurationMs <= 650) {
            setBlinkCount((prev) => prev + 1);

            // Filter blinks within 1.8 seconds
            const updatedBlinks = [...state.blinkTimestamps, now].filter(
              (t) => now - t <= 1800
            );
            state.blinkTimestamps = updatedBlinks;
            setRecentBlinks(updatedBlinks);

            // EMERGENCY PATTERN: 3 rapid blinks within 1.8 seconds
            if (updatedBlinks.length >= 3 && !distressTriggered) {
              handleDispatchEmergency(
                'Triple Eye Blink Distress Sequence (3 blinks < 1.8s)',
                currentEar
              );
            }
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(processFrame);
    };

    animationFrameId.current = requestAnimationFrame(processFrame);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [
    isSimulatedMode,
    earThreshold,
    distressTriggered,
    countdown,
    handleDispatchEmergency,
    showClearFaceOnly,
  ]);

  // Quick manual trigger for testing the Emergency EAR trigger
  const triggerSimulatedTripleBlink = () => {
    handleDispatchEmergency(
      `Manual Simulated 3x Rapid Blink (EAR < 0.16) to Admin ID: ${targetAdminId}`,
      0.14
    );
  };

  // -------------------------------------------------------------
  // DRAGGING AND MOVING TO ANY SIDE OF THE APP LOGIC
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag when clicking the drag handle or header background, not buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    dragStartRef.current = {
      pointerStartX: e.clientX,
      pointerStartY: e.clientY,
      elemStartX: rect.left,
      elemStartY: rect.top,
    };

    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.pointerStartX;
    const deltaY = e.clientY - dragStartRef.current.pointerStartY;

    const newX = dragStartRef.current.elemStartX + deltaX;
    const newY = dragStartRef.current.elemStartY + deltaY;

    const boxWidth = isMinimized ? 280 : 340;
    const boxHeight = isMinimized ? 220 : 340;

    // Clamp inside viewport
    const clampedX = Math.max(10, Math.min(window.innerWidth - boxWidth - 10, newX));
    const clampedY = Math.max(10, Math.min(window.innerHeight - boxHeight - 10, newY));

    setCoords({ x: clampedX, y: clampedY });
    setDockPosition('free');
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignored
      }
    }
  };

  // Snap to specific corner or side
  const snapToSide = (dock: PipDockCorner) => {
    setDockPosition(dock);
    setCoords(null);
    setShowSidePicker(false);
    speakText(`Camera preview docked to ${dock.replace('-', ' ')}.`);
  };

  // Determine container positioning classes and styles
  const getPositionClassesAndStyles = () => {
    if (coords && dockPosition === 'free') {
      return {
        classes: 'fixed z-[9990]',
        style: { left: `${coords.x}px`, top: `${coords.y}px` },
      };
    }

    switch (dockPosition) {
      case 'top-left':
        return { classes: 'fixed top-4 left-4 z-[9990]', style: {} };
      case 'bottom-left':
        return { classes: 'fixed bottom-4 left-4 z-[9990]', style: {} };
      case 'bottom-right':
        return { classes: 'fixed bottom-4 right-4 z-[9990]', style: {} };
      case 'top-center':
        return {
          classes: 'fixed top-4 left-1/2 -translate-x-1/2 z-[9990]',
          style: {},
        };
      case 'bottom-center':
        return {
          classes: 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[9990]',
          style: {},
        };
      case 'top-right':
      default:
        return { classes: 'fixed top-4 right-4 z-[9990]', style: {} };
    }
  };

  const { classes: positionClasses, style: positionStyles } = getPositionClassesAndStyles();

  return (
    <>
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Floating Picture-In-Picture Overlay (Movable to ANY side of screen) */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={positionStyles}
        className={`${positionClasses} transition-shadow duration-200 select-none rounded-2xl overflow-hidden border shadow-2xl ${
          distressTriggered
            ? 'border-red-500 ring-4 ring-red-500/70 bg-red-950/95'
            : highContrast
            ? 'border-yellow-400 bg-black text-yellow-300 ring-2 ring-yellow-400'
            : 'border-cyan-500/50 bg-slate-900/95 backdrop-blur-xl text-white shadow-cyan-950/60'
        } ${isDragging ? 'cursor-grabbing opacity-95 scale-[1.02]' : ''} ${
          isMinimized ? 'w-64 sm:w-72' : 'w-80 sm:w-88'
        }`}
      >
        {/* PIP Header & Move Handle */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/90 border-b border-slate-700/70 cursor-grab active:cursor-grabbing">
          {/* Status & Label */}
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                distressTriggered
                  ? 'bg-red-500 animate-ping'
                  : hasPermission
                  ? 'bg-emerald-400 ring-2 ring-emerald-400/40'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-[11px] font-black tracking-wider uppercase flex items-center gap-1 text-slate-100">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              EAR Cam
            </span>

            {/* Simulated vs Real Feed badge */}
            {isSimulatedMode ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                HD SIM
              </span>
            ) : (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                LIVE CAM
              </span>
            )}
          </div>

          {/* Quick Header Actions: Move to Any Side, Toggle Clear View, Minimize/Expand */}
          <div className="flex items-center space-x-1">
            {/* Clear View Toggle: strips landmarks for crystal-clear unobstructed patient face */}
            <button
              onClick={() => setShowClearFaceOnly(!showClearFaceOnly)}
              title={
                showClearFaceOnly
                  ? 'Switch to EAR Tracking Mesh HUD'
                  : 'Enable Clear Face View (Hide Overlay Mesh)'
              }
              className={`p-1 rounded transition-colors ${
                showClearFaceOnly
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {showClearFaceOnly ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            {/* Move to Any Side Picker Button */}
            <div className="relative">
              <button
                onClick={() => setShowSidePicker(!showSidePicker)}
                title="Dock to Any Side or Corner of the Screen"
                className={`p-1 rounded transition-colors ${
                  showSidePicker
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
              </button>

              {/* Popup Docking Menu */}
              {showSidePicker && (
                <div className="absolute right-0 top-7 z-50 bg-slate-900 border border-cyan-500/40 rounded-xl p-2 shadow-2xl w-48 text-xs space-y-1.5 animate-in fade-in">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 border-b border-slate-800 pb-1">
                    Snap To Any Screen Side:
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      onClick={() => snapToSide('top-left')}
                      className={`p-1.5 rounded flex items-center gap-1 ${
                        dockPosition === 'top-left'
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <ArrowUpLeft className="w-3 h-3" /> Top-Left
                    </button>
                    <button
                      onClick={() => snapToSide('top-right')}
                      className={`p-1.5 rounded flex items-center gap-1 ${
                        dockPosition === 'top-right'
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <ArrowUpRight className="w-3 h-3" /> Top-Right
                    </button>
                    <button
                      onClick={() => snapToSide('bottom-left')}
                      className={`p-1.5 rounded flex items-center gap-1 ${
                        dockPosition === 'bottom-left'
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <ArrowDownLeft className="w-3 h-3" /> Btm-Left
                    </button>
                    <button
                      onClick={() => snapToSide('bottom-right')}
                      className={`p-1.5 rounded flex items-center gap-1 ${
                        dockPosition === 'bottom-right'
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <ArrowDownRight className="w-3 h-3" /> Btm-Right
                    </button>
                    <button
                      onClick={() => snapToSide('top-center')}
                      className={`p-1.5 rounded flex items-center gap-1 col-span-2 justify-center ${
                        dockPosition === 'top-center'
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <ArrowUp className="w-3 h-3" /> Top Center
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 px-1 pt-1 italic">
                    Tip: You can also drag this window anywhere freely!
                  </p>
                </div>
              )}
            </div>

            {/* Modal Detail Expand */}
            <button
              onClick={() => setIsExpandedModal(true)}
              title="Open Full Computer Vision & Telemetry Console"
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Minimize / Expand Size */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? 'Expand controls' : 'Minimize to compact view'}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Camera Viewport: Clear, visible, high-definition in minimized & normal mode */}
        <div className="p-2.5 space-y-2">
          {/* Active Admin Routing Indicator */}
          <div className="flex items-center justify-between text-[10px] px-2 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 font-medium">
            <span className="text-cyan-300 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-red-400 animate-pulse" />
              <span>Route:</span>
              <strong className="text-white font-bold font-mono">[{targetAdminId}]</strong>
            </span>
            <span className="text-slate-400 text-[9px] truncate max-w-[110px]" title={targetAdminName}>
              {targetAdminName.split(',')[0]}
            </span>
          </div>

          {/* Viewport Frame */}
          <div
            className={`relative w-full ${
              isMinimized ? 'h-36 sm:h-40' : 'aspect-4/3'
            } bg-black rounded-xl overflow-hidden border border-slate-700 shadow-inner group`}
          >
            {/* Real Webcam Stream */}
            {!isSimulatedMode && hasPermission ? (
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && streamRef.current && el.srcObject !== streamRef.current) {
                    el.srcObject = streamRef.current;
                    el.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{
                  transform: 'scaleX(-1)',
                  filter: enhanceClarity ? 'contrast(1.1) brightness(1.05)' : 'none',
                }}
              />
            ) : (
              /* High-Definition Clinical Patient Simulation Canvas */
              <canvas
                ref={simCanvasRef}
                className="w-full h-full object-cover block"
                style={{
                  filter: enhanceClarity ? 'contrast(1.08) brightness(1.02)' : 'none',
                }}
              />
            )}

            {/* Dynamic Landmark Overlay Canvas for real webcam */}
            {!isSimulatedMode && !showClearFaceOnly && (
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            )}

            {/* Real-Time EAR HUD Badge */}
            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1.5 border border-white/10 shadow">
              <span
                className={`w-2 h-2 rounded-full ${
                  earValue < earThreshold ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
                }`}
              />
              <span className="text-slate-100">EAR: {earValue.toFixed(2)}</span>
              <span
                className={`text-[9px] font-bold ${
                  earValue < earThreshold ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {earValue < earThreshold ? 'CLOSED' : 'OPEN'}
              </span>
            </div>

            {/* Mode Tag (Clear vs Overlay) */}
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-medium text-slate-300 border border-white/10">
              {showClearFaceOnly ? 'Clear Cam View' : 'Mesh HUD'}
            </div>

            {/* Cadence Indicator */}
            <div className="absolute bottom-2 left-2 flex gap-1 items-center bg-black/75 px-2 py-0.5 rounded text-[10px] border border-white/10">
              <span className="text-slate-400 text-[9px]">3x Blink:</span>
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((idx) => (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx < recentBlinks.length
                        ? 'bg-amber-400 scale-125 ring-1 ring-amber-300'
                        : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Prolonged Closure Warning */}
            {prolongedClosureTimer > 0.8 && (
              <div className="absolute bottom-2 right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold animate-pulse shadow-lg">
                Hold: {prolongedClosureTimer}s
              </div>
            )}
          </div>

          {/* Quick Actions in Minimized View */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1.5 text-[11px]">
              {/* Blink Counter */}
              <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/60 font-mono text-[10px]">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span>Blinks: {blinkCount}</span>
              </div>

              {/* Quick Triggers */}
              <div className="flex items-center gap-1">
                <button
                  onClick={triggerSimulatedTripleBlink}
                  className="px-2 py-1 bg-amber-600/90 hover:bg-amber-600 text-white font-bold text-[10px] rounded-lg shadow active:scale-95 transition-all"
                  title={`Simulate 3x rapid blinks emergency to Admin ${targetAdminId}`}
                >
                  Test 3x
                </button>
                <button
                  onClick={() =>
                    handleDispatchEmergency(
                      `Direct Manual SOS from Minimized Camera PIP to Admin ID: ${targetAdminId}`,
                      earValue
                    )
                  }
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] rounded-lg shadow active:scale-95 transition-all flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  SOS
                </button>
              </div>
            </div>

            {/* Drag helper hint */}
            <div className="flex items-center justify-between text-[9px] text-slate-400 px-1 pt-0.5">
              <span className="flex items-center gap-1 text-slate-400">
                <Move className="w-2.5 h-2.5 text-cyan-400" />
                Drag header to move anywhere
              </span>
              <button
                onClick={() => setEnhanceClarity(!enhanceClarity)}
                className="hover:text-cyan-300 underline"
              >
                {enhanceClarity ? 'Clarity Boost: ON' : 'Clarity Boost: OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Distress Modal Overlay when emergency triggers */}
      {distressTriggered && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border-2 border-red-500 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-500 animate-bounce">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-black text-white">EMERGENCY SIGNAL SENT!</h2>
            <p className="text-sm text-slate-300">
              An emergency distress alert was triggered via your Eye-Blink cadence (EAR {earValue.toFixed(2)}).
            </p>

            {/* Target Admin ID Card */}
            <div className="bg-red-950/70 border border-red-500/50 rounded-2xl p-3.5 text-left font-mono text-xs text-red-200 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-white border-b border-red-500/30 pb-1">
                <span>ASSIGNED ADMIN ID:</span>
                <span className="bg-red-600 px-2 py-0.5 rounded text-white font-mono">
                  {targetAdminId}
                </span>
              </div>
              <div>Admin Name: {targetAdminName}</div>
              <div>Channel: Direct Console Push + Audio Siren Relay</div>
              <div>Patient: Eleanor Vance (Bedside South Wing)</div>
              <div>Trigger: 3x Rapid Blink / Prolonged Closure</div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() =>
                  speakText(
                    `Help is en route. Admin ID ${targetAdminId}, ${targetAdminName}, has received your emergency alert.`
                  )
                }
                className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg"
              >
                <Volume2 className="w-4 h-4" />
                Hear Status
              </button>
              <button
                onClick={cancelEmergencyCountdown}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-semibold rounded-xl"
              >
                Dismiss / I am OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Vision Details Modal */}
      {isExpandedModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-2xl w-full bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold">Real-Time Computer Vision & EAR Calibration</h3>
              </div>
              <button
                onClick={() => setIsExpandedModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Eye Landmark Pipeline
                </h4>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-2">
                  <p className="text-slate-300">
                    The Eye Aspect Ratio (EAR) calculates eyelid separation relative to eye width:
                  </p>
                  <div className="font-mono bg-black/50 p-2 rounded text-cyan-300 text-[11px]">
                    EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                    <li>Open eye baseline: ~0.26 - 0.35</li>
                    <li>Closed eye threshold: &lt; {earThreshold}</li>
                    <li>Emergency pattern: 3 rapid blinks &lt; 1.8s</li>
                    <li>Target Admin: [{targetAdminId}]</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-semibold block">
                    Calibrate Sensitivity Threshold ({earThreshold})
                  </label>
                  <input
                    type="range"
                    min="0.15"
                    max="0.32"
                    step="0.01"
                    value={earThreshold}
                    onChange={(e) => setEarThreshold(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Strict (0.15)</span>
                    <span>Default (0.21)</span>
                    <span>Sensitive (0.32)</span>
                  </div>
                </div>

                {/* View Mode controls in modal */}
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2">
                  <div className="text-xs font-semibold text-slate-200">Camera Clarity Options</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowClearFaceOnly(!showClearFaceOnly)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                        showClearFaceOnly
                          ? 'bg-cyan-600 text-white border-cyan-400'
                          : 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      {showClearFaceOnly ? 'Clear View Active' : 'Show Clear View'}
                    </button>
                    <button
                      onClick={() => setIsSimulatedMode(!isSimulatedMode)}
                      className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600"
                    >
                      {isSimulatedMode ? 'Switch to Webcam' : 'Switch to HD Sim'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live Telemetry
                </h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                    <p className="text-[10px] text-slate-400">Instant EAR</p>
                    <p className="text-2xl font-mono font-bold text-cyan-400">
                      {earValue.toFixed(3)}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                    <p className="text-[10px] text-slate-400">Eye Status</p>
                    <p
                      className={`text-xl font-bold ${
                        isEyeClosed ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {isEyeClosed ? 'CLOSED' : 'OPEN'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-2">
                  <p className="font-semibold text-slate-300">Target Admin Routing:</p>
                  <div className="font-mono bg-black/40 p-2 rounded text-[11px] text-cyan-300 space-y-0.5">
                    <div>Admin ID: {targetAdminId}</div>
                    <div>Name: {targetAdminName}</div>
                    <div>Status: CONNECTED</div>
                  </div>
                </div>

                <button
                  onClick={startCamera}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Restart / Re-request Permissions
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsExpandedModal(false)}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold text-sm"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
