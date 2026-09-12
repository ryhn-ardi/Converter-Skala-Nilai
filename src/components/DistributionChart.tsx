import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ScaleSettings } from '../types';

interface DistributionChartProps {
  originalScores: number[];
  newScores: number[];
  settings: ScaleSettings;
}

interface BinData {
  rangeLabel: string;
  countOriginal: number;
  countNew: number;
  origMin: number;
  origMax: number;
  newMin: number;
  newMax: number;
}

export default function DistributionChart({
  originalScores,
  newScores,
  settings,
}: DistributionChartProps) {
  const [activeTab, setActiveTab] = useState<'both' | 'orig' | 'new'>('both');
  const [hoveredBin, setHoveredBin] = useState<BinData | null>(null);
  const [hoveredType, setHoveredType] = useState<'orig' | 'new' | null>(null);

  const { minOld, maxOld, minNew, maxNew } = settings;

  // Compute 8 distribution bins for both original and new scores
  const binsList = useMemo((): BinData[] => {
    const totalBins = 8;
    const list: BinData[] = [];

    const rangeOld = maxOld - minOld;
    const rangeNew = maxNew - minNew;

    // Prevent division issues or bad ranges
    const stepOld = rangeOld === 0 ? 0 : rangeOld / totalBins;
    const stepNew = rangeNew === 0 ? 0 : rangeNew / totalBins;

    for (let i = 0; i < totalBins; i++) {
      const origMin = minOld + i * stepOld;
      const origMax = i === totalBins - 1 ? maxOld : minOld + (i + 1) * stepOld;

      const newMin = minNew + i * stepNew;
      // Handle inverse scale potential
      const isInverse = minNew > maxNew;
      const newMax = i === totalBins - 1 ? maxNew : minNew + (i + 1) * stepNew;

      // Count scores falling in original bin
      const countOriginal = originalScores.filter(score => {
        if (rangeOld === 0) return score === minOld;
        if (i === totalBins - 1) {
          return score >= origMin && score <= origMax;
        }
        return score >= origMin && score < origMax;
      }).length;

      // Count scores falling in new bin
      const countNew = newScores.filter(score => {
        if (rangeNew === 0) return score === minNew;
        const lowNew = Math.min(newMin, newMax);
        const hiNew = Math.max(newMin, newMax);
        if (i === totalBins - 1) {
          return score >= lowNew && score <= hiNew;
        }
        return score >= lowNew && score < hiNew;
      }).length;

      // Make labels
      const formatLabel = (val: number) => {
        if (Number.isInteger(val)) return val.toString();
        return val.toFixed(1);
      };

      const rangeLabel = `Sesi #${i + 1}`;

      list.push({
        rangeLabel,
        countOriginal,
        countNew,
        origMin,
        origMax,
        newMin,
        newMax,
      });
    }

    return list;
  }, [originalScores, newScores, minOld, maxOld, minNew, maxNew]);

  // Find max frequency to scale the heights of visual bars
  const maxFrequency = useMemo(() => {
    let maxFreq = 1;
    binsList.forEach(b => {
      if (b.countOriginal > maxFreq) maxFreq = b.countOriginal;
      if (b.countNew > maxFreq) maxFreq = b.countNew;
    });
    return maxFreq;
  }, [binsList]);

  if (originalScores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 text-center">
        <p className="text-sm font-medium text-slate-500">
          Grafik distribusi akan otomatis muncul setelah Anda memasukkan data nilai di Hitung Massal.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Visualisasi Distribusi Nilai</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbandingan penyebaran frekuensi nilai sebelum dan sesudah dilakukan penyetaraan skala.
          </p>
        </div>

        {/* View Switches */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('both')}
            className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              activeTab === 'both'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Keduanya
          </button>
          <button
            onClick={() => setActiveTab('orig')}
            className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              activeTab === 'orig'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Skala Asli
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              activeTab === 'new'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Skala Baru
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative mt-2">
        <div className="flex h-56 items-end justify-between border-b border-slate-200 pb-2 pt-6">
          {binsList.map((bin, index) => {
            // Percent calculations for height
            const origHeightPct = (bin.countOriginal / maxFrequency) * 100;
            const newHeightPct = (bin.countNew / maxFrequency) * 100;

            const isOriginalActive = activeTab === 'both' || activeTab === 'orig';
            const isNewActive = activeTab === 'both' || activeTab === 'new';

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group relative h-full px-1"
              >
                {/* Visual Bars Container */}
                <div className="flex h-full w-full items-end justify-center gap-1.5 pt-4">
                  {/* Original Score Bar */}
                  {isOriginalActive && (
                    <div
                      onMouseEnter={() => {
                        setHoveredBin(bin);
                        setHoveredType('orig');
                      }}
                      onMouseLeave={() => {
                        setHoveredBin(null);
                        setHoveredType(null);
                      }}
                      className="w-full max-w-[20px] sm:max-w-[24px] group/bar cursor-pointer"
                      style={{ height: `${Math.max(4, origHeightPct)}%` }}
                    >
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.03 }}
                        className={`h-full w-full rounded-t-sm transition-all origin-bottom ${
                          hoveredBin === bin && hoveredType === 'orig'
                            ? 'bg-indigo-600'
                            : 'bg-indigo-400/85 hover:bg-indigo-500'
                        }`}
                      />
                    </div>
                  )}

                  {/* New Score Bar */}
                  {isNewActive && (
                    <div
                      onMouseEnter={() => {
                        setHoveredBin(bin);
                        setHoveredType('new');
                      }}
                      onMouseLeave={() => {
                        setHoveredBin(null);
                        setHoveredType(null);
                      }}
                      className="w-full max-w-[20px] sm:max-w-[24px] group/bar cursor-pointer"
                      style={{ height: `${Math.max(4, newHeightPct)}%` }}
                    >
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.03 + 0.1 }}
                        className={`h-full w-full rounded-t-sm transition-all origin-bottom ${
                          hoveredBin === bin && hoveredType === 'new'
                            ? 'bg-emerald-600'
                            : 'bg-emerald-400/85 hover:bg-emerald-500'
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* Grid Interval Indicator */}
                <div className="mt-2 text-[10px] font-medium text-slate-400 select-none hidden sm:block">
                  Bin {index + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend Indicator */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-500">
          {(activeTab === 'both' || activeTab === 'orig') && (
            <div className="flex items-center gap-1.5">
              <span className="block h-2.5 w-2.5 rounded-sm bg-indigo-400/85" />
              <span>Nilai Asli ({minOld} - {maxOld})</span>
            </div>
          )}
          {(activeTab === 'both' || activeTab === 'new') && (
            <div className="flex items-center gap-1.5">
              <span className="block h-2.5 w-2.5 rounded-sm bg-emerald-400/85" />
              <span>Nilai Baru ({minNew} - {maxNew})</span>
            </div>
          )}
          <span className="text-slate-300">|</span>
          <span className="italic text-[11px]">Arahkan kursor ke batang untuk detail rentang</span>
        </div>

        {/* Hover Tooltip Overlay (Absolute Positioned) */}
        {hoveredBin && hoveredType && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg pointer-events-none z-15 max-w-[240px] border border-slate-700/50 backdrop-blur-xs">
            <p className="font-semibold text-slate-200 border-b border-slate-700 pb-0.5 mb-1 text-center">
              Detail Kelompok Nilai
            </p>
            {hoveredType === 'orig' ? (
              <div>
                <p className="flex justify-between gap-4">
                  <span className="text-slate-400">Rentang Asli:</span>
                  <span className="font-mono font-medium text-indigo-300">
                    {hoveredBin.origMin.toFixed(1)} - {hoveredBin.origMax.toFixed(1)}
                  </span>
                </p>
                <p className="flex justify-between gap-4 mt-0.5">
                  <span className="text-slate-400">Jumlah Siswa:</span>
                  <span className="font-bold text-white">{hoveredBin.countOriginal} Siswa</span>
                </p>
                <div className="mt-1 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400"
                    style={{
                      width: `${(hoveredBin.countOriginal / originalScores.length) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-indigo-200/75 text-right mt-0.5">
                  {((hoveredBin.countOriginal / originalScores.length) * 100).toFixed(0)}% dari total
                </p>
              </div>
            ) : (
              <div>
                <p className="flex justify-between gap-4">
                  <span className="text-slate-400">Rentang Baru:</span>
                  <span className="font-mono font-medium text-emerald-300">
                    {Math.min(hoveredBin.newMin, hoveredBin.newMax).toFixed(2)} - {Math.max(hoveredBin.newMin, hoveredBin.newMax).toFixed(2)}
                  </span>
                </p>
                <p className="flex justify-between gap-4 mt-0.5">
                  <span className="text-slate-400">Jumlah Siswa:</span>
                  <span className="font-bold text-white">{hoveredBin.countNew} Siswa</span>
                </p>
                <div className="mt-1 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400"
                    style={{
                      width: `${(hoveredBin.countNew / newScores.length) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-emerald-200/75 text-right mt-0.5">
                  {((hoveredBin.countNew / newScores.length) * 100).toFixed(0)}% dari total
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
