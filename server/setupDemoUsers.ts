// Script to set up demo users in Firebase
// This would be run once to create demo accounts
import { firebaseAdmin, adminAuth, adminDb } from "./firebaseAdmin";

export async function createDemoUsers() {
  const demoUsers = [
    {
      email: "admin@finflow.com",
      password: "admin123",
      displayName: "Admin User",
      role: "admin" as const,
    },
    {
      email: "agent@finflow.com",
      password: "agent123",
      displayName: "Agent User",
      role: "agent" as const,
    },
    {
      email: "md@finflow.com",
      password: "md123",
      displayName: "Managing Director",
      role: "md" as const,
    },
  ];

  for (const user of demoUsers) {
    try {
      // Create user in Firebase Auth
      const userRecord = await adminAuth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      });

      // Create user profile in Firestore
      await adminDb.collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: new Date(),
      });

      console.log(`Created demo user: ${user.email}`);
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        console.log(`User ${user.email} already exists`);
      } else {
        console.error(`Error creating user ${user.email}:`, error);
      }
    }
  }
}

// Uncomment to run this script
// createDemoUsers().then(() => {
//   console.log("Demo users setup complete");
//   process.exit(0);
// }).catch(console.error);
