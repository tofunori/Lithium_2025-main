const express = require('express');
const fs = require('fs').promises; // Still needed for initial read in migration script, maybe remove later?
const path = require('path');
const admin = require('firebase-admin'); // Firebase Admin SDK
const jwt = require('jsonwebtoken'); // Import JWT library
const multer = require('multer'); // Middleware for handling multipart/form-data (file uploads)
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs
const { generateFacilityPageHTML } = require('./page-generator'); // Import the dynamic page generator
const app = express();

// Trust the Vercel proxy to correctly set secure headers (like X-Forwarded-Proto)
app.set('trust proxy', 1);

const port = 3000; // Port is less relevant in serverless, but keep for consistency
// Keep dataFilePath reference for potential future use or cleanup
const dataFilePath = path.join(__dirname, '..', 'data', 'facilities.json');

// --- Firebase Initialization ---
let serviceAccount;
const firebaseBucketName = process.env.FIREBASE_STORAGE_BUCKET || 'leafy-bulwark-442103-e7.firebasestorage.app'; // Fallback if not set

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("Attempting Firebase init via environment variable...");
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
        console.error("FATAL ERROR: Could not parse FIREBASE_SERVICE_ACCOUNT environment variable.", e);
        // process.exit(1); // Exit if parsing fails
    }
} else {
    console.log("Attempting Firebase init via local file...");
    const serviceAccountPath = path.join(__dirname, '..', 'config', 'leafy-bulwark-442103-e7-firebase-adminsdk-fbsvc-31a9c3e896.json');
    try {
        serviceAccount = require(serviceAccountPath);
    } catch (e) {
        console.error(`FATAL ERROR: Could not load local service account file at ${serviceAccountPath}. Ensure the file exists and path is correct.`, e);
        // process.exit(1); // Exit if local file fails
    }
}

if (serviceAccount) {
    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: firebaseBucketName
            });
            console.log('Firebase Admin SDK initialized successfully.');
        } else {
            console.log('Firebase Admin SDK already initialized.');
        }
    } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
        // process.exit(1);
    }
} else {
     console.error("FATAL ERROR: Firebase Service Account could not be loaded from environment variable or local file.");
     // process.exit(1);
}
const bucket = admin.storage().bucket();
const db = admin.firestore(); // Firestore database instance
// --- End Firebase Initialization ---


// --- Multer Configuration ---
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
// --- End Multer Configuration ---


// --- Core Middleware ---
app.use(express.json()); // Parse JSON bodies
app.use(express.static(path.join(__dirname, '..'))); // Serve static files from root
// --- End Core Middleware ---


// --- Authentication ---
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-jwt-secret-key-CHANGE-ME-IN-ENV'; // Use a strong secret, ideally from env vars

function isAuthenticated(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]; // Extract token after "Bearer "

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                console.warn('JWT Verification Failed:', err.message);
                return res.status(403).json({ message: 'Forbidden: Invalid or expired token.' }); // Forbidden if token is invalid/expired
            }
            req.user = user; // Attach decoded user payload to request object
            next(); // Proceed to the protected route
        });
    } else {
        res.status(401).json({ message: 'Unauthorized: No token provided.' }); // Unauthorized if no token
    }
}
// --- End Authentication ---


// --- API Endpoints ---

