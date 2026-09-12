import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScaleSettings, StudentRow, CalculatedRow } from '../types';
import { calculateNewScore, parseClipboardData, SAMPLE_STUDENTS } from '../utils';
import { 
  Trash2, UserPlus, ClipboardCheck, Info, FileSpreadsheet,
  Download, Copy, AlertCircle, RefreshCw, Check, X, FileDown
} from 'lucide-react';

interface BulkCalculatorProps {
  settings: ScaleSettings;
  students: StudentRow[];
  setStudents: React.Dispatch<React.SetStateAction<StudentRow[]>>;
}

export default function BulkCalculator({
  settings,
  students,
  setStudents,
}: BulkCalculatorProps) {
  const [pasteText, setPasteText] = useState('');
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [singleName, setSingleName] = useState('');
  const [singleScore, setSingleScore] = useState('');
  const [copied, setCopied] = useState(false);
  const [importOption, setImportOption] = useState<'append' | 'replace'>('replace');

  const { minOld, maxOld, minNew, maxNew, passingScoreNew } = settings;

  // Real-time calculated results based on active list and current settings
  const calculatedRows = useMemo((): CalculatedRow[] => {
    return students.map(student => {
      const isRemediated = settings.enableRemedial && student.originalScore < settings.remedialThreshold;
      const remedialOriginalScore = student.originalScore;
      
      const newScore = calculateNewScore(student.originalScore, settings);
      
      // Determine if student passes
      // In normal scale, passing is >= threshold
      // In inverse scale (minNew > maxNew), lower scores are better, pass depends on bounds
      const isPassed = minNew <= maxNew
        ? newScore >= passingScoreNew
        : newScore <= passingScoreNew;

      return {
        ...student,
        isRemediated,
        remedialOriginalScore,
        newScore,
        isPassed,
      };
    });
  }, [students, settings, minNew, maxNew, passingScoreNew]);

  // Real-time Class Analytics Statistics
  const statistics = useMemo(() => {
    if (students.length === 0) return null;

    const tot = students.length;
    const origScores = students.map(s => s.originalScore);
    const remedialOrigScores = calculatedRows.map(r => r.remedialOriginalScore);
    const newScores = calculatedRows.map(r => r.newScore);

    // Filter non-NaN
    const cleanOrig = origScores.filter(s => !isNaN(s));
    const cleanRemedialOrig = remedialOrigScores.filter(s => !isNaN(s));
    const cleanNew = newScores.filter(s => !isNaN(s));

    if (cleanOrig.length === 0) return null;

    // Averages
    const avgOrig = cleanOrig.reduce((sum, v) => sum + v, 0) / cleanOrig.length;
    const avgRemedialOrig = cleanRemedialOrig.reduce((sum, v) => sum + v, 0) / cleanRemedialOrig.length;
    const avgNew = cleanNew.reduce((sum, v) => sum + v, 0) / cleanNew.length;

    // Extreme ranges
    const maxOrig = Math.max(...cleanOrig);
    const minOrig = Math.min(...cleanOrig);
    const minRemedialOrig = Math.min(...cleanRemedialOrig);
    const maxNew = Math.max(...cleanNew);
    const minNewVal = Math.min(...cleanNew);

    // Pass count
    const passCount = calculatedRows.filter(r => r.isPassed).length;
    const passRate = (passCount / tot) * 100;

    // Remedial match counts
    const remediatedCount = calculatedRows.filter(r => r.isRemediated).length;

    return {
      total: tot,
      avgOriginal: avgOrig,
      avgRemedialOriginal: avgRemedialOrig,
      avgNew,
      maxOriginal: maxOrig,
      minOriginal: minOrig,
      minRemedialOriginal: minRemedialOrig,
      maxNew,
      minNew: minNewVal,
      passCount,
      passRate,
      remediatedCount,
    };
  }, [students, calculatedRows]);

  // Handle single student addition
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const scoreVal = parseFloat(singleScore);
    if (isNaN(scoreVal)) return;

    const newStudent: StudentRow = {
      id: Math.random().toString(36).substring(2, 9),
      name: singleName.trim() || `Siswa #${students.length + 1}`,
      originalScore: scoreVal,
    };

    setStudents(prev => [...prev, newStudent]);
    setSingleName('');
    setSingleScore('');
  };

  // Remove individual row
  const handleRemoveRow = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  // Clear entire list
  const handleClearAll = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua data siswa di tabel?')) {
      setStudents([]);
    }
  };

  // Inject standard demo data
  const handleLoadDemo = () => {
    setStudents(SAMPLE_STUDENTS);
  };

  // Handle spreadsheet copy-paste input
  const handleImportPaste = () => {
    const parsed = parseClipboardData(pasteText, students.length + 1);
    if (parsed.length === 0) {
      alert('Format teks tidak dikenali atau kosong. Silakan tempel data tabel Excel.');
      return;
    }

    if (importOption === 'replace') {
      setStudents(parsed);
    } else {
      setStudents(prev => [...prev, ...parsed]);
    }

    setPasteText('');
    setIsImporterOpen(false);
  };

  // Export to Excel-compatible Clipboard format
  const handleCopyToClipboard = () => {
    if (calculatedRows.length === 0) return;

    // Headers
    let text = "Nama Siswa\tNilai Asli\tNilai Penyetaraan Baru\tStatus Kelulusan\n";
    calculatedRows.forEach(row => {
      const scoreFormatted = Number.isInteger(row.newScore) ? row.newScore : row.newScore.toFixed(2);
      const passText = row.isPassed ? "LULUS" : "BELUM LULUS";
      text += `${row.name}\t${row.originalScore}\t${scoreFormatted}\t${passText}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Export to downloadable CSV file
  const handleExportCSV = () => {
    if (calculatedRows.length === 0) return;

    // CSV headers (use semi-colon as delimiter which is friendly with European decimal settings in Excel)
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nama Siswa,Nilai Asli,Nilai Penyetaraan Baru,Keterangan\n";

    calculatedRows.forEach(row => {
      const scoreFormatted = Number.isInteger(row.newScore) ? row.newScore : row.newScore.toFixed(2);
      const passText = row.isPassed ? "LULUS" : "BELUM LULUS";
      csvContent += `"${row.name.replace(/"/g, '""')}",${row.originalScore},${scoreFormatted},"${passText}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `konversi_skala_nilai_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Inline value editor for rapid adjustments
  const handleInlineScoreChange = (id: string, newScoreText: string) => {
    const parsed = parseFloat(newScoreText);
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          originalScore: isNaN(parsed) ? 0 : parsed,
        };
      }
      return s;
    }));
  };

  const handleInlineNameChange = (id: string, newName: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, name: newName };
      }
      return s;
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Top action toolbar & Excel importer toggler */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-indigo-950 flex items-center gap-1.5">
            <FileSpreadsheet className="h-4.5 w-4.5 text-indigo-600" />
            Ingat Cara Cepat: Impor dari Spreadsheet Excel / Sheets
          </h4>
          <p className="text-xs text-slate-500">
            Punya tabel di Excel? Salin/Copy langsung kolom Nama &amp; Nilai dari Excel, lalu tempelkan di tombol impor.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsImporterOpen(prev => !prev)}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-semibold text-white transition-all shadow-xs"
          >
            <ClipboardCheck className="h-4 w-4" />
            {isImporterOpen ? 'Tutup Tempel Data' : 'Tempel Data Excel / Sheets'}
          </button>

          {students.length === 0 ? (
            <button
              onClick={handleLoadDemo}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100/80 px-3.5 py-2 text-xs font-semibold transition-all"
            >
              <RefreshCw className="h-4 w-4 text-orange-500" />
              Gunakan Data Contoh
            </button>
          ) : (
            <button
              onClick={handleClearAll}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100/80 px-3.5 py-2 text-xs font-semibold transition-all"
            >
              <Trash2 className="h-4 w-4 text-rose-500" />
              Kosongkan Tabel
            </button>
          )}
        </div>
      </div>

      {/* Paste Excel Area (Expandable Block) */}
      <AnimatePresence>
        {isImporterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border border-slate-200 rounded-xl bg-white p-5 shadow-xs"
          >
            <div className="flex items-start gap-2.5 mb-3">
              <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-slate-800 text-sm">Tempel Data Nilai dari Excel / Google Sheets</h5>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Buka file excel Anda, blok minimal 1 kolom berisi data nilai (atau 2 kolom berisi nama dan nilai), klik copy. Lalu <strong className="text-indigo-600">paste (Ctrl+V)</strong> teks tersebut di kotak di bawah ini:
                </p>
              </div>
            </div>

            <textarea
              id="excel-import-textarea"
              rows={6}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Contoh:&#10;Ahmad Faisal	55&#10;Budi Santoso	68&#10;Dina	82&#10;(Atau cukup masukkan angka nilainya saja perbaris)"
              className="w-full font-mono text-xs rounded-lg border border-slate-200 p-3.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/50"
            />

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="font-semibold text-slate-500">Metode Pengisian:</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importOption"
                    checked={importOption === 'replace'}
                    onChange={() => setImportOption('replace')}
                    className="accent-indigo-600"
                  />
                  <span>Timpa data saat ini</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importOption"
                    checked={importOption === 'append'}
                    onChange={() => setImportOption('append')}
                    className="accent-indigo-600"
                  />
                  <span>Tambahkan di baris bawah</span>
                </label>
              </div>

              <div className="flex gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setIsImporterOpen(false)}
                  className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleImportPaste}
                  disabled={!pasteText.trim()}
                  className="cursor-pointer px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-xs text-white font-semibold shadow-xs"
                >
                  Mulai Impor Siswa
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Statistics summaries and Live student database table */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Statistics Dashboard Panel */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-1.5">
              <Info className="h-4.5 w-4.5 text-indigo-500" />
              Statistik Kelas Saat Ini
            </h3>

            {statistics ? (
              <div className="space-y-4">
                {/* Gauge chart simplified inside sidebar */}
                <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Batas Kelulusan ({passingScoreNew})
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-indigo-600 font-mono">
                      {statistics.passRate.toFixed(0)}%
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {statistics.passCount} dari {statistics.total} siswa lulus
                    </span>
                  </div>
                  {/* Miniature progress bar */}
                  <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${statistics.passRate >= 60 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${statistics.passRate}%` }}
                    />
                  </div>
                </div>

                {/* Grid Comparison stats */}
                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  {/* Mean Column */}
                  <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Rata-rata Nilai:</span>
                    <div className="space-y-0.5">
                      <p className="font-mono text-xs text-indigo-500 flex justify-between">
                        <span>Lama:</span>
                        <span className="font-bold">{statistics.avgOriginal.toFixed(1)}</span>
                      </p>
                      <p className="font-mono text-sm text-emerald-600 flex justify-between border-t border-dashed border-slate-200 pt-0.5 mt-0.5">
                        <span>Baru:</span>
                        <strong className="font-extrabold">{statistics.avgNew.toFixed(2)}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Range Span Column */}
                  <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Nilai Tertinggi:</span>
                    <div className="space-y-0.5">
                      <p className="font-mono text-xs text-indigo-500 flex justify-between">
                        <span>Asli:</span>
                        <span className="font-bold">{statistics.maxOriginal}</span>
                      </p>
                      <p className="font-mono text-sm text-emerald-600 flex justify-between border-t border-dashed border-slate-200 pt-0.5 mt-0.5">
                        <span>Baru:</span>
                        <strong className="font-extrabold">{statistics.maxNew % 1 === 0 ? statistics.maxNew : statistics.maxNew.toFixed(1)}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Min Score Column */}
                  <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100 col-span-2">
                    <span className="text-slate-400 block mb-0.5 text-center">Nilai Terendah Kelas</span>
                    <div className="mt-1 flex items-center justify-around">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Skala Asli:</span>
                        <span className="font-mono font-bold text-indigo-500 text-sm">
                          {statistics.minOriginal}
                        </span>
                      </div>
                      <div className="h-6 w-px bg-slate-200" />
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Skala Baru:</span>
                        <span className="font-mono font-extrabold text-emerald-600 text-sm">
                          {statistics.minNew % 1 === 0 ? statistics.minNew : statistics.minNew.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto Remedial Stats Badge */}
                {settings.enableRemedial && statistics.remediatedCount > 0 && (
                  <div className="rounded-lg bg-orange-50/70 p-2.5 border border-orange-100/70 flex items-center justify-between text-xs animate-pulse">
                    <span className="text-slate-600 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                      Terdampak Auto Remedial:
                    </span>
                    <span className="font-mono font-extrabold text-orange-700 bg-orange-100 rounded-full px-2 py-0.5 text-[11px]">
                      {statistics.remediatedCount} Siswa
                    </span>
                  </div>
                )}

                <div className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
                  💡 <strong>Info:</strong> Nilai baru diukur proporsional. Bila rerata kelas meningkat signifikan, ini wajar karena rentang konversinya telah diubah.
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                Belum ada data nilai terkumpul untuk kalkulasi statistik kelas.
              </div>
            )}
          </div>

          {/* Add individual student widget */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
              <UserPlus className="h-4.5 w-4.5 text-emerald-500" />
              Tambah Siswa Manual
            </h3>
            
            <form onSubmit={handleAddSingle} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Siswa (Opsional)
                </label>
                <input
                  id="bulk_student_name_input"
                  type="text"
                  placeholder="Nama Siswa (cth: Ahmad Faisal)"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nilai Asli ({minOld} - {maxOld})
                </label>
                <input
                  id="bulk_student_score_input"
                  type="number"
                  step="any"
                  placeholder="Masukan Nilai Asli"
                  value={singleScore}
                  onChange={(e) => setSingleScore(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="cursor-pointer w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs"
              >
                Tambahkan Ke Tabel
              </button>
            </form>
          </div>
        </div>

        {/* Right Columns: Main Student Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Daftar Hasil Penyetaraan Skala Baru</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total data: <strong>{students.length}</strong> siswa
              </p>
            </div>

            {/* Downloader & Copiers */}
            {students.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 px-3 py-2 transition-all"
                  title="Salin hasil tabel ke notepad/excel langsung"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      <span>Salin Ke Excel</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleExportCSV}
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 px-3 py-2 transition-all"
                  title="Unduh berkas CSV"
                >
                  <FileDown className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-[10px] text-slate-400 uppercase tracking-wider select-none font-bold">
                  <th className="py-3 px-4 w-12">No</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4 w-32">Nilai Asli</th>
                  <th className="py-3 px-4 w-32">Nilai Baru</th>
                  <th className="py-3 px-4 w-28">Status</th>
                  <th className="py-3 px-4 w-12 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                <AnimatePresence initial={false}>
                  {calculatedRows.length > 0 ? (
                    calculatedRows.map((row, index) => {
                      const finalNewScore = Number.isInteger(row.newScore)
                        ? row.newScore
                        : row.newScore.toFixed(2);

                      return (
                        <motion.tr
                          key={row.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -15 }}
                          transition={{ duration: 0.15 }}
                          className="hover:bg-slate-50/50 group"
                        >
                          {/* Row index */}
                          <td className="py-3 px-4 font-mono text-slate-400 font-semibold">
                            {index + 1}
                          </td>

                          {/* Editable Name */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => handleInlineNameChange(row.id, e.target.value)}
                              className="font-semibold text-slate-700 hover:border-slate-300 focus:border-indigo-500 focus:bg-white px-2 py-0.5 rounded-sm border border-transparent bg-transparent transition-all w-full focus:outline-hidden"
                            />
                          </td>

                          {/* Editable Original Score */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-0.5 justify-center">
                              <div className="flex items-center gap-1.5 font-mono">
                                <input
                                  type="number"
                                  step="any"
                                  value={row.originalScore}
                                  onChange={(e) => handleInlineScoreChange(row.id, e.target.value)}
                                  className={`font-bold text-slate-700 hover:border-slate-300 focus:border-indigo-500 focus:bg-white px-2 py-0.5 rounded-sm border border-transparent bg-transparent transition-all w-20 focus:outline-hidden ${
                                    row.isRemediated ? 'line-through text-slate-400 decoration-orange-600 decoration-1.5' : ''
                                  }`}
                                />
                                <span className="text-[10px] text-slate-300">/ {maxOld}</span>
                              </div>
                              {row.isRemediated && (
                                <motion.span 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="self-start inline-flex items-center rounded-md bg-orange-50 px-1.5 py-0.5 text-[8px] font-bold text-orange-700 border border-orange-100 mt-0.5 select-none whitespace-nowrap"
                                >
                                  Auto Boost → Min ({minNew})
                                </motion.span>
                              )}
                            </div>
                          </td>

                          {/* Computed New Score */}
                          <td className="py-3 px-4 font-bold font-mono text-slate-800 text-sm">
                            {finalNewScore}
                          </td>

                          {/* Pass/Fail badge indicator */}
                          <td className="py-3 px-4">
                            {row.isPassed ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                Lulus
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                Gagal
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleRemoveRow(row.id)}
                              className="cursor-pointer text-slate-300 hover:text-rose-600 transition-all p-1 hover:bg-rose-50 rounded-md"
                              title="Hapus baris siswa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        Tabel masih kosong. Tambah baris manual di samping atau gunakan tombol "Tempel Data Excel" di atas untuk mengimpor daftar nilai Anda.
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {students.length > 0 && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-50">
              <p>💡 Tip: Anda dapat langsung menyunting (double-click/edit) **Nama** dan **Nilai Asli** langsung dari baris tabel!</p>
              <button 
                onClick={handleLoadDemo} 
                className="cursor-pointer text-indigo-500 hover:underline font-semibold"
              >
                Gunakan Data Contoh Ulang
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
