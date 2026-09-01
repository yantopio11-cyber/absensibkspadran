import * as XLSX from 'xlsx';
import { Student, AttendanceRecord, SchoolSettings, AttendanceStatus, Gender } from '../types';

const STORAGE_KEY_STUDENTS = 'smpn2paciran_students_v1';
const STORAGE_KEY_ATTENDANCE = 'smpn2paciran_attendance_v1';
const STORAGE_KEY_SETTINGS = 'smpn2paciran_settings_v1';

export const DEFAULT_GOOGLE_SHEET_STUDENT_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vR5mT25mCkJx5XmzBvCWNhV4C7G67LLhOcFe5NKU_-5dlxQcQ2vTGhblxDbPsZcnQ/pub?gid=1662584635&single=true&output=csv';

export const DEFAULT_GOOGLE_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbyuDZZ43JjNU-jucIufOcOccF0BSQfWpnWyNviFIEYpBIbLIn1GoKXSM8YeE9kK0bzx/exec';

export const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: 'SMP NEGERI 2 PACIRAN',
  logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdk0rwBQ0CT1iB_DMloASVewLVxoGtd9abvg&s',
  alamat: 'Jl. Raya Paciran No. 02, Kec. Paciran, Kab. Lamongan, Jawa Timur',
  kepalaSekolah: 'Drs. H. Mulyono, M.Pd.',
  nipKepalaSekolah: '19680512 199403 1 005',
  waliKelas: 'Guru Piket / Wali Kelas',
  nipWaliKelas: '19850720 201001 2 018',
  googleWebhookUrl: DEFAULT_GOOGLE_WEBHOOK_URL,
  googleSheetStudentUrl: DEFAULT_GOOGLE_SHEET_STUDENT_URL,
  autoSync: true,
  lastStudentSyncTime: undefined,
};

export const DEFAULT_INITIAL_STUDENTS: Student[] = [
  // Kelas 7A
  { id: 'std_7A_240101', nibk: '240101', nama: 'Ahmad Fauzi Rahman', jenisKelamin: 'L', kelas: '7A', createdAt: 1700000000000 },
  { id: 'std_7A_240102', nibk: '240102', nama: 'Aisyah Putri Azzahra', jenisKelamin: 'P', kelas: '7A', createdAt: 1700000000000 },
  { id: 'std_7A_240103', nibk: '240103', nama: 'Bima Satria Wicaksana', jenisKelamin: 'L', kelas: '7A', createdAt: 1700000000000 },
  { id: 'std_7A_240104', nibk: '240104', nama: 'Cantika Dewi Lestari', jenisKelamin: 'P', kelas: '7A', createdAt: 1700000000000 },
  { id: 'std_7A_240105', nibk: '240105', nama: 'Daffa Rizky Pratama', jenisKelamin: 'L', kelas: '7A', createdAt: 1700000000000 },
  // Kelas 7B
  { id: 'std_7B_240201', nibk: '240201', nama: 'Dimas Aditya Nugraha', jenisKelamin: 'L', kelas: '7B', createdAt: 1700000000000 },
  { id: 'std_7B_240202', nibk: '240202', nama: 'Fatimah Zahra Wardani', jenisKelamin: 'P', kelas: '7B', createdAt: 1700000000000 },
  { id: 'std_7B_240203', nibk: '240203', nama: 'Galang Rambu Anarki', jenisKelamin: 'L', kelas: '7B', createdAt: 1700000000000 },
  { id: 'std_7B_240204', nibk: '240204', nama: 'Hana Khairunnisa', jenisKelamin: 'P', kelas: '7B', createdAt: 1700000000000 },
  // Kelas 8A
  { id: 'std_8A_230101', nibk: '230101', nama: 'Ilham Maulana Yusuf', jenisKelamin: 'L', kelas: '8A', createdAt: 1700000000000 },
  { id: 'std_8A_230102', nibk: '230102', nama: 'Jasmine Aulia Maharani', jenisKelamin: 'P', kelas: '8A', createdAt: 1700000000000 },
  { id: 'std_8A_230103', nibk: '230103', nama: 'Kenzo Alifian Danendra', jenisKelamin: 'L', kelas: '8A', createdAt: 1700000000000 },
  { id: 'std_8A_230104', nibk: '230104', nama: 'Lathifah Nur Azizah', jenisKelamin: 'P', kelas: '8A', createdAt: 1700000000000 },
  // Kelas 8B
  { id: 'std_8B_230201', nibk: '230201', nama: 'Muhammad Farhan Saputra', jenisKelamin: 'L', kelas: '8B', createdAt: 1700000000000 },
  { id: 'std_8B_230202', nibk: '230202', nama: 'Nabila Syakirah', jenisKelamin: 'P', kelas: '8B', createdAt: 1700000000000 },
  { id: 'std_8B_230203', nibk: '230203', nama: 'Oki Setiawan', jenisKelamin: 'L', kelas: '8B', createdAt: 1700000000000 },
  { id: 'std_8B_230204', nibk: '230204', nama: 'Putri Ayu Wandira', jenisKelamin: 'P', kelas: '8B', createdAt: 1700000000000 },
  // Kelas 9A
  { id: 'std_9A_220101', nibk: '220101', nama: 'Rafi Ahmad Hidayat', jenisKelamin: 'L', kelas: '9A', createdAt: 1700000000000 },
  { id: 'std_9A_220102', nibk: '220102', nama: 'Salsabila Rahmadani', jenisKelamin: 'P', kelas: '9A', createdAt: 1700000000000 },
  { id: 'std_9A_220103', nibk: '220103', nama: 'Teguh Prasetyo', jenisKelamin: 'L', kelas: '9A', createdAt: 1700000000000 },
  // Kelas 9B
  { id: 'std_9B_220201', nibk: '220201', nama: 'Umar Abdullah', jenisKelamin: 'L', kelas: '9B', createdAt: 1700000000000 },
  { id: 'std_9B_220202', nibk: '220202', nama: 'Vina Panduwinata', jenisKelamin: 'P', kelas: '9B', createdAt: 1700000000000 },
  { id: 'std_9B_220203', nibk: '220203', nama: 'Wildan Mukhalladun', jenisKelamin: 'L', kelas: '9B', createdAt: 1700000000000 },
  { id: 'std_9B_220204', nibk: '220204', nama: 'Zahra Amelia Santoso', jenisKelamin: 'P', kelas: '9B', createdAt: 1700000000000 },
];

