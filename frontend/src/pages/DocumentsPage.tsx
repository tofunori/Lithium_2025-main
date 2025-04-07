import React, { useState, useEffect, ChangeEvent, FormEvent, MouseEvent } from 'react';
// Removed FolderNode, DocItem, StorageFileData from this import
import { getFolderStructure, getFolderContents, getStorageFiles } from '../firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, getFirestore, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, getStorage, StorageReference } from 'firebase/storage';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext.jsx is renamed or doesn't need extension
import { User } from 'firebase/auth'; // Import User type
import './DocumentsPage.css';
// Define interfaces locally as they are not exported from firebase.ts
interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  children?: FolderNode[];
  // Add other properties if used, e.g., createdAt
  createdAt?: Timestamp | Date;
  type: 'folder'; // Explicitly type folders
  url?: string; // Folders don't have URLs typically
  size?: number; // Folders don't have sizes typically
}

interface DocItemBase {
    id: string;
    name: string;
    parentId: string;
    createdAt?: Timestamp | Date; // Make optional or ensure it's always present
    url?: string; // Optional for folders/links
    size?: number; // Optional for folders/links
    contentType?: string; // Optional for folders/links
}

interface DocItemFolder extends DocItemBase {
    type: 'folder';
    children?: DocItem[]; // Folders can have children (though FolderNode is used for tree structure)
}

interface DocItemFile extends DocItemBase {
    type: 'file';
    url: string; // Files should have a URL
    size: number; // Files should have a size
    contentType: string; // Files should have a content type
}

interface DocItemLink extends DocItemBase {
    type: 'link';
    url: string; // Links must have a URL
}

// Union type for items within a folder's content list
type DocItem = DocItemFolder | DocItemFile | DocItemLink;

// Interface for data returned by getStorageFiles (adjust based on actual return type)
interface StorageFileData {
    name: string;
    fullPath: string;
    // Add other properties returned by getStorageFiles if needed
}


// Interface for expanded folders state
interface ExpandedFoldersState {
  [key: string]: boolean;
}

// Interface for dynamic URLs state
interface DynamicUrlsState {
    [key: string]: string;
}


