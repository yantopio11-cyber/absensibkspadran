import React, { useState } from 'react';
import { SchoolSettings, Student, AttendanceRecord } from '../types';
import {
  DEFAULT_SETTINGS,
  DEFAULT_GOOGLE_SHEET_STUDENT_URL,
  sendAttendanceToGoogleSheets,
  pushSettingsToCloud,
  fetchRemoteSettings,
} from '../utils/storage';
import {
  Settings,
  School,
  Database,
  Link,
  Code,
  Download,
  Upload,
  CheckCircle,
  Copy,
  Trash2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Globe,
  AlertCircle,
  Info,
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  KeyRound,
  LogIn,
  LogOut,
  CheckCircle2,
  Cloud,
  CloudUpload,
  CloudDownload,
  Wifi,
  Radio,
} from 'lucide-react';

interface PengaturanTabProps {
  settings: SchoolSettings;
  onSaveSettings: (newSettings: SchoolSettings) => void;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onRestoreAllData: (students: Student[], attendance: AttendanceRecord[], settings: SchoolSettings) => void;
  onClearAttendanceOnly: () => void;
  onClearAll: () => void;
  onSyncGoogleSheet?: (customUrl?: string, showToast?: boolean) => Promise<{ success: boolean; count: number; classes: string[] }>;
  onSyncRemoteSettings?: (showToast?: boolean) => Promise<{ success: boolean; updated?: boolean }>;
  isSyncingSheet?: boolean;
}

