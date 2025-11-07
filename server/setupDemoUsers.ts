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
      password: "md123456",
      displayName: "Managing Director",
      role: "md" as const,
    },
  ];

  for (const user of demoUsers) {
    try {
      // Check if user already exists
      let userRecord;
      try {
        userRecord = await adminAuth.getUserByEmail(user.email);
        console.log(`User ${user.email} already exists`);
        
        // Update custom claims for existing user
        await adminAuth.setCustomUserClaims(userRecord.uid, { role: user.role });
        
        // Update user profile in Firestore
        await adminDb.collection("users").doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          createdAt: new Date(),
        }, { merge: true });
        
      } catch (error: any) {
        if (error.code === "auth/user-not-found") {
          // Create user in Firebase Auth
          userRecord = await adminAuth.createUser({
            email: user.email,
            password: user.password,
            displayName: user.displayName,
          });

          // Set custom claims for role
          await adminAuth.setCustomUserClaims(userRecord.uid, { role: user.role });

          // Create user profile in Firestore
          await adminDb.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            createdAt: new Date(),
          });

          console.log(`Created demo user: ${user.email} with role: ${user.role}`);
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error(`Error setting up user ${user.email}:`, error);
    }
  }
}

// Uncomment to run this script
// createDemoUsers().then(() => {
//   console.log("Demo users setup complete");
//   process.exit(0);
// }).catch(console.error);