// Auth Routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Generate JWT
        const userPayload = { username: ADMIN_USERNAME }; // Include necessary user info in payload
        const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1d' }); // Token expires in 1 day

        console.log('Login successful, JWT generated for user:', username);
        res.json({ success: true, message: 'Login successful', token: token }); // Send token to client
    } else {
        console.log('Login failed for user:', username);
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Removed /api/logout and /api/session routes as they are not needed with JWT

// Facility Routes
app.get('/api/facilities', async (req, res) => {
    // GET all facilities from Firestore
    try {
        const facilitiesRef = db.collection('facilities');
        const snapshot = await facilitiesRef.get();
        if (snapshot.empty) {
            console.log('No facilities found in Firestore.');
            return res.json({ type: "FeatureCollection", features: [] });
        }
        const features = [];
        snapshot.forEach(doc => {
            const featureData = doc.data();
            if (!featureData.properties) featureData.properties = {};
            if (!featureData.properties.id) featureData.properties.id = doc.id;
            featureData.type = "Feature";
            features.push(featureData);
        });
        res.json({ type: "FeatureCollection", features: features });
    } catch (err) {
        console.error("Error fetching facilities from Firestore:", err);
        res.status(500).send('Error fetching facility data');
    }
});

app.get('/api/facilities/:id', async (req, res) => {
    // GET a specific facility by ID from Firestore
    const facilityId = req.params.id;
    try {
        // Query for the document where the 'properties.id' field matches the requested ID
        const facilitiesRef = db.collection('facilities');
        const querySnapshot = await facilitiesRef.where('properties.id', '==', facilityId).limit(1).get();

        if (querySnapshot.empty) {
            console.log(`Facility with properties.id ${facilityId} not found in Firestore.`);
            return res.status(404).json({ message: `Facility with ID ${facilityId} not found.` });
        }
        // Get the document snapshot from the query result
        const docSnap = querySnapshot.docs[0];
        const featureData = docSnap.data();
        if (!featureData.properties) featureData.properties = {};
        if (!featureData.properties.id) featureData.properties.id = docSnap.id;
        featureData.type = "Feature";
        res.json(featureData);
    } catch (err) {
        console.error(`Error fetching facility ${facilityId} from Firestore:`, err);
        res.status(500).send(`Error fetching facility data for ID ${facilityId}`);
    }
});

app.post('/api/facilities', isAuthenticated, async (req, res) => {
    // POST (create) a new facility in Firestore
    try {
        if (!req.body || !req.body.properties || !req.body.properties.name) {
            return res.status(400).json({ message: 'Missing required facility data (e.g., name).' });
        }
        const newFacilityFeature = {
            type: "Feature",
            properties: { ...req.body.properties },
            geometry: req.body.geometry || { type: "Point", coordinates: [0, 0] }
        };
        const generatedId = newFacilityFeature.properties.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (!newFacilityFeature.properties.id) {
             newFacilityFeature.properties.id = generatedId;
        }
        const facilityId = newFacilityFeature.properties.id;
        const rootFolderId = `root-${facilityId}`;
        newFacilityFeature.properties.filesystem = {
            [rootFolderId]: {
                id: rootFolderId, type: "folder", name: "/", parentId: null,
                createdAt: new Date().toISOString(), children: []
            }
        };
        delete newFacilityFeature.properties.documents; // Remove old field

        const docRef = db.collection('facilities').doc(facilityId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            console.log(`Attempted to create facility with existing ID: ${facilityId}`);
            return res.status(409).json({ message: `Facility with ID ${facilityId} already exists.` });
        }
        await docRef.set(newFacilityFeature);
        console.log(`Facility ${facilityId} created successfully in Firestore.`);
        res.status(201).json(newFacilityFeature);
    } catch (err) {
        console.error('Error creating facility in Firestore:', err);
        res.status(500).send('Error creating facility');
    }
});

app.put('/api/facilities/:id', isAuthenticated, async (req, res) => {
    // PUT (update) a specific facility's properties in Firestore
    const facilityId = req.params.id;
    const propertiesToUpdate = req.body;
    if (!propertiesToUpdate || typeof propertiesToUpdate !== 'object' || Array.isArray(propertiesToUpdate)) {
         return res.status(400).json({ message: 'Invalid update data format. Expecting an object of properties.' });
    }
    delete propertiesToUpdate.id;
    delete propertiesToUpdate.filesystem;
    delete propertiesToUpdate.documents;
    if (Object.keys(propertiesToUpdate).length === 0) {
        return res.status(400).json({ message: 'No valid properties provided for update.' });
    }
    try {
        const docRef = db.collection('facilities').doc(facilityId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return res.status(404).json({ message: `Facility with ID ${facilityId} not found.` });
        }
        const updatePayload = {};
        for (const key in propertiesToUpdate) {
            if (Object.hasOwnProperty.call(propertiesToUpdate, key)) {
                updatePayload[`properties.${key}`] = propertiesToUpdate[key];
            }
        }
        await docRef.update(updatePayload);
        const updatedDocSnap = await docRef.get();
        const updatedFacilityData = updatedDocSnap.data();
        console.log(`Facility ${facilityId} properties updated successfully in Firestore.`);
        res.json(updatedFacilityData.properties || {});
    } catch (err) {
        console.error(`Error updating facility ${facilityId} in Firestore:`, err);
        res.status(500).send(`Error updating facility ${facilityId}`);
    }
});

// DELETE /api/facilities/:id - Delete a facility
app.delete('/api/facilities/:id', isAuthenticated, async (req, res) => {
    const facilityId = req.params.id;
    console.log(`Attempting to delete facility with ID: ${facilityId}`);

    try {
        const docRef = db.collection('facilities').doc(facilityId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.log(`Facility ${facilityId} not found for deletion.`);
            return res.status(404).json({ success: false, message: `Facility with ID ${facilityId} not found.` });
        }

        // Delete the document from Firestore
        await docRef.delete();

        // TODO: Implement deletion of associated doc_items and storage files if needed
        console.log(`Facility ${facilityId} deleted successfully from Firestore.`);
        res.status(200).json({ success: true, message: `Facility ${facilityId} deleted successfully.` });

    } catch (err) {
        console.error(`Error deleting facility ${facilityId} from Firestore:`, err);
        res.status(500).json({ success: false, message: `Error deleting facility ${facilityId}.` });
    }
});


// --- Dynamic Facility Page Route ---
app.get('/facilities/:id.html', async (req, res) => {
    const facilityId = req.params.id;
    console.log(`Request received for dynamic page: /facilities/${facilityId}.html`);

    try {
        // 1. Fetch the main facility data
        const facilityRef = db.collection('facilities').doc(facilityId);
        const facilitySnap = await facilityRef.get();

        if (!facilitySnap.exists) {
            console.log(`Facility ${facilityId} not found for dynamic page generation.`);
            return res.status(404).send(`Facility with ID ${facilityId} not found.`);
        }
        const facilityData = facilitySnap.data();
        const facilityProperties = facilityData.properties;

        if (!facilityProperties) {
             console.error(`Facility ${facilityId} is missing 'properties' field.`);
             return res.status(500).send('Internal server error: Facility data is incomplete.');
        }

        // 2. Fetch related facilities (same company, different ID)
        let relatedFacilitiesProps = [];
        if (facilityProperties.company) {
            console.log(`Fetching related facilities for company: ${facilityProperties.company}`);
            const relatedQuery = db.collection('facilities')
                .where('properties.company', '==', facilityProperties.company)
                .where(admin.firestore.FieldPath.documentId(), '!=', facilityId); // Exclude self using FieldPath

            const relatedSnapshot = await relatedQuery.get();
            relatedSnapshot.forEach(doc => {
                const relatedData = doc.data();
                if (relatedData.properties) { // Ensure related facilities also have properties
                     // Only add properties needed for the link list (id, name)
                     relatedFacilitiesProps.push({
                         id: relatedData.properties.id || doc.id,
                         name: relatedData.properties.name || 'Unnamed Facility'
                     });
                }
            });
             console.log(`Found ${relatedFacilitiesProps.length} related facilities.`);
        } else {
             console.log(`No company specified for facility ${facilityId}, skipping related facilities query.`);
        }


        // 3. Generate HTML using the imported function
        console.log(`Generating HTML for facility: ${facilityProperties.name}`);
        const html = generateFacilityPageHTML(facilityProperties, relatedFacilitiesProps);

        // 4. Send the generated HTML as the response
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
        console.log(`Successfully served dynamic page for facility: ${facilityId}`);

    } catch (err) {
        console.error(`Error generating dynamic page for facility ${facilityId}:`, err);
        res.status(500).send('Error generating facility page.');
    }
});
// --- End Dynamic Facility Page Route ---


// Filesystem Item Routes
app.post('/api/facilities/:id/files', isAuthenticated, upload.single('document'), async (req, res) => {
    // POST Upload a file
    const facilityId = req.params.id;
    // console.log(`[File Upload] Received request for facilityId: ${facilityId}`); // Roo Debug Log 1 - Removed
    const parentId = req.body.parentId;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    if (!parentId) return res.status(400).json({ message: 'Missing parentId in request body.' });

    const originalFilename = req.file.originalname;
    const fileId = uuidv4();
    let storagePath; // Define storagePath variable

    try {
        // Handle the '_uncategorized' case specifically
        if (facilityId === '_uncategorized') {
            console.log(`[File Upload] Handling as uncategorized upload.`);
            storagePath = `uncategorized/files/${fileId}-${originalFilename}`;
            // Skip Firestore facility check for uncategorized
        } else {
            // Existing logic for specific facility IDs
            const docRef = db.collection('facilities').doc(facilityId);
            const docSnap = await docRef.get();
            if (!docSnap.exists) { // Correctly check exists before logging failure
                // console.log(`[File Upload] Firestore check failed for facilityId: ${facilityId}`); // Roo Debug Log 2 - Removed
                return res.status(404).json({ message: `Facility with ID ${facilityId} not found.` });
            }
            storagePath = `${facilityId}/files/${fileId}-${originalFilename}`;

            // Optional: Keep filesystem checks if needed, though maybe less relevant now?
            const facilityData = docSnap.data();
            const filesystem = facilityData.properties?.filesystem;
            if (!filesystem || typeof filesystem !== 'object') {
                 console.error(`Filesystem missing or invalid for facility ${facilityId}`);
                 return res.status(500).json({ message: 'Internal error: Facility filesystem structure is missing or invalid.' });
            }
            const parentFolder = filesystem[parentId];
            if (!parentFolder || parentFolder.type !== 'folder') {
                // Parent validation will happen in the /api/doc_items call later
            }
        }

        // --- Upload to Storage ---
        console.log(`[File Upload] Determined storage path: ${storagePath}`);
        const fileUpload = bucket.file(storagePath);
        await fileUpload.save(req.file.buffer, { metadata: { contentType: req.file.mimetype } });
        console.log(`File ${originalFilename} (ID: ${fileId}) uploaded to Firebase Storage at ${storagePath}`);
        // --- End Upload to Storage ---


        // --- Remove Firestore Update Logic ---
        // const newFileMetadata = { ... };
        // const updatePayload = { ... };
        // await docRef.update(updatePayload);
        // console.log(`Firestore updated for facility ${facilityId}: Added file ${fileId} to folder ${parentId}`);
        // --- End Remove Firestore Update Logic ---


        // --- Return Metadata for Frontend ---
        // Return the necessary info for the frontend to create the doc_item
        res.status(200).json({ // Use 200 OK since we only stored the file, not the final metadata record
            success: true,
            message: 'File stored successfully. Create doc_item metadata next.',
            // Data needed for the POST /api/doc_items call:
            name: originalFilename,
            storagePath: storagePath,
            contentType: req.file.mimetype, // Use contentType for consistency
            size: req.file.size,
            parentId: parentId // Pass parentId back to frontend
        });
        // --- End Return Metadata ---

    } catch (err) {
        console.error(`Error uploading file ${originalFilename} for facility ${facilityId}:`, err);
        // If storage upload fails, delete the temporary file? (Multer might handle this)
        res.status(500).json({ message: 'Error processing file upload.' }); // Keep original error message
    }
});

/* // [Refactored] POST /api/facilities/:id/links - Use POST /api/doc_items instead
app.post('/api/facilities/:id/links', isAuthenticated, async (req, res) => {
    // POST Add a website link
    const facilityId = req.params.id;
    const { parentId, url, name } = req.body;
    if (!parentId || !url || !name) return res.status(400).json({ message: 'Missing parentId, URL, or name for the link.' });
    try { new URL(url); } catch (_) { return res.status(400).json({ message: 'Invalid URL format.' }); }

    const linkId = uuidv4();
    try {
        const docRef = db.collection('facilities').doc(facilityId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) return res.status(404).json({ message: `Facility with ID ${facilityId} not found.` });

        const facilityData = docSnap.data();
        const filesystem = facilityData.properties?.filesystem;
        if (!filesystem || typeof filesystem !== 'object') {
             console.error(`Filesystem missing or invalid for facility ${facilityId}`);
             return res.status(500).json({ message: 'Internal error: Facility filesystem structure is missing or invalid.' });
        }
        const parentFolder = filesystem[parentId];
        if (!parentFolder || parentFolder.type !== 'folder') {
            return res.status(400).json({ message: `Invalid parentId: Folder with ID ${parentId} not found.` });
        }

        const newLinkMetadata = {
            id: linkId, type: 'link', name: name, parentId: parentId,
            url: url, addedAt: new Date().toISOString()
        };
        const updatePayload = {
            [`properties.filesystem.${linkId}`]: newLinkMetadata,
            [`properties.filesystem.${parentId}.children`]: admin.firestore.FieldValue.arrayUnion(linkId)
        };
        await docRef.update(updatePayload);
        console.log(`Firestore updated for facility ${facilityId}: Added link ${linkId} ('${name}') to folder ${parentId}`);

        const updatedDocSnap = await docRef.get(); // Re-fetch is optional
        const updatedFilesystem = updatedDocSnap.data().properties.filesystem;
        res.status(201).json({
            message: 'Link added successfully.',
            newLink: newLinkMetadata,
            updatedFilesystem: updatedFilesystem
        });
    } catch (err) {
        console.error(`Error adding link '${name}' for facility ${facilityId}:`, err);
        res.status(500).json({ message: 'Error adding link.' });
    }
});
*/

// --- Document Items API Routes (New Structure) ---

// POST /api/doc_items - Create a new folder, file metadata, or link
app.post('/api/doc_items', isAuthenticated, async (req, res) => {
    const { parentId, name, type, tags, url, storagePath, size, contentType } = req.body;

    // Basic Validation
    if (!name || !type || !parentId) {
        return res.status(400).json({ message: 'Missing required fields: name, type, parentId.' });
    }
    if (!['folder', 'file', 'link'].includes(type)) {
        return res.status(400).json({ message: 'Invalid type specified.' });
    }
    if (type === 'link' && !url) {
        return res.status(400).json({ message: 'Missing url for type link.' });
    }
    // Add more validation as needed (e.g., for file fields)

    const docId = uuidv4();
    const cleanName = name.trim();
    const cleanTags = Array.isArray(tags) ? tags.filter(t => typeof t === 'string') : [];

    const docItemData = {
        id: docId,
        name: cleanName,
        type: type,
        parentId: parentId, // Should be 'root' or a valid doc_items ID
        tags: cleanTags,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (type === 'folder') {
        // Folders don't have children array here, relationship is via parentId
    } else if (type === 'file') {
        docItemData.storagePath = storagePath || null;
        docItemData.size = size || 0;
        docItemData.contentType = contentType || null;
    } else if (type === 'link') {
        docItemData.url = url;
    }

    try {
        // Validate parentId exists (unless 'root')
        if (parentId !== 'root') {
            const parentRef = db.collection('doc_items').doc(parentId);
            const parentSnap = await parentRef.get();
            if (!parentSnap.exists || parentSnap.data().type !== 'folder') {
                return res.status(400).json({ message: `Invalid parentId: Folder ${parentId} not found.` });
            }
        }

        // TODO: Optional - Check for duplicate name within the same parent folder

        // Add the new item
        const newItemRef = db.collection('doc_items').doc(docId);
        await newItemRef.set(docItemData);

        console.log(`Created doc_item: ${type} '${cleanName}' (ID: ${docId}) with parent ${parentId}`);

        // Fetch the created data to include server timestamp
        const createdDocSnap = await newItemRef.get();
        res.status(201).json(createdDocSnap.data());

    } catch (error) {
        console.error(`Error creating doc_item (${type} '${cleanName}'):`, error);
        res.status(500).json({ message: 'Failed to create document item.' });
    }
});
// GET /api/doc_items - Fetch items, filter by parentId or tags
app.get('/api/doc_items', isAuthenticated, async (req, res) => {
    const parentId = req.query.parentId; // e.g., ?parentId=xxx or ?parentId=root
    const tag = req.query.tag; // e.g., ?tag=facility:cirba-ohio

    try {
        let query = db.collection('doc_items');

        if (parentId) {
            console.log(`Querying doc_items with parentId: ${parentId}`);
            query = query.where('parentId', '==', parentId);
        } else if (tag) {
            console.log(`Querying doc_items with tag: ${tag}`);
            query = query.where('tags', 'array-contains', tag);
        } else {
            // Default: Fetch top-level items if no filter specified
            console.log(`Querying doc_items with parentId: root`);
            query = query.where('parentId', '==', 'root');
        }

        // Add sorting, e.g., by name (folders first, then files/links)
        // Firestore requires composite index for filtering and sorting on different fields
        // Simple sort by name for now:
        query = query.orderBy('name');
        // For folders first: query = query.orderBy('type').orderBy('name'); (Requires index)

        const snapshot = await query.get();
        const items = [];
        snapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() }); // Include document ID with data
        }); // Close snapshot.forEach

        res.status(200).json(items); // Send the response after the loop
    } catch (error) {
        console.error('Error fetching doc_items:', error);
        res.status(500).json({ message: 'Failed to fetch document items.' });
    }

