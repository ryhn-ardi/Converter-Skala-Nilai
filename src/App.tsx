import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ScaleSettings, StudentRow, ScalePreset } from './types';
import { calculateNewScore, SCALE_PRESETS, SAMPLE_STUDENTS } from './utils';

import ManualCalculator from './components/ManualCalculator';
import BulkCalculator from './components/BulkCalculator';
import DistributionChart from './components/DistributionChart';

import { 
  Sliders, Settings, ArrowRight, Layers, HelpCircle,
  Calculator, FileSpreadsheet, GraduationCap, CheckCircle2,
  Minimize, Maximize, AlertCircle
} from 'lucide-react';

export default function App() {
  // Primary Config States
  const [settings, setSettings] = useState<ScaleSettings>({
    minOld: 0,
    maxOld: 100,
    minNew: 70,
    maxNew: 100,
    decimals: 1,
    roundingMode: 'round',
    clipValues: true,
    passingScoreNew: 70,
    enableRemedial: false,
    remedialThreshold: 45,
    remedialValue: 45,
  });

  // Automatically detect old ranges from students list
  const [autoDetectOld, setAutoDetectOld] = useState<boolean>(false);

  // Main Tab Switcher
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('bulk');

  // Student list state initialized with sample data for rich initial analytics
  const [students, setStudents] = useState<StudentRow[]>(SAMPLE_STUDENTS);

  // Sychronize min/max automatically if auto-detect is active
  React.useEffect(() => {
    if (autoDetectOld && students.length > 0) {
      const scores = students.map(s => s.originalScore).filter(score => !isNaN(score));
      if (scores.length > 0) {
        const detectedMin = Math.min(...scores);
        const detectedMax = Math.max(...scores);
        setSettings(prev => ({
          ...prev,
          minOld: detectedMin,
          maxOld: detectedMax,
        }));
      }
    }
  }, [autoDetectOld, students]);

  const applyPreset = (preset: ScalePreset) => {
    setAutoDetectOld(false); // Disable auto-detect when manual presets are loaded
    setSettings({
      minOld: preset.minOld,
      maxOld: preset.maxOld,
      minNew: preset.minNew,
      maxNew: preset.maxNew,
      decimals: preset.decimals,
      roundingMode: preset.roundingMode,
      clipValues: preset.clipValues,
      passingScoreNew: preset.passingScoreNew,
      enableRemedial: preset.enableRemedial,
      remedialThreshold: preset.remedialThreshold,
      remedialValue: preset.remedialValue,
    });
  };

  // Helper to identify active preset if any
  const matchedPresetId = useMemo(() => {
    if (autoDetectOld) return 'custom';
    const match = SCALE_PRESETS.find(p => 
      p.minOld === settings.minOld &&
      p.maxOld === settings.maxOld &&
      p.minNew === settings.minNew &&
      p.maxNew === settings.maxNew &&
      p.decimals === settings.decimals &&
      p.roundingMode === settings.roundingMode &&
      p.clipValues === settings.clipValues &&
      p.passingScoreNew === settings.passingScoreNew &&
      p.enableRemedial === settings.enableRemedial &&
      p.remedialThreshold === settings.remedialThreshold &&
      p.remedialValue === settings.remedialValue
    );
    return match ? match.id : 'custom';
  }, [settings, autoDetectOld]);

  // Handle number input changes for settings securely
  const handleSettingNumChange = (field: keyof ScaleSettings, valueText: string) => {
    const parsed = parseFloat(valueText);
    setSettings(prev => ({
      ...prev,
      [field]: isNaN(parsed) ? 0 : parsed,
    }));
  };

  // Extract arrays for distribution graph live computations
  const rawScoresArray = useMemo(() => students.map(s => s.originalScore), [students]);
  const newScoresArray = useMemo(() => {
    return students.map(s => calculateNewScore(s.originalScore, settings));
  }, [students, settings]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Visual Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-subtle select-none">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-md shadow-indigo-100">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Kalkulator Skala Nilai</h1>
              <p className="text-xs text-slate-500 font-medium">
                Penyetaraan rentang skala nilai ujian &amp; tugas secara adil dan proporsional.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 bg-slate-100/80 rounded-md px-2.5 py-1 font-mono">
            <span>Metode: Interpolasi Linier</span>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-4">
          
          {/* COLUMN 1: CONFIGURATION BAR (Left-Hand Side) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Range Configuration Panel */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-colors hover:border-slate-300">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 select-none">
                <Sliders className="h-4 w-4 text-indigo-500" />
                Parameter Skala
              </h2>

              {/* Preset Quick Loader Buttons */}
              <div className="mb-5 space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Pilih Preset Konversi
                </label>
                <div className="flex flex-col gap-1.5">
                  {SCALE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className={`cursor-pointer w-full text-left rounded-lg p-2.5 transition-all outline-hidden text-xs ${
                        matchedPresetId === preset.id
                          ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-semibold'
                          : 'bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold block truncate">{preset.name}</span>
                        {matchedPresetId === preset.id && (
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                        )}
                      </div>
                      <span className="block text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                        {preset.description}
                      </span>
                    </button>
                  ))}
                  
                  <button
                    onClick={() => {}}
                    disabled={true}
                    className={`text-left rounded-lg p-2.5 outline-hidden text-xs transition-all pointer-events-none ${
                      matchedPresetId === 'custom'
                        ? 'bg-amber-50 border border-amber-200 text-amber-950'
                        : 'bg-transparent border border-dashed border-slate-150 text-slate-400 opacity-60'
                    }`}
                  >
                    <span className="font-semibold block">Skala Kustom Teruji</span>
                    <span className="block text-[10px] mt-0.5">
                      Anda sedang memodifikasi parameter secara dinamis di bawah ini.
                    </span>
                  </button>
                </div>
              </div>

              {/* Advanced Manual Tuning Parameters */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                
                {/* 1. Original Scale Boundaries */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      1. RENTANG NILAI ASLI
                    </span>
                    
                    {/* Badge Indicator */}
                    {autoDetectOld && (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 animate-pulse border border-emerald-150">
                        Otomatis Aktif
                      </span>
                    )}
                  </div>

                  {/* Auto detect checkbox switch */}
                  <div className="mb-2.5 bg-slate-50 border border-slate-200/60 p-2 rounded-lg flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-slate-600 select-none">
                      <input
                        id="auto-detect-old-checkbox"
                        type="checkbox"
                        checked={autoDetectOld}
                        onChange={(e) => setAutoDetectOld(e.target.checked)}
                        className="rounded-sm border-slate-250 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span>Deteksi otomatis dari tabel siswa</span>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Min Asli</label>
                      <input
                        id="param-min-old"
                        type="number"
                        step="any"
                        value={settings.minOld}
                        disabled={autoDetectOld}
                        onChange={(e) => handleSettingNumChange('minOld', e.target.value)}
                        className={`w-full text-center font-mono font-bold py-1.5 text-xs rounded-lg border transition-all focus:outline-hidden focus:ring-1 ${
                          autoDetectOld 
                            ? 'bg-slate-100 text-slate-450 border-slate-200 cursor-not-allowed border-dashed focus:ring-0'
                            : 'bg-slate-50 text-slate-700 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500'
                        }`}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Maks Asli</label>
                      <input
                        id="param-max-old"
                        type="number"
                        step="any"
                        value={settings.maxOld}
                        disabled={autoDetectOld}
                        onChange={(e) => handleSettingNumChange('maxOld', e.target.value)}
                        className={`w-full text-center font-mono font-bold py-1.5 text-xs rounded-lg border transition-all focus:outline-hidden focus:ring-1 ${
                          autoDetectOld 
                            ? 'bg-slate-100 text-slate-450 border-slate-200 cursor-not-allowed border-dashed focus:ring-0'
                            : 'bg-slate-50 text-slate-700 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500'
                        }`}
                        placeholder="100"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Target Scale Boundaries */}
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    2. RENTANG NILAI BARU
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Min Baru</label>
                      <input
                        id="param-min-new"
                        type="number"
                        step="any"
                        value={settings.minNew}
                        onChange={(e) => handleSettingNumChange('minNew', e.target.value)}
                        className="w-full text-center font-mono font-bold text-slate-700 bg-slate-50 focus:bg-white rounded-lg border border-slate-200 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        placeholder="70"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Maks Baru</label>
                      <input
                        id="param-max-new"
                        type="number"
                        step="any"
                        value={settings.maxNew}
                        onChange={(e) => handleSettingNumChange('maxNew', e.target.value)}
                        className="w-full text-center font-mono font-bold text-slate-700 bg-slate-50 focus:bg-white rounded-lg border border-slate-200 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        placeholder="100"
                      />
                    </div>
                  </div>
                  {/* Visual flow indicator */}
                  <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-center gap-1 bg-slate-50 py-1 rounded-md border border-slate-100">
                    <span>Posisi skala bergeser dari</span>
                    <strong className="font-mono text-indigo-500 font-bold">[{settings.minOld} s.d {settings.maxOld}]</strong>
                    <ArrowRight className="h-3 w-3" />
                    <strong className="font-mono text-emerald-600 font-bold">[{settings.minNew} s.d {settings.maxNew}]</strong>
                  </div>
                </div>

                {/* 3. Rounded options */}
                <div className="border-t border-slate-100 pt-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    3. FORMAT PEMBULATAN
                  </span>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Jumlah Desimal</label>
                      <select
                        id="param-decimals"
                        value={settings.decimals === 'flat' ? 'flat' : typeof settings.decimals === 'number' ? settings.decimals.toString() : 'none'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettings(prev => ({
                            ...prev,
                            decimals: val === 'flat' ? 'flat' : val === 'none' ? 'none' : parseInt(val),
                          }));
                        }}
                        className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-2 focus:border-indigo-500 focus:outline-hidden"
                      >
                        <option value="none">Tanpa Pembulatan (Desimal asli)</option>
                        <option value="flat">Bulat Utuh (Tanpa Desimal)</option>
                        <option value="1">1 Desimal (Satu Angka di belakang koma)</option>
                        <option value="2">2 Desimal (Dua Angka di belakang koma)</option>
                        <option value="3">3 Desimal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Model Pembulatan</label>
                      <select
                        id="param-rounding-mode"
                        value={settings.roundingMode}
                        onChange={(e) => {
                          setSettings(prev => ({
                            ...prev,
                            roundingMode: e.target.value as 'round' | 'floor' | 'ceil',
                          }));
                        }}
                        className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-2 focus:border-indigo-500 focus:outline-hidden"
                      >
                        <option value="round">Metode Matematika Terdekat (Round)</option>
                        <option value="floor">Pembulatan Ke Bawah (Floor)</option>
                        <option value="ceil">Pembulatan Ke Atas (Ceiling)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. Clip limits & passing thresholds */}
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      4. BATASAN LAINNYA
                    </span>
                    
                    <label className="flex items-start gap-2 cursor-pointer text-xs select-none">
                      <input
                        id="param-clip-values"
                        type="checkbox"
                        checked={settings.clipValues}
                        onChange={(e) => {
                          setSettings(prev => ({ ...prev, clipValues: e.target.checked }));
                        }}
                        className="mt-0.5 rounded-sm border-slate-200 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                      />
                      <span>
                        Saring / Batasi nilai output agar tidak melebih rentang skala baru (Clipping)
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5 font-bold">
                      Batas Kelulusan (Skala Baru)
                    </label>
                    <input
                      id="param-passing-score"
                      type="number"
                      step="any"
                      value={settings.passingScoreNew}
                      onChange={(e) => handleSettingNumChange('passingScoreNew', e.target.value)}
                      className="w-full font-mono text-xs font-bold text-rose-700 bg-rose-50/50 rounded-lg border border-rose-100 px-3 py-1.5 focus:border-rose-500 focus:outline-hidden"
                      placeholder="70"
                    />
                    <span className="block text-[9px] text-slate-400 mt-0.5">
                      Siswa lulus jika nilai penyetaraan barunya memenuhi skor kelulusan ini.
                    </span>
                  </div>
                </div>

                {/* 5. Auto Remedial */}
                <div className="border-t border-slate-100 pt-3 space-y-3 bg-gradient-to-br from-amber-50/40 to-orange-50/20 p-2.5 rounded-lg border border-orange-100/40">
                  <div className="flex items-center justify-between">
                    <span className="block text-[10px] font-bold text-orange-700 uppercase tracking-widest">
                      5. AUTO REMEDIAL
                    </span>
                    {settings.enableRemedial && (
                      <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                    )}
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer text-xs select-none">
                    <input
                      id="param-enable-remedial"
                      type="checkbox"
                      checked={settings.enableRemedial}
                      onChange={(e) => {
                        setSettings(prev => ({ ...prev, enableRemedial: e.target.checked }));
                      }}
                      className="mt-0.5 rounded-sm border-slate-250 text-orange-600 focus:ring-orange-500 accent-orange-600 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-700">
                      Aktifkan Auto Remedial
                    </span>
                  </label>

                  {settings.enableRemedial && (
                    <div className="space-y-2.5 pt-1.5">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">
                          Ambang Batas Nilai Remedial (Asli)
                        </label>
                        <input
                          id="param-remedial-threshold"
                          type="number"
                          step="any"
                          value={settings.remedialThreshold}
                          onChange={(e) => handleSettingNumChange('remedialThreshold', e.target.value)}
                          className="w-full font-mono text-center text-xs font-bold text-slate-700 bg-white rounded-lg border border-slate-200 py-1.5 focus:border-orange-500 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                          placeholder="45"
                        />
                        <span className="block text-[9px] text-slate-400 mt-0.5">
                          Siswa dengan nilai asli di bawah angka ini akan diremediasi.
                        </span>
                      </div>

                      <div className="bg-orange-50 border border-orange-200/50 rounded-lg p-2.5 shadow-xs">
                        <span className="block text-[10px] font-extrabold text-orange-850 uppercase tracking-wide mb-1">
                          Hasil Remedial Otomatis
                        </span>
                        <p className="text-[11px] text-slate-700 leading-normal">
                          Menggunakan logika Anda: siswa dengan nilai asli di bawah batas ini akan otomatis disetarakan menjadi nilai rentang baru minimal, yaitu <strong className="text-orange-700 font-mono font-bold text-[12px]">{settings.minNew}</strong>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>

          {/* COLUMN 2,3,4: COMPUTING STATS & GRIDS (Right-Hand Side) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Elegant Tab Switched Header */}
            <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs flex items-center justify-between">
              
              {/* Tab Selector Swappers */}
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  onClick={() => setActiveTab('bulk')}
                  className={`cursor-pointer inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === 'bulk'
                      ? 'bg-white text-indigo-950 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileSpreadsheet className={`h-4 w-4 ${activeTab === 'bulk' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  Hitung Massal / Tabel Kelas
                </button>
                
                <button
                  onClick={() => setActiveTab('single')}
                  className={`cursor-pointer inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === 'single'
                      ? 'bg-white text-indigo-950 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Calculator className={`h-4 w-4 ${activeTab === 'single' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  Hitung Tunggal (Simulasi Rumus)
                </button>
              </div>

              {/* Mini Status Badge of Active Students list */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100/60 rounded-lg select-none text-[11px] font-semibold text-indigo-700">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span>Data Aktif: {students.length} Siswa</span>
              </div>
            </div>

            {/* Active Workspace View Router */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="focus:outline-hidden"
            >
              {activeTab === 'single' ? (
                <ManualCalculator settings={settings} />
              ) : (
                <div className="space-y-6">
                  {/* Bulk Calculation table interface */}
                  <BulkCalculator
                    settings={settings}
                    students={students}
                    setStudents={setStudents}
                  />
                  
                  {/* Show elegant visual frequency distribution */}
                  <DistributionChart
                    originalScores={rawScoresArray}
                    newScores={newScoresArray}
                    settings={settings}
                  />
                </div>
              )}
            </motion.div>

          </div>

        </div>
      </main>

      {/* Humble professional page footer */}
      <footer className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 border-t border-slate-200 mt-20 text-center text-xs text-slate-400 space-y-2">
        <p>Kalkulator Skala Nilai ditenagai oleh formula linear interpolation.</p>
        <p className="font-mono text-[10px]">Coded for Teachers with Passion • 2026</p>
      </footer>

    </div>
  );
}
