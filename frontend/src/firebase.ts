import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore, collection, getDocs, doc, getDoc, setDoc, query, where, orderBy, updateDoc, deleteDoc,
  Firestore, CollectionReference, DocumentReference, Query, QuerySnapshot, DocumentSnapshot, DocumentData, FirestoreError
} from 'firebase/firestore';
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider,
  Auth, User, UserCredential, AuthError
} from 'firebase/auth'; // Added GoogleAuthProvider
import {
  getStorage, ref, listAll, getDownloadURL, uploadBytes, deleteObject,
  FirebaseStorage, StorageReference, ListResult, UploadResult, StorageError
} from 'firebase/storage'; // Added deleteObject

// --- Type Definitions ---

export interface FirebaseConfig { // Also export this if needed elsewhere, optional for now
  apiKey: string;
  authDomain: string;
  databaseURL?: string; // Optional based on usage
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string; // Optional
}

export interface FacilityTimelineEvent { // Add export
  date: string; // Or Date object if parsed
  event: string;
  description?: string;
}

export interface FacilityEnvironmentalImpact { // Add export
  details: string;
  // Add other relevant fields if they exist
}

// GeoJSON-like structure for coordinates
export interface Geometry {
  type: string; // e.g., 'Point'
  coordinates: [number, number]; // [longitude, latitude]
}


// Structure matching Firestore (nested properties)
interface FacilityProperties {
  company: string;
  address: string;
  status: 'operating' | 'construction' | 'planned' | 'Planning' | string; // Use specific statuses or string
  capacity: string | number; // Allow number if applicable
  technology: string;
  description: string;
  technicalSpecs: string;
  timeline: FacilityTimelineEvent[];
  images: string[]; // Array of image URLs
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  documents: any[]; // Define document structure if known, e.g., { name: string, url: string }[]
  environmentalImpact: FacilityEnvironmentalImpact;
  fundingDetails: string | number; // Allow number if applicable
  website: string;
  feedstock: string;
  product: string;
  volume?: number; // Add volume if it exists under properties
  // Add any other properties fields
}

// Main Facility data structure in Firestore
export interface FacilityData {
  id: string; // Document ID
  properties: FacilityProperties;
  geometry?: Geometry; // Add optional geometry field
}

// Structure likely coming from the form for updates
interface FacilityFormData {
  id?: string; // ID might be separate or part of the form
  company?: string;
  location?: string; // Form uses 'location', Firestore uses 'address'
  status?: 'operating' | 'construction' | 'planned' | 'Planning' | string;
  capacity?: string | number;
  technology?: string;
  description?: string;
  technicalSpecs?: string;
  timeline?: FacilityTimelineEvent[];
  images?: string[];
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  documents?: any[];
  environmentalImpact?: { details?: string }; // Nested structure in form?
  investment?: { total?: string | number }; // Nested structure in form?
  website?: string;
  feedstock?: string;
  product?: string;
  // Add other form fields if they exist
}

// Input for adding a new facility (might need refinement based on form)
interface AddFacilityInput {
  id: string; // Expecting ID to be provided externally
  properties: FacilityProperties; // Should contain all required properties
}

export interface FacilityStats {
  totalFacilities: number;
  operatingFacilities: number;
  constructionFacilities: number;
  plannedFacilities: number;
}

interface DocItem {
  id: string;
  parentId: string | 'root';
  name: string;
  type: 'folder' | 'file' | string; // Be more specific if possible
  // Add other fields if they exist (e.g., url for files)
  url?: string;
}

interface FolderTreeNode extends DocItem {
  children: FolderTreeNode[];
}

interface StorageFile {
  name: string;
  url: string;
  path: string;
}

// --- Firebase Initialization ---

// Your Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyAxKoyOLiNvBxHFFIs-M6lBs_cfcVvWR0Y", // Reverted to hardcoded value
  authDomain: "leafy-bulwark-442103-e7.firebaseapp.com", // Reverted
  databaseURL: "https://leafy-bulwark-442103-e7-default-rtdb.firebaseio.com", // Reverted (and added)
  projectId: "leafy-bulwark-442103-e7", // Reverted
  storageBucket: "leafy-bulwark-442103-e7.firebasestorage.app", // Reverted
  messagingSenderId: "700446305381", // Reverted
  appId: "1:700446305381:web:24883b4443894d852eaa8c", // Reverted
  measurementId: "G-23MMQLCK9Q" // Reverted
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app); // Explicitly type storage
const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();