// GET /api/doc_items/:id - Fetch a single document item by ID
app.get('/api/doc_items/:id', isAuthenticated, async (req, res) => {
    const itemId = req.params.id;
    if (!itemId) return res.status(400).json({ message: 'Missing item ID.' });

    try {
        const itemRef = db.collection('doc_items').doc(itemId);
        const itemSnap = await itemRef.get();

        if (!itemSnap.exists) {
            return res.status(404).json({ message: `Document item with ID ${itemId} not found.` });
        }
        res.status(200).json(itemSnap.data());

    } catch (error) {
        console.error(`Error fetching doc_item ${itemId}:`, error);
        res.status(500).json({ message: 'Failed to fetch document item.' });
    }
});

// GET /api/doc_items/:id/download-url - Get a temporary signed URL for a file
app.get('/api/doc_items/:id/download-url', isAuthenticated, async (req, res) => {
    const itemId = req.params.id;
    if (!itemId) return res.status(400).json({ message: 'Missing item ID.' });

    console.log(`[Download URL] Request for item ID: ${itemId}`);

    try {
        const itemRef = db.collection('doc_items').doc(itemId);
        const itemSnap = await itemRef.get();

        if (!itemSnap.exists) {
            console.log(`[Download URL] Item ${itemId} not found in Firestore.`);
            return res.status(404).json({ message: `Document item with ID ${itemId} not found.` });
        }

        const itemData = itemSnap.data();

        // Validate it's a file and has a storage path
        if (itemData.type !== 'file') {
            console.log(`[Download URL] Item ${itemId} is not a file (type: ${itemData.type}).`);
            return res.status(400).json({ message: 'Item is not a file.' });
        }
        if (!itemData.storagePath) {
            console.error(`[Download URL] Missing storagePath for file item ${itemId}.`);
            return res.status(500).json({ message: 'Internal error: File storage path is missing.' });
        }

        // Check if file exists in storage
        const fileInStorage = bucket.file(itemData.storagePath);
        const [exists] = await fileInStorage.exists();
        if (!exists) {
            console.warn(`[Download URL] File metadata exists for ${itemId}, but file not found in storage at: ${itemData.storagePath}`);
            return res.status(404).json({ message: 'File not found in storage, metadata might be out of sync.' });
        }

        // Generate signed URL (expires in 15 minutes)
        const options = {
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        };
        const [url] = await fileInStorage.getSignedUrl(options);

        console.log(`[Download URL] Generated signed URL for item ${itemId} (Path: ${itemData.storagePath})`);
        res.json({ url });

    } catch (error) {
        console.error(`[Download URL] Error generating signed URL for item ${itemId}:`, error);
        res.status(500).json({ message: 'Error generating download URL.' });
    }
});

