import { ScaleSettings, ScalePreset, StudentRow } from './types';

/**
 * Rescales an original score to a new range based on ScaleSettings.
 */
export function calculateNewScore(
  originalScore: number,
  settings: ScaleSettings
): number {
  const { minOld, maxOld, minNew, maxNew, decimals, roundingMode, clipValues, enableRemedial, remedialThreshold, remedialValue } = settings;

  if (enableRemedial && originalScore < remedialThreshold) {
    return minNew;
  }

  // Handle boundary case where maxOld equals minOld to prevent division by zero
  if (maxOld === minOld) {
    return minNew;
  }

  // Linear scaling formula:
  // result = minNew + ((original - minOld) / (maxOld - minOld)) * (maxNew - minNew)
  let result = minNew + ((originalScore - minOld) / (maxOld - minOld)) * (maxNew - minNew);

  // Clip values if requested
  if (clipValues) {
    const minCalculated = Math.min(minNew, maxNew);
    const maxCalculated = Math.max(minNew, maxNew);
    if (result < minCalculated) result = minCalculated;
    if (result > maxCalculated) result = maxCalculated;
  }

  // Apply rounding based on configurations
  let finalValue = result;
  
  if (decimals === 'flat') {
    if (roundingMode === 'round') finalValue = Math.round(result);
    else if (roundingMode === 'floor') finalValue = Math.floor(result);
    else if (roundingMode === 'ceil') finalValue = Math.ceil(result);
  } else if (typeof decimals === 'number') {
    const factor = Math.pow(10, decimals);
    if (roundingMode === 'round') finalValue = Math.round(result * factor) / factor;
    else if (roundingMode === 'floor') finalValue = Math.floor(result * factor) / factor;
    else if (roundingMode === 'ceil') finalValue = Math.ceil(result * factor) / factor;
  } else {
    // Under 'none' option, keep the floating value or apply general rounding behavior
    if (roundingMode === 'floor') finalValue = Math.floor(result);
    else if (roundingMode === 'ceil') finalValue = Math.ceil(result);
    // for 'round' with 'none', we preserve accurate floating point with up to 4 decimal precision for UI sanity
    else finalValue = Math.round(result * 10000) / 10000;
  }

  return finalValue;
}

/**
 * Common presets for Indonesian grading scales
 */
export const SCALE_PRESETS: ScalePreset[] = [
  {
    id: 'kkm-booster',
    name: 'Dokrak Nilai (KKM 70 - 100)',
    description: 'Konversi nilai ujian 0-100 ke rentang 70-100 agar nilai terendah mencapai batas kelulusan KKM 70.',
    minOld: 0,
    maxOld: 100,
    minNew: 70,
    maxNew: 100,
    decimals: 1,
    roundingMode: 'round',
    clipValues: true,
    passingScoreNew: 70,
    enableRemedial: false,
    remedialThreshold: 40,
    remedialValue: 40,
  },
  {
    id: 'standard-to-gpa',
    name: 'Skala IPK Kuliah (1.00 - 4.00)',
    description: 'Penskalaan nilai akumulatif 0-100 menjadi skala Indeks Prestasi Kumulatif standar 1.00 sampai 4.00.',
    minOld: 0,
    maxOld: 100,
    minNew: 1,
    maxNew: 4,
    decimals: 2,
    roundingMode: 'round',
    clipValues: true,
    passingScoreNew: 2.0,
    enableRemedial: false,
    remedialThreshold: 40,
    remedialValue: 40,
  },
  {
    id: 'quiz-normalize',
    name: 'Normalisasi Kuis (Maks 60 ke 100)',
    description: 'Menyetarakan nilai kuis/tugas dengan nilai maksimum khusus (misal 60 poin) ke standar 100.',
    minOld: 0,
    maxOld: 60,
    minNew: 0,
    maxNew: 100,
    decimals: 'flat',
    roundingMode: 'round',
    clipValues: true,
    passingScoreNew: 70,
    enableRemedial: false,
    remedialThreshold: 20,
    remedialValue: 20,
  },
  {
    id: 'scale-ten',
    name: 'Skala 1 - 10',
    description: 'Mengubah nilai 0-100 menjadi skala nilai puluhan sederhana 1.0 hingga 10.0.',
    minOld: 0,
    maxOld: 100,
    minNew: 1,
    maxNew: 10,
    decimals: 1,
    roundingMode: 'round',
    clipValues: true,
    passingScoreNew: 6.0,
    enableRemedial: false,
    remedialThreshold: 40,
    remedialValue: 40,
  },
  {
    id: 'inverse-ranking',
    name: 'Pembalikan Skala (Inverse)',
    description: 'Membalikkan skala: Nilai asli 0 menjadi nilai baru 100, dan nilai asli 100 menjadi 0.',
    minOld: 0,
    maxOld: 100,
    minNew: 100,
    maxNew: 0,
    decimals: 'flat',
    roundingMode: 'round',
    clipValues: true,
    passingScoreNew: 50, // lower numerical may be better in inverse, standard threshold mid-value
    enableRemedial: false,
    remedialThreshold: 30,
    remedialValue: 30,
  }
];

