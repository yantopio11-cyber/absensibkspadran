export type Gender = 'L' | 'P';

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A' | 'L' | '';

export interface Student {
  id: string;
  nibk: string;
  nama: string;
  jenisKelamin: Gender;
  kelas: string;
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  nibk: string;
  nama: string;
  kelas: string;
  tanggal: string; // YYYY-MM-DD
  status: AttendanceStatus;
  catatan?: string;
  updatedAt: number;
}

export interface SchoolSettings {
  schoolName: string;
  logoUrl: string;
  alamat: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  waliKelas: string;
  nipWaliKelas: string;
  googleWebhookUrl: string;
  googleSheetStudentUrl: string;
  autoSync: boolean;
  lastStudentSyncTime?: number;
  lastRemoteSettingsSyncTime?: number;
  enableRemoteSync?: boolean;
}

export type TabType = 'kelola_kelas' | 'input_absensi' | 'rekap_absensi' | 'pengaturan';

export interface DaySummary {
  day: number;
  dateStr: string;
  dayName: string;
  isFriday: boolean;
  isSunday: boolean;
}
