import admin from "firebase-admin";

// Initialize Firebase Admin SDK
// Note: In production on DigitalOcean, use GOOGLE_APPLICATION_CREDENTIALS or service account key
const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      
      if (!projectId) {
        throw new Error("FIREBASE_PROJECT_ID environment variable is required");
      }

      // Initialize with project ID (for dev) or credentials (for production)
      const config: admin.AppOptions = {
        projectId,
      };

      // In production with service account
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        config.credential = admin.credential.applicationDefault();
      }

      admin.initializeApp(config);
      console.log("Firebase Admin initialized successfully");
    } catch (error) {
      console.error("Error initializing Firebase Admin:", error);
      throw error;
    }
  }
  return admin;
};

export const firebaseAdmin = initializeFirebaseAdmin();
export const adminAuth = firebaseAdmin.auth();
export const adminDb = firebaseAdmin.firestore();
export const adminStorage = firebaseAdmin.storage();