// Helper to safely cast error types
const isFirebaseError = (error: unknown): error is FirestoreError | AuthError | StorageError => {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
};


// --- Firestore Service Functions ---

// Type guard for FacilityData
function isFacilityData(data: DocumentData | undefined): data is { properties: FacilityProperties } {
  return data !== undefined && typeof data === 'object' && data !== null && 'properties' in data && typeof data.properties === 'object';
}

export const getFacilities = async (): Promise<FacilityData[]> => {
  try {
    const facilitiesCollection: CollectionReference<DocumentData> = collection(db, 'facilities');
    const facilitiesSnapshot: QuerySnapshot<DocumentData> = await getDocs(facilitiesCollection);

    const facilities: FacilityData[] = facilitiesSnapshot.docs
      .map((docSnap: DocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();

        // Basic validation: Check if data and properties exist
        if (!data || typeof data !== 'object' || !data.properties || typeof data.properties !== 'object') {
          console.warn(`Facility document ${docSnap.id} is missing data or properties:`, data);
          return null;
        }

        // --- NEW: Safely access geometry and coordinates ---
        let geometry: Geometry | undefined = undefined;
        if (data.geometry && typeof data.geometry === 'object' &&
            data.geometry.type === 'Point' && // Assuming Point type
            Array.isArray(data.geometry.coordinates) &&
            data.geometry.coordinates.length === 2 &&
            typeof data.geometry.coordinates[0] === 'number' &&
            typeof data.geometry.coordinates[1] === 'number') {
          geometry = {
            type: data.geometry.type,
            coordinates: [data.geometry.coordinates[0], data.geometry.coordinates[1]] // [lon, lat]
          };
        } else if (data.geometry) {
            // Log if geometry exists but is invalid
            console.warn(`Facility document ${docSnap.id} has invalid geometry structure:`, data.geometry);
        }
        // --- End NEW ---

        return {
          id: docSnap.id,
          properties: data.properties as FacilityProperties, // Cast properties (assuming they are valid if we reach here)
          geometry: geometry // Add the validated or undefined geometry
        };
      })
      .filter((facility): facility is FacilityData => facility !== null); // Type predicate to filter nulls

    console.log('Mapped facilities data from Firebase:', facilities);

    // Check if facilities have the expected structure (checking nested properties)
    if (facilities.length > 0) {
      console.log('Sample facility structure:', facilities[0]);

      // Check if status field exists within properties
      const missingStatus = facilities.filter(f => !f.properties.status);
      if (missingStatus.length > 0) {
        console.warn(`${missingStatus.length} facilities missing properties.status field`);
      }

      // Check if capacity field exists within properties
      const missingCapacity = facilities.filter(f => f.properties.capacity === undefined || f.properties.capacity === null);
      if (missingCapacity.length > 0) {
        console.warn(`${missingCapacity.length} facilities missing properties.capacity field`);
      }
    }

    return facilities;
  } catch (error: unknown) {
    console.error("Error fetching facilities:", isFirebaseError(error) ? error.message : error);
    throw error;
  }
};