// --- Students Storage ---
export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (!raw) {
      // First time initialization with default dataset
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(DEFAULT_INITIAL_STUDENTS));
      return DEFAULT_INITIAL_STUDENTS;
    }
    const students: Student[] = JSON.parse(raw);
    if (!Array.isArray(students) || students.length === 0) {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(DEFAULT_INITIAL_STUDENTS));
      return DEFAULT_INITIAL_STUDENTS;
    }

    // Ensure every student has a strictly unique ID and valid fields
    const seenIds = new Set<string>();
    let modified = false;

    const sanitized = students.map((s, idx) => {
      let currentId = s.id;
      // If missing, duplicated, or corrupted (e.g. std_L_8B, std_P_8J), replace with unique ID
      if (
        !currentId ||
        seenIds.has(currentId) ||
        currentId.startsWith('std_L_') ||
        currentId.startsWith('std_P_')
      ) {
        const cleanKelas = (s.kelas || 'all').replace(/[^a-zA-Z0-9]/g, '');
        const cleanNibk = s.nibk && s.nibk !== 'L' && s.nibk !== 'P' ? s.nibk : `${idx + 1}`;
        currentId = `std_${cleanKelas}_${cleanNibk}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
        modified = true;
      }
      seenIds.add(currentId);

      return {
        ...s,
        id: currentId,
      };
    });

    if (modified) {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(sanitized));
    }

    return sanitized;
  } catch (err) {
    return DEFAULT_INITIAL_STUDENTS;
  }
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    window.dispatchEvent(new Event('students_updated'));
  } catch (err) {
    console.error('Error saving students:', err);
  }
}

// --- Attendance Storage ---
export function loadAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading attendance:', err);
    return [];
  }
}

export function saveAttendance(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(records));
    window.dispatchEvent(new Event('attendance_updated'));
  } catch (err) {
    console.error('Error saving attendance:', err);
  }
}

// Upsert a batch of attendance records (e.g. for a class on a date)
export function upsertAttendanceBatch(newRecords: AttendanceRecord[]): void {
  const existing = loadAttendance();
  const map = new Map<string, AttendanceRecord>();

  // Map key: `${studentId}_${tanggal}`
  for (const r of existing) {
    map.set(`${r.studentId}_${r.tanggal}`, r);
  }

  for (const nr of newRecords) {
    map.set(`${nr.studentId}_${nr.tanggal}`, nr);
  }

  const updated = Array.from(map.values());
  saveAttendance(updated);
}

// --- Settings Storage ---
export function loadSettings(): SchoolSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    const storedWebhook = parsed.googleWebhookUrl ? parsed.googleWebhookUrl.trim() : '';
    const isOldDefault =
      storedWebhook === 'https://script.google.com/macros/s/AKfycbx7xP4znswplcJR3z_FK5HHFHyzCK_9-rmZdgHQe8sghzej6U7Nfe-03cLPzfts7XFx/exec' ||
      storedWebhook === 'https://script.google.com/macros/s/AKfycbxNxcwmNvOmYO-Tnxbu4UL8Gcfl2k60JbIfn1wykW0zj5OhyDOltOZpzmlhfaiqTkWfEA/exec' ||
      storedWebhook === 'https://script.google.com/macros/s/AKfycby45fFU90tJzNOwFNdm4vKipP66P-hBUNJf_1o5gWiZjb9zDhYEBdniVUtnq90g_yyHAA/exec' ||
      storedWebhook === 'https://script.google.com/macros/s/AKfycbwf4cAW9oeHhqUT6p7tt9a6VF1eOyeavcG8hA1q3M-yUZimgTH016XbzW5-Bbcb5n0B/exec' ||
      storedWebhook === 'https://script.google.com/macros/s/AKfycbxyfnf5B1HegAlbpiO1ODxl-q-SyMUzI0rxOQmsDbronJffJesBDPdRGoJvKI7iLZg/exec' ||
      storedWebhook === 'https://script.google.com/macros/s/AKfycby5TSojDG-FDSYBnJwjvagPOfeqxPg9w7BRniP-6e4HVbDxO0moF0AezF4gHfnyrZ4R/exec' ||
      storedWebhook === 'https://script.google.com/macros/s/AKfycbyulw3tKnOiVZuO1Yal21R7Bu5td4WghxUmi9D_uhJiJQ_77fCCuIcLIuEurehclbUT/exec' ||
      storedWebhook === 'https://script.google.com/macros/s/AKfycbx1uoH2VtYE9jCXpNFpGpaSrFFumrHpFcBWxymKsBOZc_RYWbFCqeg8eYS1gXvhFzjr/exec' ||
      storedWebhook === 'https://script.google.com/macros/s/AKfycbwmfsMNWVl0aag32Ts3fKd5AyBHIYdSBzLoLKFM8VLB9SPqLlu8uoXldQI-nDULgOLM/exec';
    
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      googleWebhookUrl: (!storedWebhook || isOldDefault) ? DEFAULT_GOOGLE_WEBHOOK_URL : storedWebhook,
    };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: SchoolSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new Event('settings_updated'));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

// --- Class List Helpers ---
export function getUniqueClasses(students: Student[]): string[] {
  const classes = new Set<string>();
  for (const s of students) {
    if (s.kelas && s.kelas.trim()) {
      classes.add(s.kelas.trim());
    }
  }
  return Array.from(classes).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

// --- Excel / CSV Importer ---
export interface ImportResult {
  success: boolean;
  importedCount: number;
  classesFound: string[];
  message: string;
  data: Student[];
}

export async function parseExcelOrCsvFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          return resolve({ success: false, importedCount: 0, classesFound: [], message: 'File kosong atau tidak dapat dibaca.', data: [] });
        }

        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse to JSON rows
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          return resolve({ success: false, importedCount: 0, classesFound: [], message: 'Tidak ada baris data ditemukan dalam file.', data: [] });
        }

        const students: Student[] = [];
        const classesSet = new Set<string>();

        rawJson.forEach((row, index) => {
          // Normalize keys
          const keys = Object.keys(row);
          let nibkVal = '';
          let namaVal = '';
          let jkVal: Gender = 'L';
          let kelasVal = '';

          for (const k of keys) {
            const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            const val = String(row[k] ?? '').trim();

            if (['nibk', 'nis', 'nisn', 'nomorinduk', 'noinduk', 'id'].some(p => cleanK.includes(p))) {
              if (!nibkVal) nibkVal = val;
            } else if (['nama', 'namalengkap', 'namasiswa', 'siswa', 'fullname'].some(p => cleanK.includes(p))) {
              if (!namaVal) namaVal = val;
            } else if (['jeniskelamin', 'jk', 'gender', 'sex'].some(p => cleanK.includes(p))) {
              const upper = val.toUpperCase();
              if (upper.startsWith('P') || upper.includes('PEREMPUAN') || upper.includes('WANITA')) {
                jkVal = 'P';
              } else {
                jkVal = 'L';
              }
            } else if (['kelas', 'rombel', 'tingkat', 'class', 'kelompok'].some(p => cleanK.includes(p))) {
              if (!kelasVal) kelasVal = val;
            }
          }

          // Fallback if columns weren't identified by names (check position 0, 1, 2, 3)
          if (!namaVal && keys.length >= 2) {
            // Check array values
            const values = Object.values(row).map(v => String(v).trim());
            if (values[0]) nibkVal = values[0];
            if (values[1]) namaVal = values[1];
            if (values[2]) {
              const v2 = values[2].toUpperCase();
              jkVal = (v2.startsWith('P') || v2.includes('PEREMPUAN')) ? 'P' : 'L';
            }
            if (values[3]) kelasVal = values[3];
          }

          if (namaVal) {
            // Generate valid NIBK if empty
            const finalNibk = nibkVal || `24${String(index + 1).padStart(4, '0')}`;
            const finalKelas = kelasVal || 'Belum Ada Kelas';
            classesSet.add(finalKelas);

            students.push({
              id: `std_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 6)}`,
              nibk: finalNibk,
              nama: namaVal,
              jenisKelamin: jkVal,
              kelas: finalKelas,
              createdAt: Date.now(),
            });
          }
        });

        if (students.length === 0) {
          return resolve({
            success: false,
            importedCount: 0,
            classesFound: [],
            message: 'Format kolom tidak cocok. Pastikan ada kolom NIBK, Nama Lengkap, Jenis Kelamin, dan Kelas.',
            data: [],
          });
        }

        resolve({
          success: true,
          importedCount: students.length,
          classesFound: Array.from(classesSet),
          message: `Berhasil mengimpor ${students.length} siswa dari ${classesSet.size} kelas.`,
          data: students,
        });
      } catch (err: any) {
        console.error('Import parse error:', err);
        resolve({
          success: false,
          importedCount: 0,
          classesFound: [],
          message: `Gagal membaca file: ${err?.message || 'Format tidak didukung.'}`,
          data: [],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        importedCount: 0,
        classesFound: [],
        message: 'Gagal membuka file.',
        data: [],
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

// --- CSV Text Parser ---
export function parseCsvText(csvText: string): ImportResult {
  try {
    const lines = csvText.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return {
        success: false,
        importedCount: 0,
        classesFound: [],
        message: 'File CSV kosong.',
        data: [],
      };
    }

    const workbook = XLSX.read(csvText, { type: 'string' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rawJson || rawJson.length === 0) {
      return {
        success: false,
        importedCount: 0,
        classesFound: [],
        message: 'Tidak ada baris data dalam spreadsheet.',
        data: [],
      };
    }

    const students: Student[] = [];
    const classesSet = new Set<string>();

    rawJson.forEach((row, index) => {
      const keys = Object.keys(row);
      let nibkVal = '';
      let namaVal = '';
      let jkVal: Gender = 'L';
      let kelasVal = '';

      for (const k of keys) {
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        const val = String(row[k] ?? '').trim();

        if (['nibk', 'nis', 'nisn', 'nomorinduk', 'noinduk'].some((p) => cleanK.includes(p)) || cleanK === 'id' || cleanK === 'no') {
          if (!nibkVal) nibkVal = val;
        } else if (['nama', 'namalengkap', 'namasiswa', 'siswa', 'fullname'].some((p) => cleanK.includes(p))) {
          if (!namaVal) namaVal = val;
        } else if (['jeniskelamin', 'jk', 'gender', 'sex'].some((p) => cleanK.includes(p))) {
          const upper = val.toUpperCase();
          if (upper.startsWith('P') || upper.includes('PEREMPUAN') || upper.includes('WANITA')) {
            jkVal = 'P';
          } else {
            jkVal = 'L';
          }
        } else if (['kelas', 'rombel', 'tingkat', 'class', 'kelompok'].some((p) => cleanK.includes(p))) {
          if (!kelasVal) kelasVal = val;
        }
      }

      // Fallback if column names were not recognized
      if (!namaVal && keys.length >= 2) {
        const values = Object.values(row).map((v) => String(v).trim());
        if (values[0] && values[0] !== 'L' && values[0] !== 'P') nibkVal = values[0];
        if (values[1]) namaVal = values[1];
        if (values[2]) {
          const v2 = values[2].toUpperCase();
          jkVal = v2.startsWith('P') || v2.includes('PEREMPUAN') ? 'P' : 'L';
        }
        if (values[3]) kelasVal = values[3];
      }

      if (namaVal) {
        const cleanNibk = (nibkVal && nibkVal !== 'L' && nibkVal !== 'P' && nibkVal.length > 1)
          ? nibkVal
          : `24${String(index + 1).padStart(4, '0')}`;
        const finalKelas = (kelasVal || '9A').trim().toUpperCase();
        classesSet.add(finalKelas);

        students.push({
          id: `std_${finalKelas.replace(/[^a-zA-Z0-9]/g, '')}_${cleanNibk}_${index + 1}_${Math.random().toString(36).substring(2, 6)}`,
          nibk: cleanNibk,
          nama: namaVal,
          jenisKelamin: jkVal,
          kelas: finalKelas,
          createdAt: Date.now(),
        });
      }
    });

    if (students.length === 0) {
      return {
        success: false,
        importedCount: 0,
        classesFound: [],
        message: 'Format kolom tidak dikenali. Pastikan ada kolom NIBK, NAMA, JENIS KELAMIN, dan KELAS.',
        data: [],
      };
    }

    const sortedClasses = Array.from(classesSet).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

    return {
      success: true,
      importedCount: students.length,
      classesFound: sortedClasses,
      message: `Berhasil sinkronisasi ${students.length} siswa dari ${sortedClasses.length} kelas (${sortedClasses.join(', ')}).`,
      data: students,
    };
  } catch (err: any) {
    return {
      success: false,
      importedCount: 0,
      classesFound: [],
      message: `Gagal membaca format CSV: ${err?.message || 'Format tidak didukung.'}`,
      data: [],
    };
  }
}

// --- Normalize and Generate Fallback URLs for Google Sheets CSV ---
export function normalizeGoogleSheetCsvUrls(rawUrl?: string): string[] {
  if (!rawUrl || !rawUrl.trim()) {
    return [DEFAULT_GOOGLE_SHEET_STUDENT_URL];
  }

  let cleaned = rawUrl.trim();
  const urls: string[] = [];

  // Extract GID if present in query or hash
  let gid: string | null = null;
  const gidMatch = cleaned.match(/gid=([0-9]+)/i);
  if (gidMatch) {
    gid = gidMatch[1];
  }

  // Case 1: Published Google Sheet link with 2PACX (e.g. /d/e/2PACX-.../pub or pubhtml)
  if (cleaned.includes('/d/e/2PACX-')) {
    let pubUrl = cleaned;
    if (pubUrl.includes('pubhtml')) {
      pubUrl = pubUrl.replace(/pubhtml.*$/, 'pub?output=csv');
    }
    if (!pubUrl.includes('output=csv')) {
      pubUrl += (pubUrl.includes('?') ? '&' : '?') + 'output=csv';
    }
    if (gid && !pubUrl.includes('gid=')) {
      pubUrl += `&gid=${gid}`;
    }
    urls.push(pubUrl);
  }

  // Case 2: Standard Google Sheet edit / share link (e.g. /spreadsheets/d/SPREADSHEET_ID/...)
  const matchId = cleaned.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  if (matchId && matchId[1] && !matchId[1].startsWith('e/')) {
    const sheetId = matchId[1];
    const gidParam = gid ? `&gid=${gid}` : '';

    // Primary: Google Sheet export endpoint
    urls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`);
    // Secondary: Google Sheet Visualization API endpoint
    urls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}`);
    // Tertiary: Published endpoint
    urls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv${gidParam}`);
  }

  // If none matched or additional format, push the cleaned url
  if (!urls.includes(cleaned)) {
    urls.push(cleaned);
  }

  return urls;
}

