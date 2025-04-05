// scripts/migrate-to-firestore.js
// One-time script to migrate data from data/facilities.json to Firestore

const fs = require('fs').promises;
const path = require('path');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid'); // Ensure uuid is installed: npm install uuid

// --- Firebase Initialization (Copy from api/index.js or adapt) ---
let serviceAccount;
const firebaseBucketName = process.env.FIREBASE_STORAGE_BUCKET || 'leafy-bulwark-442103-e7.firebasestorage.app'; // Match your project

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
    // Adjust path relative to THIS script file's location
    const serviceAccountPath = path.join(__dirname, '..', 'config', 'leafy-bulwark-442103-e7-firebase-adminsdk-fbsvc-31a9c3e896.json');
    try {
        serviceAccount = require(serviceAccountPath);
    } catch (e) {
        console.error(`FATAL ERROR: Could not load local service account file at ${serviceAccountPath}. Ensure the file exists and path is correct.`, e);
        process.exit(1);
    }
}

if (serviceAccount) {
    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: firebaseBucketName // Optional here, but good practice
            });
            console.log('Firebase Admin SDK initialized successfully.');
        } else {
            console.log('Firebase Admin SDK already initialized.');
        }
    } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
        process.exit(1);
    }
} else {
     console.error("FATAL ERROR: Firebase Service Account could not be loaded.");
     process.exit(1);
}
const db = admin.firestore();
// --- End Firebase Initialization ---

// --- Migration Logic ---
const dataFilePath = path.join(__dirname, '..', 'data', 'facilities.json');
const facilitiesCollectionRef = db.collection('facilities');

async function migrateData() {
    console.log(`Reading data from ${dataFilePath}...`);
    let facilitiesData;
    try {
        const jsonData = await fs.readFile(dataFilePath, 'utf8');
        facilitiesData = JSON.parse(jsonData);
    } catch (err) {
        console.error(`Error reading or parsing ${dataFilePath}:`, err);
        process.exit(1);
    }

    if (!facilitiesData || !facilitiesData.features || !Array.isArray(facilitiesData.features)) {
        console.error('Invalid data format in facilities.json. Expected { "type": "FeatureCollection", "features": [...] }');
        process.exit(1);
    }

    console.log(`Found ${facilitiesData.features.length} facilities to migrate.`);
    let successCount = 0;
    let errorCount = 0;

    // Use Promise.all for concurrent writes (adjust if too many writes cause issues)
    const migrationPromises = facilitiesData.features.map(async (feature) => {
        if (!feature.properties || !feature.properties.id) {
            console.warn('Skipping feature without properties or properties.id:', feature);
            errorCount++;
            return; // Skip this feature
        }

        const facilityId = feature.properties.id;
        console.log(`Processing facility: ${facilityId} (${feature.properties.name})...`);

        // --- Transform 'documents' to 'filesystem' ---
        const oldDocuments = feature.properties.documents || [];
        const filesystem = {};
        const rootFolderId = `root-${facilityId}`;

        // Create root folder metadata
        filesystem[rootFolderId] = {
            id: rootFolderId,
            type: 'folder',
            name: '/',
            parentId: null,
            createdAt: new Date().toISOString(), // Add creation timestamp
            children: []
        };

        // Migrate old documents/links into the root folder
        oldDocuments.forEach(item => {
            const itemId = uuidv4();
            let newItemMetadata = {
                id: itemId,
                parentId: rootFolderId,
                // Copy common fields
                type: item.type || (item.url ? 'link' : 'file'), // Infer type if missing
            };

            if (newItemMetadata.type === 'link') {
                newItemMetadata.name = item.description || item.url; // Use description as name, fallback to URL
                newItemMetadata.url = item.url;
                newItemMetadata.addedAt = item.addedAt || new Date().toISOString();
            } else { // Assume file
                newItemMetadata.name = item.filename;
                newItemMetadata.storagePath = item.storagePath || `${facilityId}/${item.filename}`; // Reconstruct path if missing
                newItemMetadata.uploadedAt = item.uploadedAt || new Date().toISOString();
                newItemMetadata.mimetype = item.mimetype;
                newItemMetadata.size = item.size;
            }

            // Add the new item to the filesystem map
            filesystem[itemId] = newItemMetadata;
            // Add the new item's ID to the root folder's children
            filesystem[rootFolderId].children.push(itemId);
        });

        // Assign the new filesystem and remove the old documents array
        feature.properties.filesystem = filesystem;
        delete feature.properties.documents;
        // --- End Transformation ---

        // Prepare data for Firestore (the whole feature object)
        const firestoreDocData = { ...feature }; // Create a copy

        try {
            // Write to Firestore using facilityId as document ID
            // Use set with merge:true to be safe if run multiple times, or just set if collection is empty
            await facilitiesCollectionRef.doc(facilityId).set(firestoreDocData, { merge: true });
            console.log(` -> Successfully migrated facility: ${facilityId}`);
            successCount++;
        } catch (err) {
            console.error(` -> Error migrating facility ${facilityId}:`, err);
            errorCount++;
        }
    });

    // Wait for all migration operations to complete
    await Promise.all(migrationPromises);

    console.log('\n--- Migration Summary ---');
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('Migration process finished.');
}

// Run the migration
migrateData().catch(err => {
    console.error("An unexpected error occurred during migration:", err);
    process.exit(1);
});