export const PengaturanTab: React.FC<PengaturanTabProps> = ({
  settings,
  onSaveSettings,
  students,
  attendanceRecords,
  onRestoreAllData,
  onClearAttendanceOnly,
  onClearAll,
  onSyncGoogleSheet,
  onSyncRemoteSettings,
  isSyncingSheet = false,
}) => {
  const [formData, setFormData] = useState<SchoolSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testResult, setTestResult] = useState<{ loading: boolean; msg: string; success?: boolean } | null>(null);
  const [sheetSyncResult, setSheetSyncResult] = useState<{ loading: boolean; msg: string; success?: boolean } | null>(null);
  const [cloudSyncLoading, setCloudSyncLoading] = useState(false);
  const [cloudSyncResult, setCloudSyncResult] = useState<{ loading: boolean; msg: string; success?: boolean } | null>(null);

  // Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('spadaran_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const user = adminUsername.trim().toLowerCase();
    const pass = adminPassword.trim();

    if (user === 'smpn2paciran' && pass === 'adminspadaran') {
      setIsAdminAuthenticated(true);
      try {
        sessionStorage.setItem('spadaran_admin_auth', 'true');
      } catch (err) {
        console.error('Session storage error:', err);
      }
      setLoginError(null);
    } else {
      setLoginError('Username atau Password Admin salah! Periksa kembali data login Anda.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminUsername('');
    setAdminPassword('');
    try {
      sessionStorage.removeItem('spadaran_admin_auth');
    } catch (err) {
      console.error('Session storage error:', err);
    }
  };

  React.useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);

    // Otomatis sebar / push pengaturan ke Cloud jika Webhook URL tersedia
    if (formData.googleWebhookUrl) {
      setCloudSyncLoading(true);
      const res = await pushSettingsToCloud(formData, formData.googleWebhookUrl);
      setCloudSyncLoading(false);
      setCloudSyncResult({
        loading: false,
        msg: res.success
          ? 'Pengaturan berhasil disimpan dan di-update ke Cloud Spreadsheet untuk SEMUA perangkat!'
          : res.message,
        success: res.success,
      });
      setTimeout(() => setCloudSyncResult(null), 6000);
    }
  };

  const handlePushSettingsToCloudManual = async () => {
    setCloudSyncLoading(true);
    setCloudSyncResult({ loading: true, msg: 'Sedang menyebarkan pengaturan ke Cloud Spreadsheet...' });
    const res = await pushSettingsToCloud(formData, formData.googleWebhookUrl);
    setCloudSyncLoading(false);
    setCloudSyncResult({
      loading: false,
      msg: res.success
        ? 'Sukses! Pengaturan berhasil disimpan di Cloud Spreadsheet dan otomatis tersinkron ke semua perangkat yang mengakses web app ini.'
        : res.message,
      success: res.success,
    });
  };

  const handlePullSettingsFromCloudManual = async () => {
    if (onSyncRemoteSettings) {
      setCloudSyncLoading(true);
      setCloudSyncResult({ loading: true, msg: 'Sedang mengecek dan menarik pengaturan dari Cloud...' });
      const res = await onSyncRemoteSettings(false);
      setCloudSyncLoading(false);
      if (res.success) {
        setCloudSyncResult({
          loading: false,
          msg: res.updated
            ? 'Pengaturan terbaru dari Cloud Admin berhasil ditarik dan diterapkan ke perangkat ini.'
            : 'Pengaturan perangkat ini sudah cocok dan sinkron dengan Admin Pusat.',
          success: true,
        });
      } else {
        setCloudSyncResult({
          loading: false,
          msg: 'Gagal menarik pengaturan dari Cloud. Pastikan Webhook sudah aktif dan telah dideploy sebagai Aplikasi Web.',
          success: false,
        });
      }
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan profil sekolah ke setelan awal SMP Negeri 2 Paciran?')) {
      setFormData(DEFAULT_SETTINGS);
      onSaveSettings(DEFAULT_SETTINGS);
    }
  };

  const handleManualSyncStudents = async () => {
    if (!onSyncGoogleSheet) return;
    setSheetSyncResult({ loading: true, msg: 'Sedang mengunduh dan membaca data siswa dari Google Sheets...' });
    const res = await onSyncGoogleSheet(formData.googleSheetStudentUrl, false);
    if (res.success) {
      setSheetSyncResult({
        loading: false,
        msg: `Berhasil menyinkronkan ${res.count} siswa dari ${res.classes.length} kelas (${res.classes.join(', ')}).`,
        success: true,
      });
    } else {
      setSheetSyncResult({
        loading: false,
        msg: 'Gagal mengambil data dari Google Sheets. Pastikan URL benar dan sheet telah dipublikasikan sebagai CSV.',
        success: false,
      });
    }
  };

  // Google Apps Script code generator
  const appsScriptCode = `function doPost(e) {
  return handleAllRequests(e);
}

function doGet(e) {
  return handleAllRequests(e);
}

function handleAllRequests(e) {
  try {
    var rawData = "";
    if (e && e.parameter && e.parameter.data) {
      rawData = e.parameter.data;
    } else if (e && e.postData && e.postData.contents) {
      rawData = e.postData.contents;
    } else if (e && e.postData && typeof e.postData.getDataAsString === "function") {
      rawData = e.postData.getDataAsString();
    } else if (e && e.parameter && e.parameter.payload) {
      rawData = e.parameter.payload;
    }

    if (!rawData) {
      if (e && e.parameter && e.parameter.action) {
        data = { action: e.parameter.action, kelas: e.parameter.kelas, tahun: e.parameter.tahun, bulan: e.parameter.bulan };
      } else {
        return ContentService.createTextOutput(
          JSON.stringify({ status: "success", message: "Web App Absensi SMPN 2 Paciran Aktif & Siap Digunakan!" })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    } else {
      try {
        data = JSON.parse(rawData);
      } catch (parseErr) {
        data = JSON.parse(decodeURIComponent(rawData));
      }
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error("Spreadsheet tidak ditemukan. Pastikan Apps Script dibuat melalui menu Ekstensi > Apps Script di Google Sheets Anda.");
    }

    // =========================================================================
    // 0. TARIK SEMUA DATA ABSENSI LIVE (UNTUK SINKRONISASI MULTI-PERANGKAT HP/LAPTOP)
    // =========================================================================
    if (data && (data.action === "get_all_attendance" || data.action === "get_attendance")) {
      var allRecords = [];
      var masterSheet = ss.getSheetByName("DATABASE_ABSENSI_ALL");
      
      if (masterSheet && masterSheet.getLastRow() > 1) {
        var values = masterSheet.getRange(2, 1, masterSheet.getLastRow() - 1, 8).getValues();
        for (var m = 0; m < values.length; m++) {
          var rowM = values[m];
          var nibkVal = String(rowM[1] || "").replace(/^'/, "").trim();
          var namaVal = String(rowM[2] || "").trim();
          var kelasVal = String(rowM[3] || "").trim();
          var tanggalVal = String(rowM[4] || "").trim();
          var statusVal = String(rowM[5] || "").trim().toUpperCase();
          var catatanVal = String(rowM[6] || "").trim();
          
          if (tanggalVal && statusVal) {
            // Filter kelas if requested
            if (data.kelas && data.kelas !== "ALL" && kelasVal !== data.kelas) continue;
            allRecords.push({
              nibk: nibkVal,
              nama: namaVal,
              kelas: kelasVal,
              tanggal: tanggalVal,
              status: statusVal,
              catatan: catatanVal
            });
          }
        }
      } else {
        // Fallback: cari dari sheet absensi bulanan yang ada
        var sheets = ss.getSheets();
        for (var sIdx = 0; sIdx < sheets.length; sIdx++) {
          var sh = sheets[sIdx];
          var shName = sh.getName();
          if (shName.indexOf("Absensi_") === 0 || shName.indexOf("Januari") === 0 || shName.indexOf("Februari") === 0 || 
              shName.indexOf("Maret") === 0 || shName.indexOf("April") === 0 || shName.indexOf("Mei") === 0 || 
              shName.indexOf("Juni") === 0 || shName.indexOf("Juli") === 0 || shName.indexOf("Agustus") === 0 || 
              shName.indexOf("September") === 0 || shName.indexOf("Oktober") === 0 || shName.indexOf("November") === 0 || 
              shName.indexOf("Desember") === 0) {
            if (sh.getLastRow() > 1 && sh.getLastColumn() >= 6) {
              var sValues = sh.getRange(2, 1, sh.getLastRow() - 1, Math.min(sh.getLastColumn(), 7)).getValues();
              for (var rowIdx = 0; rowIdx < sValues.length; rowIdx++) {
                var sRow = sValues[rowIdx];
                var sNibk = String(sRow[1] || "").replace(/^'/, "").trim();
                var sNama = String(sRow[2] || "").trim();
                var sKelas = String(sRow[3] || "").trim();
                var sTgl = String(sRow[4] || "").trim();
                var sSt = String(sRow[5] || "").trim().toUpperCase();
                var sCat = String(sRow[6] || "").trim();
                if (sTgl && ["H", "S", "I", "A"].indexOf(sSt) >= 0) {
                  if (data.kelas && data.kelas !== "ALL" && sKelas !== data.kelas) continue;
                  allRecords.push({
                    nibk: sNibk,
                    nama: sNama,
                    kelas: sKelas,
                    tanggal: sTgl,
                    status: sSt,
                    catatan: sCat
                  });
                }
              }
            }
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        count: allRecords.length,
        records: allRecords
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // 1. FORMAT REKAP ABSENSI RESMI (PERSIS SEPERTI TAB REKAPITULASI APLIKASI)
    // - Kop Resmi Sekolah
    // - Header 2 Baris: Nama Hari (Min, Sen, ...) + Nomor Tanggal (1..31)
    // - Status Siswa: H, S, I, A, L (Jumat Libur), -
    // - Kolom Total: H, S, I, A, % Hadir
    // - Baris Footer: Jumlah Hadir Harian
    // - Tabel Ringkasan Persentase Kehadiran
    // - Format Tanda Tangan Kepala Sekolah & Wali Kelas
    // =========================================================================
    if (data.action === "save_monthly_matrix" || data.matrix) {
      var bulan = data.bulan || "Bulan";
      var kelas = data.kelas || "Semua";
      var sheetName = bulan + " " + kelas;
      var sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      } else {
        sheet.clear();
      }

      var daysInMonth = parseInt(data.daysInMonth, 10) || 31;
      var tahun = data.tahun || new Date().getFullYear();
      var schoolName = data.school || "SMP NEGERI 2 PACIRAN";
      var alamat = data.alamat || "Jl. Raya Paciran No. 123, Paciran, Lamongan";
      var kepalaSekolah = data.kepalaSekolah || "Drs. H. M. Zainuri, M.Pd.";
      var nipKepalaSekolah = data.nipKepalaSekolah || "19680512 199403 1 005";
      var waliKelas = data.waliKelas || "Guru Piket / Wali Kelas";
      var nipWaliKelas = data.nipWaliKelas || "19850720 201001 2 018";
      var daysInfo = data.daysInfo || [];

      // Total Kolom: NO, NIBK, NAMA, JK, KELAS (5) + Hari (1..N) + H, S, I, A, % (5)
      var totalColumns = 5 + daysInMonth + 5;

      // Pastikan jumlah kolom sheet mencukupi (Google Sheet default hanya 26 kolom A-Z)
      if (sheet.getMaxColumns() < totalColumns) {
        sheet.insertColumnsAfter(sheet.getMaxColumns(), totalColumns - sheet.getMaxColumns());
      }

      // Helper konversi indeks kolom angka ke huruf kolom Spreadsheet (misal: 1->A, 26->Z, 27->AA)
      function colToLetter(col) {
        var temp, letter = '';
        while (col > 0) {
          temp = (col - 1) % 26;
          letter = String.fromCharCode(temp + 65) + letter;
          col = Math.floor((col - temp - 1) / 26);
        }
        return letter;
      }

      var firstDayCol = colToLetter(6);
      var lastDayCol = colToLetter(5 + daysInMonth);
      var colHLetter = colToLetter(5 + daysInMonth + 1);
      var colSLetter = colToLetter(5 + daysInMonth + 2);
      var colILetter = colToLetter(5 + daysInMonth + 3);
      var colALetter = colToLetter(5 + daysInMonth + 4);
      var colPctLetter = colToLetter(5 + daysInMonth + 5);

      // 1. Kop Surat & Judul Rekapitulasi
      sheet.getRange(1, 1).setValue("PEMERINTAH KABUPATEN LAMONGAN • DINAS PENDIDIKAN");
      sheet.getRange(1, 1).setFontSize(10).setFontWeight("bold").setFontColor("#475569");

      sheet.getRange(2, 1).setValue(schoolName.toUpperCase());
      sheet.getRange(2, 1).setFontSize(14).setFontWeight("bold").setFontColor("#0f172a");

      sheet.getRange(3, 1).setValue(alamat);
      sheet.getRange(3, 1).setFontSize(9).setFontColor("#64748b");

      sheet.getRange(4, 1).setValue("REKAPITULASI PRESENSI SISWA BULAN " + String(bulan).toUpperCase() + " " + tahun + " - KELAS " + kelas.toUpperCase());
      sheet.getRange(4, 1).setFontSize(12).setFontWeight("bold").setFontColor("#047857");

      // 2. Baris Header Tabel
      var headerRow1 = ["NO", "NIBK", "NAMA LENGKAP", "JK", "KELAS"];
      var headerRow2 = ["", "", "", "", ""];

      var dayNamesShort = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      for (var d = 1; d <= daysInMonth; d++) {
        var dayName = "";
        if (daysInfo && daysInfo[d - 1] && daysInfo[d - 1].dayName) {
          dayName = daysInfo[d - 1].dayName;
        } else {
          var dateObj = new Date(tahun, (data.bulanAngka ? data.bulanAngka - 1 : 0), d);
          dayName = dayNamesShort[dateObj.getDay()];
        }
        headerRow1.push(dayName);
        headerRow2.push(String(d));
      }

      headerRow1.push("H", "S", "I", "A", "% Hadir");
      headerRow2.push("", "", "", "", "");

      var headerRange1 = sheet.getRange(6, 1, 1, totalColumns);
      headerRange1.setValues([headerRow1])
                  .setFontWeight("bold")
                  .setBackground("#1e293b")
                  .setFontColor("#ffffff")
                  .setHorizontalAlignment("center")
                  .setFontSize(9);

      var headerRange2 = sheet.getRange(7, 1, 1, totalColumns);
      headerRange2.setValues([headerRow2])
                  .setFontWeight("bold")
                  .setBackground("#334155")
                  .setFontColor("#f8fafc")
                  .setHorizontalAlignment("center")
                  .setFontSize(10);

      // Merge kolom non-tanggal (NO, NIBK, NAMA, JK, KELAS, H, S, I, A, %)
      sheet.getRange(6, 1, 2, 1).merge().setValue("NO");
      sheet.getRange(6, 2, 2, 1).merge().setValue("NIBK");
      sheet.getRange(6, 3, 2, 1).merge().setValue("NAMA SISWA");
      sheet.getRange(6, 4, 2, 1).merge().setValue("JK");
      sheet.getRange(6, 5, 2, 1).merge().setValue("KELAS");

      sheet.getRange(6, 5 + daysInMonth + 1, 2, 1).merge().setValue("H").setBackground("#065f46");
      sheet.getRange(6, 5 + daysInMonth + 2, 2, 1).merge().setValue("S").setBackground("#92400e");
      sheet.getRange(6, 5 + daysInMonth + 3, 2, 1).merge().setValue("I").setBackground("#3730a3");
      sheet.getRange(6, 5 + daysInMonth + 4, 2, 1).merge().setValue("A").setBackground("#9f1239");
      sheet.getRange(6, 5 + daysInMonth + 5, 2, 1).merge().setValue("% Hadir").setBackground("#0f172a");

      // Warnai header kolom hari Jumat (Libur)
      for (var dj = 1; dj <= daysInMonth; dj++) {
        var isFri = (daysInfo && daysInfo[dj - 1]) ? daysInfo[dj - 1].isFriday : (headerRow1[5 + dj - 1] === "Jum");
        if (isFri) {
          sheet.getRange(6, 5 + dj, 1, 1).setBackground("#881337").setFontColor("#fecdd3");
          sheet.getRange(7, 5 + dj, 1, 1).setBackground("#9f1239").setFontColor("#ffffff");
        }
      }

      // 3. Isi Data Baris Siswa dengan Rumus Otomatis (COUNTIF & Persentase Dinamis 0.0%)
      var matrixRows = [];
      var matrix = data.matrix || [];
      var startDataRow = 8;
      var endDataRow = startDataRow + matrix.length - 1;

      for (var i = 0; i < matrix.length; i++) {
        var s = matrix[i];
        var currentRow = startDataRow + i;
        var row = [
          i + 1,
          "'" + (s.nibk || ""),
          s.nama || "",
          s.jk || "",
          s.kelas || ""
        ];

        // Isi status harian tanggal 1..N
        for (var day = 1; day <= daysInMonth; day++) {
          var val = (s.dailyStatus && s.dailyStatus[day]) ? s.dailyStatus[day] : "-";
          row.push(val);
        }

        // RUMUS OTOMATIS SPREADSHEET:
        // H, S, I, A dihitung dinamis dengan COUNTIF sehingga jika diisi di tengah bulan langsung terupdate
        var formulaH = '=COUNTIF(' + firstDayCol + currentRow + ':' + lastDayCol + currentRow + ', "H")';
        var formulaS = '=COUNTIF(' + firstDayCol + currentRow + ':' + lastDayCol + currentRow + ', "S")';
        var formulaI = '=COUNTIF(' + firstDayCol + currentRow + ':' + lastDayCol + currentRow + ', "I")';
        var formulaA = '=COUNTIF(' + firstDayCol + currentRow + ':' + lastDayCol + currentRow + ', "A")';

        // PERSENTASE OTOMATIS: membagi H dengan (H+S+I+A) dari data yang terisi saja (meski bulan belum selesai)
        var sumActiveRecorded = '(' + colHLetter + currentRow + '+' + colSLetter + currentRow + '+' + colILetter + currentRow + '+' + colALetter + currentRow + ')';
        var formulaPct = '=IF(' + sumActiveRecorded + '>0, ' + colHLetter + currentRow + '/' + sumActiveRecorded + ', 0)';

        row.push(formulaH);
        row.push(formulaS);
        row.push(formulaI);
        row.push(formulaA);
        row.push(formulaPct);

        matrixRows.push(row);
      }

      if (matrixRows.length > 0) {
        var dataRange = sheet.getRange(startDataRow, 1, matrixRows.length, totalColumns);
        dataRange.setValues(matrixRows);
        dataRange.setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
        dataRange.setFontSize(10);

        // Alignment kolom
        sheet.getRange(startDataRow, 1, matrixRows.length, 1).setHorizontalAlignment("center");
        sheet.getRange(startDataRow, 4, matrixRows.length, 1).setHorizontalAlignment("center");
        sheet.getRange(startDataRow, 5, matrixRows.length, 1).setHorizontalAlignment("center");
        sheet.getRange(startDataRow, 6, matrixRows.length, daysInMonth).setHorizontalAlignment("center");
        sheet.getRange(startDataRow, 5 + daysInMonth + 1, matrixRows.length, 5).setHorizontalAlignment("center");
        sheet.getRange(startDataRow, 5 + daysInMonth + 5, matrixRows.length, 1).setFontWeight("bold");

        // Format angka presisi 0.0% untuk kolom % Hadir
        sheet.getRange(startDataRow, 5 + daysInMonth + 5, matrixRows.length, 1).setNumberFormat("0.0%");

        // Background styling untuk kolom summary per baris
        sheet.getRange(startDataRow, 5 + daysInMonth + 1, matrixRows.length, 1).setBackground("#ecfdf5").setFontColor("#065f46").setFontWeight("bold");
        sheet.getRange(startDataRow, 5 + daysInMonth + 2, matrixRows.length, 1).setBackground("#fffbeb").setFontColor("#92400e").setFontWeight("bold");
        sheet.getRange(startDataRow, 5 + daysInMonth + 3, matrixRows.length, 1).setBackground("#eef2ff").setFontColor("#3730a3").setFontWeight("bold");
        sheet.getRange(startDataRow, 5 + daysInMonth + 4, matrixRows.length, 1).setBackground("#fff1f2").setFontColor("#9f1239").setFontWeight("bold");
      }

      // 4. Baris Footer: Jumlah Hadir Harian & Total Dinamis Terhubung
      var footerRowIndex = startDataRow + matrixRows.length;
      var footerRow = ["", "", "", "", "Jumlah Hadir Harian:"];
      
      for (var fDay = 1; fDay <= daysInMonth; fDay++) {
        var isFridayFooter = (daysInfo && daysInfo[fDay - 1]) ? daysInfo[fDay - 1].isFriday : (headerRow1[5 + fDay - 1] === "Jum");
        if (isFridayFooter) {
          footerRow.push("L");
        } else {
          var dayColLet = colToLetter(5 + fDay);
          footerRow.push(matrixRows.length > 0 ? ('=COUNTIF(' + dayColLet + startDataRow + ':' + dayColLet + endDataRow + ', "H")') : 0);
        }
      }

      if (matrixRows.length > 0) {
        var footerFormulaH = '=SUM(' + colHLetter + startDataRow + ':' + colHLetter + endDataRow + ')';
        var footerFormulaS = '=SUM(' + colSLetter + startDataRow + ':' + colSLetter + endDataRow + ')';
        var footerFormulaI = '=SUM(' + colILetter + startDataRow + ':' + colILetter + endDataRow + ')';
        var footerFormulaA = '=SUM(' + colALetter + startDataRow + ':' + colALetter + endDataRow + ')';
        var sumFooterRecorded = '(' + colHLetter + footerRowIndex + '+' + colSLetter + footerRowIndex + '+' + colILetter + footerRowIndex + '+' + colALetter + footerRowIndex + ')';
        var footerFormulaPct = '=IF(' + sumFooterRecorded + '>0, ' + colHLetter + footerRowIndex + '/' + sumFooterRecorded + ', 0)';

        footerRow.push(footerFormulaH, footerFormulaS, footerFormulaI, footerFormulaA, footerFormulaPct);
      } else {
        footerRow.push(0, 0, 0, 0, 0);
      }

      sheet.getRange(footerRowIndex, 1, 1, 5).merge().setValue("Jumlah Hadir Harian:").setHorizontalAlignment("right").setFontWeight("bold");
      sheet.getRange(footerRowIndex, 6, 1, daysInMonth + 5).setValues([footerRow.slice(5)]);

      var footerRange = sheet.getRange(footerRowIndex, 1, 1, totalColumns);
      footerRange.setFontWeight("bold")
                 .setBackground("#f1f5f9")
                 .setBorder(true, true, true, true, true, true, "#94a3b8", SpreadsheetApp.BorderStyle.SOLID)
                 .setFontSize(10);
      sheet.getRange(footerRowIndex, 6, 1, daysInMonth + 5).setHorizontalAlignment("center");
      sheet.getRange(footerRowIndex, 5 + daysInMonth + 5, 1, 1).setBackground("#1e293b").setFontColor("#ffffff").setNumberFormat("0.0%");

      // =========================================================================
      // 5. TABEL REKAPITULASI TOTAL & PERSENTASE TERHUBUNG OTOMATIS KE HASIL SUM FOOTER
      // =========================================================================
      var summaryStartRow = footerRowIndex + 3;

      sheet.getRange(summaryStartRow, 1).setValue("REKAPITULASI TOTAL KEHADIRAN KELAS BULAN " + String(bulan).toUpperCase() + " " + tahun);
      sheet.getRange(summaryStartRow, 1).setFontWeight("bold").setFontSize(11).setFontColor("#0f172a");

      var rowHIndex = summaryStartRow + 2;
      var rowSIndex = summaryStartRow + 3;
      var rowIIndex = summaryStartRow + 4;
      var rowAIndex = summaryStartRow + 5;
      var rowTotalIndex = summaryStartRow + 6;

      var summaryTable = [
        ["Kategori Kehadiran", "Keterangan", "Total Hari/Siswa", "Persentase (%)"],
        ["Hadir (H)", "Siswa Masuk Mengikuti Pembelajaran", "=" + colHLetter + footerRowIndex, "=IF(C" + rowTotalIndex + ">0, C" + rowHIndex + "/C" + rowTotalIndex + ", 0)"],
        ["Sakit (S)", "Siswa Berhalangan Karena Sakit", "=" + colSLetter + footerRowIndex, "=IF(C" + rowTotalIndex + ">0, C" + rowSIndex + "/C" + rowTotalIndex + ", 0)"],
        ["Izin (I)", "Siswa Izin dengan Keterangan", "=" + colILetter + footerRowIndex, "=IF(C" + rowTotalIndex + ">0, C" + rowIIndex + "/C" + rowTotalIndex + ", 0)"],
        ["Alpa / Tanpa Keterangan (A)", "Siswa Tidak Hadir Tanpa Surat/Kabar", "=" + colALetter + footerRowIndex, "=IF(C" + rowTotalIndex + ">0, C" + rowAIndex + "/C" + rowTotalIndex + ", 0)"],
        ["TOTAL KESELURUHAN", "Akumulasi Seluruh Hari Efektif Belajar", "=SUM(C" + rowHIndex + ":C" + rowAIndex + ")", "=IF(C" + rowTotalIndex + ">0, 1, 0)"]
      ];

      var summaryRange = sheet.getRange(summaryStartRow + 1, 1, summaryTable.length, 4);
      summaryRange.setValues(summaryTable);
      summaryRange.setBorder(true, true, true, true, true, true, "#94a3b8", SpreadsheetApp.BorderStyle.SOLID);
      summaryRange.setFontSize(10);

      // Format Presisi Persentase 0.0% di Tabel Rekapitulasi
      sheet.getRange(summaryStartRow + 2, 4, 5, 1).setNumberFormat("0.0%");

      // Header summary styling
      sheet.getRange(summaryStartRow + 1, 1, 1, 4)
           .setFontWeight("bold")
           .setBackground("#047857")
           .setFontColor("#ffffff")
           .setHorizontalAlignment("center");

      // Total baris styling
      sheet.getRange(summaryStartRow + summaryTable.length, 1, 1, 4)
           .setFontWeight("bold")
           .setBackground("#e2e8f0");

      sheet.getRange(summaryStartRow + 2, 3, summaryTable.length - 1, 2)
           .setHorizontalAlignment("center");

      // =========================================================================
      // 6. FORMAT TANDA TANGAN (KEPALA SEKOLAH & WALI KELAS)
      // =========================================================================
      var sigStartRow = summaryStartRow + summaryTable.length + 3;

      // Kiri: Kepala Sekolah
      sheet.getRange(sigStartRow, 2).setValue("Mengetahui,");
      sheet.getRange(sigStartRow + 1, 2).setValue("Kepala " + schoolName).setFontWeight("bold");
      sheet.getRange(sigStartRow + 5, 2).setValue(kepalaSekolah).setFontWeight("bold").setFontUnderline("single");
      sheet.getRange(sigStartRow + 6, 2).setValue("NIP. " + nipKepalaSekolah);

      // Kanan: Wali Kelas / Guru Piket
      var rightCol = Math.max(10, totalColumns - 4);
      sheet.getRange(sigStartRow, rightCol).setValue("Paciran, " + daysInMonth + " " + bulan + " " + tahun);
      sheet.getRange(sigStartRow + 1, rightCol).setValue("Wali Kelas / Guru Piket").setFontWeight("bold");
      sheet.getRange(sigStartRow + 5, rightCol).setValue(waliKelas).setFontWeight("bold").setFontUnderline("single");
      sheet.getRange(sigStartRow + 6, rightCol).setValue("NIP. " + nipWaliKelas);

      // Auto-fit kolom nama dan ukuran kolom tanggal
      sheet.setColumnWidth(1, 35); // NO
      sheet.setColumnWidth(2, 85); // NIBK
      sheet.setColumnWidth(3, 190); // NAMA
      sheet.setColumnWidth(4, 35); // JK
      sheet.setColumnWidth(5, 50); // KELAS

      for (var c = 6; c <= 5 + daysInMonth; c++) {
        sheet.setColumnWidth(c, 30);
      }
      sheet.setColumnWidth(5 + daysInMonth + 1, 38); // H
      sheet.setColumnWidth(5 + daysInMonth + 2, 38); // S
      sheet.setColumnWidth(5 + daysInMonth + 3, 38); // I
      sheet.setColumnWidth(5 + daysInMonth + 4, 38); // A
      sheet.setColumnWidth(5 + daysInMonth + 5, 65); // % Hadir

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        sheet: sheetName,
        message: "Rekapitulasi absensi bulanan resmi berhasil dibuat di sheet: " + sheetName
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // 2. PENGATURAN REMOTE CLOUD (SINKRONISASI PENGATURAN KE SELURUH PERANGKAT)
    // =========================================================================
    if (data.action === "save_settings" || (e && e.parameter && e.parameter.action === "save_settings")) {
      var configSheet = ss.getSheetByName("CONFIG_PENGATURAN");
      if (!configSheet) {
        configSheet = ss.insertSheet("CONFIG_PENGATURAN");
      }
      configSheet.clear();
      configSheet.appendRow(["Kunci Pengaturan", "Nilai / Value", "Waktu Pembaruan Terakhir"]);
      configSheet.getRange(1, 1, 1, 3)
                 .setFontWeight("bold")
                 .setBackground("#059669")
                 .setFontColor("#ffffff");

      var settingsObj = data.settings || data;
      var keys = [
        "schoolName", "logoUrl", "alamat", "kepalaSekolah", 
        "nipKepalaSekolah", "waliKelas", "nipWaliKelas", 
        "googleWebhookUrl", "googleSheetStudentUrl", "autoSync", "updatedAt"
      ];

      var nowStr = new Date().toLocaleString("id-ID");
      var rowsToInsert = [];
      for (var ki = 0; ki < keys.length; ki++) {
        var kName = keys[ki];
        var kVal = settingsObj[kName] !== undefined ? String(settingsObj[kName]) : "";
        rowsToInsert.push([kName, kVal, nowStr]);
      }
      if (rowsToInsert.length > 0) {
        configSheet.getRange(2, 1, rowsToInsert.length, 3).setValues(rowsToInsert);
      }

      configSheet.setColumnWidth(1, 180);
      configSheet.setColumnWidth(2, 450);
      configSheet.setColumnWidth(3, 180);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Pengaturan berhasil disimpan di Cloud Spreadsheet dan siap disinkronkan ke seluruh perangkat!",
        updatedAt: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "get_settings" || (e && e.parameter && e.parameter.action === "get_settings")) {
      var configSheet = ss.getSheetByName("CONFIG_PENGATURAN");
      var configData = {};
      if (configSheet && configSheet.getLastRow() >= 2) {
        var vals = configSheet.getDataRange().getValues();
        for (var i = 1; i < vals.length; i++) {
          var k = String(vals[i][0] || "").trim();
          var v = vals[i][1];
          if (k) {
            if (v === "true") configData[k] = true;
            else if (v === "false") configData[k] = false;
            else configData[k] = v;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        settings: configData
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // 3. FORMAT LOG HARIAN KETIKA SIMPAN ABSENSI KELAS
    // =========================================================================
    var namaBulan = "";
    if (data.tanggal) {
      var dateParts = String(data.tanggal).split("-");
      var bulanArray = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      if (dateParts.length === 3) {
        var monthIndex = parseInt(dateParts[1], 10) - 1;
        namaBulan = bulanArray[monthIndex] || "";
      }
    }
    if (!namaBulan && data.bulan) namaBulan = data.bulan;

    var logSheetName = (namaBulan ? (namaBulan + " ") : "Absensi_") + (data.kelas || "Semua");
    var logSheet = ss.getSheetByName(logSheetName);

    if (!logSheet) {
      logSheet = ss.insertSheet(logSheetName);
      logSheet.appendRow(["Waktu Simpan", "NIBK", "Nama Lengkap", "Kelas", "Tanggal", "Status", "Catatan"]);
      logSheet.getRange(1, 1, 1, 7)
              .setFontWeight("bold")
              .setBackground("#10b981")
              .setFontColor("#ffffff");
    }

    if (data.records && data.records.length > 0) {
      var rows = [];
      for (var k = 0; k < data.records.length; k++) {
        var r = data.records[k];
        rows.push([
          r.waktuUpdate || new Date().toLocaleString("id-ID"),
          "'" + (r.nibk || ""),
          r.nama || "",
          r.kelas || "",
          r.tanggal || "",
          r.status || "",
          r.catatan || ""
        ]);
      }

      if (rows.length > 0) {
        logSheet.getRange(logSheet.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
      }

      // Maintain Master Hub: DATABASE_ABSENSI_ALL (Deduplicated per NIBK & Tanggal for seamless multi-device live sync)
      var masterSheet = ss.getSheetByName("DATABASE_ABSENSI_ALL");
      if (!masterSheet) {
        masterSheet = ss.insertSheet("DATABASE_ABSENSI_ALL");
        masterSheet.appendRow(["KEY", "NIBK", "Nama Lengkap", "Kelas", "Tanggal", "Status", "Catatan", "Waktu Simpan"]);
        masterSheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
      }

      var existingMap = {};
      var lastRowMaster = masterSheet.getLastRow();
      if (lastRowMaster > 1) {
        var keys = masterSheet.getRange(2, 1, lastRowMaster - 1, 1).getValues();
        for (var km = 0; km < keys.length; km++) {
          existingMap[String(keys[km][0])] = km + 2; // baris row index
        }
      }

      for (var kr = 0; kr < data.records.length; kr++) {
        var rec = data.records[kr];
        var itemKey = (rec.nibk || rec.nama || "") + "_" + (rec.tanggal || "");
        var masterRowData = [
          itemKey,
          "'" + (rec.nibk || ""),
          rec.nama || "",
          rec.kelas || "",
          rec.tanggal || "",
          rec.status || "",
          rec.catatan || "",
          rec.waktuUpdate || new Date().toLocaleString("id-ID")
        ];

        if (existingMap[itemKey]) {
          // Update baris yang sudah ada
          masterSheet.getRange(existingMap[itemKey], 1, 1, 8).setValues([masterRowData]);
        } else {
          // Append baris baru
          masterSheet.appendRow(masterRowData);
          existingMap[itemKey] = masterSheet.getLastRow();
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      sheet: logSheetName,
      count: data.records ? data.records.length : 0
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log("Error: " + err.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyAppsScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Test Webhook Connection
  const handleTestWebhook = async () => {
    const rawUrl = formData.googleWebhookUrl ? formData.googleWebhookUrl.trim() : '';
    if (!rawUrl) {
      setTestResult({
        loading: false,
        msg: 'Silakan masukkan URL Webhook Google Apps Script terlebih dahulu.',
        success: false,
      });
      return;
    }

    if (rawUrl.includes('/edit')) {
      setTestResult({
        loading: false,
        msg: '⚠️ URL yang Anda masukkan adalah URL Editor skrip (/edit). Harap klik tombol Terapkan (Deploy) > Deployment baru di Apps Script untuk mendapatkan URL Web App yang berakhiran /exec.',
        success: false,
      });
      return;
    }

    if (rawUrl.includes('docs.google.com/spreadsheets')) {
      setTestResult({
        loading: false,
        msg: '⚠️ URL ini adalah tautan Google Spreadsheet, bukan URL Webhook Apps Script. Silakan buka menu Ekstensi > Apps Script di Spreadsheet Anda, lalu terapkan skrip sebagai Aplikasi Web.',
        success: false,
      });
      return;
    }

    setTestResult({ loading: true, msg: 'Mengirim data uji coba ke Spreadsheet...' });
    const dummyRecord: AttendanceRecord = {
      id: 'test_record_' + Date.now(),
      studentId: 'test_std_01',
      nibk: '240001',
      nama: 'TEST KONEKSI SISWA',
      kelas: '7A',
      tanggal: new Date().toISOString().split('T')[0],
      status: 'H',
      catatan: 'Uji koneksi webhook dari aplikasi',
      updatedAt: Date.now(),
    };

    const res = await sendAttendanceToGoogleSheets(rawUrl, [dummyRecord], {
      kelas: '7A',
      tanggal: dummyRecord.tanggal,
    });

    setTestResult({
      loading: false,
      msg: res.success
        ? '✅ Berhasil! Sinyal data telah dikirim ke Google Apps Script. Silakan periksa file Google Spreadsheet Anda (akan muncul tab baru).'
        : `⚠️ Perhatian: ${res.message}`,
      success: res.success,
    });
  };

  // Export Full JSON Backup
  const handleExportBackup = () => {
    const backupObj = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      school: 'SMP NEGERI 2 PACIRAN',
      students,
      attendanceRecords,
      settings: formData,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Backup_Absensi_SMPN2_Paciran_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Restore JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.students && Array.isArray(parsed.students)) {
          onRestoreAllData(
            parsed.students,
            parsed.attendanceRecords || [],
            parsed.settings || DEFAULT_SETTINGS
          );
          setFormData(parsed.settings || DEFAULT_SETTINGS);
          alert(`Berhasil memulihkan ${parsed.students.length} siswa dan ${parsed.attendanceRecords?.length || 0} catatan absensi!`);
        } else {
          alert('Format file JSON tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca file backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      {!isAdminAuthenticated ? (
        <div className="max-w-md mx-auto my-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Lock className="w-3.5 h-3.5" />
                Akses Terbatas Administrator
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 pt-1">
                Login Pengaturan Admin
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
                Menu Pengaturan hanya dapat diakses oleh Administrator resmi SMP Negeri 2 Paciran.
              </p>
            </div>

            {/* Error Alert */}
            {loginError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="font-semibold">{loginError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username Administrator
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={adminUsername}
                    onChange={(e) => {
                      setAdminUsername(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="smpn2paciran"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password Administrator
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-150"
              >
                <LogIn className="w-4 h-4" />
                <span>Buka Menu Pengaturan</span>
              </button>
            </form>

            {/* Info Footer */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-[11px] text-slate-500">
              SMP Negeri 2 Paciran • Sistem Presensi Terpadu
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Banner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
                <Settings className="w-4 h-4" />
                <span>Konfigurasi & Integrasi</span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                Pengaturan Aplikasi Absensi
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Konfigurasi profil sekolah, integrasi pengiriman Google Spreadsheet tanpa batas, dan pencadangan data.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Admin Terverifikasi</span>
              </div>
              <button
                type="button"
                onClick={handleAdminLogout}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-colors"
                title="Kunci kembali menu pengaturan"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Kunci / Logout</span>
              </button>
            </div>
          </div>

      {/* SECTION REMOTE CLOUD SYNC: SINKRONISASI PENGATURAN KE SELURUH PERANGKAT */}
      <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-emerald-700/50 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-800/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl shadow-inner">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Remote Cloud Sync (Sinkronisasi Jarak Jauh)
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Live Admin
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Perubahan pengaturan yang Anda simpan di sini akan otomatis disebarkan & diterapkan di semua perangkat guru/wali kelas secara real-time melalui Cloud.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {formData.googleWebhookUrl ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 border border-emerald-400/30 text-emerald-200">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloud Sync Aktif</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 border border-amber-400/30 text-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Webhook Belum Diisi</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handlePushSettingsToCloudManual}
            disabled={cloudSyncLoading || !formData.googleWebhookUrl}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
          >
            {cloudSyncLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CloudUpload className="w-4 h-4 text-emerald-200" />
            )}
            <span>🚀 Sebarkan Pengaturan ke Seluruh Perangkat (Push)</span>
          </button>

          <button
            type="button"
            onClick={handlePullSettingsFromCloudManual}
            disabled={cloudSyncLoading || !formData.googleWebhookUrl}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 disabled:opacity-50 text-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {cloudSyncLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CloudDownload className="w-4 h-4 text-slate-300" />
            )}
            <span>📥 Tarik Pengaturan Terbaru dari Cloud (Pull)</span>
          </button>
        </div>

        {cloudSyncResult && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium border flex items-start gap-2.5 ${
              cloudSyncResult.success
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-100'
                : 'bg-red-950/80 border-red-500/50 text-red-100'
            }`}
          >
            {cloudSyncResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span>{cloudSyncResult.msg}</span>
            </div>
          </div>
        )}

        <div className="text-[11px] text-emerald-200/70 bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/40 flex items-center justify-between flex-wrap gap-2">
          <span>
            💡 <strong>Cara Kerja:</strong> Pengaturan disimpan pada tab <code>CONFIG_PENGATURAN</code> di Google Sheet Anda. Setiap aplikasi dibuka oleh guru/wali kelas di HP atau laptop manapun, aplikasi akan otomatis mencocokkan pengaturan terbaru dari Cloud.
          </span>
          {settings.lastRemoteSettingsSyncTime && (
            <span className="text-emerald-300/90 font-mono text-[10px]">
              Sinkron Terakhir: {new Date(settings.lastRemoteSettingsSyncTime).toLocaleTimeString('id-ID')}
            </span>
          )}
        </div>
      </div>

      {/* SECTION 1: PROFIL SEKOLAH & KOP LAPORAN */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                1. Profil Sekolah & Tanda Tangan Laporan
              </h3>
              <p className="text-xs text-slate-500">
                Digunakan pada judul aplikasi, kop surat cetak laporan, dan nama penandatangan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Sekolah
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL Logo Sekolah
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
                <img
                  src={formData.logoUrl}
                  alt="Preview Logo"
                  className="w-9 h-9 object-contain rounded-lg border border-slate-200 bg-slate-50 p-1 flex-shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Lengkap Sekolah
              </label>
              <input
                type="text"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Kepala Sekolah
              </label>
              <input
                type="text"
                value={formData.kepalaSekolah}
                onChange={(e) => setFormData({ ...formData, kepalaSekolah: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIP Kepala Sekolah
              </label>
              <input
                type="text"
                value={formData.nipKepalaSekolah}
                onChange={(e) => setFormData({ ...formData, nipKepalaSekolah: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jabatan / Wali Kelas
              </label>
              <input
                type="text"
                value={formData.waliKelas}
                onChange={(e) => setFormData({ ...formData, waliKelas: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIP Wali Kelas / Guru Piket
              </label>
              <input
                type="text"
                value={formData.nipWaliKelas}
                onChange={(e) => setFormData({ ...formData, nipWaliKelas: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Pengaturan profil sekolah berhasil disimpan dan disinkronkan ke Cloud!
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">
                Tekan tombol simpan untuk menerapkan ke perangkat ini & otomatis memperbarui Cloud.
              </span>
            )}
            <button
              type="submit"
              disabled={cloudSyncLoading}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {cloudSyncLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              <span>Simpan & Sebarkan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: SUMBER DATA POKOK SISWA (GOOGLE SPREADSHEET CSV) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                2. Sumber Data Pokok Siswa (Google Spreadsheet CSV)
              </h3>
              <p className="text-xs text-slate-500">
                Aplikasi otomatis menyinkronkan data siswa dari tautan publikasi CSV Google Spreadsheet ini saat dibuka.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
            {students.length} Siswa Terdaftar
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              URL Publikasi Google Sheet (Format CSV)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                required
                placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&output=csv"
                value={formData.googleSheetStudentUrl || DEFAULT_GOOGLE_SHEET_STUDENT_URL}
                onChange={(e) => setFormData({ ...formData, googleSheetStudentUrl: e.target.value })}
                className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleManualSyncStudents}
                disabled={sheetSyncResult?.loading || isSyncingSheet}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 flex-shrink-0 shadow-md shadow-emerald-600/20"
              >
                {sheetSyncResult?.loading || isSyncingSheet ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Tarik & Sinkronkan Sekarang</span>
              </button>
            </div>

            {sheetSyncResult && (
              <p
                className={`text-xs font-semibold mt-2 p-2.5 rounded-xl border ${
                  sheetSyncResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {sheetSyncResult.msg}
              </p>
            )}

            <p className="text-[11px] text-slate-500 mt-2">
              Tautan saat ini: <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 text-[10px] break-all">{formData.googleSheetStudentUrl || DEFAULT_GOOGLE_SHEET_STUDENT_URL}</code>
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: INTEGRASI PENGIRIMAN ABSENSI (GOOGLE APPS SCRIPT WEBHOOK) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-2 bg-teal-100 text-teal-800 rounded-lg">
            <Link className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              3. Integrasi Pengiriman Absensi (Penyimpanan Tanpa Batas)
            </h3>
            <p className="text-xs text-slate-500">
              Setiap kali Anda menekan "Simpan Absensi", data otomatis terkirim dan tersimpan rapi di Google Sheets sekolah.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              URL Webhook Google Apps Script (Deployment Web App)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={formData.googleWebhookUrl}
                onChange={(e) => setFormData({ ...formData, googleWebhookUrl: e.target.value })}
                className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testResult?.loading}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                {testResult?.loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Uji Koneksi Webhook</span>
              </button>
            </div>
            {/* Real-time URL format validator & warning */}
            {formData.googleWebhookUrl && formData.googleWebhookUrl.includes('/edit') && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>URL Kurang Tepat:</strong> URL yang Anda masukkan berakhiran <code>/edit</code> (URL Editor Skrip). Harap klik <strong>Terapkan (Deploy)</strong> &gt; <strong>Deployment Baru</strong> di Google Apps Script, lalu salin URL yang berakhiran <code>/exec</code>.
                </div>
              </div>
            )}

            {formData.googleWebhookUrl && formData.googleWebhookUrl.includes('/dev') && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Peringatan URL /dev:</strong> URL berakhiran <code>/dev</code> membutuhkan otentikasi login Google dan akan gagal saat pengiriman otomatis. Harap gunakan URL deployment resmi yang berakhiran <code>/exec</code>.
                </div>
              </div>
            )}

            {testResult && (
              <p
                className={`text-xs font-semibold mt-2 p-3 rounded-xl border ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                {testResult.msg}
              </p>
            )}
          </div>

          {/* Troubleshooting Checklist Box */}
          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2 text-xs text-amber-900">
            <h4 className="font-extrabold text-amber-950 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-700" />
              Penting: 3 Syarat Wajib Agar Data Berhasil Masuk ke Google Sheets:
            </h4>
            <ul className="space-y-1 list-disc list-inside text-amber-800/90 pl-1 leading-relaxed">
              <li>
                <strong>Akses (Who has access)</strong> HARUS diset ke <strong>"Siapa saja (Anyone)"</strong> saat Deployment di Google Apps Script (Bukan "Hanya saya").
              </li>
              <li>
                <strong>Jalankan sebagai (Execute as)</strong> HARUS diset ke <strong>"Saya (Me / email Anda)"</strong>.
              </li>
              <li>
                <strong>Setiap selesai mengganti kode script:</strong> Anda HARUS klik <strong>Terapkan (Deploy)</strong> &gt; <strong>Kelola deployment (Manage deployments)</strong> &gt; Klik ikon Pensil (Edit) &gt; Pilih Versi: <strong>"Versi baru (New version)"</strong> &gt; Klik <strong>Terapkan</strong>. (Jika hanya klik Simpan di Apps Script, Web App tetap menjalankan kode versi lama).
              </li>
            </ul>
          </div>

          {/* Tutorial & Script Code */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-emerald-600" />
                  Kode Google Apps Script Multi-Bulan & Per-Kelas (Contoh: "November 8A")
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Otomatis membuat tab baru per bulan dan per rombel kelas (misal <strong>November 8A</strong>, <strong>Desember 9B</strong>, dst.) lengkap dengan matriks tanggal 1-31 dan total kehadiran.
                </p>
              </div>
              <button
                type="button"
                onClick={copyAppsScript}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 shadow-sm transition-all flex-shrink-0"
              >
                {copiedCode ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Kode Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin Kode Script</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56 border border-slate-800 leading-relaxed">
              {appsScriptCode}
            </pre>

            <ol className="text-xs text-slate-600 list-decimal list-inside space-y-1 pt-1">
              <li>Buka file Google Spreadsheet baru di Google Drive Anda.</li>
              <li>Klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.</li>
              <li>Hapus kode bawaan (jika ada) dan tempel seluruh kode di atas.</li>
              <li>Klik tombol <strong>Terapkan (Deploy)</strong> &gt; <strong>Deployment Baru (New deployment)</strong> &gt; Pilih jenis <strong>Aplikasi Web (Web app)</strong>.</li>
              <li>Atur <em>Jalankan sebagai (Execute as)</em>: <strong>"Saya (Me)"</strong>, dan <em>Akses (Who has access)</em>: <strong>"Siapa saja (Anyone)"</strong>.</li>
              <li>Klik <strong>Terapkan (Deploy)</strong> &gt; Salin <strong>URL Aplikasi Web</strong> yang dihasilkan ke kolom input Webhook di atas &gt; Simpan.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* SECTION 4: BACKUP & PEMULIHAN DATA */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              4. Cadangkan & Pulihkan Data
            </h3>
            <p className="text-xs text-slate-500">
              Unduh seluruh data siswa, riwayat absensi, dan pengaturan dalam satu file JSON untuk dipindahkan ke perangkat lain.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h4 className="text-xs font-extrabold uppercase text-slate-700">
              Ekspor File Cadangan (Backup)
            </h4>
            <p className="text-xs text-slate-500">
              Menyimpan {students.length} siswa dan {attendanceRecords.length} rekaman presensi.
            </p>
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Backup (.json)</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h4 className="text-xs font-extrabold uppercase text-slate-700">
              Pulihkan dari File Backup
            </h4>
            <p className="text-xs text-slate-500">
              Pilih file JSON backup yang pernah Anda unduh sebelumnya.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Pilih File Backup JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClearAttendanceOnly}
            className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Riwayat Absensi Saja (Data Siswa Tetap Ada)</span>
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan Seluruh Database Aplikasi</span>
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
