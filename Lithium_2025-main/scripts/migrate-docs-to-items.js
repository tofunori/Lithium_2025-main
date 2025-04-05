// scripts/migrate-docs-to-items.js
// Migrates filesystem data from within facility documents to a top-level 'doc_items' collection.

const admin = require('firebase-admin');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // For generating new IDs

// --- Firebase Initialization (Copied from api/index.js) ---
let serviceAccount;
// Assuming the script runs from the project root, adjust path if needed
const serviceAccountPath = path.join(__dirname, '..', 'config', 'leafy-bulwark-442103-e7-firebase-adminsdk-fbsvc-31a9c3e896.json');

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("Attempting Firebase init via environment variable...");
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
        console.error("FATAL ERROR: Could not parse FIREBASE_SERVICE_ACCOUNT environment variable.", e);
        process.exit(1); // Exit if parsing fails in script
    }
} else {
    console.log("Attempting Firebase init via local file...");
    try {
        // Use require for JSON files
        serviceAccount = require(serviceAccountPath);
    } catch (e) {
        console.error(`FATAL ERROR: Could not load local service account file at ${serviceAccountPath}. Ensure the file exists and path is correct.`, e);
        process.exit(1); // Exit if local file fails
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
            // Add databaseURL if needed, though usually inferred
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
// --- End Firebase Initialization ---


// --- Migration Logic ---

const facilitiesCollection = db.collection('facilities');
const docItemsCollection = db.collection('doc_items'); // Target collection

// Map to store old filesystem ID -> new doc_items ID mapping during processing
const oldIdToNewIdMap = {};

// Recursive function to process each node in the old filesystem
// Added 'filesystem' parameter to avoid re-fetching
// Added 'isDryRun' parameter
async function processNode(nodeId, nodeData, parentNewId, facilityId, filesystem, batch, operationCounter, isDryRun) {
    if (!nodeData || !nodeData.type) {
        console.warn(`Skipping node ${nodeId} in facility ${facilityId} due to missing data or type.`);
        return operationCounter;
    }

    const newId = uuidv4(); // Generate new unique ID
    oldIdToNewIdMap[nodeId] = newId; // Store mapping

    // Verify field names here based on actual data structure if possible
    const docItemData = {
        name: nodeData.name || 'Unnamed',
        type: nodeData.type,
        parentId: parentNewId, // Set parent using the new ID system
        tags: [`facility:${facilityId}`], // Add initial facility tag
        // Ensure these field names match your actual data:
        createdAt: nodeData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: nodeData.updatedAt || admin.firestore.FieldValue.serverTimestamp(),
    };

    if (nodeData.type === 'file') {
        // Ensure these field names match your actual data:
        docItemData.storagePath = nodeData.storagePath || null;
        docItemData.size = nodeData.size || 0;
        // Map 'mimetype' from old data to 'contentType' in new data
        docItemData.contentType = nodeData.mimetype || null;
    } else if (nodeData.type === 'link') {
        // Ensure this field name matches your actual data:
        docItemData.url = nodeData.url || null;
    }

    console.log(`  ${isDryRun ? '[DRY RUN] Would prepare' : 'Preparing'} ${nodeData.type} '${docItemData.name}' (Old ID: ${nodeId}, New ID: ${newId}) with parent ${parentNewId}`);

    if (!isDryRun) {
        // Add to batch only if not a dry run
        const newItemRef = docItemsCollection.doc(newId);
        batch.set(newItemRef, docItemData);
        operationCounter.count++;

        // Commit batch if it reaches Firestore limit (500 operations)
        if (operationCounter.count >= 499) {
            console.log(`Committing batch of ${operationCounter.count} operations...`);
            await batch.commit();
            operationCounter.batch = db.batch(); // Start a new batch
            operationCounter.count = 0;
            console.log("Batch committed. Continuing...");
        }
    } else {
         // In dry run, maybe increment a separate counter if needed for logging totals
    }


    // Recurse for children if it's a folder
    if (nodeData.type === 'folder' && nodeData.children && Array.isArray(nodeData.children)) {
        for (const childId of nodeData.children) {
            const childData = filesystem[childId]; // Use passed filesystem object
            if (childData) {
                // Pass the newId of the current folder as the parentNewId for the child
                // Pass the full filesystem object down
                operationCounter = await processNode(childId, childData, newId, facilityId, filesystem, operationCounter.batch, operationCounter, isDryRun);
            } else {
                console.warn(`Child node ${childId} referenced in folder ${nodeId} (Facility ${facilityId}) not found in filesystem data.`);
            }
        }
    }

    return operationCounter;
}


// Main migration function
async function migrateData(isDryRun = false) { // Added isDryRun parameter
    console.log(isDryRun ? "Starting migration (DRY RUN)..." : "Starting migration...");
    let batch = db.batch();
    // Pass object to modify in recursive calls, including the current batch reference
    let operationCounter = { batch: batch, count: 0 };

    try {
        const facilitiesSnapshot = await facilitiesCollection.get();
        if (facilitiesSnapshot.empty) {
            console.log("No facilities found. Migration not needed.");
            return;
        }

        console.log(`Found ${facilitiesSnapshot.size} facilities to process.`);

        for (const facilityDoc of facilitiesSnapshot.docs) {
            const facilityId = facilityDoc.id;
            const facilityData = facilityDoc.data();
            const filesystem = facilityData.properties?.filesystem; // Get the whole filesystem once

            console.log(`Processing facility: ${facilityData.properties?.name || facilityId}`);

            if (filesystem) {
                const rootNodeId = `root-${facilityId}`;
                const rootNodeData = filesystem[rootNodeId];

                if (rootNodeData && rootNodeData.type === 'folder') {
                    // Start processing from the root node, parent is 'root' string literal
                    // Pass the full filesystem object
                    operationCounter = await processNode(rootNodeId, rootNodeData, 'root', facilityId, filesystem, operationCounter.batch, operationCounter, isDryRun);
                } else {
                    console.warn(`  Facility ${facilityId} has filesystem data but no valid root node found (expected ID: ${rootNodeId}). Skipping filesystem migration for this facility.`);
                }
            } else {
                console.log(`  Facility ${facilityId} has no filesystem data. Skipping.`);
            }
        }

        // Commit any remaining operations in the last batch if not a dry run
        if (!isDryRun && operationCounter.count > 0) {
            console.log(`Committing final batch of ${operationCounter.count} operations...`);
            await operationCounter.batch.commit();
            console.log("Final batch committed.");
        } else if (isDryRun) {
             console.log(`[DRY RUN] Would have committed final batch of ${operationCounter.count} operations.`);
        }

        console.log(isDryRun ? "Dry run finished." : "Migration completed successfully!");

    } catch (error) {
        console.error("Migration failed:", error);
        // Consider adding logic here to handle partial failures if needed
    }
}

// --- Execution ---
const isDryRun = process.argv.includes('--dry-run');

migrateData(isDryRun); // Pass the dry run flag