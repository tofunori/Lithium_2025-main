import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

// Your Firebase configuration
// IMPORTANT: Replace these values with your actual Firebase project configuration
// You can find these values in your Firebase project settings:
// 1. Go to Firebase Console (https://console.firebase.google.com/)
// 2. Select your project
// 3. Click on the gear icon (⚙️) next to "Project Overview" to access Project settings
// 4. Scroll down to "Your apps" section and select your web app
// 5. Under "Firebase SDK snippet", select "Config"
// 6. Copy the configuration object and replace the values below

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// For development without Firebase, set this to true to use mock data instead
const useMockData = true;

// Initialize Firebase only if not using mock data
let app, db, auth, storage;

if (!useMockData) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // Handle initialization error, maybe fall back to mock data or show an error message
  }
} else {
  console.log("Using mock data. Firebase is not initialized.");
  // Assign null or mock objects if needed, though functions should handle the useMockData flag
  app = null;
  db = null;
  auth = null;
  storage = null;
}

// Firestore service functions
// Mock data for facilities
const mockFacilities = [
  {
    id: 1,
    company: 'Li-Cycle',
    location: 'Rochester, NY',
    region: 'US Northeast',
    volume: 5000,
    method: 'Hydrometallurgical',
    status: 'operating'
  },
  {
    id: 2,
    company: 'Redwood Materials',
    location: 'Carson City, NV',
    region: 'US West',
    volume: 20000,
    method: 'Pyrometallurgical',
    status: 'operating'
  },
  {
    id: 3,
    company: 'Ascend Elements',
    location: 'Covington, GA',
    region: 'US Southeast',
    volume: 30000,
    method: 'Hydrometallurgical',
    status: 'construction'
  },
  {
    id: 4,
    company: 'ABTC',
    location: 'Fernley, NV',
    region: 'US West',
    volume: 20000,
    method: 'Direct Recycling',
    status: 'planned'
  },
  {
    id: 5,
    company: 'Cirba Solutions',
    location: 'Ohio',
    region: 'US Midwest',
    volume: 15000,
    method: 'Hybrid',
    status: 'operating'
  },
  {
    id: 6,
    company: 'Li-Cycle',
    location: 'Ontario, Canada',
    region: 'Canada',
    volume: 10000,
    method: 'Hydrometallurgical',
    status: 'operating'
  }
];

export const getFacilities = async () => {
  try {
    if (useMockData) {
      // Return mock data
      return mockFacilities;
    }
    
    // Return data from Firebase
    const facilitiesCollection = collection(db, 'facilities');
    const facilitiesSnapshot = await getDocs(facilitiesCollection);
    return facilitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching facilities:", error);
    if (useMockData) {
      return mockFacilities;
    }
    throw error;
  }
};

export const getFacilityById = async (facilityId) => {
  try {
    if (useMockData) {
      // Return mock data
      const facility = mockFacilities.find(f => f.id.toString() === facilityId.toString());
      if (facility) {
        return facility;
      } else {
        throw new Error("Facility not found");
      }
    }
    
    // Return data from Firebase
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
    if (useMockData) {
      const facility = mockFacilities.find(f => f.id.toString() === facilityId.toString());
      if (facility) {
        return facility;
      }
    }
    throw error;
  }
};

export const getFacilitiesByStatus = async (status) => {
  try {
    if (useMockData) {
      // Return mock data
      return mockFacilities.filter(f => f.status === status);
    }
    
    // Return data from Firebase
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
    if (useMockData) {
      return mockFacilities.filter(f => f.status === status);
    }
    throw error;
  }
};

export const getFacilityStats = async () => {
  try {
    if (useMockData) {
      // Return mock data
      const totalFacilities = mockFacilities.length;
      const operatingFacilities = mockFacilities.filter(f => f.status === 'operating').length;
      const constructionFacilities = mockFacilities.filter(f => f.status === 'construction').length;
      const plannedFacilities = mockFacilities.filter(f => f.status === 'planned').length;
      
      return {
        totalFacilities,
        operatingFacilities,
        constructionFacilities,
        plannedFacilities
      };
    }
    
    // Return data from Firebase
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
    if (useMockData) {
      const totalFacilities = mockFacilities.length;
      const operatingFacilities = mockFacilities.filter(f => f.status === 'operating').length;
      const constructionFacilities = mockFacilities.filter(f => f.status === 'construction').length;
      const plannedFacilities = mockFacilities.filter(f => f.status === 'planned').length;
      
      return {
        totalFacilities,
        operatingFacilities,
        constructionFacilities,
        plannedFacilities
      };
    }
    throw error;
  }
};

