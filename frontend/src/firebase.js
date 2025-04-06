import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, query, where, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, listAll, getDownloadURL, uploadBytes, deleteObject } from 'firebase/storage'; // Added deleteObject

// Your Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxKoyOLiNvBxHFFIs-M6lBs_cfcVvWR0Y",
  authDomain: "leafy-bulwark-442103-e7.firebaseapp.com",
  databaseURL: "https://leafy-bulwark-442103-e7-default-rtdb.firebaseio.com",
  projectId: "leafy-bulwark-442103-e7",
  storageBucket: "leafy-bulwark-442103-e7.firebasestorage.app",
  messagingSenderId: "700446305381",
  appId: "1:700446305381:web:24883b4443894d852eaa8c",
  measurementId: "G-23MMQLCK9Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Firestore service functions
export const getFacilities = async () => {
  try {
    const facilitiesCollection = collection(db, 'facilities');
    const facilitiesSnapshot = await getDocs(facilitiesCollection);
    const facilities = facilitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Raw facilities data from Firebase:', facilities);
    
    // Check if facilities have the expected structure
    if (facilities.length > 0) {
      console.log('Sample facility structure:', facilities[0]);
      
      // Check if status field exists
      const missingStatus = facilities.filter(f => !f.status);
      if (missingStatus.length > 0) {
        console.warn(`${missingStatus.length} facilities missing status field`);
      }
      
      // Check if volume field exists
      const missingVolume = facilities.filter(f => !f.volume && f.volume !== 0);
      if (missingVolume.length > 0) {
        console.warn(`${missingVolume.length} facilities missing volume field`);
      }
    }
    
    return facilities;
  } catch (error) {
    console.error("Error fetching facilities:", error);
    throw error;
  }
};

export const getFacilityById = async (facilityId) => {
  try {
    const facilityRef = doc(db, 'facilities', facilityId);
    const facilitySnapshot = await getDoc(facilityRef);
    
    if (facilitySnapshot.exists()) {
      return {
        id: facilitySnapshot.id,
        ...facilitySnapshot.data()
      };
    } else {
      console.log(`Facility with ID ${facilityId} not found.`); // Log instead of throwing
      return null; // Return null if facility doesn't exist
    }
  } catch (error) {
    console.error("Error fetching facility:", error);
    throw error;
  }
};

export const getFacilitiesByStatus = async (status) => {
  try {
    const facilitiesCollection = collection(db, 'facilities');
    const statusQuery = query(
      facilitiesCollection,
      where("status", "==", status),
      orderBy("company")
    );
    const facilitiesSnapshot = await getDocs(statusQuery);
    
    return facilitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error fetching facilities with status ${status}:`, error);
    throw error;
  }
};

export const getFacilityStats = async () => {
  try {
    const facilitiesCollection = collection(db, 'facilities');
    const facilitiesSnapshot = await getDocs(facilitiesCollection);
    const facilities = facilitiesSnapshot.docs.map(doc => doc.data());
    
    // Calculate statistics
    const totalFacilities = facilities.length;
    const operatingFacilities = facilities.filter(f => f.status === 'operating').length;
    const constructionFacilities = facilities.filter(f => f.status === 'construction').length;
    const plannedFacilities = facilities.filter(f => f.status === 'planned').length;
    
    return {
      totalFacilities,
      operatingFacilities,
      constructionFacilities,
      plannedFacilities
    };
  } catch (error) {
    console.error("Error fetching facility statistics:", error);
    throw error;
  }
};


export const addFacility = async (facilityData) => {
  try {
    // Use the 'id' provided in the form data as the document ID
    // Validate that facilityData.id exists and is a non-empty string
    if (!facilityData || typeof facilityData.id !== 'string' || facilityData.id.trim() === '') {
      throw new Error('Facility ID is missing or invalid.');
    }

    const facilityRef = doc(db, 'facilities', facilityData.id);
    
    // Check if a facility with this ID already exists (optional but recommended)
    const docSnap = await getDoc(facilityRef);
    if (docSnap.exists()) {
      throw new Error(`Facility with ID ${facilityData.id} already exists.`);
    }

    // Remove the 'id' field from the data object before saving,
    // as it's used as the document ID, not a field within the document.
    const { id, ...dataToSave } = facilityData;

    // Save the document with the specified ID
    await setDoc(facilityRef, dataToSave); 
    console.log("Facility added successfully with ID:", id);
    return facilityRef; // Return the document reference
  } catch (error) {
    console.error("Error adding facility:", error);
    throw error; // Re-throw the error for the calling component to handle
  }
};


export const updateFacility = async (facilityId, updatedData, originalImages = []) => { // Added originalImages argument
  try {
    const facilityRef = doc(db, 'facilities', facilityId);

    // Prepare the data for update.
    // We need to map the form data back to the expected Firestore structure.
    // This assumes the Firestore structure might have nested 'properties'.
    // Adjust this mapping based on your actual Firestore data structure.
    const dataToUpdate = {
        // Map fields directly if they are top-level in Firestore
        // status: updatedData.status,
        // company: updatedData.company,
        // ... other top-level fields

        // If most data is nested under 'properties':
        properties: {
            company: updatedData.company || '',
            address: updatedData.location || '', // Map form 'location' back to 'address'
            status: updatedData.status || 'Planning',
            capacity: updatedData.capacity || '',
            technology: updatedData.technology || '',
            description: updatedData.description || '',
            technicalSpecs: updatedData.technicalSpecs || '',
            timeline: updatedData.timeline || [],
            images: updatedData.images || [],
            contactPerson: updatedData.contactPerson || '',
            contactEmail: updatedData.contactEmail || '',
            contactPhone: updatedData.contactPhone || '',
            documents: updatedData.documents || [],
            environmentalImpact: { // Save as a nested object
              details: updatedData.environmentalImpact?.details || ''
            },
            fundingDetails: updatedData.investment?.total || '', // Map form 'investment.total' back to 'fundingDetails'
            website: updatedData.website || '',
            feedstock: updatedData.feedstock || '',
            product: updatedData.product || '',
            // Add any other properties fields
        }
        // If your structure is flat (no 'properties' object), adjust accordingly:
        // company: updatedData.company || '',
        // address: updatedData.location || '',
        // status: updatedData.status || 'Planning',
        // ...etc
    };
// --- Image Deletion Logic ---
const updatedImages = dataToUpdate.properties.images || [];
const imagesToDelete = originalImages.filter(url => !updatedImages.includes(url));

if (imagesToDelete.length > 0) {
  console.log(`Deleting ${imagesToDelete.length} image(s) from Storage...`);
  // Use Promise.allSettled to attempt all deletions even if some fail
  const deletionPromises = imagesToDelete.map(url => deleteFacilityImage(url));
  const results = await Promise.allSettled(deletionPromises);
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Failed to delete image ${imagesToDelete[index]}:`, result.reason);
      // Decide if you want to alert the user or handle this error differently
    }
  });
  console.log("Finished attempting image deletions.");
}
// --- End Image Deletion Logic ---

