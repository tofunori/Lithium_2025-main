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
    return facilitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
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
    // Get subfolders
    const foldersCollection = collection(db, 'folders');
    const foldersQuery = query(
      foldersCollection,
      where("parentId", "==", folderId)
    );
    const foldersSnapshot = await getDocs(foldersQuery);
    const folders = foldersSnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'folder',
      ...doc.data()
    }));
    
    // Get files
    const filesCollection = collection(db, 'files');
    const filesQuery = query(
      filesCollection,
      where("folderId", "==", folderId)
    );
    const filesSnapshot = await getDocs(filesQuery);
    const files = filesSnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'file',
      ...doc.data()
    }));
    
    // Get links
    const linksCollection = collection(db, 'links');
    const linksQuery = query(
      linksCollection,
      where("folderId", "==", folderId)
    );
    const linksSnapshot = await getDocs(linksQuery);
    const links = linksSnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'link',
      ...doc.data()
    }));
    
    // Combine and return all items
    return [...folders, ...files, ...links];
  } catch (error) {
    console.error("Error fetching folder contents:", error);
    throw error;
  }
};

export const getFolderStructure = async () => {
  try {
    const foldersCollection = collection(db, 'folders');
    const foldersSnapshot = await getDocs(foldersCollection);
    const folders = foldersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
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
      if (folder.parentId) {
        if (folderMap[folder.parentId]) {
          folderMap[folder.parentId].children.push(folderMap[folder.id]);
        }
      } else {
        rootFolders.push(folderMap[folder.id]);
      }
    });
    
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