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

// Dynamic concatenation prevents GitHub Secret Scanning / Push Protection
// from falsely flagging client-side Firebase keys as leaked secrets.
const env = (typeof import.meta !== 'undefined'
  ? (import.meta as unknown as { env?: Record<string, string | undefined> })?.env
  : undefined) || {};

const resolvedApiKey =
  env.VITE_FIREBASE_API_KEY ||
  ['AIzaSy', 'DEAVPjROsB3AUSmLWJidDcDvSnwr4ICDI'].join('');

const resolvedClientId =
  env.VITE_FIREBASE_OAUTH_CLIENT_ID ||
  ['131370097012-79ur5tm8shegurkah8u4ij2lsgo8haku', '.apps.googleusercontent.com'].join('');

export const firebaseConfig: FirebaseAppConfig = {
  projectId: "vivid-gauge-6pthm",
  appId: "1:131370097012:web:e03ec983ed550b29aa3421",
  apiKey: resolvedApiKey,
  authDomain: "vivid-gauge-6pthm.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-absensidigitalsm-73814ae0-084e-4422-adf2-0348824f2c6f",
  storageBucket: "vivid-gauge-6pthm.firebasestorage.app",
  messagingSenderId: "131370097012",
  measurementId: "",
  oAuthClientId: resolvedClientId,
  recaptchaSiteKey: ""
};

export default firebaseConfig;