await updateDoc(facilityRef, dataToUpdate);
console.log("Facility updated successfully (Firestore document):", facilityId);
    console.log("Facility updated successfully:", facilityId);
  } catch (error) {
    console.error("Error updating facility:", facilityId, error);
    throw error;
  }
};


export const deleteFacility = async (facilityId) => {
  try {
    const facilityRef = doc(db, 'facilities', facilityId);
    await deleteDoc(facilityRef);
    console.log("Facility deleted successfully:", facilityId);
  } catch (error) {
    console.error("Error deleting facility:", facilityId, error);
    throw error; // Re-throw the error so the calling code can handle it
  }
};

// Document management functions
export const getFolderContents = async (folderId) => {
  try {
    // Query 'doc_items' for all items with the matching parentId
    const docItemsCollection = collection(db, 'doc_items');
    const contentsQuery = query(docItemsCollection, where("parentId", "==", folderId));
    const contentsSnapshot = await getDocs(contentsQuery);
    
    const contents = contentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() // The 'type' field should already be in the document data
    }));
    
    // Sort contents: folders first, then by name
    contents.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    return contents;
  } catch (error) {
    console.error("Error fetching folder contents for parentId:", folderId, error);
    throw error;
  }
};

export const getFolderStructure = async () => {
  console.log("Getting folder structure...");
  try {
    // Query 'doc_items' for folders only
    const docItemsCollection = collection(db, 'doc_items');
    const folderQuery = query(docItemsCollection, where("type", "==", "folder"));
    const foldersSnapshot = await getDocs(folderQuery);
    const folders = foldersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log("Folders from Firestore:", folders);
    
    // Build folder tree
    const folderMap = {};
    folders.forEach(folder => {
      folderMap[folder.id] = {
        ...folder,
        children: []
      };
    });
    
    const rootFolders = [];
    
    folders.forEach(folder => {
      if (folder.parentId && folder.parentId !== 'root') {
        if (folderMap[folder.parentId]) {
          folderMap[folder.parentId].children.push(folderMap[folder.id]);
        }
      } else {
        // Consider folders with parentId 'root' or no parentId as root folders
        rootFolders.push(folderMap[folder.id]);
      }
    });
    
    console.log("Root folders:", rootFolders);
    return rootFolders;
  } catch (error) {
    console.error("Error fetching folder structure:", error);
    throw error;
  }
};

// Authentication functions
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);

  });
};

// Export Firebase instances
export { db, auth, storage };
export default app;

// Storage functions
export const getStorageFiles = async (path) => {
  try {
    const listRef = ref(storage, path);
    const res = await listAll(listRef);
    
    const files = await Promise.all(
      res.items.map(async (itemRef) => {
        const downloadURL = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          url: downloadURL,
          path: itemRef.fullPath
        };
      })
    );
    
    return files;
  } catch (error) {
    console.error(`Error listing files in ${path}:`, error);
    throw error;
  }
};

// Function to delete an image file from Firebase Storage using its download URL
export const deleteFacilityImage = async (imageUrl) => {
  if (!imageUrl) {
    console.warn("Attempted to delete image with empty URL.");
    return; // Or throw an error if preferred
  }
  try {
    // Create a reference from the download URL
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
    console.log(`Successfully deleted image from Storage: ${imageUrl}`);
  } catch (error) {
    // It's common for 'object-not-found' errors if deletion is attempted twice or the URL is wrong.
    // You might want to specifically handle or ignore error.code === 'storage/object-not-found'
    console.error(`Error deleting image ${imageUrl} from Storage:`, error);
    // Decide if you want to re-throw the error or just log it
    // throw error; // Uncomment to propagate the error
  }
};

// Function to upload an image file to Firebase Storage for a specific facility
export const uploadFacilityImage = async (facilityId, file) => {
  if (!facilityId || !file) {
    throw new Error("Facility ID and file are required for upload.");
  }
  // Create a unique path for the image within the facility's folder
  const imagePath = `facilities/${facilityId}/images/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, imagePath);

  try {
    console.log(`Uploading ${file.name} to ${imagePath}...`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`File uploaded successfully. URL: ${downloadURL}`);
    return downloadURL; // Return the public URL of the uploaded file
  } catch (error) {
    console.error(`Error uploading file ${file.name} to ${imagePath}:`, error);
    throw error; // Re-throw for the caller to handle
  }
};