// Removed duplicated block below
});
// Removing orphaned catch block and closing bracket below
// Removing misplaced block from GET /api/doc_items



// PUT /api/doc_items/:id - Update an item (rename, move, change tags)
app.put('/api/doc_items/:id', isAuthenticated, async (req, res) => {
    const itemId = req.params.id;
    const updateData = req.body; // e.g., { name: 'newName' } or { parentId: 'newParentId' } or { tags: [...] }

    if (!itemId) return res.status(400).json({ message: 'Missing item ID.' });
    if (Object.keys(updateData).length === 0) return res.status(400).json({ message: 'No update data provided.' });

    const allowedFields = ['name', 'parentId', 'tags', 'url']; // Define fields allowed for update
    const cleanUpdateData = {};
    let isMoveOperation = false;

    for (const key in updateData) {
        if (allowedFields.includes(key)) {
            if (key === 'name') {
                const cleanName = updateData.name?.trim();
                if (!cleanName) return res.status(400).json({ message: 'Invalid name provided.' });
                cleanUpdateData.name = cleanName;
            } else if (key === 'parentId') {
                if (!updateData.parentId) return res.status(400).json({ message: 'Invalid new parentId provided.' });
                cleanUpdateData.parentId = updateData.parentId;
                isMoveOperation = true;
            } else if (key === 'tags') {
                if (!Array.isArray(updateData.tags)) return res.status(400).json({ message: 'Tags must be an array.' });
                cleanUpdateData.tags = updateData.tags.filter(t => typeof t === 'string');
            } else if (key === 'url') {
                 // Add URL validation if needed
                 cleanUpdateData.url = updateData.url;
            }
        }
    }

    if (Object.keys(cleanUpdateData).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    // Add timestamp for update
    cleanUpdateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    try {
        const itemRef = db.collection('doc_items').doc(itemId);
        const itemSnap = await itemRef.get();

        if (!itemSnap.exists) {
            return res.status(404).json({ message: `Item with ID ${itemId} not found.` });
        }

        // --- Specific Validations --- 
        // Prevent renaming/moving root
        if (itemSnap.data().parentId === null || itemSnap.data().parentId === 'root') {
             if (cleanUpdateData.name && itemSnap.data().name === '/') {
                  return res.status(400).json({ message: 'Cannot rename the absolute root folder.' });
             }
             if (cleanUpdateData.parentId) {
                  return res.status(400).json({ message: 'Cannot move the absolute root folder.' });
             }
        }
        // If moving, validate the new parent
        if (isMoveOperation) {
            const newParentId = cleanUpdateData.parentId;
            if (itemId === newParentId) return res.status(400).json({ message: 'Cannot move an item into itself.' });
            if (newParentId !== 'root') {
                 const parentRef = db.collection('doc_items').doc(newParentId);
                 const parentSnap = await parentRef.get();
                 if (!parentSnap.exists || parentSnap.data().type !== 'folder') {
                     return res.status(400).json({ message: `Invalid newParentId: Folder ${newParentId} not found.` });
                 }
                 // TODO: Optional - Add check for circular moves (moving a folder into one of its own descendants)
            }
        }
        // If renaming, check for name collision within the *current* parent (optional)
        // if (cleanUpdateData.name) { ... }
        // --- End Validations ---

        await itemRef.update(cleanUpdateData);
        console.log(`Updated doc_item ${itemId}:`, cleanUpdateData);

        const updatedDocSnap = await itemRef.get();
        res.status(200).json(updatedDocSnap.data());

    } catch (error) {
        console.error(`Error updating doc_item ${itemId}:`, error);
        res.status(500).json({ message: 'Failed to update document item.' });
    }
});


// DELETE /api/doc_items/:id - Delete an item (file, link, or folder recursively)
app.delete('/api/doc_items/:id', isAuthenticated, async (req, res) => {
    const itemId = req.params.id;
    if (!itemId) return res.status(400).json({ message: 'Missing item ID.' });

    console.log(`Attempting to delete doc_item: ${itemId}`);
    const itemRef = db.collection('doc_items').doc(itemId);

    try {
        const itemSnap = await itemRef.get();
        if (!itemSnap.exists) {
            return res.status(404).json({ message: `Item with ID ${itemId} not found.` });
        }
        const itemData = itemSnap.data();

        // --- Recursive Deletion Logic --- 
        async function deleteRecursively(idToDelete) {
            const currentItemRef = db.collection('doc_items').doc(idToDelete);
            const currentItemSnap = await currentItemRef.get();
            if (!currentItemSnap.exists) return; // Already deleted or doesn't exist
            const currentItemData = currentItemSnap.data();

            // 1. Delete associated storage file if it's a file
            if (currentItemData.type === 'file' && currentItemData.storagePath) {
                console.log(`  Deleting file from storage: ${currentItemData.storagePath}`);
                try {
                    await bucket.file(currentItemData.storagePath).delete();
                } catch (storageError) {
                    // Log error but continue deletion process
                    console.error(`  Failed to delete file ${currentItemData.storagePath} from storage:`, storageError.message);
                }
            }

            // 2. Recursively delete children if it's a folder
            if (currentItemData.type === 'folder') {
                console.log(`  Recursively deleting children of folder: ${idToDelete}`);
                const childrenQuery = db.collection('doc_items').where('parentId', '==', idToDelete);
                const childrenSnapshot = await childrenQuery.get();
                if (!childrenSnapshot.empty) {
                    const deletePromises = [];
                    childrenSnapshot.forEach(childDoc => {
                        console.log(`    Queueing deletion for child: ${childDoc.id}`);
                        deletePromises.push(deleteRecursively(childDoc.id));
                    });
                    await Promise.all(deletePromises);
                }
            }

            // 3. Delete the Firestore document itself
            console.log(`  Deleting Firestore document: ${idToDelete}`);
            await currentItemRef.delete();


// GET /api/doc_items/:id/download-url - Get a temporary signed URL for a file
app.get('/api/doc_items/:id/download-url', isAuthenticated, async (req, res) => {
    const itemId = req.params.id;
    if (!itemId) return res.status(400).json({ message: 'Missing item ID.' });

    try {
        const itemRef = db.collection('doc_items').doc(itemId);
        const itemSnap = await itemRef.get();

        if (!itemSnap.exists) {
            return res.status(404).json({ message: `Document item with ID ${itemId} not found.` });
        }
        const itemData = itemSnap.data();

        if (itemData.type !== 'file') {
            return res.status(400).json({ message: `Item ${itemId} is not a file.` });
        }

        const storagePath = itemData.storagePath;
        if (!storagePath) {
            console.error(`Missing storagePath for doc_item ${itemId}`);
            return res.status(500).json({ message: 'Internal error: File storage path is missing.' });
        }

        const fileInStorage = bucket.file(storagePath);
        const [exists] = await fileInStorage.exists();
        if (!exists) {
            console.warn(`File metadata exists for ${itemId}, but file not found in storage at: ${storagePath}`);
            return res.status(404).json({ message: 'File not found in storage, metadata might be out of sync.' });
        }

        // Generate signed URL (e.g., expires in 15 minutes)
        const options = { version: 'v4', action: 'read', expires: Date.now() + 15 * 60 * 1000 };
        const [url] = await fileInStorage.getSignedUrl(options);
        console.log(`Generated signed URL for doc_item ${itemId} (Path: ${storagePath})`);
        res.json({ url });

    } catch (error) {
        console.error(`Error generating signed URL for doc_item ${itemId}:`, error);
        res.status(500).json({ message: 'Error generating download URL.' });
    }
});

        }
        // --- End Recursive Deletion Logic ---

        // Prevent deleting absolute root
        if (itemData.parentId === null || itemData.parentId === 'root') {
             if (itemData.name === '/' && itemData.type === 'folder') {
                  return res.status(400).json({ message: 'Cannot delete the absolute root folder.' });
             }
        }

        // Start the deletion process
        await deleteRecursively(itemId);

        console.log(`Successfully deleted doc_item ${itemId} and its descendants (if any).`);
        res.status(200).json({ message: 'Item deleted successfully.' });

    } catch (error) {
        console.error(`Error deleting doc_item ${itemId}:`, error);
        res.status(500).json({ message: 'Failed to delete document item.' });
    }
});




app.post('/api/facilities/:id/folders', isAuthenticated, async (req, res) => {
    // POST Create a new folder
    const facilityId = req.params.id;
    const { parentId, name } = req.body;
    if (!parentId || !name) return res.status(400).json({ message: 'Missing parentId or name for the new folder.' });
    if (typeof name !== 'string' || name.trim().length === 0) return res.status(400).json({ message: 'Invalid folder name.' });

    const folderId = uuidv4();
    const cleanName = name.trim();
    try {
        const docRef = db.collection('facilities').doc(facilityId);
        await db.runTransaction(async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists) throw { status: 404, message: `Facility with ID ${facilityId} not found.` };

            const facilityData = docSnap.data();
            const filesystem = facilityData.properties?.filesystem;
            if (!filesystem || typeof filesystem !== 'object') throw { status: 500, message: 'Internal error: Facility filesystem structure is missing or invalid.' };

            const parentFolder = filesystem[parentId];
            if (!parentFolder || parentFolder.type !== 'folder') throw { status: 400, message: `Invalid parentId: Folder with ID ${parentId} not found.` };

            // Optional: Check for duplicate folder name (add later if needed)

            const newFolderMetadata = {
                id: folderId, type: 'folder', name: cleanName, parentId: parentId,
                createdAt: new Date().toISOString(), children: []
            };
            const updatePayload = {
                [`properties.filesystem.${folderId}`]: newFolderMetadata,
                [`properties.filesystem.${parentId}.children`]: admin.firestore.FieldValue.arrayUnion(folderId)
            };
            transaction.update(docRef, updatePayload);
        });
        console.log(`Firestore updated for facility ${facilityId}: Added folder ${folderId} ('${cleanName}') to parent ${parentId}`);

        const updatedDocSnap = await docRef.get(); // Re-fetch is optional
        const updatedFilesystem = updatedDocSnap.data().properties.filesystem;
        res.status(201).json({
            message: 'Folder created successfully.',
            newFolder: updatedFilesystem[folderId],
            updatedFilesystem: updatedFilesystem
        });
    } catch (err) {
        console.error(`Error creating folder '${cleanName}' for facility ${facilityId}:`, err);
        if (err.status) res.status(err.status).json({ message: err.message });
        else res.status(500).json({ message: 'Error creating folder.' });
    }
});

