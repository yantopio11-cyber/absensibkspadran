import React, { useState, useMemo } from 'react';
import { Student, AttendanceRecord, SchoolSettings, Gender } from '../types';
import {
  exportAttendanceMatrixToExcel,
  getUniqueClasses,
  sendMonthlyRekapToGoogleSheets,
} from '../utils/storage';
import {
  CalendarRange,
  Search,
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Users,
  CheckCircle,
  HeartPulse,
  FileText,
  UserX,
  Sparkles,
  Info,
  Calendar,
  Layers,
  CloudUpload,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface RekapAbsensiTabProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  settings: SchoolSettings;
}

export const RekapAbsensiTab: React.FC<RekapAbsensiTabProps> = ({
  students,
  attendanceRecords,
  settings,
}) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-11
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, LOW_ATTENDANCE, HAS_ALPHA
  const [isSyncingToSheet, setIsSyncingToSheet] = useState(false);
  const [sheetSyncStatus, setSheetSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const uniqueClasses = useMemo(() => getUniqueClasses(students), [students]);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const currentMonthName = monthNames[selectedMonth];

  // Calculate number of days in selected month & generate day array
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Array of days [1..daysInMonth] with day name & Friday indicator
  const daysArray = useMemo(() => {
    const days = [];
    const dayNamesShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(selectedYear, selectedMonth, d);
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 5 = Friday
      const isFriday = dayOfWeek === 5; // Friday is Holiday
      const isSunday = dayOfWeek === 0; // Sunday is school day

      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(
        d
      ).padStart(2, '0')}`;

      days.push({
        dayNumber: d,
        dayName: dayNamesShort[dayOfWeek],
        dateStr,
        isFriday,
        isSunday,
      });
    }
    return days;
  }, [selectedYear, selectedMonth, daysInMonth]);

  // Filter students by class and search query
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesClass = selectedClass === 'ALL' || s.kelas === selectedClass;
      const matchesSearch =
        searchQuery === '' ||
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nibk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.kelas.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [students, selectedClass, searchQuery]);

  // Compute student attendance matrix & summary stats
  // RULE: "JIKA DATA INPUT BELUM MASUK MAKA KOSONKAN KETERANGAN H,S,I,A. JIKA HARI JUMAT MAKA KETERANGAN MENJADI L = LIBUR"
  // RULE: "LIBUR GANTI DI HARI JUMAT, MINGGU TETAP MASUK"
  const studentRows = useMemo(() => {
    return filteredStudents.map((std) => {
      let totalH = 0;
      let totalS = 0;
      let totalI = 0;
      let totalA = 0;
      let effectiveSchoolDaysRecorded = 0;

      const dailyStatus: { [day: number]: { status: string; isFriday: boolean; note?: string } } = {};

      daysArray.forEach((dayInfo) => {
        if (dayInfo.isFriday) {
          // Automatic Holiday on Friday
          dailyStatus[dayInfo.dayNumber] = {
            status: 'L',
            isFriday: true,
          };
        } else {
          // Regular school day (including Sunday!)
          const record = attendanceRecords.find(
            (r) => r.studentId === std.id && r.tanggal === dayInfo.dateStr
          );

          if (record && record.status) {
            dailyStatus[dayInfo.dayNumber] = {
              status: record.status,
              isFriday: false,
              note: record.catatan,
            };

            if (record.status === 'H') totalH++;
            else if (record.status === 'S') totalS++;
            else if (record.status === 'I') totalI++;
            else if (record.status === 'A') totalA++;

            effectiveSchoolDaysRecorded++;
          } else {
            // Unrecorded date -> EMPTY (Kosongkan)
            dailyStatus[dayInfo.dayNumber] = {
              status: '',
              isFriday: false,
            };
          }
        }
      });

      const totalRecorded = totalH + totalS + totalI + totalA;
      const percentage = totalRecorded > 0 ? (totalH / totalRecorded) * 100 : 0;

      return {
        student: std,
        dailyStatus,
        totalH,
        totalS,
        totalI,
        totalA,
        totalRecorded,
        percentage,
      };
    });
  }, [filteredStudents, daysArray, attendanceRecords]);

  // Overall Class Statistics for the Month (Real-time sum of recorded days only)
  const classSummary = useMemo(() => {
    let sumH = 0;
    let sumS = 0;
    let sumI = 0;
    let sumA = 0;

    studentRows.forEach((r) => {
      sumH += r.totalH;
      sumS += r.totalS;
      sumI += r.totalI;
      sumA += r.totalA;
    });

    const grandTotal = sumH + sumS + sumI + sumA;
    const avgPercentage = grandTotal > 0 ? (sumH / grandTotal) * 100 : 0;
    const pctH = grandTotal > 0 ? (sumH / grandTotal) * 100 : 0;
    const pctS = grandTotal > 0 ? (sumS / grandTotal) * 100 : 0;
    const pctI = grandTotal > 0 ? (sumI / grandTotal) * 100 : 0;
    const pctA = grandTotal > 0 ? (sumA / grandTotal) * 100 : 0;

    return {
      sumH,
      sumS,
      sumI,
      sumA,
      grandTotal,
      avgPercentage,
      pctH,
      pctS,
      pctI,
      pctA,
    };
  }, [studentRows]);

  // Daily Totals for table footer
  const dailyTotals = useMemo(() => {
    const totals: { [day: number]: { H: number; S: number; I: number; A: number } } = {};

    daysArray.forEach((dayInfo) => {
      totals[dayInfo.dayNumber] = { H: 0, S: 0, I: 0, A: 0 };
    });

    studentRows.forEach((row) => {
      daysArray.forEach((dayInfo) => {
        const st = row.dailyStatus[dayInfo.dayNumber]?.status;
        if (st === 'H') totals[dayInfo.dayNumber].H++;
        else if (st === 'S') totals[dayInfo.dayNumber].S++;
        else if (st === 'I') totals[dayInfo.dayNumber].I++;
        else if (st === 'A') totals[dayInfo.dayNumber].A++;
      });
    });

    return totals;
  }, [studentRows, daysArray]);

  // Trigger browser print dialog formatted for school report
  const handlePrint = () => {
    window.print();
  };

  // Export Excel
  const handleExportExcel = () => {
    const classLabel = selectedClass === 'ALL' ? 'Semua_Kelas' : `Kelas_${selectedClass}`;
    exportAttendanceMatrixToExcel(
      filteredStudents,
      attendanceRecords,
      selectedYear,
      selectedMonth,
      classLabel
    );
  };

  // Send Monthly Matrix to Google Sheets (e.g. Tab "November 8A")
  const handleSendMonthlyToGoogleSheet = async () => {
    if (!settings.googleWebhookUrl || !settings.googleWebhookUrl.trim()) {
      setSheetSyncStatus({
        type: 'error',
        message: 'URL Webhook Google Apps Script belum diisi di menu Pengaturan.',
      });
      setTimeout(() => setSheetSyncStatus(null), 5000);
      return;
    }

    const classLabel = selectedClass === 'ALL' ? 'Semua' : selectedClass;
    setIsSyncingToSheet(true);
    setSheetSyncStatus(null);

    const res = await sendMonthlyRekapToGoogleSheets(
      settings.googleWebhookUrl,
      students,
      attendanceRecords,
      selectedYear,
      selectedMonth,
      classLabel,
      settings
    );

    setIsSyncingToSheet(false);
    if (res.success) {
      setSheetSyncStatus({
        type: 'success',
        message: res.message || `Rekap ${currentMonthName} ${classLabel} berhasil dikirim ke Google Sheets!`,
      });
    } else {
      setSheetSyncStatus({
        type: 'error',
        message: res.message || 'Gagal mengirim rekap ke Google Sheets.',
      });
    }
    setTimeout(() => setSheetSyncStatus(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title (SERTAKAN NAMA BULAN) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
              <CalendarRange className="w-4 h-4" />
              <span>Matriks Rekapitulasi Presensi Siswa</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Cloud Database Terhubung
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
              REKAPITULASI ABSENSI BULAN {currentMonthName.toUpperCase()} {selectedYear}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Matriks tanggal horizontal (1 s.d. {daysInMonth}), data siswa vertikal, dengan jadwal khusus <strong>Jumat Libur (L)</strong> dan <strong>Minggu Masuk</strong>.
            </p>
          </div>

          {/* Action Buttons: Print, Excel, Google Sheets */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Print Laporan</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Excel (.xlsx)</span>
            </button>
            <button
              onClick={handleSendMonthlyToGoogleSheet}
              disabled={isSyncingToSheet}
              title={`Kirim Rekapitulasi ${currentMonthName} ${selectedClass === 'ALL' ? 'Semua' : selectedClass} ke Google Spreadsheet`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              {isSyncingToSheet ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              <span>
                {isSyncingToSheet
                  ? 'Mengirim ke Sheet...'
                  : `Kirim ke Sheet (${currentMonthName} ${selectedClass === 'ALL' ? 'Semua' : selectedClass})`}
              </span>
            </button>
          </div>
        </div>

        {/* Sync Toast Notice */}
        {sheetSyncStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border ${
              sheetSyncStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : sheetSyncStatus.type === 'info'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {sheetSyncStatus.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : sheetSyncStatus.type === 'info' ? (
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <span>{sheetSyncStatus.message}</span>
            </div>
            <button
              onClick={() => setSheetSyncStatus(null)}
              className="text-slate-500 hover:text-slate-700 text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Filters: Kelas, Bulan, Tahun, Pencarian */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 pt-4 border-t border-slate-100 items-end">
          {/* Class Filter */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Pilihan Kelas
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="ALL">-- Semua Kelas ({students.length} Siswa) --</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls} ({students.filter((s) => s.kelas === cls).length} Siswa)
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Bulan
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Tahun
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Search by Name / NIBK */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Cari Siswa
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama siswa / NIBK..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Dashboard Aggregate Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div className="text-[10px] font-bold uppercase text-slate-500">Total Siswa</div>
            <div className="text-lg font-extrabold text-slate-800">{studentRows.length}</div>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <div className="text-[10px] font-bold uppercase text-emerald-700">Total Hadir (H)</div>
            <div className="text-lg font-extrabold text-emerald-800">{classSummary.sumH}</div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <div className="text-[10px] font-bold uppercase text-amber-700">Total Sakit (S)</div>
            <div className="text-lg font-extrabold text-amber-800">{classSummary.sumS}</div>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
            <div className="text-[10px] font-bold uppercase text-indigo-700">Total Izin (I)</div>
            <div className="text-lg font-extrabold text-indigo-800">{classSummary.sumI}</div>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <div className="text-[10px] font-bold uppercase text-rose-700">Total Alpha (A)</div>
            <div className="text-lg font-extrabold text-rose-800">{classSummary.sumA}</div>
          </div>
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-center">
            <div className="text-[10px] font-bold uppercase text-teal-700">% Rata-rata</div>
            <div className="text-lg font-extrabold text-teal-800">
              {classSummary.avgPercentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Legend Information */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-slate-700">Keterangan:</span>
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">H</span>
              Hadir
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span className="w-3.5 h-3.5 rounded bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">S</span>
              Sakit
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span className="w-3.5 h-3.5 rounded bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">I</span>
              Izin
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span className="w-3.5 h-3.5 rounded bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">A</span>
              Alpha
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span className="w-3.5 h-3.5 rounded bg-red-100 text-red-700 border border-red-300 text-[10px] font-bold flex items-center justify-center">L</span>
              Jumat Libur
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-400">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 text-slate-400 text-[10px] font-bold flex items-center justify-center">-</span>
              Belum Diisi
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            *Hari Minggu tetap masuk dan dihitung sebagai hari efektif belajar.
          </span>
        </div>
      </div>

      {/* PRINT-ONLY OFFICIAL SCHOOL LETTERHEAD */}
      <div className="hidden print:block mb-6 text-center border-b-2 border-slate-900 pb-4">
        <div className="flex items-center justify-center gap-4 mb-2">
          <img
            src={settings.logoUrl}
            alt="Logo"
            className="w-16 h-16 object-contain"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-base font-extrabold uppercase tracking-wide">
              PEMERINTAH KABUPATEN LAMONGAN • DINAS PENDIDIKAN
            </h1>
            <h2 className="text-xl font-black uppercase tracking-wider">
              {settings.schoolName || 'SMP NEGERI 2 PACIRAN'}
            </h2>
            <p className="text-xs text-slate-700">{settings.alamat}</p>
          </div>
        </div>
        <h3 className="text-sm font-bold uppercase mt-2 underline">
          REKAPITULASI PRESENSI SISWA BULAN {currentMonthName.toUpperCase()} {selectedYear}
        </h3>
        <p className="text-xs font-semibold">
          Kelas: {selectedClass === 'ALL' ? 'Semua Kelas' : `Kelas ${selectedClass}`} • Tahun Ajaran {selectedYear}/{selectedYear + 1}
        </p>
      </div>

      {/* MAIN HORIZONTAL REKAP MATRIX TABLE */}
      {studentRows.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">
            Tidak Ada Data Siswa Ditemukan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Silakan masukkan data siswa di tab <strong>Kelola Kelas</strong> terlebih dahulu.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-5 space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                {/* Header Row 1: Day Names */}
                <tr className="bg-slate-800 text-slate-100 text-[10px] font-bold uppercase tracking-wider text-center">
                  <th className="py-2 px-2 border-r border-slate-700 w-8" rowSpan={2}>
                    No
                  </th>
                  <th className="py-2 px-2.5 border-r border-slate-700 text-left min-w-[90px]" rowSpan={2}>
                    NIBK
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700 text-left min-w-[170px]" rowSpan={2}>
                    Nama Siswa
                  </th>
                  <th className="py-2 px-1.5 border-r border-slate-700 w-10" rowSpan={2}>
                    JK
                  </th>
                  {selectedClass === 'ALL' && (
                    <th className="py-2 px-2 border-r border-slate-700 w-14" rowSpan={2}>
                      Kelas
                    </th>
                  )}
                  {/* Calendar Days Header */}
                  {daysArray.map((day) => (
                    <th
                      key={day.dayNumber}
                      className={`py-1 px-1 border-r border-slate-700 text-center min-w-[28px] ${
                        day.isFriday
                          ? 'bg-rose-900/90 text-rose-200 font-black'
                          : day.isSunday
                          ? 'bg-slate-700 text-slate-200'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {day.dayName}
                    </th>
                  ))}
                  {/* Summary Columns */}
                  <th className="py-1 px-1.5 bg-emerald-900/90 text-emerald-200 border-r border-slate-700 w-9" rowSpan={2}>
                    H
                  </th>
                  <th className="py-1 px-1.5 bg-amber-900/90 text-amber-200 border-r border-slate-700 w-9" rowSpan={2}>
                    S
                  </th>
                  <th className="py-1 px-1.5 bg-indigo-900/90 text-indigo-200 border-r border-slate-700 w-9" rowSpan={2}>
                    I
                  </th>
                  <th className="py-1 px-1.5 bg-rose-900/90 text-rose-200 border-r border-slate-700 w-9" rowSpan={2}>
                    A
                  </th>
                  <th className="py-1 px-2 bg-slate-900 text-white min-w-[55px]" rowSpan={2}>
                    % Hadir
                  </th>
                </tr>

                {/* Header Row 2: Date Numbers 1..31 */}
                <tr className="bg-slate-800 text-slate-100 text-[11px] font-extrabold text-center border-b border-slate-300">
                  {daysArray.map((day) => (
                    <th
                      key={`num-${day.dayNumber}`}
                      className={`py-1 px-1 border-r border-slate-700 ${
                        day.isFriday
                          ? 'bg-rose-800 text-white font-black'
                          : 'bg-slate-700/80 text-white'
                      }`}
                    >
                      {day.dayNumber}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-[11px]">
                {studentRows.map((row, idx) => (
                  <tr
                    key={`rekap-row-${row.student.id || row.student.nibk}-${idx}`}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-2 px-1.5 text-center font-mono text-slate-400 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2.5 font-mono font-semibold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                      {row.student.nibk}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                      {row.student.nama}
                    </td>
                    <td className="py-2 px-1.5 text-center border-r border-slate-200 font-bold">
                      <span
                        className={
                          row.student.jenisKelamin === 'L'
                            ? 'text-blue-600'
                            : 'text-pink-600'
                        }
                      >
                        {row.student.jenisKelamin}
                      </span>
                    </td>
                    {selectedClass === 'ALL' && (
                      <td className="py-2 px-2 text-center border-r border-slate-200 font-extrabold text-emerald-800">
                        {row.student.kelas}
                      </td>
                    )}

                    {/* Matrix Cells 1..N */}
                    {daysArray.map((day) => {
                      const dayData = row.dailyStatus[day.dayNumber];
                      const status = dayData?.status;

                      if (day.isFriday) {
                        return (
                          <td
                            key={`cell-${row.student.id || idx}-${day.dayNumber}`}
                            className="py-1 px-0.5 text-center border-r border-slate-200 bg-rose-50/70 font-extrabold text-rose-600 text-[10px]"
                            title="Jumat: Libur Resmi Sekolah"
                          >
                            L
                          </td>
                        );
                      }

                      return (
                        <td
                          key={`cell-${row.student.id || idx}-${day.dayNumber}`}
                          className="py-1 px-0.5 text-center border-r border-slate-200"
                        >
                          {status === 'H' ? (
                            <span className="inline-block w-5 h-5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] leading-5">
                              H
                            </span>
                          ) : status === 'S' ? (
                            <span
                              className="inline-block w-5 h-5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] leading-5 cursor-help"
                              title={`Sakit${dayData?.note ? `: ${dayData.note}` : ''}`}
                            >
                              S
                            </span>
                          ) : status === 'I' ? (
                            <span
                              className="inline-block w-5 h-5 rounded bg-indigo-100 text-indigo-900 font-bold text-[10px] leading-5 cursor-help"
                              title={`Izin${dayData?.note ? `: ${dayData.note}` : ''}`}
                            >
                              I
                            </span>
                          ) : status === 'A' ? (
                            <span
                              className="inline-block w-5 h-5 rounded bg-rose-600 text-white font-black text-[10px] leading-5 cursor-help"
                              title={`Alpha / Tanpa Keterangan${dayData?.note ? `: ${dayData.note}` : ''}`}
                            >
                              A
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Row Summary Counts */}
                    <td className="py-2 px-1 text-center font-bold text-emerald-800 bg-emerald-50/50 border-r border-slate-200">
                      {row.totalH}
                    </td>
                    <td className="py-2 px-1 text-center font-bold text-amber-800 bg-amber-50/50 border-r border-slate-200">
                      {row.totalS}
                    </td>
                    <td className="py-2 px-1 text-center font-bold text-indigo-800 bg-indigo-50/50 border-r border-slate-200">
                      {row.totalI}
                    </td>
                    <td className="py-2 px-1 text-center font-bold text-rose-800 bg-rose-50/50 border-r border-slate-200">
                      {row.totalA}
                    </td>
                    <td className="py-2 px-2 text-center font-extrabold border-r border-slate-200">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                          row.percentage >= 85
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.percentage >= 70
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {row.percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Table Footer: Daily Aggregate Totals */}
              <tfoot>
                <tr className="bg-slate-100 font-extrabold text-[10px] text-slate-800 border-t-2 border-slate-300 text-center">
                  <td
                    colSpan={selectedClass === 'ALL' ? 5 : 4}
                    className="py-2.5 px-3 text-right font-bold uppercase tracking-wider border-r border-slate-300"
                  >
                    Jumlah Hadir Harian:
                  </td>
                  {daysArray.map((day) => (
                    <td
                      key={`total-day-${day.dayNumber}`}
                      className={`py-2 px-0.5 border-r border-slate-300 ${
                        day.isFriday ? 'bg-rose-100 text-rose-700 font-bold' : 'text-slate-900'
                      }`}
                    >
                      {day.isFriday ? 'L' : dailyTotals[day.dayNumber]?.H || 0}
                    </td>
                  ))}
                  <td className="py-2 px-1 text-center bg-emerald-100 text-emerald-900 border-r border-slate-300 font-black">
                    {classSummary.sumH}
                  </td>
                  <td className="py-2 px-1 text-center bg-amber-100 text-amber-900 border-r border-slate-300 font-black">
                    {classSummary.sumS}
                  </td>
                  <td className="py-2 px-1 text-center bg-indigo-100 text-indigo-900 border-r border-slate-300 font-black">
                    {classSummary.sumI}
                  </td>
                  <td className="py-2 px-1 text-center bg-rose-100 text-rose-900 border-r border-slate-300 font-black">
                    {classSummary.sumA}
                  </td>
                  <td className="py-2 px-2 text-center bg-slate-900 text-white font-black">
                    {classSummary.avgPercentage.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* TABEL REKAPITULASI TOTAL KEHADIRAN (TERHUBUNG OTOMATIS & PRESISI 0.0%) */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  REKAPITULASI TOTAL KEHADIRAN KELAS BULAN {currentMonthName.toUpperCase()} {selectedYear}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Akumulasi terhubung langsung ke hasil rekapitulasi data yang sudah terisi ({classSummary.grandTotal} total pencatatan).
                </p>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
                Format Presisi 0.0%
              </span>
            </div>

            <div className="max-w-2xl overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-800 text-white font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3 border-r border-emerald-700">Kategori Kehadiran</th>
                    <th className="py-2.5 px-3 border-r border-emerald-700">Keterangan</th>
                    <th className="py-2.5 px-3 text-center border-r border-emerald-700 w-28">Total Siswa/Hari</th>
                    <th className="py-2.5 px-3 text-center w-28">Persentase (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-emerald-800 border-r border-slate-200">
                      Hadir (H)
                    </td>
                    <td className="py-2 px-3 text-slate-600 border-r border-slate-200">
                      Siswa Masuk Mengikuti Pembelajaran
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-900 border-r border-slate-200 font-mono">
                      {classSummary.sumH}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-700 font-mono bg-emerald-50/50">
                      {classSummary.pctH.toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-amber-800 border-r border-slate-200">
                      Sakit (S)
                    </td>
                    <td className="py-2 px-3 text-slate-600 border-r border-slate-200">
                      Siswa Berhalangan Karena Sakit
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-900 border-r border-slate-200 font-mono">
                      {classSummary.sumS}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-amber-700 font-mono bg-amber-50/50">
                      {classSummary.pctS.toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-indigo-800 border-r border-slate-200">
                      Izin (I)
                    </td>
                    <td className="py-2 px-3 text-slate-600 border-r border-slate-200">
                      Siswa Izin dengan Keterangan
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-900 border-r border-slate-200 font-mono">
                      {classSummary.sumI}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-indigo-700 font-mono bg-indigo-50/50">
                      {classSummary.pctI.toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-rose-800 border-r border-slate-200">
                      Alpa / Tanpa Keterangan (A)
                    </td>
                    <td className="py-2 px-3 text-slate-600 border-r border-slate-200">
                      Siswa Tidak Hadir Tanpa Surat/Kabar
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-900 border-r border-slate-200 font-mono">
                      {classSummary.sumA}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-rose-700 font-mono bg-rose-50/50">
                      {classSummary.pctA.toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={2} className="py-2.5 px-3 uppercase tracking-wider text-right border-r border-slate-300">
                      TOTAL KESELURUHAN:
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 font-mono text-emerald-900">
                      {classSummary.grandTotal}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-900 bg-slate-200">
                      {classSummary.grandTotal > 0 ? '100.0%' : '0.0%'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* PRINT-ONLY SIGNATURE SECTION */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-8 text-xs">
            <div className="text-center">
              <p>Mengetahui,</p>
              <p className="font-bold">Kepala {settings.schoolName || 'SMP Negeri 2 Paciran'}</p>
              <div className="h-20" />
              <p className="font-bold underline">{settings.kepalaSekolah}</p>
              <p className="text-slate-600">NIP. {settings.nipKepalaSekolah}</p>
            </div>
            <div className="text-center">
              <p>Paciran, {daysInMonth} {currentMonthName} {selectedYear}</p>
              <p className="font-bold">Wali Kelas / Guru Piket</p>
              <div className="h-20" />
              <p className="font-bold underline">{settings.waliKelas}</p>
              <p className="text-slate-600">NIP. {settings.nipWaliKelas}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