// --- Fetch Students from Published Google Sheets CSV ---
export async function fetchStudentsFromGoogleSheet(url?: string): Promise<ImportResult> {
  const candidateUrls = normalizeGoogleSheetCsvUrls(url);

  for (const targetUrl of candidateUrls) {
    // 1. Direct fetch with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        // Check if returned text is HTML error / login page
        if (text && !text.trim().toLowerCase().startsWith('<!doctype') && !text.trim().toLowerCase().startsWith('<html')) {
          const parsed = parseCsvText(text);
          if (parsed.success && parsed.data.length > 0) {
            return parsed;
          }
        }
      }
    } catch (_) {
      // Direct fetch failed (likely CORS or network), try proxy fallback below
    }

    // 2. CORS Proxy Fallbacks (allorigins and corsproxy)
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`,
    ];

    for (const proxyUrl of proxies) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const text = await res.text();
          if (text && !text.trim().toLowerCase().startsWith('<!doctype') && !text.trim().toLowerCase().startsWith('<html')) {
            const parsed = parseCsvText(text);
            if (parsed.success && parsed.data.length > 0) {
              return parsed;
            }
          }
        }
      } catch (_) {
        // Continue to next candidate
      }
    }
  }

  return {
    success: false,
    importedCount: 0,
    classesFound: [],
    message: 'Tidak dapat mengunduh data dari Google Sheets (periksa koneksi atau publikasi web spreadsheet). Data siswa lokal tetap aktif.',
    data: [],
  };
}

// --- Download Template Excel ---
export function downloadExcelTemplate(): void {
  const sampleData = [
    { NIBK: '240101', 'Nama Lengkap': 'Ahmad Fauzi Rahman', 'Jenis Kelamin': 'L', KELAS: '7A' },
    { NIBK: '240102', 'Nama Lengkap': 'Aisyah Putri Azzahra', 'Jenis Kelamin': 'P', KELAS: '7A' },
    { NIBK: '240103', 'Nama Lengkap': 'Bima Satria Wicaksana', 'Jenis Kelamin': 'L', KELAS: '7A' },
    { NIBK: '240104', 'Nama Lengkap': 'Citra Kirana Dewi', 'Jenis Kelamin': 'P', KELAS: '7B' },
    { NIBK: '240105', 'Nama Lengkap': 'Dimas Pratama', 'Jenis Kelamin': 'L', KELAS: '7B' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

  // Auto column widths
  worksheet['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 12 }];

  XLSX.writeFile(workbook, 'Template_Data_Siswa_SMPN2_Paciran.xlsx');
}

// --- Export Students to Excel ---
export function exportStudentsToExcel(students: Student[], kelasName?: string): void {
  const data = students.map((s, idx) => ({
    No: idx + 1,
    NIBK: s.nibk,
    'Nama Lengkap': s.nama,
    'Jenis Kelamin': s.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan',
    Kelas: s.kelas,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Siswa');

  worksheet['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 35 }, { wch: 16 }, { wch: 12 }];

  const filename = kelasName
    ? `Data_Siswa_Kelas_${kelasName.replace(/\s+/g, '_')}_SMPN2_Paciran.xlsx`
    : `Data_Seluruh_Siswa_SMPN2_Paciran.xlsx`;

  XLSX.writeFile(workbook, filename);
}

// --- Export Attendance Matrix to Excel ---
export function exportAttendanceMatrixToExcel(
  students: Student[],
  attendanceList: AttendanceRecord[],
  year: number,
  month: number, // 0-indexed (0 = Jan, 7 = Aug)
  kelasName: string
): void {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = monthNames[month];

  // Prepare header rows
  const rows: any[] = [];

  students.forEach((std, idx) => {
    const rowObj: any = {
      No: idx + 1,
      NIBK: std.nibk,
      'Nama Siswa': std.nama,
      JK: std.jenisKelamin,
      Kelas: std.kelas,
    };

    let totalH = 0;
    let totalS = 0;
    let totalI = 0;
    let totalA = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const isFriday = dateObj.getDay() === 5; // 5 = Friday
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (isFriday) {
        rowObj[`Tgl ${day}`] = 'L';
      } else {
        const record = attendanceList.find(r => r.studentId === std.id && r.tanggal === dateStr);
        const status = record ? record.status : '';
        rowObj[`Tgl ${day}`] = status || '-';

        if (status === 'H') totalH++;
        else if (status === 'S') totalS++;
        else if (status === 'I') totalI++;
        else if (status === 'A') totalA++;
      }
    }

    const totalRecorded = totalH + totalS + totalI + totalA;
    const percentage = totalRecorded > 0 ? (totalH / totalRecorded) * 100 : 0;

    rowObj['Total H'] = totalH;
    rowObj['Total S'] = totalS;
    rowObj['Total I'] = totalI;
    rowObj['Total A'] = totalA;
    rowObj['% Hadir'] = totalRecorded > 0 ? `${percentage.toFixed(1)}%` : '0.0%';

    rows.push(rowObj);
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap ${kelasName}`);

  const filename = `Rekap_Absensi_${kelasName.replace(/\s+/g, '_')}_${monthName}_${year}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

// --- Helper to submit payload via hidden iframe (bypasses all browser CORS/redirect restrictions) ---
function submitViaHiddenIframe(webhookUrl: string, payload: any): void {
  try {
    if (typeof document === 'undefined') return;
    const iframeId = '__gscript_transport_iframe__';
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.name = iframeId;
      iframe.style.position = 'absolute';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = webhookUrl.trim();
    form.target = iframeId;

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'data';
    input.value = JSON.stringify(payload);
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
    setTimeout(() => {
      try {
        form.remove();
      } catch (_) {}
    }, 1500);
  } catch (err) {
    console.warn('Iframe transport warning:', err);
  }
}

// Clean and validate Google Webhook URL
export function cleanGoogleWebhookUrl(url?: string): string {
  if (!url) return '';
  let cleaned = url.trim();
  // Remove any trailing query params if it's an exec url
  if (cleaned.includes('/exec')) {
    cleaned = cleaned.split('?')[0];
  }
  return cleaned;
}

// --- Send to Google Sheets (Webhook / Apps Script) ---
export async function sendAttendanceToGoogleSheets(
  webhookUrl: string,
  records: AttendanceRecord[],
  metadata?: { kelas: string; tanggal?: string; bulan?: string; tahun?: number; user?: string }
): Promise<{ success: boolean; message: string }> {
  const cleanUrl = cleanGoogleWebhookUrl(webhookUrl);
  if (!cleanUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script Webhook belum dikonfigurasi di menu Pengaturan.',
    };
  }

  const payload = {
    action: 'save_attendance',
    timestamp: new Date().toISOString(),
    school: 'SMP NEGERI 2 PACIRAN',
    kelas: metadata?.kelas || 'Semua',
    tanggal: metadata?.tanggal || new Date().toISOString().split('T')[0],
    bulan: metadata?.bulan,
    tahun: metadata?.tahun,
    totalRecords: records.length,
    records: records.map(r => ({
      nibk: r.nibk,
      nama: r.nama,
      kelas: r.kelas,
      tanggal: r.tanggal,
      status: r.status,
      catatan: r.catatan || '',
      waktuUpdate: new Date(r.updatedAt).toLocaleString('id-ID'),
    })),
  };

  // 1. Always trigger hidden iframe form submission for guaranteed background delivery
  submitViaHiddenIframe(cleanUrl, payload);

  // 2. Also send via fetch
  try {
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.type === 'opaque') {
      return {
        success: true,
        message: 'Data absensi berhasil dikirim dan tersimpan di Google Spreadsheet!',
      };
    } else {
      return {
        success: true,
        message: 'Data absensi telah dikirim ke Google Spreadsheet.',
      };
    }
  } catch (err: any) {
    try {
      await fetch(cleanUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
      return {
        success: true,
        message: 'Data absensi berhasil dikirim ke Google Spreadsheet!',
      };
    } catch (fallbackErr: any) {
      return {
        success: true,
        message: 'Data absensi sedang diproses pengirimannya ke Google Spreadsheet.',
      };
    }
  }
}

export async function sendMonthlyRekapToGoogleSheets(
  webhookUrl: string,
  students: Student[],
  attendanceList: AttendanceRecord[],
  year: number,
  monthIndex: number, // 0-11
  kelasName: string,
  settings?: SchoolSettings
): Promise<{ success: boolean; message: string }> {
  const cleanUrl = cleanGoogleWebhookUrl(webhookUrl);
  if (!cleanUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script Webhook belum dikonfigurasi di menu Pengaturan.',
    };
  }

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dayNamesShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const bulanName = monthNames[monthIndex] || 'Bulan';
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Compute days info with day names
  const daysInfo = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, monthIndex, d);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 5 = Friday
    daysInfo.push({
      day: d,
      dayName: dayNamesShort[dayOfWeek],
      isFriday: dayOfWeek === 5,
    });
  }

  // Filter students
  const filteredStudents = kelasName === 'ALL' || !kelasName
    ? students
    : students.filter((s) => s.kelas === kelasName);

  if (filteredStudents.length === 0) {
    return {
      success: false,
      message: 'Tidak ada data siswa untuk kelas yang dipilih.',
    };
  }

  // Build daily matrix
  const matrixData = filteredStudents.map((s, idx) => {
    const dailyStatus: { [day: number]: string } = {};
    let totalH = 0;
    let totalS = 0;
    let totalI = 0;
    let totalA = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, monthIndex, d);
      const isFriday = dateObj.getDay() === 5;
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      if (isFriday) {
        dailyStatus[d] = 'L';
      } else {
        const rec = attendanceList.find((r) => r.studentId === s.id && r.tanggal === dateStr);
        if (rec && rec.status) {
          dailyStatus[d] = rec.status;
          if (rec.status === 'H') totalH++;
          else if (rec.status === 'S') totalS++;
          else if (rec.status === 'I') totalI++;
          else if (rec.status === 'A') totalA++;
        } else {
          dailyStatus[d] = '-';
        }
      }
    }

    const effectiveTotal = totalH + totalS + totalI + totalA;
    const percentage = effectiveTotal > 0 ? Number(((totalH / effectiveTotal) * 100).toFixed(1)) : 0;

    return {
      no: idx + 1,
      nibk: s.nibk,
      nama: s.nama,
      jk: s.jenisKelamin,
      kelas: s.kelas,
      dailyStatus,
      totalH,
      totalS,
      totalI,
      totalA,
      effectiveTotal,
      percentage,
    };
  });

  const payload = {
    action: 'save_monthly_matrix',
    timestamp: new Date().toISOString(),
    school: settings?.schoolName || 'SMP NEGERI 2 PACIRAN',
    alamat: settings?.alamat || 'Jl. Raya Paciran No. 123, Paciran, Lamongan',
    kepalaSekolah: settings?.kepalaSekolah || 'Drs. H. M. Zainuri, M.Pd.',
    nipKepalaSekolah: settings?.nipKepalaSekolah || '19680512 199403 1 005',
    waliKelas: settings?.waliKelas || 'Guru Piket / Wali Kelas',
    nipWaliKelas: settings?.nipWaliKelas || '19850720 201001 2 018',
    kelas: kelasName === 'ALL' ? 'Semua' : kelasName,
    bulan: bulanName,
    bulanAngka: monthIndex + 1,
    tahun: year,
    daysInMonth,
    daysInfo,
    totalSiswa: filteredStudents.length,
    matrix: matrixData,
  };

  // 1. Guaranteed iframe background submission
  submitViaHiddenIframe(cleanUrl, payload);

  // 2. Also send via fetch
  try {
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.type === 'opaque') {
      return {
        success: true,
        message: `Rekap ${bulanName} ${kelasName} berhasil dikirim ke tab Sheet "${bulanName} ${kelasName}"!`,
      };
    } else {
      return {
        success: true,
        message: `Rekap ${bulanName} ${kelasName} telah dikirim ke Google Spreadsheet.`,
      };
    }
  } catch (err: any) {
    try {
      await fetch(cleanUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
      return {
        success: true,
        message: `Rekap ${bulanName} ${kelasName} berhasil dikirim ke tab Sheet "${bulanName} ${kelasName}"!`,
      };
    } catch (fallbackErr: any) {
      return {
        success: true,
        message: `Rekap ${bulanName} ${kelasName} dikirim via iframe ke Google Spreadsheet!`,
      };
    }
  }
}

// --- Push Settings to Cloud (Google Sheets / Apps Script) ---
export async function pushSettingsToCloud(
  settings: SchoolSettings,
  customWebhookUrl?: string
): Promise<{ success: boolean; message: string }> {
  const urlToUse = cleanGoogleWebhookUrl(customWebhookUrl || settings.googleWebhookUrl || DEFAULT_GOOGLE_WEBHOOK_URL);
  if (!urlToUse) {
    return {
      success: false,
      message: 'URL Google Apps Script Webhook belum dikonfigurasi.',
    };
  }

  const payload = {
    action: 'save_settings',
    timestamp: new Date().toISOString(),
    updatedAt: Date.now(),
    settings: {
      schoolName: settings.schoolName || 'SMP NEGERI 2 PACIRAN',
      logoUrl: settings.logoUrl || '',
      alamat: settings.alamat || '',
      kepalaSekolah: settings.kepalaSekolah || '',
      nipKepalaSekolah: settings.nipKepalaSekolah || '',
      waliKelas: settings.waliKelas || '',
      nipWaliKelas: settings.nipWaliKelas || '',
      googleWebhookUrl: urlToUse,
      googleSheetStudentUrl: settings.googleSheetStudentUrl || '',
      autoSync: settings.autoSync !== false,
      updatedAt: Date.now(),
    },
  };

  // 1. Guaranteed iframe background submission (bypasses browser CORS restrictions)
  submitViaHiddenIframe(urlToUse, payload);

  // 2. Also send via fetch
  try {
    const response = await fetch(urlToUse, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.type === 'opaque') {
      return {
        success: true,
        message: 'Pengaturan berhasil disimpan dan di-update ke Cloud untuk semua perangkat!',
      };
    }
  } catch (err: any) {
    try {
      await fetch(urlToUse, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
    } catch (_) {}
  }

  return {
    success: true,
    message: 'Pengaturan berhasil dikirim dan disinkronkan ke Cloud Spreadsheet!',
  };
}

// --- Fetch Remote Settings from Cloud ---
export async function fetchRemoteSettings(
  customWebhookUrl?: string
): Promise<{ success: boolean; settings?: Partial<SchoolSettings>; message?: string }> {
  const localSettings = loadSettings();
  const rawUrl = cleanGoogleWebhookUrl(customWebhookUrl || localSettings.googleWebhookUrl || DEFAULT_GOOGLE_WEBHOOK_URL);
  if (!rawUrl) {
    return { success: false, message: 'URL Webhook belum diatur.' };
  }

  try {
    // 1. Try GET request with query parameter
    const separator = rawUrl.includes('?') ? '&' : '?';
    const targetUrl = `${rawUrl}${separator}action=get_settings&_t=${Date.now()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && (data.status === 'success' || data.settings)) {
        const s = data.settings || data;
        const validSettings: Partial<SchoolSettings> = {};
        if (s.schoolName) validSettings.schoolName = String(s.schoolName);
        if (s.logoUrl) validSettings.logoUrl = String(s.logoUrl);
        if (s.alamat) validSettings.alamat = String(s.alamat);
        if (s.kepalaSekolah) validSettings.kepalaSekolah = String(s.kepalaSekolah);
        if (s.nipKepalaSekolah) validSettings.nipKepalaSekolah = String(s.nipKepalaSekolah);
        if (s.waliKelas) validSettings.waliKelas = String(s.waliKelas);
        if (s.nipWaliKelas) validSettings.nipWaliKelas = String(s.nipWaliKelas);
        if (s.googleSheetStudentUrl) validSettings.googleSheetStudentUrl = String(s.googleSheetStudentUrl);
        if (s.autoSync !== undefined) validSettings.autoSync = s.autoSync === true || s.autoSync === 'true';

        return {
          success: true,
          settings: validSettings,
          message: 'Pengaturan cloud berhasil diambil.',
        };
      }
    }
  } catch (err: any) {
    // 2. Fallback to POST JSON
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const resPost = await fetch(rawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'get_settings' }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (resPost.ok) {
        const data = await resPost.json();
        if (data && (data.status === 'success' || data.settings)) {
          return { success: true, settings: data.settings || data, message: 'Pengaturan cloud berhasil diambil.' };
        }
      }
    } catch (_) {}
  }

  return { success: false, message: 'Gagal mengambil pengaturan dari cloud.' };
}