/**
 * Sample student mock data for quick demo runs
 */
export const SAMPLE_STUDENTS: StudentRow[] = [
  { id: '1', name: 'Ahmad Faisal', originalScore: 45 },
  { id: '2', name: 'Budi Santoso', originalScore: 68 },
  { id: '3', name: 'Citra Kirana', originalScore: 82 },
  { id: '4', name: 'Dina Lestari', originalScore: 92 },
  { id: '5', name: 'Edi Wibowo', originalScore: 50 },
  { id: '6', name: 'Farhan Setiawan', originalScore: 35 },
  { id: '7', name: 'Gita Permata', originalScore: 75 },
  { id: '8', name: 'Hendri Wijaya', originalScore: 88 },
  { id: '9', name: 'Indah Kusuma', originalScore: 61 },
  { id: '10', name: 'Joko Susilo', originalScore: 58 },
];

/**
 * Parses multiple lines of string representing spreadsheet copies (Excel/Google Sheets)
 * Recognizes delimiters like tabs, commas, semi-colons, and retrieves values
 */
export function parseClipboardData(text: string, startIndex: number = 1): StudentRow[] {
  if (!text || !text.trim()) return [];

  const lines = text.split(/\r?\n/);
  const rows: StudentRow[] = [];
  let currentIdx = startIndex;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Split on typical delimiters: Tab, comma, semicolon
    let parts = trimmed.split(/\t/);
    if (parts.length <= 1) {
      parts = trimmed.split(/[,;]/);
    }

    // Filter parts
    const cleanParts = parts.map(p => p.trim()).filter(p => p !== '');

    if (cleanParts.length === 0) continue;

    let name = '';
    let score = 0;

    if (cleanParts.length === 1) {
      // Just a number
      const parsedNum = parseFloat(cleanParts[0].replace(',', '.'));
      if (!isNaN(parsedNum)) {
        name = `Siswa #${currentIdx++}`;
        score = parsedNum;
      } else {
        // Just text, skip or parse as 0
        name = cleanParts[0];
        score = 0;
      }
    } else {
      // Multiple items. Let's find the numeric score.
      // Usually, the score is on the last column or the second column.
      let scoreFound = false;
      
      // Look from the right side for the first parsable number
      for (let i = cleanParts.length - 1; i >= 0; i--) {
        const parsed = parseFloat(cleanParts[i].replace(',', '.'));
        if (!isNaN(parsed)) {
          score = parsed;
          // Combine previous parts as name
          name = cleanParts.slice(0, i).concat(cleanParts.slice(i + 1)).join(' ');
          scoreFound = true;
          break;
        }
      }

      if (!scoreFound) {
        name = cleanParts.join(' ');
        score = 0;
      }
    }

    // Clean up name if too generic or empty
    if (!name || name.trim() === '') {
      name = `Siswa #${currentIdx++}`;
    }

    rows.push({
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      originalScore: score,
    });
  }

  return rows;
}
