import React, { useState, useEffect, useCallback } from 'react';
import { TabType, Student, AttendanceRecord, SchoolSettings } from './types';
import {
  loadStudents,
  saveStudents,
  loadAttendance,
  saveAttendance,
  loadSettings,
  saveSettings,
  getUniqueClasses,
  fetchStudentsFromGoogleSheet,
  fetchRemoteSettings,
  pushSettingsToCloud,
  DEFAULT_GOOGLE_SHEET_STUDENT_URL,
  DEFAULT_GOOGLE_WEBHOOK_URL,
} from './utils/storage';
import {
  saveAttendanceToCloud,
  clearAttendanceFromCloud,
  subscribeToCloudAttendance,
  saveStudentsToCloud,
  subscribeToCloudStudents,
  saveSettingsToCloud,
  subscribeToCloudSettings,
  syncLocalDataToCloudIfNeeded,
} from './lib/firebaseSync';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { KelolaKelasTab } from './components/KelolaKelasTab';
import { InputAbsensiTab } from './components/InputAbsensiTab';
import { RekapAbsensiTab } from './components/RekapAbsensiTab';
import { PengaturanTab } from './components/PengaturanTab';
import { RefreshCw, CheckCircle2, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('kelola_kelas');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<SchoolSettings>(loadSettings());
  const [targetClassForInput, setTargetClassForInput] = useState<string | undefined>(undefined);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [syncStatusNotice, setSyncStatusNotice] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  // Sync students directly from Google Sheet CSV
  const handleSyncGoogleSheet = useCallback(
    async (customUrl?: string, showToast = true) => {
      setIsSyncingSheet(true);
      const urlToUse = customUrl || settings.googleSheetStudentUrl || DEFAULT_GOOGLE_SHEET_STUDENT_URL;
      
      const result = await fetchStudentsFromGoogleSheet(urlToUse);
      setIsSyncingSheet(false);

      if (result.success && result.data.length > 0) {
        // Save and update students state
        setStudents(result.data);
        saveStudents(result.data);

        // Update settings with last sync time
        const updatedSettings: SchoolSettings = {
          ...settings,
          lastStudentSyncTime: Date.now(),
          googleSheetStudentUrl: urlToUse,
        };
        setSettings(updatedSettings);
        saveSettings(updatedSettings);

        if (showToast) {
          setSyncStatusNotice({
            type: 'success',
            message: `Data berhasil disinkronkan otomatis dari Google Sheets (${result.importedCount} siswa • Kelas ${result.classesFound.join(', ')}).`,
          });
          setTimeout(() => setSyncStatusNotice(null), 6000);
        }
        return { success: true, count: result.importedCount, classes: result.classesFound };
      } else {
        if (showToast) {
          setSyncStatusNotice({
            type: 'error',
            message: result.message || 'Gagal sinkronisasi data dari Google Sheets.',
          });
          setTimeout(() => setSyncStatusNotice(null), 6000);
        }
        return { success: false, count: 0, classes: [] };
      }
    },
    [settings]
  );

  // Synchronize remote settings from Admin Cloud across all devices
  const handleSyncRemoteSettings = useCallback(
    async (showToast = false) => {
      const currentLocal = loadSettings();
      const webhookUrl = currentLocal.googleWebhookUrl || DEFAULT_GOOGLE_WEBHOOK_URL;
      if (!webhookUrl) return { success: false };

      try {
        const res = await fetchRemoteSettings(webhookUrl);
        if (res.success && res.settings) {
          const remote = res.settings;
          const local = loadSettings();

          // Check if remote settings differ from local
          const hasChanges =
            (remote.schoolName && remote.schoolName !== local.schoolName) ||
            (remote.alamat && remote.alamat !== local.alamat) ||
            (remote.kepalaSekolah && remote.kepalaSekolah !== local.kepalaSekolah) ||
            (remote.nipKepalaSekolah && remote.nipKepalaSekolah !== local.nipKepalaSekolah) ||
            (remote.waliKelas && remote.waliKelas !== local.waliKelas) ||
            (remote.nipWaliKelas && remote.nipWaliKelas !== local.nipWaliKelas) ||
            (remote.googleSheetStudentUrl && remote.googleSheetStudentUrl !== local.googleSheetStudentUrl) ||
            (remote.logoUrl && remote.logoUrl !== local.logoUrl);

          if (hasChanges) {
            const updated: SchoolSettings = {
              ...local,
              ...remote,
              lastRemoteSettingsSyncTime: Date.now(),
            };
            setSettings(updated);
            saveSettings(updated);

            if (showToast) {
              setSyncStatusNotice({
                type: 'success',
                message: 'Pengaturan aplikasi berhasil disinkronkan secara otomatis dari Admin Pusat (Cloud Sync).',
              });
              setTimeout(() => setSyncStatusNotice(null), 6000);
            }
            return { success: true, updated: true };
          } else {
            if (showToast) {
              setSyncStatusNotice({
                type: 'info',
                message: 'Pengaturan perangkat sudah sinkron dengan Admin Pusat.',
              });
              setTimeout(() => setSyncStatusNotice(null), 5000);
            }
            return { success: true, updated: false };
          }
        }
      } catch (err) {
        console.warn('Remote sync check error:', err);
      }
      return { success: false, updated: false };
    },
    []
  );

  // Load Initial Data from Storage & Auto-Sync from Google Sheets & Remote Cloud Settings on Mount
  useEffect(() => {
    const localStudents = loadStudents();
    const localAttendance = loadAttendance();
    const localSettings = loadSettings();

    setStudents(localStudents);
    setAttendanceRecords(localAttendance);
    setSettings(localSettings);

    // Initial sync of remote settings (Cloud Sync)
    handleSyncRemoteSettings(false);

    // If local storage is empty OR on initial startup, automatically pull latest official Google Sheet data
    const runInitialSync = async () => {
      const url = localSettings.googleSheetStudentUrl || DEFAULT_GOOGLE_SHEET_STUDENT_URL;
      const res = await fetchStudentsFromGoogleSheet(url);
      if (res.success && res.data.length > 0) {
        if (localStudents.length === 0) {
          // Initial population
          setStudents(res.data);
          saveStudents(res.data);
        } else {
          // Merge or update existing so no records are lost
          const merged = [...localStudents];
          for (const newStd of res.data) {
            const idx = merged.findIndex((s) => s.nibk === newStd.nibk && s.kelas === newStd.kelas);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...newStd };
            } else {
              merged.push(newStd);
            }
          }
          setStudents(merged);
          saveStudents(merged);
        }

        const newSettings = {
          ...localSettings,
          lastStudentSyncTime: Date.now(),
          googleSheetStudentUrl: url,
        };
        setSettings(newSettings);
        saveSettings(newSettings);
      }
    };

    runInitialSync();
  }, [handleSyncRemoteSettings]);

  // Periodic background check & on-focus check for remote settings updates
  useEffect(() => {
    const onFocus = () => {
      handleSyncRemoteSettings(false);
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleSyncRemoteSettings(false);
      }
    });

    // Periodic check every 60 seconds
    const interval = setInterval(() => {
      handleSyncRemoteSettings(false);
    }, 60000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [handleSyncRemoteSettings]);

  // Listen to Storage update events for multi-tab or instant sync
  useEffect(() => {
    const handleStudentsUpdated = () => {
      setStudents(loadStudents());
    };
    const handleAttendanceUpdated = () => {
      setAttendanceRecords(loadAttendance());
    };
    const handleSettingsUpdated = () => {
      setSettings(loadSettings());
    };

    window.addEventListener('students_updated', handleStudentsUpdated);
    window.addEventListener('attendance_updated', handleAttendanceUpdated);
    window.addEventListener('settings_updated', handleSettingsUpdated);

    return () => {
      window.removeEventListener('students_updated', handleStudentsUpdated);
      window.removeEventListener('attendance_updated', handleAttendanceUpdated);
      window.removeEventListener('settings_updated', handleSettingsUpdated);
    };
  }, []);

  // Real-time Cloud Synchronization (HP A, HP B, Laptops)
  useEffect(() => {
    // 1. Subscribe to Cloud Attendance in real time
    const unsubscribeAttendance = subscribeToCloudAttendance((records) => {
      if (records && records.length > 0) {
        setAttendanceRecords(records);
      }
    });

    // 2. Subscribe to Cloud Students in real time
    const unsubscribeStudents = subscribeToCloudStudents((studentsList) => {
      if (studentsList && studentsList.length > 0) {
        setStudents(studentsList);
      }
    });

    // 3. Subscribe to Cloud Settings in real time
    const unsubscribeSettings = subscribeToCloudSettings((newSettings) => {
      if (newSettings) {
        setSettings(newSettings);
      }
    });

    // 4. Seed Cloud if empty so any existing records on this device are pushed for others to see
    syncLocalDataToCloudIfNeeded();

    return () => {
      unsubscribeAttendance();
      unsubscribeStudents();
      unsubscribeSettings();
    };
  }, []);

  // Save Students Handler
  const handleSaveStudents = useCallback((newStudents: Student[]) => {
    setStudents(newStudents);
    saveStudents(newStudents);
    saveStudentsToCloud(newStudents);
  }, []);

  // Save Settings Handler
  const handleSaveSettings = useCallback((newSettings: SchoolSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    saveSettingsToCloud(newSettings);
  }, []);

  // Refresh Attendance Records (Sync with Rekap Absensi)
  const handleAttendanceSaved = useCallback(() => {
    const updated = loadAttendance();
    setAttendanceRecords(updated);
  }, []);

  // Navigate to Input Absensi tab directly with a preset class
  const handleNavigateToInput = (targetClass?: string) => {
    setTargetClassForInput(targetClass);
    setActiveTab('input_absensi');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Restore All Data Backup
  const handleRestoreAllData = (
    restoredStudents: Student[],
    restoredAttendance: AttendanceRecord[],
    restoredSettings: SchoolSettings
  ) => {
    setStudents(restoredStudents);
    setAttendanceRecords(restoredAttendance);
    setSettings(restoredSettings);
    saveStudents(restoredStudents);
    saveAttendance(restoredAttendance);
    saveSettings(restoredSettings);
    saveAttendanceToCloud(restoredAttendance);
    saveStudentsToCloud(restoredStudents);
    saveSettingsToCloud(restoredSettings);
  };

  // Reset Attendance Only
  const handleClearAttendanceOnly = () => {
    if (window.confirm('Yakin ingin mereset seluruh riwayat absensi? Data siswa akan tetap aman.')) {
      setAttendanceRecords([]);
      saveAttendance([]);
      clearAttendanceFromCloud();
      alert('Seluruh riwayat absensi berhasil direset di perangkat dan cloud.');
    }
  };

  // Reset All
  const handleClearAll = () => {
    if (
      window.confirm(
        'PERINGATAN: Yakin ingin mereset SELURUH data siswa dan riwayat absensi di aplikasi?'
      )
    ) {
      setStudents([]);
      setAttendanceRecords([]);
      saveStudents([]);
      saveAttendance([]);
      alert('Semua data berhasil dibersihkan.');
    }
  };

  const uniqueClasses = getUniqueClasses(students);

  // Smooth Scroll Handlers
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToBottomMenu = () => {
    const bottomNav = document.getElementById('bottom-nav-section');
    if (bottomNav) {
      bottomNav.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-canvas-gradient flex flex-col font-sans selection:bg-pink-500 selection:text-white relative">
      {/* Official Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        totalStudents={students.length}
        totalClasses={uniqueClasses.length}
      />

      {/* Auto-Sync Toast Notification */}
      {syncStatusNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 w-full">
          <div
            className={`p-3.5 rounded-2xl text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-md transition-all ${
              syncStatusNotice.type === 'success'
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : 'bg-red-600 text-white shadow-red-600/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {syncStatusNotice.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{syncStatusNotice.message}</span>
            </div>
            <button
              onClick={() => setSyncStatusNotice(null)}
              className="text-white/80 hover:text-white text-xs underline font-semibold flex-shrink-0 px-2"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {activeTab === 'kelola_kelas' && (
          <KelolaKelasTab
            students={students}
            onSaveStudents={handleSaveStudents}
            onNavigateToInput={handleNavigateToInput}
            settings={settings}
            onSyncGoogleSheet={handleSyncGoogleSheet}
            isSyncingSheet={isSyncingSheet}
          />
        )}

        {activeTab === 'input_absensi' && (
          <InputAbsensiTab
            students={students}
            attendanceRecords={attendanceRecords}
            onAttendanceSaved={handleAttendanceSaved}
            settings={settings}
            defaultClass={targetClassForInput}
          />
        )}

        {activeTab === 'rekap_absensi' && (
          <RekapAbsensiTab
            students={students}
            attendanceRecords={attendanceRecords}
            settings={settings}
          />
        )}

        {activeTab === 'pengaturan' && (
          <PengaturanTab
            settings={settings}
            onSaveSettings={handleSaveSettings}
            students={students}
            attendanceRecords={attendanceRecords}
            onRestoreAllData={handleRestoreAllData}
            onClearAttendanceOnly={handleClearAttendanceOnly}
            onClearAll={handleClearAll}
            onSyncGoogleSheet={handleSyncGoogleSheet}
            onSyncRemoteSettings={handleSyncRemoteSettings}
            isSyncingSheet={isSyncingSheet}
          />
        )}

        {/* DUPLICATE TAB MENU KELOLA KELAS, INPUT ABSENSI, REKAP ABSENSI KE BAWAH KONTEN */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          totalClasses={uniqueClasses.length}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-pink-200/50 py-6 text-center text-xs text-slate-600 print:hidden">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-800">
            ABSENSI DIGITAL {settings.schoolName || 'SMP NEGERI 2 PACIRAN'}
          </p>
          <p>
            {settings.alamat} • Sistem Presensi Harian & Rekapitulasi Kalender Bulanan
          </p>
        </div>
      </footer>

      {/* TOMBOL MELAYANG DI SEBELAH KIRI: BULAT MERAH (PANAH TURUN KE MENU BAWAH) */}
      <aside
        aria-label="Navigasi ke Bawah"
        className="fixed left-4 sm:left-6 bottom-6 sm:bottom-8 z-50 print:hidden"
      >
        <button
          id="btn-scroll-bottom"
          onClick={handleScrollToBottomMenu}
          type="button"
          aria-label="Turun ke Menu Bawah"
          title="Turun ke Menu Bawah"
          className="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/35 border-2 border-white ring-2 ring-red-500/25 active:scale-90 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-300 cursor-pointer"
        >
          <ArrowDown className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5] group-hover:translate-y-0.5 transition-transform" />
          <span className="sr-only">Turun ke Menu Bawah</span>
        </button>
      </aside>

      {/* TOMBOL MELAYANG DI SEBELAH KANAN: BULAT BIRU (PANAH NAIK KE ATAS) */}
      <aside
        aria-label="Navigasi ke Atas"
        className="fixed right-4 sm:right-6 bottom-6 sm:bottom-8 z-50 print:hidden"
      >
        <button
          id="btn-scroll-top"
          onClick={handleScrollToTop}
          type="button"
          aria-label="Naik ke Atas"
          title="Naik ke Atas (Puncak Halaman)"
          className="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/35 border-2 border-white ring-2 ring-blue-500/25 active:scale-90 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 cursor-pointer"
        >
          <ArrowUp className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
          <span className="sr-only">Naik ke Atas</span>
        </button>
      </aside>
    </div>
  );
}