export const getFacilityById = async (facilityId: string): Promise<FacilityData | null> => {
  try {
    const facilityRef: DocumentReference<DocumentData> = doc(db, 'facilities', facilityId);
    const facilitySnapshot: DocumentSnapshot<DocumentData> = await getDoc(facilityRef);

    if (facilitySnapshot.exists()) {
      const data = facilitySnapshot.data();

      // Basic validation
      if (!data || typeof data !== 'object' || !data.properties || typeof data.properties !== 'object') {
        console.warn(`Facility document ${facilitySnapshot.id} is missing data or properties:`, data);
        return null;
      }

      // Safely access geometry
      let geometry: Geometry | undefined = undefined;
      if (data.geometry && typeof data.geometry === 'object' &&
          data.geometry.type === 'Point' &&
          Array.isArray(data.geometry.coordinates) &&
          data.geometry.coordinates.length === 2 &&
          typeof data.geometry.coordinates[0] === 'number' &&
          typeof data.geometry.coordinates[1] === 'number') {
        geometry = {
          type: data.geometry.type,
          coordinates: [data.geometry.coordinates[0], data.geometry.coordinates[1]]
        };
      } else if (data.geometry) {
        console.warn(`Facility document ${facilitySnapshot.id} has invalid geometry structure:`, data.geometry);
      }

      return {
        id: facilitySnapshot.id,
        properties: data.properties as FacilityProperties,
        geometry: geometry
      };
    } else {
      console.log(`Facility with ID ${facilityId} not found.`);
      return null;
    }
  } catch (error: unknown) {
    console.error("Error fetching facility:", isFirebaseError(error) ? error.message : error);
    throw error;
  }
};

export const getFacilitiesByStatus = async (status: string): Promise<FacilityData[]> => {
  try {
    const facilitiesCollection: CollectionReference<DocumentData> = collection(db, 'facilities');
    // Query based on nested status field
    const statusQuery: Query<DocumentData> = query(
      facilitiesCollection,
      where("properties.status", "==", status),
      orderBy("properties.company") // Assuming company is also nested
    );
    const facilitiesSnapshot: QuerySnapshot<DocumentData> = await getDocs(statusQuery);

    const facilities: FacilityData[] = facilitiesSnapshot.docs
      .map((docSnap: DocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();

        // Basic validation
        if (!data || typeof data !== 'object' || !data.properties || typeof data.properties !== 'object') {
          console.warn(`Facility document ${docSnap.id} is missing data or properties:`, data);
          return null;
        }

        // Safely access geometry
        let geometry: Geometry | undefined = undefined;
        if (data.geometry && typeof data.geometry === 'object' &&
            data.geometry.type === 'Point' &&
            Array.isArray(data.geometry.coordinates) &&
            data.geometry.coordinates.length === 2 &&
            typeof data.geometry.coordinates[0] === 'number' &&
            typeof data.geometry.coordinates[1] === 'number') {
          geometry = {
            type: data.geometry.type,
            coordinates: [data.geometry.coordinates[0], data.geometry.coordinates[1]]
          };
        } else if (data.geometry) {
          console.warn(`Facility document ${docSnap.id} has invalid geometry structure:`, data.geometry);
        }

        return {
          id: docSnap.id,
          properties: data.properties as FacilityProperties,
          geometry: geometry
        };
      })
      .filter((facility): facility is FacilityData => facility !== null);

    return facilities;
  } catch (error: unknown) {
    console.error(`Error fetching facilities with status ${status}:`, isFirebaseError(error) ? error.message : error);
    throw error;
  }
};

export const getFacilityStats = async (): Promise<FacilityStats> => {
  try {
    const facilitiesCollection: CollectionReference<DocumentData> = collection(db, 'facilities');
    const facilitiesSnapshot: QuerySnapshot<DocumentData> = await getDocs(facilitiesCollection);
    
    const facilitiesProperties: FacilityProperties[] = facilitiesSnapshot.docs
        .map(doc => doc.data()?.properties as FacilityProperties)
        .filter((props): props is FacilityProperties => props !== undefined); // Ensure properties exist

    // Calculate statistics based on nested status
    const totalFacilities = facilitiesProperties.length;
    const operatingFacilities = facilitiesProperties.filter(p => p.status === 'operating').length;
    const constructionFacilities = facilitiesProperties.filter(p => p.status === 'construction').length;
    const plannedFacilities = facilitiesProperties.filter(p => p.status === 'planned' || p.status === 'Planning').length; // Include 'Planning'

    return {
      totalFacilities,
      operatingFacilities,
      constructionFacilities,
      plannedFacilities
    };
  } catch (error: unknown) {
    console.error("Error fetching facility statistics:", isFirebaseError(error) ? error.message : error);
    throw error;
  }
};


// Note: The input type 'AddFacilityInput' assumes the caller provides the full 'properties' object.
// Adjust if the input structure is different (e.g., flat like FacilityFormData).
export const addFacility = async (facilityData: AddFacilityInput): Promise<DocumentReference> => {
  try {
    if (!facilityData || typeof facilityData.id !== 'string' || facilityData.id.trim() === '') {
      throw new Error('Facility ID is missing or invalid.');
    }
    if (!facilityData.properties) {
       throw new Error('Facility properties are missing.');
    }

    const facilityRef: DocumentReference = doc(db, 'facilities', facilityData.id);

    const docSnap: DocumentSnapshot = await getDoc(facilityRef);
    if (docSnap.exists()) {
      throw new Error(`Facility with ID ${facilityData.id} already exists.`);
    }

    // Data to save should be just the properties object
    const dataToSave: { properties: FacilityProperties } = { properties: facilityData.properties };

    await setDoc(facilityRef, dataToSave);
    console.log("Facility added successfully with ID:", facilityData.id);
    return facilityRef;
  } catch (error: unknown) {
    console.error("Error adding facility:", isFirebaseError(error) ? error.message : error);
    throw error;
  }
};

// Accepts flat form data and maps it to the nested Firestore structure for update
export const updateFacility = async (facilityId: string, updatedData: FacilityFormData, originalImages: string[] = []): Promise<void> => {
  try {
    const facilityRef: DocumentReference = doc(db, 'facilities', facilityId);

    // Map the flat form data (updatedData) to the nested Firestore structure (Partial<FacilityData>)
    // We only update the 'properties' field. Use Partial<> for flexibility.
    const dataToUpdate: { properties: Partial<FacilityProperties> } = {
        properties: {
            // Only include fields that are present in updatedData
            ...(updatedData.company !== undefined && { company: updatedData.company }),
            ...(updatedData.location !== undefined && { address: updatedData.location }), // Map location -> address
            ...(updatedData.status !== undefined && { status: updatedData.status }),
            ...(updatedData.capacity !== undefined && { capacity: updatedData.capacity }),
            ...(updatedData.technology !== undefined && { technology: updatedData.technology }),
            ...(updatedData.description !== undefined && { description: updatedData.description }),
            ...(updatedData.technicalSpecs !== undefined && { technicalSpecs: updatedData.technicalSpecs }),
            ...(updatedData.timeline !== undefined && { timeline: updatedData.timeline }),
            ...(updatedData.images !== undefined && { images: updatedData.images }),
            ...(updatedData.contactPerson !== undefined && { contactPerson: updatedData.contactPerson }),
            ...(updatedData.contactEmail !== undefined && { contactEmail: updatedData.contactEmail }),
            ...(updatedData.contactPhone !== undefined && { contactPhone: updatedData.contactPhone }),
            ...(updatedData.documents !== undefined && { documents: updatedData.documents }),
            ...(updatedData.environmentalImpact?.details !== undefined && {
                environmentalImpact: { details: updatedData.environmentalImpact.details }
            }),
            ...(updatedData.investment?.total !== undefined && { fundingDetails: updatedData.investment.total }), // Map investment.total -> fundingDetails
            ...(updatedData.website !== undefined && { website: updatedData.website }),
            ...(updatedData.feedstock !== undefined && { feedstock: updatedData.feedstock }),
            ...(updatedData.product !== undefined && { product: updatedData.product }),
        }
    };

    // --- Image Deletion Logic ---
    const updatedImages = dataToUpdate.properties.images || []; // Images to keep/add
    const imagesToDelete = originalImages.filter(url => !updatedImages.includes(url));

    if (imagesToDelete.length > 0) {
      console.log(`Deleting ${imagesToDelete.length} image(s) from Storage...`);
      const deletionPromises = imagesToDelete.map(url => deleteFacilityImage(url));
      const results = await Promise.allSettled(deletionPromises);
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete image ${imagesToDelete[index]}:`, result.reason);
        }
      });
      console.log("Finished attempting image deletions.");
    }
    // --- End Image Deletion Logic ---

    // Use updateDoc to merge with existing data, only changing specified fields
    await updateDoc(facilityRef, dataToUpdate);
    console.log("Facility updated successfully:", facilityId);
  } catch (error: unknown) {
    console.error("Error updating facility:", facilityId, isFirebaseError(error) ? error.message : error);
    throw error;
  }
};


export const deleteFacility = async (facilityId: string): Promise<void> => {
  try {
    const facilityRef: DocumentReference = doc(db, 'facilities', facilityId);
    // Consider deleting associated storage items (images, documents) here if needed
    await deleteDoc(facilityRef);
    console.log("Facility deleted successfully:", facilityId);
  } catch (error: unknown) {
    console.error("Error deleting facility:", facilityId, isFirebaseError(error) ? error.message : error);
    throw error;
  }
};

// --- Document Management Functions ---

// Type guard for DocItem
function isDocItem(data: DocumentData | undefined): data is DocItem {
    return data !== undefined && typeof data === 'object' && data !== null &&
           'id' in data && 'parentId' in data && 'name' in data && 'type' in data;
}

export const getFolderContents = async (folderId: string): Promise<DocItem[]> => {
  try {
    const docItemsCollection: CollectionReference<DocumentData> = collection(db, 'doc_items');
    const contentsQuery: Query<DocumentData> = query(docItemsCollection, where("parentId", "==", folderId));
    const contentsSnapshot: QuerySnapshot<DocumentData> = await getDocs(contentsQuery);

    const contents: DocItem[] = contentsSnapshot.docs
      .map((docSnap: DocumentSnapshot<DocumentData>) => {
          const data = docSnap.data();
          // Add id to the data object before casting/validation
          const itemDataWithId = { ...data, id: docSnap.id };
          if (isDocItem(itemDataWithId)) { // Validate the combined object
              return itemDataWithId as DocItem; // Cast validated data
          }
          console.warn(`DocItem document ${docSnap.id} has unexpected structure:`, data);
          return null;
      })
      .filter((item): item is DocItem => item !== null); // Filter out invalid items

    // Sort contents: folders first, then by name
    contents.sort((a: DocItem, b: DocItem) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    return contents;
  } catch (error: unknown) {
    console.error("Error fetching folder contents for parentId:", folderId, isFirebaseError(error) ? error.message : error);
    throw error;
  }
};

export const getFolderStructure = async (): Promise<FolderTreeNode[]> => {
  console.log("Getting folder structure...");
  try {
    const docItemsCollection: CollectionReference<DocumentData> = collection(db, 'doc_items');
    const folderQuery: Query<DocumentData> = query(docItemsCollection, where("type", "==", "folder"));
    const foldersSnapshot: QuerySnapshot<DocumentData> = await getDocs(folderQuery);
    
    const folders: DocItem[] = foldersSnapshot.docs
        .map((docSnap: DocumentSnapshot<DocumentData>) => {
            const data = docSnap.data();
            const itemDataWithId = { ...data, id: docSnap.id };
            if (isDocItem(itemDataWithId) && itemDataWithId.type === 'folder') {
                return itemDataWithId as DocItem;
            }
            console.warn(`Folder document ${docSnap.id} has unexpected structure or type:`, data);
            return null;
        })
        .filter((item): item is DocItem => item !== null);

    console.log("Folders from Firestore:", folders);

    // Build folder tree
    const folderMap: { [key: string]: FolderTreeNode } = {}; // Explicitly type folderMap
    folders.forEach((folder: DocItem) => {
      folderMap[folder.id] = {
        ...folder,
        children: [] // Initialize children array
      };
    });

    const rootFolders: FolderTreeNode[] = []; // Explicitly type rootFolders

    folders.forEach((folder: DocItem) => {
      const node = folderMap[folder.id]; // Get the typed node
      if (folder.parentId && folder.parentId !== 'root') {
        const parentNode = folderMap[folder.parentId];
        if (parentNode) {
          // Ensure children array exists (should be initialized above)
          parentNode.children = parentNode.children || [];
          parentNode.children.push(node);
          // Sort children by name after adding
          parentNode.children.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else {
          console.warn(`Parent folder with ID ${folder.parentId} not found for folder ${folder.id}`);
          // Optionally add to root if parent is missing, or handle differently
          rootFolders.push(node);
        }
      } else {
        // Folders with parentId 'root' or no parentId are root folders
        rootFolders.push(node);
      }
    });
    
    // Sort root folders by name
    rootFolders.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    console.log("Root folders:", rootFolders);
    return rootFolders;
  } catch (error: unknown) {
    console.error("Error fetching folder structure:", isFirebaseError(error) ? error.message : error);
    throw error;
  }
};

// --- Authentication Functions ---

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: unknown) {
    console.error("Error logging in:", isFirebaseError(error) ? error.message : error);
    throw error; // Re-throw original error structure for potential handling upstream
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: unknown) {
    console.error("Error logging out:", isFirebaseError(error) ? error.message : error);
    throw error;
  }
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
        unsubscribe(); // Unsubscribe after the first state change
        resolve(user);
      }, (error: Error) => { // Changed type from AuthError to Error
        unsubscribe(); // Ensure unsubscribe on error too
        console.error("Error in onAuthStateChanged:", error.message);
        reject(error);
      });
    } catch (error: unknown) {
        console.error("Error setting up onAuthStateChanged listener:", error);
        reject(error);
    }
  });
};

// --- Export Firebase Instances ---
export { db, auth, storage, googleProvider };
export default app;

// --- Storage Functions ---

export const getStorageFiles = async (path: string): Promise<StorageFile[]> => {
  try {
    const listRef: StorageReference = ref(storage, path);
    const res: ListResult = await listAll(listRef);

    const filePromises: Promise<StorageFile>[] = res.items.map(async (itemRef: StorageReference) => {
      const downloadURL: string = await getDownloadURL(itemRef);
      return {
        name: itemRef.name,
        url: downloadURL,
        path: itemRef.fullPath
      };
    });

    const files: StorageFile[] = await Promise.all(filePromises);
    return files;
  } catch (error: unknown) {
    console.error(`Error listing files in ${path}:`, isFirebaseError(error) ? error.message : error);
    throw error;
  }
};

// Function to delete an image file from Firebase Storage using its download URL
export const deleteFacilityImage = async (imageUrl: string): Promise<void> => {
  if (!imageUrl) {
    console.warn("Attempted to delete image with empty or invalid URL.");
    return;
  }
  try {
    // Create a reference from the download URL. Note: This assumes the URL format is compatible.
    // If using gs:// URLs, use ref(storage, gsUrl) directly.
    // For HTTPS URLs, firebase might need configuration or a different approach if direct ref creation fails.
    // Let's assume the URL is a gs:// path or a full HTTPS URL that ref() can handle.
    const storageRef: StorageReference = ref(storage, imageUrl);
    await deleteObject(storageRef);
    console.log(`Successfully deleted image from Storage: ${imageUrl}`);
  } catch (error: unknown) {
    if (isFirebaseError(error) && error.code === 'storage/object-not-found') {
        console.warn(`Image not found for deletion (may already be deleted): ${imageUrl}`);
    } else {
        console.error(`Error deleting image ${imageUrl} from Storage:`, isFirebaseError(error) ? error.message : error);
        // Decide if you want to re-throw the error or just log it
        // throw error; // Uncomment to propagate the error
    }
  }
};

// Function to upload an image file to Firebase Storage for a specific facility
export const uploadFacilityImage = async (facilityId: string, file: File): Promise<string> => {
  if (!facilityId || !file) {
    throw new Error("Facility ID and file are required for upload.");
  }
  // Create a unique path for the image within the facility's folder
  const imagePath = `facilities/${facilityId}/images/${Date.now()}_${file.name}`;
  const storageRef: StorageReference = ref(storage, imagePath);

  try {
    console.log(`Uploading ${file.name} to ${imagePath}...`);
    const snapshot: UploadResult = await uploadBytes(storageRef, file);
    const downloadURL: string = await getDownloadURL(snapshot.ref);
    console.log(`File uploaded successfully. URL: ${downloadURL}`);
    return downloadURL; // Return the public URL of the uploaded file
  } catch (error: unknown) {
    console.error(`Error uploading file ${file.name} to ${imagePath}:`, isFirebaseError(error) ? error.message : error);
    throw error; // Re-throw for the caller to handle
  }
};