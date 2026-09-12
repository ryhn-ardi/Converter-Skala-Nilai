import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ScaleSettings } from '../types';
import { calculateNewScore } from '../utils';
import { HelpCircle, Sparkles, BookOpen, Calculator, HelpCircle as HelpIcon } from 'lucide-react';

interface ManualCalculatorProps {
  settings: ScaleSettings;
}

export default function ManualCalculator({ settings }: ManualCalculatorProps) {
  const [inputValue, setInputValue] = useState<number>(75);
  const [isHovered, setIsHovered] = useState(false);

  const { minOld, maxOld, minNew, maxNew, passingScoreNew } = settings;

  // Sync / validate input value if settings boundaries change
  useEffect(() => {
    const minVal = Math.min(minOld, maxOld);
    const maxVal = Math.max(minOld, maxOld);
    if (inputValue < minVal) {
      setInputValue(minVal);
    } else if (inputValue > maxVal) {
      setInputValue(maxVal);
    }
  }, [minOld, maxOld]);

  const isRemediated = settings.enableRemedial && inputValue < settings.remedialThreshold;

  const outputValue = calculateNewScore(inputValue, settings);

  // Math visual explanation strings
  const rangeOld = maxOld - minOld;
  const rangeNew = maxNew - minNew;
  const fraction = rangeOld === 0 ? 0 : (inputValue - minOld) / rangeOld;
  const stepCalculationText = isRemediated 
    ? `R = ${settings.minNew} (Bypass Auto-Remedial)`
    : `R = ${minNew} + ((${inputValue} - ${minOld}) / (${maxOld} - ${minOld})) × (${maxNew} - ${minNew})`;
  const stepCalculationTextSolved = isRemediated
    ? `Nilai asli (${inputValue}) di bawah ambang batas remedial (${settings.remedialThreshold})`
    : `R = ${minNew} + (${fraction.toFixed(4)}) × (${rangeNew})`;
  const stepCalculationTextResult = isRemediated
    ? `R = ${settings.minNew}  ➔  ${outputValue}`
    : `R = ${(minNew + fraction * rangeNew).toFixed(4)}  ➔  ${outputValue}`;

  const originalPercent = rangeOld === 0 ? 0 : ((inputValue - minOld) / rangeOld) * 100;
  
  // Calculate display percent for new value
  const targetRange = maxNew - minNew;
  const newPercent = targetRange === 0 ? 0 : ((outputValue - minNew) / targetRange) * 100;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(Number(e.target.value));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      setInputValue(val);
    } else {
      setInputValue(0);
    }
  };

  const isPassed = minNew <= maxNew 
    ? outputValue >= passingScoreNew 
    : outputValue <= passingScoreNew; // If scale is inverted, lower might mean pass or check standard directional bounds

  return (
    <div className="space-y-6">
      {/* Interactive Controls & Realtime Gauge Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Input & Slider Panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Calculator className="h-4.5 w-4.5" />
              </span>
              <h3 className="font-semibold text-slate-800">Nilai yang Ingin Dihitung</h3>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-500 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Skala Asli
            </span>
          </div>

          <div className="flex flex-col gap-5">
            {/* Direct Number Input */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Masukkan Nilai Asli
              </label>
              <div className="relative">
                <input
                  id="manual_original_score_input"
                  type="number"
                  step="any"
                  value={inputValue}
                  onChange={handleNumberChange}
                  className={`w-full rounded-lg border py-3.5 pl-4 pr-12 text-2xl font-bold font-mono transition-all focus:outline-hidden focus:ring-1 ${
                    isRemediated
                      ? 'border-orange-300 bg-orange-50/20 text-orange-850 focus:border-orange-500 focus:ring-orange-500 focus:bg-white'
                      : 'border-slate-200 text-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 select-none">
                  ({minOld} s.d. {maxOld})
                </span>
              </div>
              {isRemediated && (
                <div className="mt-2.5 bg-gradient-to-br from-amber-50 to-orange-50/50 border border-orange-100 p-2.5 rounded-lg flex items-start gap-1.5 text-xs text-orange-850 leading-normal select-none shadow-xs">
                  <span className="font-extrabold translate-y-0.5 animate-bounce">🔥 Auto Remedial:</span>
                  <span>
                    Karena nilai asli <strong>{inputValue}</strong> berada di bawah batas remedial ({settings.remedialThreshold}), hasil nilainya otomatis dijadikan nilai rentang baru minimal, yaitu <strong>{settings.minNew}</strong>.
                  </span>
                </div>
              )}
            </div>

            {/* Slider Bar */}
            <div className="pt-2">
              <div className="flex justify-between text-xs font-mono font-medium text-slate-400 mb-2">
                <span>Min ({minOld})</span>
                <span>Nilai Terpilih: <strong className="text-indigo-600 font-bold">{inputValue}</strong></span>
                <span>Max ({maxOld})</span>
              </div>
              <input
                id="manual_original_score_slider"
                type="range"
                min={Math.min(minOld, maxOld)}
                max={Math.max(minOld, maxOld)}
                step="any"
                value={inputValue}
                onChange={handleSliderChange}
                className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Preset Buttons */}
            <div className="border-t border-slate-100 pt-3">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Cepat Pilih Nilai Terpuji (Shortcut)
              </span>
              <div className="flex flex-wrap gap-2">
                {[0, 25, 50, 60, 75, 80, 90, 100].map(pt => {
                  // convert back based on old scale
                  const ratio = pt / 100;
                  const calculatedVal = minOld + ratio * (maxOld - minOld);
                  const formattedLabel = pt === 0 ? 'Min' : pt === 100 ? 'Maks' : `${pt}%`;
                  return (
                    <button
                      key={pt}
                      onClick={() => setInputValue(Number(calculatedVal.toFixed(2)))}
                      className={`cursor-pointer px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        Math.abs(inputValue - calculatedVal) < 0.01
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {formattedLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Output / Rescaled Score Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background glow depending on pass state */}
          <div className={`absolute top-0 right-0 w-44 h-44 rounded-full filter blur-3xl opacity-10 -mr-12 -mt-12 transition-all ${
            isPassed ? 'bg-emerald-500' : 'bg-rose-500'
          }`} />

          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Sparkles className="h-4.5 w-4.5" />
                </span>
                <h3 className="font-semibold text-slate-800">Hasil Skala Baru</h3>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Skala Baru
              </span>
            </div>

            {/* Giant Output display */}
            <div className="py-2 text-center">
              <motion.div
                key={outputValue}
                initial={{ scale: 0.9, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-6xl font-bold font-mono tracking-tight text-slate-800"
              >
                {typeof outputValue === 'number' && !isNaN(outputValue) ? (
                  Number.isInteger(outputValue) ? outputValue : outputValue.toFixed(2)
                ) : '0'}
              </motion.div>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <span className="text-xs text-slate-400">Rentang output:</span>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                  {minNew} s.d. {maxNew}
                </span>
              </div>
            </div>
          </div>

          {/* Quick status & dynamic bars */}
          <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                <span>Rasio Posisi Skala Baru</span>
                <span className="font-mono">{newPercent.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-all ${
                    isPassed ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, newPercent))}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">Batas Kelulusan ({passingScoreNew}):</span>
                {isPassed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    LULUS
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    BELUM LULUS
                  </span>
                )}
              </div>
              
              <div className="text-[11px] text-slate-400 text-right">
                {minNew <= maxNew ? (
                  <span>Lulus jika ≥ {passingScoreNew}</span>
                ) : (
                  <span>Lulus jika ≤ {passingScoreNew}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Breakdown Block / Cara Perhitungan */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-4.5 w-4.5 text-indigo-500" />
          <h4 className="font-semibold text-slate-800 text-sm">Langkah &amp; Rumus Matematika (Interpolasi Linier)</h4>
        </div>
        
        <div className="space-y-3 text-xs text-slate-600">
          <p className="leading-relaxed">
            Metode hitung ulang skala nilai menggunakan **Metode Penyetaraan Linier (Linear Rescaling)**. Jarak proporsional nilai asli pada rentang lama digeser secara presisi ke dalam jarak proporsional rentang baru:
          </p>

          <div className="rounded-lg bg-white border border-slate-200 p-3 font-mono text-slate-700 overflow-x-auto space-y-1.5">
            <div className="text-indigo-600 font-semibold flex items-center gap-2">
              <span className="bg-indigo-50 text-[10px] px-1.5 py-0.5 rounded-sm">RUMUS</span>
              <span>R = MinBaru + ((V - MinAsli) / (MaxAsli - MinAsli)) × (MaxBaru - MinBaru)</span>
            </div>
            <div className="text-slate-400 border-t border-slate-100 my-1 pt-1" />
            <div className="flex gap-4">
              <span className="text-slate-400 w-12 shrink-0">Substitusi:</span>
              <span className="text-slate-600 font-medium">{stepCalculationText}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-slate-400 w-12 shrink-0">Fraksi:</span>
              <span className="text-slate-600 font-medium">{stepCalculationTextSolved}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-slate-400 w-12 shrink-0">Hasil:</span>
              <span className="text-emerald-700 font-bold">{stepCalculationTextResult}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 text-[11px] text-slate-400">
            <div className="bg-white rounded-md p-2 flex-1 border border-slate-100/80">
              <span className="font-semibold text-slate-500 block mb-0.5">Analisis Fraksi Posisi:</span>
              Nilai asli <strong className="text-indigo-500 mt-0.5 font-bold font-mono">{inputValue}</strong> adalah **{(fraction * 100).toFixed(1)}%** jalan dari batas bawah ({minOld}) menuju batas atas ({maxOld}).
            </div>
            <div className="bg-white rounded-md p-2 flex-1 border border-slate-100/80">
              <span className="font-semibold text-slate-500 block mb-0.5">Konsistensi Posisi:</span>
              Nilai konversi baru akan tepat menduduki posisi **{(fraction * 100).toFixed(1)}%** dari batas bawah ({minNew}) menuju batas atas ({maxNew}) pada skala baru.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