/* // [Refactored] PUT /api/facilities/:id/items/:itemId - Use PUT /api/doc_items/:id instead
app.put('/api/facilities/:id/items/:itemId', isAuthenticated, async (req, res) => {
    // PUT Rename or Move an item
    const facilityId = req.params.id;
    const itemId = req.params.itemId;
    const { action, newName, newParentId } = req.body;
    if (!action || (action !== 'rename' && action !== 'move')) return res.status(400).json({ message: 'Invalid or missing action. Must be "rename" or "move".' });
    if (action === 'rename' && (typeof newName !== 'string' || newName.trim().length === 0)) return res.status(400).json({ message: 'Missing or invalid newName for rename action.' });
    if (action === 'move' && !newParentId) return res.status(400).json({ message: 'Missing newParentId for move action.' });

    const cleanNewName = action === 'rename' ? newName.trim() : null;
    try {
        const docRef = db.collection('facilities').doc(facilityId);
        await db.runTransaction(async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists) throw { status: 404, message: `Facility with ID ${facilityId} not found.` };

            const facilityData = docSnap.data();
            const filesystem = facilityData.properties?.filesystem;
            if (!filesystem || typeof filesystem !== 'object') throw { status: 500, message: 'Internal error: Facility filesystem structure is missing or invalid.' };

            const itemToModify = filesystem[itemId];
            if (!itemToModify) throw { status: 404, message: `Item with ID ${itemId} not found.` };
            const oldParentId = itemToModify.parentId;

            // Basic check to prevent moving/renaming root (assuming root has parentId: null)
             if (!oldParentId) {
                  throw { status: 400, message: 'Cannot move or rename the root folder.' };
             }

            const updatePayload = {};
            if (action === 'rename') {
                // Optional: Check for name collision
                updatePayload[`properties.filesystem.${itemId}.name`] = cleanNewName;
            } else if (action === 'move') {
                if (itemId === newParentId) throw { status: 400, message: 'Cannot move an item into itself.' };
                const newParentFolder = filesystem[newParentId];
                if (!newParentFolder || newParentFolder.type !== 'folder') throw { status: 400, message: `Invalid newParentId: Folder with ID ${newParentId} not found.` };
                // Optional: Prevent circular move

                updatePayload[`properties.filesystem.${itemId}.parentId`] = newParentId;
                updatePayload[`properties.filesystem.${oldParentId}.children`] = admin.firestore.FieldValue.arrayRemove(itemId);
                updatePayload[`properties.filesystem.${newParentId}.children`] = admin.firestore.FieldValue.arrayUnion(itemId);
            }
            transaction.update(docRef, updatePayload);
        });
        const actionVerb = action === 'rename' ? 'renamed' : 'moved';
        console.log(`Firestore updated for facility ${facilityId}: Item ${itemId} ${actionVerb}.`);

        const updatedDocSnap = await docRef.get(); // Re-fetch is optional
        const updatedFilesystem = updatedDocSnap.data().properties.filesystem;
        res.status(200).json({
            message: `Item ${actionVerb} successfully.`,
            updatedItem: updatedFilesystem[itemId],
            updatedFilesystem: updatedFilesystem
        });
    } catch (err) {
        const actionVerb = action === 'rename' ? 'renaming' : 'moving';
        console.error(`Error ${actionVerb} item ${itemId} for facility ${facilityId}:`, err);
        if (err.status) res.status(err.status).json({ message: err.message });
        else res.status(500).json({ message: `Error ${actionVerb} item.` });
    }
});
*/