// Document management functions
// Mock data for folder contents
const mockFolderContents = {
  root: [
    { id: 'reports-folder', name: 'Reports', type: 'folder', lastModified: '2025-03-15' },
    { id: 'regulations-folder', name: 'Regulations', type: 'folder', lastModified: '2025-03-10' },
    { id: 'research-folder', name: 'Research', type: 'folder', lastModified: '2025-03-20' },
    { id: 'overview-doc', name: 'Lithium Recycling Overview.pdf', type: 'file', size: '2.4 MB', lastModified: '2025-03-01' },
    { id: 'industry-link', name: 'Industry Association', type: 'link', url: 'https://example.com/association', lastModified: '2025-02-28' }
  ],
  reports: [
    { id: 'annual-folder', name: 'Annual Reports', type: 'folder', lastModified: '2025-03-15' },
    { id: 'quarterly-folder', name: 'Quarterly Reports', type: 'folder', lastModified: '2025-03-10' },
    { id: 'summary-doc', name: 'Executive Summary 2024.pdf', type: 'file', size: '1.2 MB', lastModified: '2025-01-15' }
  ],
  annual: [
    { id: 'report-2024', name: 'Annual Report 2024.pdf', type: 'file', size: '5.7 MB', lastModified: '2025-01-30' },
    { id: 'report-2023', name: 'Annual Report 2023.pdf', type: 'file', size: '5.2 MB', lastModified: '2024-01-25' }
  ],
  quarterly: [
    { id: 'q1-2025', name: 'Q1 2025 Report.pdf', type: 'file', size: '1.8 MB', lastModified: '2025-04-01' },
    { id: 'q4-2024', name: 'Q4 2024 Report.pdf', type: 'file', size: '1.7 MB', lastModified: '2025-01-05' }
  ],
  regulations: [
    { id: 'federal-folder', name: 'Federal', type: 'folder', lastModified: '2025-03-10' },
    { id: 'state-folder', name: 'State/Provincial', type: 'folder', lastModified: '2025-03-08' },
    { id: 'guidelines-doc', name: 'Regulatory Guidelines.pdf', type: 'file', size: '3.1 MB', lastModified: '2025-02-20' }
  ],
  federal: [
    { id: 'epa-doc', name: 'EPA Requirements.pdf', type: 'file', size: '2.3 MB', lastModified: '2025-02-15' },
    { id: 'epa-link', name: 'EPA Website', type: 'link', url: 'https://example.com/epa', lastModified: '2025-02-10' }
  ],
  state: [
    { id: 'california-doc', name: 'California Regulations.pdf', type: 'file', size: '1.9 MB', lastModified: '2025-02-05' },
    { id: 'ontario-doc', name: 'Ontario Regulations.pdf', type: 'file', size: '1.8 MB', lastModified: '2025-02-01' }
  ],
  research: [
    { id: 'technology-doc', name: 'Recycling Technologies.pdf', type: 'file', size: '4.2 MB', lastModified: '2025-03-18' },
    { id: 'market-doc', name: 'Market Analysis.pdf', type: 'file', size: '3.5 MB', lastModified: '2025-03-12' },
    { id: 'research-link', name: 'Research Portal', type: 'link', url: 'https://example.com/research', lastModified: '2025-03-05' }
  ]
};

// Mock data for folder structure
const mockFolderStructure = [
  {
    id: 'root',
    name: 'Root',
    children: [
      {
        id: 'reports',
        name: 'Reports',
        children: [
          { id: 'annual', name: 'Annual Reports', children: [] },
          { id: 'quarterly', name: 'Quarterly Reports', children: [] }
        ]
      },
      {
        id: 'regulations',
        name: 'Regulations',
        children: [
          { id: 'federal', name: 'Federal', children: [] },
          { id: 'state', name: 'State/Provincial', children: [] }
        ]
      },
      {
        id: 'research',
        name: 'Research',
        children: []
      }
    ]
  }
];

export const getFolderContents = async (folderId) => {
  try {
    if (useMockData) {
      // Return mock data
      return mockFolderContents[folderId] || [];
    }
    
    // Return data from Firebase
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
    if (useMockData) {
      return mockFolderContents[folderId] || [];
    }
    throw error;
  }
};

export const getFolderStructure = async () => {
  try {
    if (useMockData) {
      // Return mock data
      return mockFolderStructure;
    }
    
    // Return data from Firebase
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
    if (useMockData) {
      return mockFolderStructure;
    }
    throw error;
  }
};

// Authentication functions
export const loginUser = async (email, password) => {
  try {
    if (useMockData) {
      // Return mock user
      return { uid: '123456', email, displayName: 'Mock User' };
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error);
    if (useMockData) {
      return { uid: '123456', email, displayName: 'Mock User' };
    }
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    if (!useMockData) {
      await signOut(auth);
    }
    return true;
  } catch (error) {
    console.error("Error logging out:", error);
    if (useMockData) {
      return true;
    }
    throw error;
  }
};

export const getCurrentUser = () => {
  if (useMockData) {
    // Return mock user
    return Promise.resolve({ uid: '123456', email: 'user@example.com', displayName: 'Mock User' });
  }
  
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// Export Firebase instances (conditionally initialized)
export { db, auth, storage };
export default app; // app might be null if useMockData is true