const DocumentsPage: React.FC = () => {
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [folderHistory, setFolderHistory] = useState<string[]>(['root']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [folderStructure, setFolderStructure] = useState<FolderNode[]>([]);
  const [currentFolderContents, setCurrentFolderContents] = useState<DocItem[]>([]);
  const [storageFiles, setStorageFiles] = useState<StorageFileData[]>([]); // Use imported type
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [showNewFolderForm, setShowNewFolderForm] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { currentUser }: { currentUser: User | null } = useAuth(); // Type currentUser
  const [showAddLinkForm, setShowAddLinkForm] = useState<boolean>(false);
  const [newLinkName, setNewLinkName] = useState<string>('');
  const [newLinkUrl, setNewLinkUrl] = useState<string>('');
  const [dynamicUrls, setDynamicUrls] = useState<DynamicUrlsState>({}); // State to store dynamically fetched URLs

  const db = getFirestore();
  const storage = getStorage();

  // State for expanded folders in the tree view
  const [expandedFolders, setExpandedFolders] = useState<ExpandedFoldersState>({});

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);

        // Fetch folder structure
        let folderStructureData: FolderNode[] = await getFolderStructure();

        // If no folders exist, create sample folders
        if (folderStructureData.length === 0) {
          console.log("No folders found, creating sample folders...");
          await createSampleFolders();
          folderStructureData = await getFolderStructure();
          console.log("After creating sample folders, structure:", folderStructureData);
        }

        setFolderStructure(folderStructureData);
        console.log("Folder structure set in state:", folderStructureData);

        // Set all folders as expanded by default
        const expanded: ExpandedFoldersState = {};
        const setAllExpanded = (nodes: FolderNode[]): void => {
          nodes.forEach(node => {
            expanded[node.id] = true;
            if (node.children && node.children.length > 0) {
              setAllExpanded(node.children);
            }
          });
        };
        setAllExpanded(folderStructureData);
        setExpandedFolders(expanded);

        // Fetch root folder contents
        await updateCurrentFolderContents('root');

        // Fetch Storage files
        const filesFromStorage: StorageFileData[] = await getStorageFiles('documents');
        setStorageFiles(filesFromStorage);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching document data:", error);
        setLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create sample folders for demonstration
  const createSampleFolders = async (): Promise<void> => {
    console.log("Creating sample folders...");
    try {
      // Create main folders
      const documentsFolder = await addDoc(collection(db, 'doc_items'), {
        name: 'Documents',
        type: 'folder',
        parentId: 'root',
        createdAt: Timestamp.now() // Use Timestamp
      });

      const imagesFolder = await addDoc(collection(db, 'doc_items'), {
        name: 'Images',
        type: 'folder',
        parentId: 'root',
        createdAt: Timestamp.now()
      });

      const reportsFolder = await addDoc(collection(db, 'doc_items'), {
        name: 'Reports',
        type: 'folder',
        parentId: 'root',
        createdAt: Timestamp.now()
      });

      // Create subfolders
      await addDoc(collection(db, 'doc_items'), {
        name: 'Contracts',
        type: 'folder',
        parentId: documentsFolder.id,
        createdAt: Timestamp.now()
      });

      await addDoc(collection(db, 'doc_items'), {
        name: 'Manuals',
        type: 'folder',
        parentId: documentsFolder.id,
        createdAt: Timestamp.now()
      });

      await addDoc(collection(db, 'doc_items'), {
        name: 'Facility Photos',
        type: 'folder',
        parentId: imagesFolder.id,
        createdAt: Timestamp.now()
      });

      await addDoc(collection(db, 'doc_items'), {
        name: 'Monthly Reports',
        type: 'folder',
        parentId: reportsFolder.id,
        createdAt: Timestamp.now()
      });

      await addDoc(collection(db, 'doc_items'), {
        name: 'Annual Reports',
        type: 'folder',
        parentId: reportsFolder.id,
        createdAt: Timestamp.now()
      });

      console.log('Sample folders created successfully');
    } catch (error) {
      console.error('Error creating sample folders:', error);
    }
  };

  const updateCurrentFolderContents = async (folderId: string): Promise<DocItem[]> => {
    console.log("Updating folder contents for folder ID:", folderId);
    try {
      // Fetch folder contents from Firebase
      const contents: DocItem[] = await getFolderContents(folderId);

      // Apply search filter if needed
      const filteredContents = searchTerm
        ? contents.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : contents;

      console.log("Folder contents fetched:", filteredContents);

      setCurrentFolderContents(filteredContents);
      return contents; // Return fetched contents
    } catch (error) {
      console.error("Error fetching folder contents:", error);
      setCurrentFolderContents([]);
      return []; // Return empty array on error
    }
  };

  const navigateToFolder = async (folderId: string, folderName: string): Promise<void> => { // Added folderName parameter type
    try {
      // Update current folder
      setCurrentFolder(folderId);

      // Update folder contents
      await updateCurrentFolderContents(folderId);

      // Update history
      if (historyIndex < folderHistory.length - 1) {
        // If we navigated back and then to a new location, truncate the forward history
        const newHistory = folderHistory.slice(0, historyIndex + 1);
        setFolderHistory([...newHistory, folderId]);
        setHistoryIndex(newHistory.length);
      } else {
        setFolderHistory([...folderHistory, folderId]);
        setHistoryIndex(folderHistory.length);
      }
    } catch (error) {
      console.error("Error navigating to folder:", error);
    }
  };

  const handleNavBack = async (): Promise<void> => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousFolder = folderHistory[newIndex];

      setHistoryIndex(newIndex);
      setCurrentFolder(previousFolder);
      await updateCurrentFolderContents(previousFolder);
    }
  };

  const handleNavForward = async (): Promise<void> => {
    if (historyIndex < folderHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const nextFolder = folderHistory[newIndex];

      setHistoryIndex(newIndex);
      setCurrentFolder(nextFolder);
      await updateCurrentFolderContents(nextFolder);
    }
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
    updateCurrentFolderContents(currentFolder); // Refetch with new search term
  };

  const handleCreateFolder = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!newFolderName.trim()) {
      alert("Please enter a folder name");
      return;
    }

    try {
      // Add new folder to Firestore
      const folderData = {
        name: newFolderName.trim(),
        type: 'folder',
        parentId: currentFolder,
        createdAt: Timestamp.now() // Use Timestamp
      };

      await addDoc(collection(db, 'doc_items'), folderData);

      // Reset form
      setNewFolderName('');
      setShowNewFolderForm(false);

      // Refresh folder structure and current folder contents
      const folderStructureData = await getFolderStructure();
      setFolderStructure(folderStructureData);
      await updateCurrentFolderContents(currentFolder);

    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Failed to create folder. Please try again.");
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    setSelectedFile(file);

    try {
      // Create a reference to the file in Firebase Storage
      const storageRef: StorageReference = ref(storage, `documents/${file.name}`); // Type storageRef

      // Upload the file
      const uploadTask = uploadBytes(storageRef, file);

      // Monitor upload progress (simplified version)
      setUploadProgress(50); // Consider using onTaskStateChanged for real progress

      // Wait for upload to complete
      await uploadTask;
      setUploadProgress(100);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Add file metadata to Firestore
      const fileData = {
        name: file.name,
        type: 'file',
        parentId: currentFolder,
        size: file.size,
        contentType: file.type,
        url: downloadURL,
        createdAt: Timestamp.now() // Use Timestamp
      };

      await addDoc(collection(db, 'doc_items'), fileData);

      // Refresh folder contents
      await updateCurrentFolderContents(currentFolder);

      // Reset state
      setSelectedFile(null);
      setUploadProgress(0);
      e.target.value = ''; // Clear the file input

      // Refresh Storage files list (optional, depends if needed immediately)
      // const filesFromStorage = await getStorageFiles('documents');
      // setStorageFiles(filesFromStorage);

    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
      setSelectedFile(null);
      setUploadProgress(0);
      if (e.target) e.target.value = ''; // Clear input on error too
    }
  };


  const handleAddLink = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!newLinkName.trim() || !newLinkUrl.trim()) {
      alert("Please enter both a name and a valid URL for the link.");
      return;
    }

    // Basic URL validation (can be improved)
    try {
      new URL(newLinkUrl);
    } catch (_) {
      alert("Please enter a valid URL (e.g., https://example.com).");
      return;
    }

    try {
      // Add new link to Firestore
      const linkData = {
        name: newLinkName.trim(),
        url: newLinkUrl.trim(),
        type: 'link',
        parentId: currentFolder,
        createdAt: Timestamp.now(), // Use Timestamp
        // Optionally add createdBy if user info is available and needed
        // createdBy: currentUser ? currentUser.uid : null
      };

      await addDoc(collection(db, 'doc_items'), linkData);

      // Reset form
      setNewLinkName('');
      setNewLinkUrl('');
      setShowAddLinkForm(false);

      // Refresh current folder contents
      await updateCurrentFolderContents(currentFolder);

    } catch (error) {
      console.error("Error adding link:", error);
      alert("Failed to add link. Please try again.");
    }
  };

  const handleDeleteItem = async (item: DocItem): Promise<void> => {
    // Confirmation dialog
    const itemType = item.type === 'folder' ? 'folder' : item.type === 'link' ? 'link' : 'file';
    if (!confirm(`Are you sure you want to delete the ${itemType} "${item.name}"? ${item.type === 'folder' ? 'This will delete all its contents.' : ''}`)) {
        return;
    }

    try {
      console.log("Deleting item:", item);

      // If it's a folder, we need to recursively delete all its contents
      if (item.type === 'folder') {
        await deleteFolder(item.id);
      } else {
        // Delete a single file or link from Firestore
        await deleteDoc(doc(db, 'doc_items', item.id));

        // If it's a file, also delete from Storage
        if (item.type === 'file' && item.url) {
          try {
            // Construct the storage path from the URL (this might need adjustment based on URL format)
            // Assuming URL is like https://firebasestorage.googleapis.com/v0/b/your-bucket/o/documents%2Ffilename.ext?alt=media...
            // A more robust way is to store the storage path alongside the URL in Firestore
            const path = decodeURIComponent(item.url.split('/o/')[1].split('?')[0]);
            const fileRef: StorageReference = ref(storage, path); // Type storageRef
            await deleteObject(fileRef);
            console.log(`Deleted file from Storage: ${item.name}`);
          } catch (storageError: any) {
             // Check if the error is 'object-not-found'
             if (storageError.code === 'storage/object-not-found') {
                console.warn(`File not found in Storage (may have been deleted already): ${item.name}`);
            } else {
                console.error("Error deleting file from Storage:", storageError);
                // Decide if you want to alert the user or just log
                // alert(`Failed to delete file "${item.name}" from storage. It has been removed from the list, but might still exist in storage.`);
            }
          }
        }
      }

      // Refresh folder contents
      await updateCurrentFolderContents(currentFolder);

      // Refresh folder structure if a folder was deleted
      if (item.type === 'folder') {
        const folderStructureData = await getFolderStructure();
        setFolderStructure(folderStructureData);
      }

      // If we deleted the current folder, navigate to its parent
      if (item.type === 'folder' && item.id === currentFolder) {
        const parentFolderId = item.parentId || 'root';
        // Find parent name (optional, could just navigate)
        let parentName = 'Parent Folder'; // Default
        const findParent = (nodes: FolderNode[], id: string): FolderNode | null => {
            for (const node of nodes) {
                if (node.id === id) return node;
                if (node.children) {
                    const found = findParent(node.children, id);
                    if (found) return found;
                }
            }
            return null;
        };
        const parentNode = findParent(folderStructure, parentFolderId);
        if (parentNode) parentName = parentNode.name;

        navigateToFolder(parentFolderId, parentName);
      }

    } catch (error) {
      console.error("Error deleting item:", error);
      alert(`Failed to delete ${itemType}. Please try again.`);
    }
  };

  // Helper function to recursively delete a folder and all its contents
  const deleteFolder = async (folderId: string): Promise<void> => {
    console.log("Deleting folder with ID:", folderId);

    try {
      // Get all items in the folder
      const docItemsCollection = collection(db, 'doc_items');
      const contentsQuery = query(docItemsCollection, where("parentId", "==", folderId));
      const contentsSnapshot = await getDocs(contentsQuery);

      console.log(`Found ${contentsSnapshot.docs.length} items in folder ${folderId}`);

      // Delete each item in the folder
      for (const docSnapshot of contentsSnapshot.docs) {
        // Use 'any' for itemData temporarily to resolve complex type assignment issue,
        // as subsequent checks handle the specific types (folder, file, link).
        const itemData = docSnapshot.data() as any; // Use any here
        const item = { id: docSnapshot.id, ...itemData }; // Let item type be inferred for now

        console.log(`Processing item in folder: ${item.name} (${item.type})`);

        // If it's a subfolder, recursively delete it
        if (item.type === 'folder') {
          await deleteFolder(item.id);
        } else if (item.type === 'file' && item.url) {
          // If it's a file, delete it from Storage
          try {
             // Construct the storage path from the URL (same potential issue as above)
             const path = decodeURIComponent(item.url.split('/o/')[1].split('?')[0]);
             const fileRef: StorageReference = ref(storage, path); // Type storageRef
             await deleteObject(fileRef);
             console.log(`Deleted file from Storage: ${item.name}`);
          } catch (storageError: any) {
             if (storageError.code === 'storage/object-not-found') {
                console.warn(`File not found in Storage during folder delete: ${item.name}`);
            } else {
                console.error(`Error deleting file ${item.name} from Storage during folder delete:`, storageError);
                // Decide if you want to throw or continue
            }
          }
        }

        // Delete the item from Firestore
        await deleteDoc(doc(db, 'doc_items', item.id));
        console.log(`Deleted item from Firestore: ${item.name}`);
      }

      // Finally, delete the folder itself
      await deleteDoc(doc(db, 'doc_items', folderId));
      console.log(`Deleted folder with ID: ${folderId}`);
    } catch (error) {
      console.error(`Error in deleteFolder for folder ID ${folderId}:`, error);
      throw error; // Re-throw to be handled by the caller
    }
  };

  // Toggle folder expansion in the tree view
  const toggleFolderExpansion = (folderId: string, e: MouseEvent<HTMLElement>): void => {
    e.stopPropagation(); // Prevent navigation when clicking the chevron
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Function to render the folder tree in Windows Explorer style
  const renderFolderTree = (nodes: FolderNode[]): JSX.Element | JSX.Element[] => {
    // console.log("Rendering folder tree with nodes:", nodes); // Reduce console noise

    if (!nodes || nodes.length === 0) {
      return <div className="text-muted p-2 small">No folders created yet.</div>;
    }

    return nodes.map((node) => (
      <div key={node.id} className="tree-node">
        <div
          className={`explorer-tree-node d-flex align-items-center ${currentFolder === node.id ? 'active' : ''}`}
          style={{ paddingLeft: '8px', cursor: 'pointer' }} // Add cursor pointer
          onClick={() => navigateToFolder(node.id, node.name)} // Click anywhere on the row to navigate
        >
          {/* Chevron and Folder Icon */}
          <div className="d-flex align-items-center flex-grow-1">
            {node.children && node.children.length > 0 ? (
              <i
                className={`fas ${expandedFolders[node.id] ? 'fa-chevron-down' : 'fa-chevron-right'} me-1`}
                onClick={(e) => toggleFolderExpansion(node.id, e)} // Click only chevron to expand/collapse
                style={{ width: '16px', fontSize: '0.7rem', color: '#6c757d', cursor: 'pointer' }} // Ensure chevron is clickable
              ></i>
            ) : (
              <span style={{ width: '16px', display: 'inline-block' }} className="me-1"></span> // Placeholder for alignment
            )}
            <i className={`fas fa-folder${currentFolder === node.id ? '-open' : ''} explorer-folder-icon me-1`}></i>
            <span className="folder-name text-truncate">{node.name}</span>
          </div>
          {/* Delete Button */}
          {currentUser && (
            <button
              className="btn btn-sm btn-link text-danger p-0 ms-auto tree-delete-btn"
              onClick={(e) => {
                e.stopPropagation(); // Prevent navigation when clicking delete
                handleDeleteItem(node as DocItem); // Cast node to DocItem for deletion
              }}
              title="Delete folder"
              style={{ visibility: 'hidden' }} // Initially hidden
            >
              <i className="fas fa-trash-alt fa-xs"></i>
            </button>
          )}
        </div>
        {/* Render Children */}
        {node.children && node.children.length > 0 && expandedFolders[node.id] && (
          <div style={{ paddingLeft: '20px', borderLeft: '1px solid #eee', marginLeft: '15px' }}>
            {renderFolderTree(node.children)}
          </div>
        )}
      </div>
    ));
  };


  // Function to get appropriate file icon
  const getFileIcon = (type: string, name: string): JSX.Element => {
    if (type === 'folder') {
      return <i className="fas fa-folder me-2 text-warning"></i>;
    }
    if (type === 'link') {
        return <i className="fas fa-link me-2 text-info"></i>;
    }

    const ext = name.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf':
        return <i className="fas fa-file-pdf me-2 text-danger"></i>;
      case 'doc':
      case 'docx':
        return <i className="fas fa-file-word me-2 text-primary"></i>;
      case 'xls':
      case 'xlsx':
        return <i className="fas fa-file-excel me-2 text-success"></i>;
      case 'ppt':
      case 'pptx':
        return <i className="fas fa-file-powerpoint me-2 text-warning"></i>;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return <i className="fas fa-file-image me-2 text-info"></i>;
      case 'zip':
      case 'rar':
      case '7z':
        return <i className="fas fa-file-archive me-2 text-secondary"></i>;
      case 'txt':
         return <i className="fas fa-file-alt me-2 text-muted"></i>;
      default:
        return <i className="fas fa-file me-2 text-secondary"></i>;
    }
  };

  // Function to get the name of the current folder
  const getCurrentFolderName = (): string => {
    if (currentFolder === 'root') {
      return 'Documents'; // Or 'Root' or '/'
    }
    const findFolderName = (nodes: FolderNode[], id: string): string | null => {
      for (const node of nodes) {
        if (node.id === id) {
          return node.name;
        }
        if (node.children) {
          const foundName = findFolderName(node.children, id);
          if (foundName) {
            return foundName;
          }
        }
      }
      return null;
    };
    return findFolderName(folderStructure, currentFolder) || 'Unknown Folder';
  };

  // Utility function to format file size
  const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Utility function to format date (handle Firestore Timestamp)
  const formatDate = (dateValue: Timestamp | Date | undefined | null): string => {
    if (!dateValue) return '-';
    let date: Date;
    if (dateValue instanceof Timestamp) {
      date = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
        return '-'; // Or handle other potential types/invalid input
    }
    // Use toLocaleDateString for user-friendly format
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    // return date.toISOString().split('T')[0]; // Alternative ISO format YYYY-MM-DD
  };


  return (
    <div className="container-fluid mt-4 fade-in">
      <div className="row">
        {/* Left Panel: Folder Tree */}
        <div className="col-md-3 mb-3 mb-md-0">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Folders</h6>
              {/* Optional: Add button to collapse/expand all */}
            </div>
            <div className="card-body p-0" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
              {/* Root Node */}
              <div
                className={`explorer-tree-node d-flex align-items-center p-2 ${currentFolder === 'root' ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => navigateToFolder('root', 'Documents')}
              >
                 <i className={`fas fa-folder${currentFolder === 'root' ? '-open' : ''} explorer-folder-icon me-1`}></i>
                 <span className="folder-name fw-bold">Documents</span>
              </div>
              {/* Render Tree */}
              <div style={{ paddingLeft: '20px' }}>
                {loading ? (
                  <div className="p-2 text-center"><i className="fas fa-spinner fa-spin"></i> Loading...</div>
                ) : (
                  renderFolderTree(folderStructure)
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Folder Contents */}
        <div className="col-md-9">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <div className="d-flex justify-content-between align-items-center flex-wrap">
                {/* Breadcrumbs/Navigation */}
                <div className="d-flex align-items-center mb-2 mb-md-0">
                  <button
                    className="btn btn-sm btn-outline-secondary me-1"
                    onClick={handleNavBack}
                    disabled={historyIndex === 0}
                    title="Back"
                  >
                    <i className="fas fa-arrow-left"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary me-2"
                    onClick={handleNavForward}
                    disabled={historyIndex === folderHistory.length - 1}
                    title="Forward"
                  >
                    <i className="fas fa-arrow-right"></i>
                  </button>
                  <h5 className="mb-0 text-truncate" style={{ maxWidth: '300px' }}>{getCurrentFolderName()}</h5>
                </div>

                {/* Search and Actions */}
                <div className="d-flex align-items-center">
                  <input
                    type="text"
                    className="form-control form-control-sm me-2"
                    placeholder="Search current folder..."
                    value={searchTerm}
                    onChange={handleSearch}
                    style={{ maxWidth: '200px' }}
                  />
                  {currentUser && (
                    <div className="btn-group">
                       {/* Add Link Button */}
                       <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setShowAddLinkForm(!showAddLinkForm)}
                        title="Add Link"
                      >
                        <i className="fas fa-link"></i> <span className="d-none d-sm-inline">Add Link</span>
                      </button>
                      {/* New Folder Button */}
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => setShowNewFolderForm(!showNewFolderForm)}
                        title="New Folder"
                      >
                        <i className="fas fa-folder-plus"></i> <span className="d-none d-sm-inline">New Folder</span>
                      </button>
                      {/* Upload File Button */}
                      <label className="btn btn-sm btn-outline-secondary" title="Upload File">
                        <input type="file" className="d-none" onChange={handleFileUpload} />
                        <i className="fas fa-upload"></i> <span className="d-none d-sm-inline">Upload</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* New Folder Form */}
              {showNewFolderForm && currentUser && (
                <form onSubmit={handleCreateFolder} className="mt-2 p-2 border rounded bg-white">
                  <div className="input-group input-group-sm">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="New folder name"
                      value={newFolderName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value)}
                      required
                      autoFocus
                    />
                    <button type="submit" className="btn btn-success">Create</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowNewFolderForm(false)}>Cancel</button>
                  </div>
                </form>
              )}

               {/* Add Link Form */}
              {showAddLinkForm && currentUser && (
                <form onSubmit={handleAddLink} className="mt-2 p-2 border rounded bg-white">
                  <div className="input-group input-group-sm mb-1">
                     <span className="input-group-text" style={{width: '60px'}}>Name</span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Link Name"
                      value={newLinkName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNewLinkName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                   <div className="input-group input-group-sm">
                     <span className="input-group-text" style={{width: '60px'}}>URL</span>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://example.com"
                      value={newLinkUrl}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNewLinkUrl(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-primary">Add</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddLinkForm(false)}>Cancel</button>
                  </div>
                </form>
              )}

              {/* Upload Progress */}
              {selectedFile && (
                <div className="mt-2">
                  <div className="progress" style={{ height: '5px' }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${uploadProgress}%` }}
                      aria-valuenow={uploadProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    ></div>
                  </div>
                  <small className="text-muted">Uploading: {selectedFile.name} ({formatBytes(selectedFile.size)})</small>
                </div>
              )}
            </div>

            {/* File List Table */}
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center p-5"><i className="fas fa-spinner fa-spin fa-2x"></i></div>
              ) : currentFolderContents.length === 0 ? (
                <div className="text-center p-5 text-muted">
                  {searchTerm ? `No items found matching "${searchTerm}".` : 'This folder is empty.'}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 document-table">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" className="px-3">Name</th>
                        <th scope="col">Type</th>
                        <th scope="col">Size</th>
                        <th scope="col">Date Modified</th>
                        <th scope="col" className="text-end pe-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentFolderContents.map((item) => {
                        const itemDate = item.createdAt; // Assuming createdAt is the date to display
                        return (
                          <tr key={item.id} className={item.type === 'folder' ? 'table-row-folder' : ''}>
                            <td className="px-3">
                              <div
                                className="d-flex align-items-center"
                                style={{ cursor: item.type === 'folder' ? 'pointer' : 'default' }}
                                onClick={() => item.type === 'folder' && navigateToFolder(item.id, item.name)}
                              >
                                {getFileIcon(item.type, item.name)}
                                {item.type === 'file' || item.type === 'link' ? (
                                  <a
                                    href={item.url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-decoration-none text-dark text-truncate"
                                    title={item.name}
                                    style={{ maxWidth: '350px', display: 'inline-block' }}
                                    onClick={(e) => { if (!item.url) e.preventDefault(); }} // Prevent click if no URL
                                  >
                                    {item.name}
                                  </a>
                                ) : (
                                  <span className="text-truncate" title={item.name} style={{ maxWidth: '350px', display: 'inline-block' }}>
                                    {item.name}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                                <span className="badge bg-light text-dark border">
                                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                </span>
                            </td>
                            <td>{item.type === 'file' && item.size ? formatBytes(item.size) : '-'}</td>
                            <td>{formatDate(itemDate)}</td>
                            <td className="text-end pe-3">
                              {currentUser && (
                                <button
                                  className="btn btn-sm btn-link text-danger p-0 action-btn"
                                  onClick={() => handleDeleteItem(item)}
                                  title={`Delete ${item.type}`}
                                >
                                  <i className="fas fa-trash-alt fa-sm"></i>
                                </button>
                              )}
                              {/* Add other actions like rename, move, download here */}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentsPage;