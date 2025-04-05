# Lithium Battery Recycling Dashboard - React Frontend

This is the React frontend for the Lithium Battery Recycling Dashboard. It provides an interactive interface for viewing information about lithium battery recycling facilities across North America.

## Features

- Interactive map of recycling facilities
- Facilities list with filtering and search
- Charts and statistics
- Document management system
- About page with project information

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Firebase project

### Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies

```bash
cd frontend
npm install
```

### Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Firestore Database, Authentication, and Storage
3. Create a web app in your Firebase project
4. Copy your Firebase configuration (available in Project Settings > General > Your Apps > Firebase SDK snippet > Config)
5. Update the `firebaseConfig` object in `src/firebase.js` with your configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Firestore Database Structure

Set up your Firestore database with the following collections:

#### Facilities Collection

Each document represents a recycling facility:

```
facilities/
  {facility_id}/
    company: string
    location: string
    region: string
    volume: number
    method: string
    status: string (operating, construction, planned, pilot)
    latitude: number
    longitude: number
    description: string
    yearEstablished: number
```

#### Folders Collection

Each document represents a folder in the document management system:

```
folders/
  {folder_id}/
    name: string
    parentId: string (reference to parent folder, null for root folders)
    facilityId: string (optional, if folder is specific to a facility)
    createdAt: timestamp
    updatedAt: timestamp
```

#### Files Collection

Each document represents a file in the document management system:

```
files/
  {file_id}/
    name: string
    folderId: string (reference to parent folder)
    size: string
    type: string
    url: string (Storage URL)
    createdAt: timestamp
    updatedAt: timestamp
```

#### Links Collection

Each document represents an external link in the document management system:

```
links/
  {link_id}/
    name: string
    folderId: string (reference to parent folder)
    url: string (external URL)
    createdAt: timestamp
    updatedAt: timestamp
```

### Firebase Storage Structure

Organize your Storage with the following structure:

```
files/
  {facility_id}/
    {file_id}.{extension}
```

### Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

## Firebase Service Functions

The `firebase.js` file provides several functions for interacting with Firebase:

### Facilities

- `getFacilities()` - Get all facilities
- `getFacilityById(facilityId)` - Get a specific facility by ID
- `getFacilitiesByStatus(status)` - Get facilities filtered by status
- `getFacilityStats()` - Get statistics about facilities

### Document Management

- `getFolderContents(folderId)` - Get contents of a folder
- `getFolderStructure()` - Get the entire folder structure

### Authentication

- `loginUser(email, password)` - Log in a user
- `logoutUser()` - Log out the current user
- `getCurrentUser()` - Get the currently authenticated user

## Customizing Firebase Integration

You can extend the Firebase integration by adding more functions to the `firebase.js` file. For example:

### Adding a New Facility

```javascript
export const addFacility = async (facilityData) => {
  try {
    const facilitiesCollection = collection(db, 'facilities');
    const docRef = await addDoc(facilitiesCollection, {
      ...facilityData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding facility:", error);
    throw error;
  }
};
```

### Updating a Facility

```javascript
export const updateFacility = async (facilityId, facilityData) => {
  try {
    const facilityRef = doc(db, 'facilities', facilityId);
    await updateDoc(facilityRef, {
      ...facilityData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating facility:", error);
    throw error;
  }
};
```

### Uploading a File

```javascript
export const uploadFile = async (file, folderId, facilityId) => {
  try {
    const fileId = uuidv4();
    const storageRef = ref(storage, `files/${facilityId}/${fileId}`);
    
    // Upload file to Storage
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Add file metadata to Firestore
    const filesCollection = collection(db, 'files');
    await addDoc(filesCollection, {
      name: file.name,
      folderId,
      facilityId,
      size: formatFileSize(file.size),
      type: 'file',
      url: downloadURL,
      createdAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
```

## License

This project is licensed under the MIT License.