// DEBUG: Catch-all middleware before DELETE route (REMOVED FOR CLEANUP)
// app.use('/api/facilities/:id/items/:itemId', (req, res, next) => {
//     console.log(`DEBUG: Request reached middleware just before DELETE handler. Method: ${req.method}, URL: ${req.originalUrl}`);
//     next();
// });

// DELETE an item (file, link, or folder) - RESTORED isAuthenticated
/* // [Refactored] DELETE /api/facilities/:id/items/:itemId - Use DELETE /api/doc_items/:id instead
app.delete('/api/facilities/:id/items/:itemId', isAuthenticated, async (req, res) => {
    const facilityId = req.params.id;
    const itemId = req.params.itemId;

    try {
        const docRef = db.collection('facilities').doc(facilityId);
        const itemsToDelete = new Set();
        const filesToDeleteFromStorage = [];

        await db.runTransaction(async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists) throw { status: 404, message: `Facility with ID ${facilityId} not found.` };

            const facilityData = docSnap.data();
            const filesystem = facilityData.properties?.filesystem;
            if (!filesystem || typeof filesystem !== 'object') throw { status: 500, message: 'Internal error: Facility filesystem structure is missing or invalid.' };

            const itemToDelete = filesystem[itemId];
            if (!itemToDelete) throw { status: 404, message: `Item with ID ${itemId} not found.` }; // This is likely where the 404 happens
            const parentId = itemToDelete.parentId;
            if (!parentId) throw { status: 400, message: 'Cannot delete the root folder or item lacks parent.' };

            function findItemsRecursively(currentItemId) {
                const currentItem = filesystem[currentItemId];
                if (!currentItem) return;
                itemsToDelete.add(currentItemId);
                if (currentItem.type === 'file' && currentItem.storagePath) {
                    filesToDeleteFromStorage.push(currentItem.storagePath);
                } else if (currentItem.type === 'folder') {
                    (currentItem.children || []).forEach(childId => findItemsRecursively(childId));
                }
            }
            findItemsRecursively(itemId);

            const updatePayload = {};
            updatePayload[`properties.filesystem.${parentId}.children`] = admin.firestore.FieldValue.arrayRemove(itemId);
            itemsToDelete.forEach(idToDelete => {
                updatePayload[`properties.filesystem.${idToDelete}`] = admin.firestore.FieldValue.delete();
            });
            transaction.update(docRef, updatePayload);
        }); // End Transaction

        if (filesToDeleteFromStorage.length > 0) {
            console.log(`Deleting ${filesToDeleteFromStorage.length} file(s) from storage...`);
            const deletePromises = filesToDeleteFromStorage.map(storagePath => {
                return bucket.file(storagePath).delete().catch(err => {
                    console.error(`Failed to delete file ${storagePath} from storage:`, err);
                });
            });
            await Promise.all(deletePromises);
            console.log('Storage file deletion process completed (check logs for individual errors).');
        }
        console.log(`Firestore updated for facility ${facilityId}: Item ${itemId} and its children (if any) deleted.`);
        res.status(200).json({ message: 'Item deleted successfully.' });

    } catch (err) {
        console.error(`Error deleting item ${itemId} for facility ${facilityId}:`, err);
        if (err.status) res.status(err.status).json({ message: err.message });
        else res.status(500).json({ message: 'Error deleting item.' });
    }
});
*/

