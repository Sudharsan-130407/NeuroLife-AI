import React, { useState } from 'react';
import {
  Droplet,
  Plus,
  Minus,
  RotateCcw,
  Volume2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Award,
  ChevronDown,
  ShieldCheck,
  Undo2,
} from 'lucide-react';
import { speakText } from '../services/api';

export interface HydrationLogEntry {
  id: string;
  time: string;
  amountMl: number;
  label: string;
}

interface HydrationTrackerProps {
  currentMl: number;
  goalMl?: number;
  onUpdate: (newTotal: number) => void;
  highContrast?: boolean;
}

export const HydrationTracker: React.FC<HydrationTrackerProps> = ({
  currentMl,
  goalMl = 1800,
  onUpdate,
  highContrast = false,
}) => {
  const [logs, setLogs] = useState<HydrationLogEntry[]>([
    { id: 'h-1', time: '08:15 AM', amountMl: 250, label: 'Morning medications with water' },
    { id: 'h-2', time: '10:00 AM', amountMl: 250, label: 'Post-Mirror Therapy glass' },
    { id: 'h-3', time: '11:45 AM', amountMl: 250, label: 'Mid-morning hydration cup' },
  ]);

  const [thicknessLevel, setThicknessLevel] = useState<'Thin' | 'Slightly Thick (Nectar)' | 'Mildly Thick (Honey)'>('Thin');
  const [customAmount, setCustomAmount] = useState<number>(200);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const percentage = Math.min(100, Math.round((currentMl / goalMl) * 100));
  const remainingMl = Math.max(0, goalMl - currentMl);
  const isGoalReached = currentMl >= goalMl;

  // Milestone checkpoints
  const milestones = [
    { target: 450, label: '25% Morning', reached: currentMl >= 450 },
    { target: 900, label: '50% Midday', reached: currentMl >= 900 },
    { target: 1350, label: '75% Afternoon', reached: currentMl >= 1350 },
    { target: 1800, label: '100% Target', reached: currentMl >= 1800 },
  ];

  const handleAddWater = (amount: number, label = 'Water intake') => {
    const updatedTotal = currentMl + amount;
    onUpdate(updatedTotal);

    const newEntry: HydrationLogEntry = {
      id: `h-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amountMl: amount,
      label,
    };
    setLogs((prev) => [newEntry, ...prev]);

    if (updatedTotal >= goalMl && currentMl < goalMl) {
      speakText(`Congratulations! You have reached your daily hydration goal of 1,800 milliliters! Excellent recovery progress.`);
    } else {
      speakText(`Logged ${amount} milliliters. Total is now ${updatedTotal} of ${goalMl} milliliters.`);
    }
  };

  const handleUndo = () => {
    if (logs.length === 0) return;
    const lastEntry = logs[0];
    const updatedTotal = Math.max(0, currentMl - lastEntry.amountMl);
    onUpdate(updatedTotal);
    setLogs((prev) => prev.slice(1));
    speakText(`Undid previous entry of ${lastEntry.amountMl} milliliters. Total is now ${updatedTotal} milliliters.`);
  };

  const handleReset = () => {
    if (window.confirm('Reset today\'s hydration log back to 0 ml?')) {
      onUpdate(0);
      setLogs([]);
      speakText('Hydration log has been reset to zero.');
    }
  };

  const handleReadStatus = () => {
    if (isGoalReached) {
      speakText(`Great job! You have reached your daily hydration goal. You have drank ${currentMl} milliliters of your 1,800 milliliter target.`);
    } else {
      speakText(`Hydration update: You have consumed ${currentMl} milliliters today, which is ${percentage} percent of your 1,800 milliliter goal. ${remainingMl} milliliters remaining.`);
    }
  };

  // Quick preset sizes
  const presets = [
    { amount: 100, label: 'Small Sip / Meds', iconSize: 'text-xs' },
    { amount: 150, label: 'Half Glass', iconSize: 'text-sm' },
    { amount: 250, label: 'Standard Cup (8oz)', iconSize: 'text-base' },
    { amount: 350, label: 'Large Mug / Tumbler', iconSize: 'text-lg' },
  ];

  return (
    <div
      className={`rounded-3xl border p-6 transition-all shadow-xl space-y-6 ${
        highContrast
          ? 'bg-black border-yellow-400 text-yellow-300'
          : 'bg-slate-900/95 border-cyan-500/30 text-slate-100 shadow-cyan-950/20'
      }`}
    >
      {/* Header & Status Voice Affordance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Droplet className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                Daily Stroke Hydration Tracker
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                1800 ml Goal
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Paced, aspiration-safe fluid intake to prevent stroke recurrence & dehydration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReadStatus}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
            title="Listen to hydration status"
          >
            <Volume2 className="w-4 h-4" />
            <span>Voice Status</span>
          </button>

          {logs.length > 0 && (
            <button
              onClick={handleUndo}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1"
              title="Undo last log"
            >
              <Undo2 className="w-4 h-4" />
              <span className="hidden md:inline">Undo</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs"
            title="Reset daily log"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Progress Display: Visual Gauge & Numbers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Water Vessel Visualizer */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-950/70 p-6 rounded-2xl border border-slate-800">
          <div className="relative w-36 h-56 rounded-b-3xl rounded-t-xl border-4 border-cyan-500/50 overflow-hidden bg-slate-900 shadow-inner flex flex-col justify-end">
            {/* Measurement lines */}
            <div className="absolute inset-y-0 right-1 flex flex-col justify-between py-2 text-[9px] font-mono text-slate-500 pointer-events-none select-none">
              <span>1800 ml -</span>
              <span>1350 ml -</span>
              <span>900 ml -</span>
              <span>450 ml -</span>
              <span>0 ml -</span>
            </div>

            {/* Target line badge */}
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-cyan-400/80 z-10 pointer-events-none"
              style={{ bottom: '100%' }}
            />

            {/* Animated Water Fill */}
            <div
              className={`w-full transition-all duration-700 relative ${
                isGoalReached
                  ? 'bg-gradient-to-t from-emerald-600 to-cyan-400'
                  : 'bg-gradient-to-t from-blue-600 via-cyan-500 to-cyan-400'
              }`}
              style={{ height: `${percentage}%` }}
            >
              {/* Wave ripples */}
              <div className="absolute -top-3 left-0 right-0 h-4 bg-cyan-300/40 rounded-full blur-[1px] animate-pulse" />
            </div>

            {/* Inner Percentage Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none drop-shadow">
              <span className="text-3xl font-black font-mono text-white">
                {percentage}%
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                {isGoalReached ? 'GOAL MET' : 'HYDRATED'}
              </span>
            </div>
          </div>

          <div className="mt-3 text-center">
            <span className="text-xs text-slate-400 font-medium">
              Daily Target: <strong className="text-white">1800 ml</strong>
            </span>
          </div>
        </div>

        {/* Right: Metrics, Progress Bar, & Milestones */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Logged Today
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black font-mono text-cyan-400">
                  {currentMl}
                </span>
                <span className="text-lg text-slate-400 font-bold">/ {goalMl} ml</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Remaining
              </span>
              <div className="text-2xl font-bold font-mono text-slate-200">
                {remainingMl > 0 ? `${remainingMl} ml` : '0 ml (Completed)'}
              </div>
            </div>
          </div>

          {/* Linear Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isGoalReached
                    ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Milestone Checkpoints */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  m.reached
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {m.reached ? (
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                  )}
                  <span className="text-[11px] font-bold font-mono">{m.target} ml</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Goal Reached Celebration Banner */}
          {isGoalReached && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/50 flex items-center gap-3 animate-in fade-in">
              <Award className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-300">
                  Target Reached: 1800 ml Hydration Achieved!
                </p>
                <p className="text-[11px] text-slate-300">
                  Excellent job maintaining vascular hydration to lower thrombosis risk.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Presets: Large Touch Targets for Motor-Impaired Patients */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <p className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          One-Touch Quick Log Buttons (Accessible Touch Targets)
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.amount}
              onClick={() => handleAddWater(preset.amount, preset.label)}
              className="p-4 rounded-2xl bg-slate-800/90 hover:bg-cyan-700/40 border border-slate-700 hover:border-cyan-400/60 text-white flex flex-col items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all min-h-[72px]"
            >
              <div className="flex items-center gap-1 text-cyan-300 font-black text-lg">
                <Plus className="w-4 h-4" />
                <span>{preset.amount}</span>
                <span className="text-xs font-normal text-slate-400">ml</span>
              </div>
              <span className="text-[11px] text-slate-300 text-center font-medium">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount + Liquid Consistency Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Custom Input */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-300 block">
            Custom Milliliter Input
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="20"
              max="1000"
              step="10"
              value={customAmount}
              onChange={(e) => setCustomAmount(Math.max(10, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={() => handleAddWater(customAmount, `Custom intake (${customAmount}ml)`)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs shrink-0 shadow"
            >
              + Log {customAmount}ml
            </button>
          </div>
        </div>

        {/* Dysphagia Thickened Liquid Selector */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-300">
              Prescribed Liquid Consistency
            </span>
            <span className="text-[10px] text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
              Dysphagia Guard
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            {(['Thin', 'Slightly Thick (Nectar)', 'Mildly Thick (Honey)'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setThicknessLevel(lvl)}
                className={`py-2 px-1 rounded-lg text-center font-semibold transition-all ${
                  thicknessLevel === lvl
                    ? 'bg-cyan-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {lvl.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clinical Stroke Dysphagia Safety Notice */}
      <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-2.5 text-xs text-blue-200">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white">Aspiration Precaution:</strong> Remember the{' '}
          <span className="underline decoration-cyan-400 font-semibold">Chin-Tuck Posture</span>{' '}
          when drinking liquids. Sit fully upright at 90 degrees and take single, measured sips to
          ensure airway protection.
        </p>
      </div>

      {/* Intake Timeline Toggle & History */}
      <div className="pt-2 border-t border-slate-800">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-white py-1"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Today's Hydration Log Timeline ({logs.length} entries)
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`}
          />
        </button>

        {showHistory && (
          <div className="mt-3 space-y-2 animate-in fade-in">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No entries logged yet today.</p>
            ) : (
              logs.map((entry) => (
                <div
                  key={entry.id}
                  className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="font-mono text-cyan-300 font-bold">
                      +{entry.amountMl} ml
                    </span>
                    <span className="text-slate-300">{entry.label}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{entry.time}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
