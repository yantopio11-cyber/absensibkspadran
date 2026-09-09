import {
  collection,
  doc,
  writeBatch,
  onSnapshot,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { AttendanceRecord, Student, SchoolSettings } from '../types';
import {
  loadAttendance,
  saveAttendance,
  saveAttendanceSilent,
  loadStudents,
  saveStudents,
  saveStudentsSilent,
  loadSettings,
  saveSettings,
  saveSettingsSilent,
} from '../utils/storage';

// Helper to chunk arrays for Firestore batch limit (max 500 per batch)
function chunkArray<T>(items: T[], size = 400): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

// -------------------------------------------------------------
// ATTENDANCE REAL-TIME SYNC
// -------------------------------------------------------------

/**
 * Save / upsert attendance records to Firestore
 */
export async function saveAttendanceToCloud(records: AttendanceRecord[]): Promise<boolean> {
  if (!records || records.length === 0) return true;

  try {
    const chunks = chunkArray(records, 400);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const rec of chunk) {
        const docId = `${rec.studentId}_${rec.tanggal}`;
        const ref = doc(db, 'attendance', docId);
        batch.set(
          ref,
          {
            id: rec.id || docId,
            studentId: rec.studentId,
            nibk: rec.nibk || '',
            nama: rec.nama || '',
            kelas: rec.kelas || '',
            tanggal: rec.tanggal,
            status: rec.status,
            catatan: rec.catatan || '',
            updatedAt: rec.updatedAt || Date.now(),
          },
          { merge: true }
        );
      }
      await batch.commit();
    }
    return true;
  } catch (error) {
    console.error('Error saving attendance to Firestore:', error);
    return false;
  }
}

/**
 * Delete all attendance records from Firestore (used when admin clears attendance)
 */
export async function clearAttendanceFromCloud(): Promise<boolean> {
  try {
    const snapshot = await getDocs(collection(db, 'attendance'));
    const docs = snapshot.docs;
    const chunks = chunkArray(docs, 400);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const d of chunk) {
        batch.delete(d.ref);
      }
      await batch.commit();
    }
    return true;
  } catch (error) {
    console.error('Error clearing attendance from Firestore:', error);
    return false;
  }
}

/**
 * Real-time listener for attendance records across all devices
 */
export function subscribeToCloudAttendance(
  onUpdate: (records: AttendanceRecord[]) => void
): () => void {
  try {
    const attendanceCol = collection(db, 'attendance');
    const unsubscribe = onSnapshot(
      attendanceCol,
      (snapshot) => {
        const records: AttendanceRecord[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          records.push({
            id: data.id || d.id,
            studentId: data.studentId,
            nibk: data.nibk || '',
            nama: data.nama || '',
            kelas: data.kelas || '',
            tanggal: data.tanggal,
            status: data.status,
            catatan: data.catatan || '',
            updatedAt: data.updatedAt || Date.now(),
          });
        });

        // Always save to localStorage as backup cache
        saveAttendanceSilent(records);
        onUpdate(records);
      },
      (error) => {
        console.warn('Firestore attendance onSnapshot error:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to attendance:', err);
    return () => {};
  }
}

// -------------------------------------------------------------
// STUDENTS REAL-TIME SYNC
// -------------------------------------------------------------

/**
 * Save students to Firestore
 */
export async function saveStudentsToCloud(students: Student[]): Promise<boolean> {
  if (!students || students.length === 0) return true;

  try {
    const chunks = chunkArray(students, 400);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const s of chunk) {
        const docId = s.id || `${s.kelas}_${s.nibk}`.replace(/\s+/g, '_');
        const ref = doc(db, 'students', docId);
        batch.set(
          ref,
          {
            id: s.id,
            nibk: s.nibk || '',
            nama: s.nama || '',
            jenisKelamin: s.jenisKelamin || 'L',
            kelas: s.kelas || '',
            createdAt: s.createdAt || Date.now(),
          },
          { merge: true }
        );
      }
      await batch.commit();
    }
    return true;
  } catch (error) {
    console.error('Error saving students to Firestore:', error);
    return false;
  }
}

/**
 * Real-time listener for students across all devices
 */
export function subscribeToCloudStudents(
  onUpdate: (students: Student[]) => void
): () => void {
  try {
    const studentsCol = collection(db, 'students');
    const unsubscribe = onSnapshot(
      studentsCol,
      (snapshot) => {
        if (snapshot.empty) return;
        const students: Student[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          students.push({
            id: data.id || d.id,
            nibk: data.nibk || '',
            nama: data.nama || '',
            jenisKelamin: data.jenisKelamin || 'L',
            kelas: data.kelas || '',
            createdAt: data.createdAt || Date.now(),
          });
        });

        if (students.length > 0) {
          saveStudentsSilent(students);
          onUpdate(students);
        }
      },
      (error) => {
        console.warn('Firestore students onSnapshot error:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to students:', err);
    return () => {};
  }
}

// -------------------------------------------------------------
// SETTINGS REAL-TIME SYNC
// -------------------------------------------------------------

/**
 * Save settings to Firestore
 */
export async function saveSettingsToCloud(settings: SchoolSettings): Promise<boolean> {
  try {
    const ref = doc(db, 'settings', 'global');
    await setDoc(ref, {
      ...settings,
      updatedAt: Date.now(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving settings to Firestore:', error);
    return false;
  }
}

/**
 * Real-time listener for settings across all devices
 */
export function subscribeToCloudSettings(
  onUpdate: (settings: SchoolSettings) => void
): () => void {
  try {
    const ref = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        if (data) {
          const merged: SchoolSettings = {
            ...loadSettings(),
            ...data,
          };
          saveSettingsSilent(merged);
          onUpdate(merged);
        }
      },
      (error) => {
        console.warn('Firestore settings onSnapshot error:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to settings:', err);
    return () => {};
  }
}

// -------------------------------------------------------------
// INITIAL SEED / SYNC IF CLOUD IS EMPTY
// -------------------------------------------------------------

/**
 * If cloud has no attendance or students yet, seed cloud with local data
 * so existing data from this HP is instantly available to other HPs.
 */
export async function syncLocalDataToCloudIfNeeded(): Promise<void> {
  try {
    // Check if cloud attendance has documents
    const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
    const localAttendance = loadAttendance();

    if (attendanceSnapshot.empty && localAttendance.length > 0) {
      console.log('Seeding cloud attendance with local records...');
      await saveAttendanceToCloud(localAttendance);
    }

    // Check if cloud students has documents
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    const localStudents = loadStudents();

    if (studentsSnapshot.empty && localStudents.length > 0) {
      console.log('Seeding cloud students with local records...');
      await saveStudentsToCloud(localStudents);
    }
  } catch (err) {
    console.warn('Initial cloud sync check error:', err);
  }
}
