import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
// Safely & dynamically resolve the firebase applet configuration if it exists to avoid build-time errors when deleted
const windowConfig = typeof window !== "undefined" ? (window as any).__FIREBASE_CONFIG__ : null;

const firebaseConfigModules = (import.meta as any).glob("../firebase-applet-config.json", { eager: true });
const configPaths = Object.keys(firebaseConfigModules);
const staticConfig = configPaths.length > 0 
  ? (firebaseConfigModules[configPaths[0]] as any).default 
  : null;

const firebaseConfig: any = windowConfig || staticConfig || {
      apiKey: "dummy-api-key-or-none",
      authDomain: "dummy-project.firebaseapp.com",
      projectId: "dummy-project",
      storageBucket: "dummy-project.appspot.com",
      messagingSenderId: "000000000000",
      appId: "1:000000000000:web:0000000000000000000000",
      firestoreDatabaseId: "(default)"
    };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const isDummyConfig = 
  !firebaseConfig || 
  firebaseConfig.projectId === "dummy-project" || 
  (firebaseConfig.apiKey && firebaseConfig.apiKey.includes("dummy"));

export async function testConnection() {
  if (isDummyConfig) {
    console.info("Firebase is configured in Local/Guest-only development mode (dummy credentials).");
    return;
  }
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase connection test: the client is offline or configuration is pending.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
