// scripts/clear-doc-items.js
// Deletes ALL documents from the 'doc_items' collection and associated files from storage.
// USE WITH CAUTION!

const admin = require('firebase-admin');
const path = require('path');

// --- Firebase Initialization ---
let serviceAccount;
const serviceAccountPath = path.join(__dirname, '..', 'config', 'leafy-bulwark-442103-e7-firebase-adminsdk-fbsvc-31a9c3e896.json');
const firebaseBucketName = process.env.FIREBASE_STORAGE_BUCKET || 'leafy-bulwark-442103-e7.appspot.com'; // Ensure this matches your bucket name

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("Attempting Firebase init via environment variable...");
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
        console.error("FATAL ERROR: Could not parse FIREBASE_SERVICE_ACCOUNT environment variable.", e);
        process.exit(1);
    }
} else {
    console.log("Attempting Firebase init via local file...");
    try {
        serviceAccount = require(serviceAccountPath);
    } catch (e) {
        console.error(`FATAL ERROR: Could not load local service account file at ${serviceAccountPath}.`, e);
        process.exit(1);
    }
}

if (!serviceAccount) {
     console.error("FATAL ERROR: Firebase service account credentials not found.");
     process.exit(1);
}

try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: firebaseBucketName // Important for storage operations
        });
        console.log("Firebase Admin SDK initialized successfully.");
    } else {
        console.log("Firebase Admin SDK already initialized.");
    }
} catch (e) {
    console.error("FATAL ERROR: Firebase Admin SDK initialization failed.", e);
    process.exit(1);
}

const db = admin.firestore();
const bucket = admin.storage().bucket(); // Get storage bucket reference
// --- End Firebase Initialization ---


// --- Deletion Logic ---
const docItemsCollection = db.collection('doc_items');

async function deleteAllItems() {
    console.log("Starting deletion of all items in 'doc_items' collection...");
    console.warn("!!! THIS IS A DESTRUCTIVE OPERATION !!!");

    const filesToDeleteFromStorage = [];
    let batch = db.batch();
    let operationCount = 0;
    let totalDocsDeleted = 0;

    try {
        // Fetch ALL documents. For very large collections, consider paginated fetching.
        const snapshot = await docItemsCollection.get();

        if (snapshot.empty) {
            console.log("'doc_items' collection is already empty.");
            return;
        }

        console.log(`Found ${snapshot.size} documents to delete.`);

        snapshot.forEach(doc => {
            const data = doc.data();
            // Collect storage paths for files
            if (data.type === 'file' && data.storagePath) {
                filesToDeleteFromStorage.push(data.storagePath);
            }
            // Add document deletion to batch
            batch.delete(doc.ref);
            operationCount++;
            totalDocsDeleted++;

            // Commit batch periodically
            if (operationCount >= 490) { // Leave some room in batch limit
                console.log(`Committing batch of ${operationCount} Firestore deletions...`);
                batch.commit().catch(err => console.error("Batch commit error (Firestore):", err)); // Log batch errors but continue if possible
                batch = db.batch(); // Start new batch
                operationCount = 0;
            }
        });

        // Commit final Firestore batch
        if (operationCount > 0) {
            console.log(`Committing final batch of ${operationCount} Firestore deletions...`);
            await batch.commit();
        }
        console.log(`Successfully deleted ${totalDocsDeleted} documents from Firestore.`);

        // Delete files from storage
        if (filesToDeleteFromStorage.length > 0) {
            console.log(`Attempting to delete ${filesToDeleteFromStorage.length} file(s) from storage...`);
            const deletePromises = filesToDeleteFromStorage.map(storagePath => {
                console.log(`  Deleting: ${storagePath}`);
                return bucket.file(storagePath).delete().catch(err => {
                    // Log storage deletion errors but don't stop the whole process
                    console.error(`  Failed to delete ${storagePath}: ${err.message}`);
                });
            });
            await Promise.all(deletePromises);
            console.log("Storage file deletion attempts completed.");
        } else {
            console.log("No files found in Firestore documents to delete from storage.");
        }

        console.log("Cleanup script finished.");

    } catch (error) {
        console.error("Cleanup script failed:", error);
    }
}

// --- Execution ---
// Add confirmation prompt? For now, runs directly.
console.log("Running cleanup script in 5 seconds... Press Ctrl+C to cancel.");
setTimeout(() => {
    deleteAllItems();
}, 5000);