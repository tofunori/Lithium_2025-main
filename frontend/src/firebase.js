import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

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
      throw new Error("Facility not found");
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
