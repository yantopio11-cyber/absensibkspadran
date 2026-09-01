import React, { useState, useEffect, useMemo } from 'react';
import { Student, AttendanceRecord, AttendanceStatus, SchoolSettings } from '../types';
import {
  upsertAttendanceBatch,
  sendAttendanceToGoogleSheets,
  getUniqueClasses,
} from '../utils/storage';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  HeartPulse,
  FileText,
  UserX,
  Calendar,
  Save,
  Send,
  Sparkles,
  ClipboardCopy,
  Users,
  Check,
  AlertTriangle,
  Info,
  CalendarDays,
  FileSpreadsheet,
  ChevronRight,
} from 'lucide-react';

interface InputAbsensiTabProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onAttendanceSaved: () => void;
  settings: SchoolSettings;
  defaultClass?: string;
}

export const InputAbsensiTab: React.FC<InputAbsensiTabProps> = ({
  students,
  attendanceRecords,
  onAttendanceSaved,
  settings,
  defaultClass,
}) => {
  const uniqueClasses = useMemo(() => getUniqueClasses(students), [students]);

  // Selected Class & Date State
  const [selectedClass, setSelectedClass] = useState<string>(
    defaultClass || (uniqueClasses.length > 0 ? uniqueClasses[0] : '')
  );

  // Today's date YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [notes, setNotes] = useState<{ [studentId: string]: string }>({});
  const [attendanceState, setAttendanceState] = useState<{
    [studentId: string]: AttendanceStatus;
  }>({});

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [copiedClipboard, setCopiedClipboard] = useState(false);

  // Filter students by selected class
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter((s) => s.kelas === selectedClass);
  }, [students, selectedClass]);

  // Determine if selected date is Friday
  const isFriday = useMemo(() => {
    if (!selectedDate) return false;
    const parts = selectedDate.split('-');
    if (parts.length !== 3) return false;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.getDay() === 5;
  }, [selectedDate]);

  // Synchronize initial attendance state whenever selectedClass, selectedDate or students change
  // RULE: "INPUT ABSENSI PADA WAKTU DIBUKA OTOMATIS PILIHANYA ADALAH HADIR"
  useEffect(() => {
    if (!selectedClass || classStudents.length === 0) return;

    const initialMap: { [studentId: string]: AttendanceStatus } = {};
    const initialNotes: { [studentId: string]: string } = {};

    classStudents.forEach((student) => {
      // Check if there is an existing saved attendance record for this student on this date
      const record = attendanceRecords.find(
        (r) => r.studentId === student.id && r.tanggal === selectedDate
      );

      if (record && record.status) {
        initialMap[student.id] = record.status;
        if (record.catatan) initialNotes[student.id] = record.catatan;
      } else {
        // AUTOMATICALLY DEFAULT TO 'H' (HADIR)
        initialMap[student.id] = 'H';
      }
    });

    setAttendanceState(initialMap);
    setNotes(initialNotes);
  }, [selectedClass, selectedDate, classStudents, attendanceRecords]);

  // Change single student status
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Change notes
  const handleNoteChange = (studentId: string, noteVal: string) => {
    setNotes((prev) => ({
      ...prev,
      [studentId]: noteVal,
    }));
  };

  // Batch actions
  const handleSetAll = (status: AttendanceStatus) => {
    const updated: { [studentId: string]: AttendanceStatus } = {};
    classStudents.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceState(updated);
  };

  // Count Statistics
  const stats = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpha = 0;

    classStudents.forEach((s) => {
      const st = attendanceState[s.id] || 'H';
      if (st === 'H') hadir++;
      else if (st === 'S') sakit++;
      else if (st === 'I') izin++;
      else if (st === 'A') alpha++;
    });

    const total = classStudents.length;
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return { total, hadir, sakit, izin, alpha, percentage };
  }, [classStudents, attendanceState]);

  // Save Attendance Fast & Cloud / Webhook Sync
  const handleSaveAttendance = async () => {
    if (classStudents.length === 0) {
      alert('Tidak ada siswa di kelas yang dipilih.');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg(null);

    const recordsToSave: AttendanceRecord[] = classStudents.map((std) => ({
      id: `att_${std.id}_${selectedDate}`,
      studentId: std.id,
      nibk: std.nibk,
      nama: std.nama,
      kelas: std.kelas,
      tanggal: selectedDate,
      status: attendanceState[std.id] || 'H',
      catatan: notes[std.id] || '',
      updatedAt: Date.now(),
    }));

    // 1. Instant local persistence & rekap state synchronization
    upsertAttendanceBatch(recordsToSave);
    onAttendanceSaved();

    // 2. Trigger Confetti celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (_) {}

    // 3. Fast sync to Google Sheets if Webhook URL exists
    let syncResultText = 'Data absensi tersimpan dengan aman di sistem!';
    if (settings.googleWebhookUrl && settings.googleWebhookUrl.trim()) {
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const dateParts = selectedDate.split('-');
      const monthIndex = dateParts.length === 3 ? parseInt(dateParts[1], 10) - 1 : new Date().getMonth();
      const currentMonthStr = monthNames[monthIndex] || 'Bulan';
      const currentYearNum = dateParts.length === 3 ? parseInt(dateParts[0], 10) : new Date().getFullYear();

      const syncRes = await sendAttendanceToGoogleSheets(
        settings.googleWebhookUrl,
        recordsToSave,
        {
          kelas: selectedClass,
          tanggal: selectedDate,
          bulan: currentMonthStr,
          tahun: currentYearNum,
        }
      );
      if (syncRes.success) {
        syncResultText = `Data absensi tersimpan & terkirim ke sheet "${currentMonthStr} ${selectedClass}"!`;
      } else {
        syncResultText = `Tersimpan lokal (${syncRes.message})`;
      }
    }

    setIsSaving(false);
    setSaveSuccessMsg(syncResultText);
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 6000);
  };

  // Copy Tab-Separated Data for Direct Paste to Excel/Sheets
  const handleCopyToClipboard = () => {
    if (classStudents.length === 0) return;

    let tsv = 'No\tNIBK\tNama Siswa\tJK\tKelas\tTanggal\tStatus\tKeterangan\n';
    classStudents.forEach((std, idx) => {
      const st = attendanceState[std.id] || 'H';
      const cat = notes[std.id] || '';
      tsv += `${idx + 1}\t${std.nibk}\t${std.nama}\t${std.jenisKelamin}\t${std.kelas}\t${selectedDate}\t${st}\t${cat}\n`;
    });

    navigator.clipboard.writeText(tsv).then(() => {
      setCopiedClipboard(true);
      setTimeout(() => setCopiedClipboard(false), 3000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
              <ClipboardCopy className="w-4 h-4" />
              <span>Input Kehadiran Siswa Harian</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
              Presensi Harian Kelas
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Semua siswa otomatis dipilih <strong>HADIR (H)</strong>. Klik tombol status untuk mengubah ke Sakit, Izin, atau Alpha.
            </p>
          </div>

          {/* Quick Stats Chips */}
          {classStudents.length > 0 && (
            <div className="grid grid-cols-5 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center">
              <div className="px-2 py-1 bg-white rounded-xl shadow-xs">
                <div className="text-[10px] font-bold text-slate-500">TOTAL</div>
                <div className="text-sm font-extrabold text-slate-800">{stats.total}</div>
              </div>
              <div className="px-2 py-1 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
                <div className="text-[10px] font-bold">HADIR</div>
                <div className="text-sm font-extrabold">{stats.hadir}</div>
              </div>
              <div className="px-2 py-1 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
                <div className="text-[10px] font-bold">SAKIT</div>
                <div className="text-sm font-extrabold">{stats.sakit}</div>
              </div>
              <div className="px-2 py-1 bg-indigo-50 text-indigo-800 rounded-xl border border-indigo-200">
                <div className="text-[10px] font-bold">IZIN</div>
                <div className="text-sm font-extrabold">{stats.izin}</div>
              </div>
              <div className="px-2 py-1 bg-rose-50 text-rose-800 rounded-xl border border-rose-200">
                <div className="text-[10px] font-bold">ALPHA</div>
                <div className="text-sm font-extrabold">{stats.alpha}</div>
              </div>
            </div>
          )}
        </div>

        {/* Date & Class Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 pt-4 border-t border-slate-100 items-end">
          {/* Class Select */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Pilih Kelas
            </label>
            {uniqueClasses.length === 0 ? (
              <div className="p-2.5 bg-slate-100 rounded-xl text-xs text-slate-500">
                Belum ada kelas. Silakan impor data di tab <strong>Kelola Kelas</strong>.
              </div>
            ) : (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs"
              >
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    Kelas {cls} ({students.filter((s) => s.kelas === cls).length} Siswa)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date Picker */}
          <div className="lg:col-span-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Tanggal Absensi
              </label>
              {isFriday && (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Hari Jumat (Libur Resmi)
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs"
              />
            </div>
          </div>

          {/* Batch Status Buttons */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Aksi Cepat Massal
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleSetAll('H')}
                className="px-2 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-extrabold transition-colors flex items-center justify-center gap-1"
                title="Tandai Semua Siswa Hadir"
              >
                <span>Hadir</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetAll('S')}
                className="px-2 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-extrabold transition-colors flex items-center justify-center gap-1"
                title="Tandai Semua Siswa Sakit"
              >
                <span>Sakit</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetAll('I')}
                className="px-2 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-xl text-xs font-extrabold transition-colors flex items-center justify-center gap-1"
                title="Tandai Semua Siswa Izin"
              >
                <span>Izin</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetAll('A')}
                className="px-2 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-extrabold transition-colors flex items-center justify-center gap-1"
                title="Tandai Semua Siswa Alpha"
              >
                <span>Alpha</span>
              </button>
            </div>
          </div>
        </div>

        {/* Friday Advisory Notification */}
        {isFriday && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Pemberitahuan Jadwal:</strong> Di SMP Negeri 2 Paciran, hari <strong>Jumat</strong> adalah hari libur (L) dan hari <strong>Minggu</strong> tetap masuk sekolah. Absensi pada hari Jumat otomatis dicatat sebagai Libur pada rekapitulasi.
            </span>
          </div>
        )}
      </div>

      {/* Save Success Alert */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-200 flex-shrink-0" />
            <div>
              <p className="font-extrabold text-sm">{saveSuccessMsg}</p>
              <p className="text-xs text-emerald-100">
                Data kehadiran otomatis terhubung ke Rekap Absensi bulanan dan tersimpan permanen.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* STUDENT ATTENDANCE LIST (LARGE ICONS MATCHING STUDENT ROW HEIGHT) */}
      {classStudents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {uniqueClasses.length === 0
              ? 'Belum Ada Data Siswa'
              : `Tidak Ada Siswa di Kelas ${selectedClass}`}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Silakan masuk ke menu <strong>Kelola Kelas</strong> untuk mengimpor atau menambahkan siswa baru.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Daftar Siswa Kelas {selectedClass}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {classStudents.length} Siswa
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Pilih status kehadiran dengan menekan tombol ikon di samping nama siswa.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyToClipboard}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                title="Salin data absensi format tab-separated untuk ditempel langsung di Google Sheets/Excel"
              >
                {copiedClipboard ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Salin Format Spreadsheet</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Student Cards List with Matched Large Status Buttons */}
          <div className="space-y-2.5">
            {classStudents.map((std, idx) => {
              const currentStatus = attendanceState[std.id] || 'H';

              return (
                <div
                  key={`input-std-${std.id || std.nibk}-${idx}`}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${
                    currentStatus === 'H'
                      ? 'bg-white border-slate-200 hover:border-emerald-300'
                      : currentStatus === 'S'
                      ? 'bg-amber-50/40 border-amber-200'
                      : currentStatus === 'I'
                      ? 'bg-indigo-50/40 border-indigo-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  {/* Student Identity Block (Height symmetrical to buttons) */}
                  <div className="flex items-center space-x-3.5 min-w-[240px]">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 text-slate-600 font-bold font-mono text-xs sm:text-sm flex items-center justify-center flex-shrink-0 border border-slate-200 shadow-2xs">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                          {std.nama}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            std.jenisKelamin === 'L'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-pink-100 text-pink-800'
                          }`}
                        >
                          {std.jenisKelamin}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                        <span>NIBK: {std.nibk}</span>
                        <span>•</span>
                        <span className="font-sans font-semibold text-emerald-700">
                          Kelas {std.kelas}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* LARGE INTERACTIVE ICONS FOR HADIR, SAKIT, IZIN, ALPHA (MATCHED HEIGHT, GREY BEFORE SELECT) */}
                  <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 sm:gap-2.5">
                    {/* HADIR BUTTON */}
                    <button
                      type="button"
                      id={`btn-hadir-${std.id}`}
                      onClick={() => handleStatusChange(std.id, 'H')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 ${
                        currentStatus === 'H'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02] ring-2 ring-emerald-400/50'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 border border-slate-200/70'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          currentStatus === 'H' ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      <span>HADIR (H)</span>
                    </button>

                    {/* SAKIT BUTTON */}
                    <button
                      type="button"
                      id={`btn-sakit-${std.id}`}
                      onClick={() => handleStatusChange(std.id, 'S')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 ${
                        currentStatus === 'S'
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-[1.02] ring-2 ring-amber-300'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 border border-slate-200/70'
                      }`}
                    >
                      <HeartPulse
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          currentStatus === 'S' ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      <span>SAKIT (S)</span>
                    </button>

                    {/* IZIN BUTTON */}
                    <button
                      type="button"
                      id={`btn-izin-${std.id}`}
                      onClick={() => handleStatusChange(std.id, 'I')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 ${
                        currentStatus === 'I'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-[1.02] ring-2 ring-indigo-300'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 border border-slate-200/70'
                      }`}
                    >
                      <FileText
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          currentStatus === 'I' ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      <span>IZIN (I)</span>
                    </button>

                    {/* ALPHA BUTTON */}
                    <button
                      type="button"
                      id={`btn-alpha-${std.id}`}
                      onClick={() => handleStatusChange(std.id, 'A')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 ${
                        currentStatus === 'A'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-[1.02] ring-2 ring-rose-300'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 border border-slate-200/70'
                      }`}
                    >
                      <UserX
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          currentStatus === 'A' ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      <span>ALPHA (A)</span>
                    </button>
                  </div>

                  {/* Optional Note input for S/I/A */}
                  {currentStatus !== 'H' && (
                    <div className="w-full md:w-48 flex-shrink-0">
                      <input
                        type="text"
                        placeholder="Keterangan (contoh: flu, izin keluarga)..."
                        value={notes[std.id] || ''}
                        onChange={(e) => handleNoteChange(std.id, e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sticky Bottom Save Bar for high speed & infinite records */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-extrabold text-sm">
                {stats.percentage}%
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-800">
                  Tingkat Kehadiran: {stats.hadir} dari {stats.total} Siswa Hadir
                </p>
                <p className="text-[11px] text-slate-500">
                  Data otomatis tersinkronisasi tanpa batas ke database & rekapitulasi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-emerald-600/25 transition-all transform active:scale-95"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>SIMPAN & SINKRONKAN ABSENSI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
