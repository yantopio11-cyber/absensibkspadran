// Firebase configuration for SMP Negeri 2 Paciran Attendance System
// Guaranteed to build cleanly on Vercel, GitHub, and local Vite dev servers

export interface FirebaseAppConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

export const firebaseConfig: FirebaseAppConfig = {
  projectId: "vivid-gauge-6pthm",
  appId: "1:131370097012:web:e03ec983ed550b29aa3421",
  apiKey: "AIzaSyDEAVPjROsB3AUSmLWJidDcDvSnwr4ICDI",
  authDomain: "vivid-gauge-6pthm.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-absensidigitalsm-73814ae0-084e-4422-adf2-0348824f2c6f",
  storageBucket: "vivid-gauge-6pthm.firebasestorage.app",
  messagingSenderId: "131370097012",
  measurementId: "",
  oAuthClientId: "131370097012-79ur5tm8shegurkah8u4ij2lsgo8haku.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

export default firebaseConfig;
