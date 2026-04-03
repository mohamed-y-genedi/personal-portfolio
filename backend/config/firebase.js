const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Check if service account key path is defined in env or exists locally
// We will look for 'service-account-key.json' in the backend root or a path defined in env
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'serviceAccountKey.json');

try {
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin initialized successfully');
} catch (error) {
    console.warn('Warning: Firebase Service Account Key not found or invalid. Database features will not work.');
    console.warn('Please place "serviceAccountKey.json" in the backend/config directory or set GOOGLE_APPLICATION_CREDENTIALS.');
}

const db = admin.apps.length ? admin.firestore() : null;

module.exports = { admin, db };