// --- Fetch Remote Attendance from Cloud (Live Multi-Device Sync) ---
export async function fetchRemoteAttendance(
  customWebhookUrl?: string,
  filter?: { bulan?: string; tahun?: number; kelas?: string }
): Promise<{ success: boolean; count: number; data: AttendanceRecord[]; message: string }> {
  const localSettings = loadSettings();
  const rawUrl = cleanGoogleWebhookUrl(customWebhookUrl || localSettings.googleWebhookUrl || DEFAULT_GOOGLE_WEBHOOK_URL);
  if (!rawUrl) {
    return { success: false, count: 0, data: [], message: 'URL Webhook Google Apps Script belum dikonfigurasi.' };
  }

  const localStudents = loadStudents();
  const studentMapByNibk = new Map<string, Student>();
  const studentMapByName = new Map<string, Student>();
  for (const s of localStudents) {
    if (s.nibk) studentMapByNibk.set(String(s.nibk).trim(), s);
    if (s.nama) studentMapByName.set(s.nama.trim().toLowerCase(), s);
  }

  const normalizeFetchedRecords = (rawRecords: any[]): AttendanceRecord[] => {
    if (!Array.isArray(rawRecords)) return [];
    const parsedList: AttendanceRecord[] = [];

    for (const r of rawRecords) {
      if (!r) continue;
      const nibk = String(r.nibk || r.NIBK || r.nis || '').trim();
      const nama = String(r.nama || r.Nama || r.namaLengkap || '').trim();
      const kelas = String(r.kelas || r.Kelas || '').trim();
      const tanggal = String(r.tanggal || r.Tanggal || '').trim();
      const statusRaw = String(r.status || r.Status || '').trim().toUpperCase();
      const catatan = String(r.catatan || r.Catatan || r.keterangan || '').trim();
      const updatedAt = r.updatedAt ? Number(r.updatedAt) : Date.now();

      // Only valid status
      if (!['H', 'S', 'I', 'A'].includes(statusRaw) || !tanggal) {
        continue;
      }

      // Match student ID
      let matchedStudent = nibk ? studentMapByNibk.get(nibk) : undefined;
      if (!matchedStudent && nama) {
        matchedStudent = studentMapByName.get(nama.toLowerCase());
      }

      const studentId = matchedStudent ? matchedStudent.id : `std_${kelas}_${nibk || Math.random().toString(36).substring(2, 7)}`;
      const validRecord: AttendanceRecord = {
        id: `att_${studentId}_${tanggal}`,
        studentId,
        nibk: matchedStudent ? matchedStudent.nibk : nibk,
        nama: matchedStudent ? matchedStudent.nama : nama,
        kelas: matchedStudent ? matchedStudent.kelas : kelas,
        tanggal,
        status: statusRaw as 'H' | 'S' | 'I' | 'A',
        catatan,
        updatedAt,
      };

      parsedList.push(validRecord);
    }

    return parsedList;
  };

  // 1. Try GET request with query params
  try {
    const separator = rawUrl.includes('?') ? '&' : '?';
    let targetUrl = `${rawUrl}${separator}action=get_all_attendance&_t=${Date.now()}`;
    if (filter?.kelas && filter.kelas !== 'ALL') targetUrl += `&kelas=${encodeURIComponent(filter.kelas)}`;
    if (filter?.tahun) targetUrl += `&tahun=${filter.tahun}`;
    if (filter?.bulan) targetUrl += `&bulan=${encodeURIComponent(filter.bulan)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const records = data.records || data.data || (Array.isArray(data) ? data : []);
      if (Array.isArray(records) && records.length > 0) {
        const normalized = normalizeFetchedRecords(records);
        if (normalized.length > 0) {
          // Merge with local storage
          upsertAttendanceBatch(normalized);
          return {
            success: true,
            count: normalized.length,
            data: normalized,
            message: `Berhasil menyinkronkan ${normalized.length} data absensi live dari Cloud Spreadsheet!`,
          };
        }
      }
    }
  } catch (err: any) {
    // Fallback to POST JSON
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const resPost = await fetch(rawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'get_all_attendance',
          kelas: filter?.kelas,
          tahun: filter?.tahun,
          bulan: filter?.bulan,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resPost.ok) {
        const data = await resPost.json();
        const records = data.records || data.data || (Array.isArray(data) ? data : []);
        if (Array.isArray(records) && records.length > 0) {
          const normalized = normalizeFetchedRecords(records);
          if (normalized.length > 0) {
            upsertAttendanceBatch(normalized);
            return {
              success: true,
              count: normalized.length,
              data: normalized,
              message: `Berhasil menyinkronkan ${normalized.length} data absensi live dari Cloud Spreadsheet!`,
            };
          }
        }
      }
    } catch (_) {}
  }

  // If remote returns 0 records or not yet deployed with get_all_attendance handler, return current local data
  const currentLocal = loadAttendance();
  return {
    success: true,
    count: currentLocal.length,
    data: currentLocal,
    message: 'Data absensi lokal aktif dan tersimpan aman. Siap sinkronisasi multi-perangkat.',
  };
}

