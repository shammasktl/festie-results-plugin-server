import admin from "firebase-admin";

// Initialize Firebase Admin with flexible credential loading
let serviceAccount;

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    // Production: Use JSON string from environment variable
    serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    console.log('🔥 Firebase: Using JSON credentials from environment variable');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Development: Use file path
    serviceAccount = await import(`../${process.env.GOOGLE_APPLICATION_CREDENTIALS}`, { 
      with: { type: "json" } 
    }).then(module => module.default);
    console.log('🔥 Firebase: Using credentials file from path');
  } else {
    // Try to load from default location
    serviceAccount = await import("./firebaseServiceAccount.json", { 
      with: { type: "json" } 
    }).then(module => module.default);
    console.log('🔥 Firebase: Using default credentials file');
  }

  // Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin initialized successfully');
  console.log(`📊 Project ID: ${serviceAccount.project_id}`);

} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.error('💡 Make sure to set GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS');
  process.exit(1);
}

const db = admin.firestore();

// Test database connection
try {
  await db.collection('_health').doc('test').set({ 
    status: 'ok', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
  console.log('✅ Firestore connection test successful');
} catch (error) {
  console.error('❌ Firestore connection test failed:', error.message);
}

export default db;