// PATCH /api/doc_items/:itemId/move - Move an item to a new parent folder
app.patch('/api/doc_items/:itemId/move', isAuthenticated, async (req, res) => {
    const itemId = req.params.itemId;
    const { newParentId } = req.body;

    console.log(`[Move Item] Request to move item ${itemId} to parent ${newParentId}`);

    if (!itemId || !newParentId) {
        return res.status(400).json({ message: 'Missing itemId or newParentId in request.' });
    }

    if (itemId === newParentId) {
        return res.status(400).json({ message: 'Cannot move an item into itself.' });
    }

    const itemRef = db.collection('doc_items').doc(itemId);
    let newParentRef;
    let newParentSnap;

    try {
        // --- Validation ---
        // 1. Check if item being moved exists
        const itemSnap = await itemRef.get();
        if (!itemSnap.exists) {
            return res.status(404).json({ message: `Item with ID ${itemId} not found.` });
        }
        const itemData = itemSnap.data();

        // 2. Check if the new parent exists and is a folder (or 'root')
        if (newParentId !== 'root') {
            newParentRef = db.collection('doc_items').doc(newParentId);
            newParentSnap = await newParentRef.get();
            if (!newParentSnap.exists) {
                return res.status(404).json({ message: `Target parent folder with ID ${newParentId} not found.` });
            }
            if (newParentSnap.data().type !== 'folder') {
                return res.status(400).json({ message: `Target parent with ID ${newParentId} is not a folder.` });
            }
        }

        // 3. Prevent moving a folder into one of its own descendants
        if (itemData.type === 'folder' && newParentId !== 'root') {
            let currentAncestorId = newParentId;
            let safety = 0;
            while (currentAncestorId && currentAncestorId !== 'root' && safety < 20) {
                 safety++;
                 if (currentAncestorId === itemId) {
                     return res.status(400).json({ message: 'Cannot move a folder into one of its own subfolders.' });
                 }
                 // Fetch the parent of the current ancestor
                 const ancestorRef = db.collection('doc_items').doc(currentAncestorId);
                 const ancestorSnap = await ancestorRef.get();
                 if (!ancestorSnap.exists) break; // Should not happen if data is consistent
                 currentAncestorId = ancestorSnap.data().parentId;
            }
        }
        // --- End Validation ---


        // --- Perform Update ---
        await itemRef.update({
            parentId: newParentId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp() // Update timestamp
        });
        // --- End Update ---

        console.log(`[Move Item] Successfully moved item ${itemId} to parent ${newParentId}`);
        res.status(200).json({ message: 'Item moved successfully.' });

    } catch (error) {
        console.error(`[Move Item] Error moving item ${itemId} to ${newParentId}:`, error);
        res.status(500).json({ message: 'Failed to move item.' });
    }
});


