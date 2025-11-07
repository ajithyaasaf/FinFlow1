import admin from "firebase-admin";

const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      if (!projectId) {
        throw new Error("FIREBASE_PROJECT_ID environment variable is required");
      }

      let credential: admin.credential.Credential;

      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        credential = admin.credential.applicationDefault();
      } else if (clientEmail && privateKey) {
        credential = admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        });
      } else {
        throw new Error("Firebase credentials not found. Please provide either GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY");
      }

      admin.initializeApp({
        credential,
        projectId,
        storageBucket: `${projectId}.appspot.com`,
      });

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
