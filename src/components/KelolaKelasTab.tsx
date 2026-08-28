import React, { useState, useRef } from 'react';
import { Student, Gender, SchoolSettings } from '../types';
import {
  parseExcelOrCsvFile,
  downloadExcelTemplate,
  exportStudentsToExcel,
  getUniqueClasses,
  DEFAULT_GOOGLE_SHEET_STUDENT_URL,
} from '../utils/storage';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  School,
  ArrowRight,
  Sparkles,
  Layers,
  X,
  RefreshCw,
  ExternalLink,
  Globe,
  Database,
} from 'lucide-react';

interface KelolaKelasTabProps {
  students: Student[];
  onSaveStudents: (newStudents: Student[]) => void;
  onNavigateToInput: (targetClass?: string) => void;
  settings?: SchoolSettings;
  onSyncGoogleSheet?: (customUrl?: string, showToast?: boolean) => Promise<{ success: boolean; count: number; classes: string[] }>;
  isSyncingSheet?: boolean;
}

export const KelolaKelasTab: React.FC<KelolaKelasTabProps> = ({
  students,
  onSaveStudents,
  onNavigateToInput,
  settings,
  onSyncGoogleSheet,
  isSyncingSheet = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importNotice, setImportNotice] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string[];
  } | null>(null);

  // Manual Add Form State
  const [nibkInput, setNibkInput] = useState('');
  const [namaInput, setNamaInput] = useState('');
  const [genderInput, setGenderInput] = useState<Gender>('L');
  const [kelasSelect, setKelasSelect] = useState('');
  const [customKelasInput, setCustomKelasInput] = useState('');
  const [isCustomKelas, setIsCustomKelas] = useState(false);

  // Edit Student State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // View Filter State
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uniqueClasses = getUniqueClasses(students);

  // Handle File Upload / Import
  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setImportNotice(null);

    const result = await parseExcelOrCsvFile(file);
    setIsProcessing(false);

    if (result.success && result.data.length > 0) {
      // Merge with existing or add new
      const merged = [...students];
      let addedCount = 0;
      let updatedCount = 0;

      for (const newStd of result.data) {
        const existingIdx = merged.findIndex(
          (s) => s.nibk === newStd.nibk && s.kelas === newStd.kelas
        );
        if (existingIdx >= 0) {
          merged[existingIdx] = { ...merged[existingIdx], ...newStd };
          updatedCount++;
        } else {
          merged.push(newStd);
          addedCount++;
        }
      }

      onSaveStudents(merged);

      setImportNotice({
        type: 'success',
        message: `Berhasil mengimpor ${result.importedCount} data siswa! (${addedCount} baru, ${updatedCount} diperbarui).`,
        details: result.classesFound.map(
          (c) => `Kelas ${c}: ${result.data.filter((d) => d.kelas === c).length} siswa`
        ),
      });

      // Automatically select the first imported class if available
      if (result.classesFound.length > 0) {
        setSelectedClassFilter(result.classesFound[0]);
      }
    } else {
      setImportNotice({
        type: 'error',
        message: result.message || 'Gagal membaca data dari file.',
      });
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Handle Manual Add
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaInput.trim()) {
      alert('Nama lengkap siswa wajib diisi!');
      return;
    }

    const finalKelas = isCustomKelas ? customKelasInput.trim() : kelasSelect.trim();
    if (!finalKelas) {
      alert('Silakan pilih kelas atau buat kelas baru!');
      return;
    }

    const newStudent: Student = {
      id: `std_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      nibk: nibkInput.trim() || `24${String(students.length + 1).padStart(4, '0')}`,
      nama: namaInput.trim(),
      jenisKelamin: genderInput,
      kelas: finalKelas,
      createdAt: Date.now(),
    };

    onSaveStudents([...students, newStudent]);

    // Reset Form
    setNibkInput('');
    setNamaInput('');
    setGenderInput('L');
    if (isCustomKelas) {
      setCustomKelasInput('');
      setIsCustomKelas(false);
    }
    setSelectedClassFilter(finalKelas);
    setImportNotice({
      type: 'success',
      message: `Siswa "${newStudent.nama}" berhasil ditambahkan ke Kelas ${finalKelas}.`,
    });
  };

  // Handle Update Student
  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.nama.trim() || !editingStudent.kelas.trim()) return;

    const updated = students.map((s) => (s.id === editingStudent.id ? editingStudent : s));
    onSaveStudents(updated);
    setEditingStudent(null);
    setImportNotice({
      type: 'success',
      message: `Data siswa "${editingStudent.nama}" berhasil diperbarui.`,
    });
  };

  // Delete single student
  const handleDeleteStudent = (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus siswa "${nama}"?`)) {
      const updated = students.filter((s) => s.id !== id);
      onSaveStudents(updated);
    }
  };

  // Delete whole class
  const handleDeleteClass = (kelasName: string) => {
    if (
      window.confirm(
        `PERINGATAN: Yakin ingin menghapus seluruh data siswa di Kelas "${kelasName}"? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      const updated = students.filter((s) => s.kelas !== kelasName);
      onSaveStudents(updated);
      setSelectedClassFilter('ALL');
    }
  };

  // Clear all data
  const handleClearAllStudents = () => {
    if (
      window.confirm(
        'PERINGATAN BESAR: Yakin ingin mengosongkan SELURUH data siswa di semua kelas?'
      )
    ) {
      onSaveStudents([]);
      setSelectedClassFilter('ALL');
      setImportNotice(null);
    }
  };

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchesClass = selectedClassFilter === 'ALL' || s.kelas === selectedClassFilter;
    const matchesQuery =
      searchQuery === '' ||
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nibk.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.kelas.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesQuery;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner / Heading */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Manajemen Data Siswa & Rombel</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Kelola Kelas & Peserta Didik
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Impor data siswa otomatis via Excel/CSV atau masukkan siswa secara manual untuk memulai absensi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={downloadExcelTemplate}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Template Excel</span>
          </button>
          {students.length > 0 && (
            <button
              onClick={() =>
                exportStudentsToExcel(
                  selectedClassFilter === 'ALL' ? students : filteredStudents,
                  selectedClassFilter === 'ALL' ? undefined : selectedClassFilter
                )
              }
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Data ({filteredStudents.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: GOOGLE SPREADSHEET LIVE SYNC */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-2xl p-6 border border-emerald-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Data Pokok Resmi
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Google Spreadsheet Terhubung
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                Sinkronisasi Otomatis Google Spreadsheet
              </h3>
              <p className="text-xs text-slate-600">
                Data siswa (NIBK, Nama, JK, Kelas) terhubung langsung dan tersinkronisasi otomatis dengan Google Spreadsheet sekolah.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => onSyncGoogleSheet && onSyncGoogleSheet()}
              disabled={isSyncingSheet}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-70 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingSheet ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheet ? 'Sedang Menyinkronkan...' : 'Tarik & Perbarui Data Siswa'}</span>
            </button>
            <a
              href={settings?.googleSheetStudentUrl || DEFAULT_GOOGLE_SHEET_STUDENT_URL}
              target="_blank"
              rel="noreferrer"
              title="Buka Spreadsheet di Tab Baru"
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-emerald-200 rounded-xl transition-colors hidden sm:flex items-center justify-center"
            >
              <ExternalLink className="w-4 h-4 text-emerald-700" />
            </a>
          </div>
        </div>

        {/* Sync Summary Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              {students.length}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Total Siswa Terdaftar</p>
              <p className="text-xs font-extrabold text-slate-800">{students.length} Siswa Aktif</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
              {uniqueClasses.length}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Rombongan Belajar</p>
              <p className="text-xs font-extrabold text-slate-800">
                {uniqueClasses.length > 0 ? `Kelas ${uniqueClasses.join(', ')}` : 'Belum Ada'}
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Terakhir Diperbarui</p>
              <p className="text-xs font-extrabold text-slate-800">
                {settings?.lastStudentSyncTime
                  ? new Date(settings.lastStudentSyncTime).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }) + ' WIB'
                  : 'Baru Saja (Aktif)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: IMPORT FILE EXCEL / CSV */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                2. Impor Tambahan (Excel / CSV Mandiri)
              </h3>
              <p className="text-xs text-slate-500">
                Otomatis mengenali kolom: NIBK, Nama Lengkap, Jenis Kelamin (L/P), dan KELAS.
              </p>
            </div>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/80 scale-[0.99]'
              : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {isProcessing
                  ? 'Sedang Memproses & Membaca Data File...'
                  : 'Klik untuk Memilih File atau Seret File Excel (.xlsx / .csv) ke Sini'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Mendukung file Excel dari Dapodik, EMIS, atau format tabel sekolah.
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
            >
              Pilih File dari Komputer / HP
            </button>
          </div>
        </div>

        {/* Import Notification / Details */}
        {importNotice && (
          <div
            className={`p-4 rounded-xl text-sm flex items-start gap-3 border ${
              importNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            {importNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1">
              <p className="font-bold">{importNotice.message}</p>
              {importNotice.details && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {importNotice.details.map((detail, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-white/80 border border-emerald-300 text-emerald-800 text-xs px-2 py-0.5 rounded-md font-medium"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setImportNotice(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* SECTION 3: MANUAL ADD STUDENT (SELANJUTNYA SETELAH KONTEN IMPORT) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-100 text-teal-800 rounded-lg">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              3. Tambah Siswa Secara Manual
            </h3>
            <p className="text-xs text-slate-500">
              Pilih kelas dari data import otomatis atau buat kelas baru jika belum ada.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          {/* NIBK */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              NIBK / No. Induk
            </label>
            <input
              type="text"
              placeholder="Contoh: 240101"
              value={nibkInput}
              onChange={(e) => setNibkInput(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Nama Lengkap */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap Siswa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Nama lengkap siswa..."
              value={namaInput}
              onChange={(e) => setNamaInput(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Jenis Kelamin */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jenis Kelamin
            </label>
            <select
              value={genderInput}
              onChange={(e) => setGenderInput(e.target.value as Gender)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="L">Laki-Laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>

          {/* Kelas (Dropdown or New) */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Pilih / Buat Kelas <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomKelas(!isCustomKelas)}
                className="text-[11px] font-semibold text-emerald-700 hover:underline"
              >
                {isCustomKelas ? '← Pilih dari Daftar' : '+ Kelas Baru'}
              </button>
            </div>

            {isCustomKelas || uniqueClasses.length === 0 ? (
              <input
                type="text"
                required
                placeholder={
                  uniqueClasses.length === 0
                    ? 'Ketik nama kelas (Contoh: 7A, 8B)'
                    : 'Ketik nama kelas baru'
                }
                value={customKelasInput}
                onChange={(e) => setCustomKelasInput(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            ) : (
              <select
                value={kelasSelect}
                onChange={(e) => setKelasSelect(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="">-- Pilih Kelas --</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    Kelas {cls} ({students.filter((s) => s.kelas === cls).length} siswa)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Submit Button */}
          <div className="lg:col-span-1">
            <button
              type="submit"
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: CLASS & STUDENT ROSTER (JIKA DATA KOSONG KELAS TIDAK PERLU MUNCUL) */}
      {students.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            Belum Ada Data Kelas & Siswa
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Data kelas akan otomatis muncul setelah Anda mengimpor file Excel/CSV di atas atau menambahkan siswa pertama.
          </p>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <Sparkles className="w-4 h-4" />
            <span>Gunakan tombol "Download Template Excel" untuk melihat format yang sesuai.</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          {/* Class Navigation Tabs & Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              <span className="text-xs font-bold uppercase text-slate-400 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Kelas:
              </span>
              <button
                onClick={() => setSelectedClassFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedClassFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Kelas ({students.length})
              </button>
              {uniqueClasses.map((cls) => {
                const count = students.filter((s) => s.kelas === cls).length;
                return (
                  <button
                    key={cls}
                    onClick={() => setSelectedClassFilter(cls)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedClassFilter === cls
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Kelas {cls} ({count})
                  </button>
                );
              })}
            </div>

            {/* Direct Action to Start Attendance */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onNavigateToInput(
                    selectedClassFilter === 'ALL'
                      ? uniqueClasses[0] || undefined
                      : selectedClassFilter
                  )
                }
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-colors"
              >
                <span>Input Absensi Kelas Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {selectedClassFilter !== 'ALL' && (
                <button
                  onClick={() => handleDeleteClass(selectedClassFilter)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors"
                  title="Hapus Seluruh Siswa di Kelas Ini"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search and Class Stats Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama / NIBK siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-3">
              <span>
                Menampilkan: <strong>{filteredStudents.length}</strong> dari{' '}
                <strong>{students.length}</strong> siswa
              </span>
              <button
                onClick={handleClearAllStudents}
                className="text-xs text-red-500 hover:text-red-700 hover:underline font-semibold"
              >
                Hapus Semua Data
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                  <th className="py-3 px-3.5 text-center w-12">No</th>
                  <th className="py-3 px-3.5 w-28">NIBK</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-3.5 text-center w-24">L/P</th>
                  <th className="py-3 px-3.5 text-center w-28">Kelas</th>
                  <th className="py-3 px-3.5 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada data siswa yang cocok dengan filter atau pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((std, idx) => (
                    <tr
                      key={std.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-2.5 px-3.5 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-800">
                        {std.nibk}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {std.nama}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            std.jenisKelamin === 'L'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-pink-50 text-pink-700 border border-pink-200'
                          }`}
                        >
                          {std.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800">
                          {std.kelas}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => setEditingStudent(std)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Siswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(std.id, std.nama)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Edit Data Siswa
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIBK / Nomor Induk
                </label>
                <input
                  type="text"
                  value={editingStudent.nibk}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, nibk: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  required
                  value={editingStudent.nama}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, nama: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={editingStudent.jenisKelamin}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        jenisKelamin: e.target.value as Gender,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kelas
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.kelas}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, kelas: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