/* // [Refactored] GET /api/facilities/:id/files/:fileId/url - Use GET /api/doc_items/:id/download-url instead
app.get('/api/facilities/:id/files/:fileId/url', isAuthenticated, async (req, res) => {
    // GET a temporary signed URL for a file
    const facilityId = req.params.id;
    const fileId = req.params.fileId;
    try {
        const docRef = db.collection('facilities').doc(facilityId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) return res.status(404).json({ message: `Facility with ID ${facilityId} not found.` });

        const facilityData = docSnap.data();
        const filesystem = facilityData.properties?.filesystem;
        if (!filesystem || typeof filesystem !== 'object') return res.status(500).json({ message: 'Internal error: Facility filesystem structure is missing or invalid.' });

        const fileMetadata = filesystem[fileId];
        if (!fileMetadata || fileMetadata.type !== 'file') return res.status(404).json({ message: `File with ID ${fileId} not found or is not a file.` });

        const storagePath = fileMetadata.storagePath;
        if (!storagePath) {
             console.error(`Missing storagePath for file ${fileId} in facility ${facilityId}`);
             return res.status(500).json({ message: 'Internal error: File storage path is missing.' });
        }

        const fileInStorage = bucket.file(storagePath);
        const [exists] = await fileInStorage.exists();
        if (!exists) {
            console.warn(`File metadata exists for ${fileId}, but file not found in storage at: ${storagePath}`);
            return res.status(404).json({ message: 'File not found in storage, metadata might be out of sync.' });
        }

        const options = { version: 'v4', action: 'read', expires: Date.now() + 15 * 60 * 1000 };
        const [url] = await fileInStorage.getSignedUrl(options);
        console.log(`Generated signed URL for file ${fileId} (Path: ${storagePath})`);
        res.json({ url });
    } catch (err) {
        console.error(`Error generating signed URL for file ${fileId} in facility ${facilityId}:`, err);
        res.status(500).json({ message: 'Error generating download URL.' });
    }
});
*/
// --- End Document/Link Management Endpoints ---


// --- Start Server (Only for local development) ---
if (process.env.NODE_ENV !== 'production') {
    const localPort = process.env.PORT || 3000;
    app.listen(localPort, () => {
        console.log(`Server listening for local development at http://localhost:${localPort}`);
    });
}

// Export the app for Vercel Serverless Functions (runs regardless)
module.exports = app;