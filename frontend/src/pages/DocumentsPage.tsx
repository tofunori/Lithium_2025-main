import React, { useState, useEffect } from 'react';
import { getFolderStructure, getFolderContents, getStorageFiles } from '../firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, getFirestore, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, getStorage } from 'firebase/storage';
import { useAuth } from '../context/AuthContext.jsx'; // Import useAuth
import './DocumentsPage.css';

function DocumentsPage() {
  const [currentFolder, setCurrentFolder] = useState('root');
  const [folderHistory, setFolderHistory] = useState(['root']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [folderStructure, setFolderStructure] = useState([]);
  const [currentFolderContents, setCurrentFolderContents] = useState([]);
  const [storageFiles, setStorageFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { currentUser } = useAuth(); // Get user from auth context
  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [dynamicUrls, setDynamicUrls] = useState({}); // State to store dynamically fetched URLs
  
  const db = getFirestore();
  const storage = getStorage();

  // State for expanded folders in the tree view
  const [expandedFolders, setExpandedFolders] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch folder structure
        let folderStructureData = await getFolderStructure();
        
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
        const expanded = {};
        const setAllExpanded = (nodes) => {
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
        const filesFromStorage = await getStorageFiles('documents');
        setStorageFiles(filesFromStorage);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching document data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Create sample folders for demonstration
  const createSampleFolders = async () => {
    console.log("Creating sample folders...");
    try {
      // Create main folders
      const documentsFolder = await addDoc(collection(db, 'doc_items'), {
        name: 'Documents',
        type: 'folder',
        parentId: 'root',
        createdAt: new Date()
      });
      
      const imagesFolder = await addDoc(collection(db, 'doc_items'), {
        name: 'Images',
        type: 'folder',
        parentId: 'root',
        createdAt: new Date()
      });
      
      const reportsFolder = await addDoc(collection(db, 'doc_items'), {
        name: 'Reports',
        type: 'folder',
        parentId: 'root',
        createdAt: new Date()
      });
      
      // Create subfolders
      await addDoc(collection(db, 'doc_items'), {
        name: 'Contracts',
        type: 'folder',
        parentId: documentsFolder.id,
        createdAt: new Date()
      });
      
      await addDoc(collection(db, 'doc_items'), {
        name: 'Manuals',
        type: 'folder',
        parentId: documentsFolder.id,
        createdAt: new Date()
      });
      
      await addDoc(collection(db, 'doc_items'), {
        name: 'Facility Photos',
        type: 'folder',
        parentId: imagesFolder.id,
        createdAt: new Date()
      });
      
      await addDoc(collection(db, 'doc_items'), {
        name: 'Monthly Reports',
        type: 'folder',
        parentId: reportsFolder.id,
        createdAt: new Date()
      });
      
      await addDoc(collection(db, 'doc_items'), {
        name: 'Annual Reports',
        type: 'folder',
        parentId: reportsFolder.id,
        createdAt: new Date()
      });
      
      console.log('Sample folders created successfully');
    } catch (error) {
      console.error('Error creating sample folders:', error);
    }
  };

  const updateCurrentFolderContents = async (folderId) => {
    console.log("Updating folder contents for folder ID:", folderId);
    try {
      // Fetch folder contents from Firebase
      const contents = await getFolderContents(folderId);
      
      // Apply search filter if needed
      const filteredContents = searchTerm
        ? contents.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : contents;
      
      console.log("Folder contents fetched:", filteredContents);
      
      setCurrentFolderContents(filteredContents);
      return contents;
    } catch (error) {
      console.error("Error fetching folder contents:", error);
      setCurrentFolderContents([]);
      return [];
    }
  };

  const navigateToFolder = async (folderId, folderName) => {
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

  const handleNavBack = async () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousFolder = folderHistory[newIndex];
      
      setHistoryIndex(newIndex);
      setCurrentFolder(previousFolder);
      await updateCurrentFolderContents(previousFolder);
    }
  };

  const handleNavForward = async () => {
    if (historyIndex < folderHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const nextFolder = folderHistory[newIndex];
      
      setHistoryIndex(newIndex);
      setCurrentFolder(nextFolder);
      await updateCurrentFolderContents(nextFolder);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    updateCurrentFolderContents(currentFolder);
  };

  const handleCreateFolder = async (e) => {
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
        createdAt: new Date()
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

  const handleFileUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    setSelectedFile(file);
    
    try {
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, `documents/${file.name}`);
      
      // Upload the file
      const uploadTask = uploadBytes(storageRef, file);
      
      // Monitor upload progress (simplified version)
      setUploadProgress(50);
      
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
        createdAt: new Date()
      };
      
      await addDoc(collection(db, 'doc_items'), fileData);
      
      // Refresh folder contents
      await updateCurrentFolderContents(currentFolder);
      
      // Reset state
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Refresh Storage files
      const filesFromStorage = await getStorageFiles('documents');
      setStorageFiles(filesFromStorage);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
      setSelectedFile(null);
      setUploadProgress(0);
    }
  };


  const handleAddLink = async (e) => {
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
        createdAt: new Date(),
        // Optionally add createdBy if user info is available and needed
        // createdBy: user ? user.uid : null 
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

  const handleDeleteItem = async (item) => {
    // Single confirmation dialog for folder deletion
    if (item.type === 'folder') {
      if (!confirm(`Delete folder "${item.name}"?`)) {
        return;
      }
    }
    
    try {
      console.log("Deleting item:", item);
      
      // If it's a folder, we need to recursively delete all its contents
      if (item.type === 'folder') {
        await deleteFolder(item.id);
      } else {
        // Delete a single file
        await deleteDoc(doc(db, 'doc_items', item.id));
        
        // If it's a file, also delete from Storage
        if (item.url) {
          try {
            const fileRef = ref(storage, item.url);
            await deleteObject(fileRef);
          } catch (storageError) {
            console.error("Error deleting file from Storage:", storageError);
            // Continue anyway since we've already deleted from Firestore
          }
        }
      }
      
      // Refresh folder contents
      await updateCurrentFolderContents(currentFolder);
      
      // Refresh folder structure
      const folderStructureData = await getFolderStructure();
      setFolderStructure(folderStructureData);
      
      // If we deleted the current folder, navigate to its parent
      if (item.type === 'folder' && item.id === currentFolder) {
        const parentFolder = item.parentId || 'root';
        navigateToFolder(parentFolder, 'Parent Folder');
      }
      
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };
  
  // Helper function to recursively delete a folder and all its contents
  const deleteFolder = async (folderId) => {
    console.log("Deleting folder with ID:", folderId);
    
    try {
      // Get all items in the folder
      const docItemsCollection = collection(db, 'doc_items');
      const contentsQuery = query(docItemsCollection, where("parentId", "==", folderId));
      const contentsSnapshot = await getDocs(contentsQuery);
      
      console.log(`Found ${contentsSnapshot.docs.length} items in folder ${folderId}`);
      
      // Delete each item in the folder
      for (const docSnapshot of contentsSnapshot.docs) {
        const item = { id: docSnapshot.id, ...docSnapshot.data() };
        console.log(`Processing item in folder: ${item.name} (${item.type})`);
        
        // If it's a subfolder, recursively delete it
        if (item.type === 'folder') {
          await deleteFolder(item.id);
        } else if (item.type === 'file' && item.url) {
          // If it's a file, delete it from Storage
          try {
            const fileRef = ref(storage, item.url);
            await deleteObject(fileRef);
            console.log(`Deleted file from Storage: ${item.name}`);
          } catch (storageError) {
            console.error(`Error deleting file ${item.name} from Storage:`, storageError);
            // Continue anyway
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
  const toggleFolderExpansion = (folderId, e) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Function to render the folder tree in Windows Explorer style
  const renderFolderTree = (nodes) => {
    console.log("Rendering folder tree with nodes:", nodes);
    
    if (!nodes || nodes.length === 0) {
      return <div className="text-muted p-2">No folders to display</div>;
    }
    
    return nodes.map((node) => (
      <div key={node.id} className="tree-node">
        <div
          className={`explorer-tree-node ${currentFolder === node.id ? 'active' : ''}`}
          style={{ paddingLeft: '8px' }}
        >
          <div
            className="d-flex align-items-center flex-grow-1"
            style={{ cursor: 'pointer' }}
            onClick={() => navigateToFolder(node.id, node.name)}
          >
            {node.children && node.children.length > 0 ? (
              <i
                className={`fas ${expandedFolders[node.id] ? 'fa-chevron-down' : 'fa-chevron-right'}`}
                onClick={(e) => toggleFolderExpansion(node.id, e)}
                style={{ width: '16px', fontSize: '0.75rem', color: '#6c757d' }}
              ></i>
            ) : (
              <span style={{ width: '16px', display: 'inline-block' }}></span>
            )}
            <i className={`fas fa-folder${currentFolder === node.id ? '-open' : ''} explorer-folder-icon`}></i>
            <span className="folder-name">{node.name}</span>
          </div>
          {currentUser && (
            <button
              className="btn btn-sm btn-link text-danger p-0 ms-auto tree-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteItem(node);
              }}
              title="Delete folder"
            >
              <i className="fas fa-trash-alt" style={{ fontSize: '0.75rem' }}></i>
            </button>
          )}
        </div>
        {node.children && node.children.length > 0 && expandedFolders[node.id] && (
          <div style={{ paddingLeft: '20px' }}>
            {renderFolderTree(node.children)}
          </div>
        )}
      </div>
    ));
  };

  // Function to render the appropriate icon for each item type
  const getFileIcon = (type, name) => {
    if (type === 'folder') {
      return <i className="fas fa-folder text-warning"></i>;
    }
    
    if (type === 'link') {
      return <i className="fas fa-link text-primary"></i>;
    }
    
    // For files, determine icon based on extension
    const ext = name.split('.').pop().toLowerCase();
    
    switch (ext) {
      case 'pdf':
        return <i className="fas fa-file-pdf text-danger"></i>;
      case 'doc':
      case 'docx':
        return <i className="fas fa-file-word text-primary"></i>;
      case 'xls':
      case 'xlsx':
        return <i className="fas fa-file-excel text-success"></i>;
      case 'ppt':
      case 'pptx':
        return <i className="fas fa-file-powerpoint text-warning"></i>;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <i className="fas fa-file-image text-info"></i>;
      default:
        return <i className="fas fa-file text-secondary"></i>;
    }
  };

  // Get current folder name
  const getCurrentFolderName = () => {
    if (currentFolder === 'root') {
      return 'Root';
    }
    
    // Find the folder in the flat structure
    const findFolderName = (nodes, id) => {
      for (const node of nodes) {
        if (node.id === id) {
          return node.name;
        }
        if (node.children && node.children.length > 0) {
          const name = findFolderName(node.children, id);
          if (name) return name;
        }
      }
      return null;
    };
    
    return findFolderName(folderStructure, currentFolder) || 'Unknown Folder';
  };

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* Windows Explorer style sidebar */}
        <div className="col-md-3" id="folderTreeViewContainer">
          <div className="explorer-header d-flex justify-content-between align-items-center">
            <div>
              <i className="fas fa-folder-tree me-2 text-primary"></i>
              <strong>Folder Structure</strong>
            </div>
            {currentUser && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setShowNewFolderForm(!showNewFolderForm)}
                title="Add Root Folder"
              >
                <i className="fas fa-folder-plus"></i>
              </button>
            )}
          </div>
          
          {currentUser && showNewFolderForm && currentFolder === 'root' && (
            <div className="p-2 border-bottom">
              <form onSubmit={handleCreateFolder}>
                <div className="input-group input-group-sm">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="New folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary">Add</button>
                </div>
              </form>
            </div>
          )}
          
          <div className="explorer-tree-container">
            {loading ? (
              <div className="p-3 text-center">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 mb-0 small">Loading folders...</p>
              </div>
            ) : (
              <div id="folderTreeView">
                {console.log("About to render folder tree with structure:", folderStructure)}
                {folderStructure && folderStructure.length > 0 ? (
                  renderFolderTree(folderStructure)
                ) : (
                  <div className="p-3 text-center">
                    <i className="fas fa-folder-open text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                    <p className="mb-0 small">No folders found. Create one to get started.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Windows Explorer style main content */}
        <div className="col-md-9" id="mainDocumentArea">
          {/* Explorer navigation bar */}
          <div className="explorer-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div className="btn-group me-3">
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  disabled={historyIndex <= 0}
                  onClick={handleNavBack}
                  title="Back"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  disabled={historyIndex >= folderHistory.length - 1}
                  onClick={handleNavForward}
                  title="Forward"
                >
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
              
              <div id="currentFolderName">
                <i className="fas fa-folder-open me-2 text-warning"></i>
                <strong>{getCurrentFolderName()}</strong>
              </div>
            </div>
          </div>
          
          {/* Explorer toolbar */}
          <div className="explorer-toolbar">
            <div className="input-group me-3" style={{ maxWidth: '300px' }}>
              <span className="input-group-text"><i className="fas fa-search"></i></span>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search in current folder..." 
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="ms-auto">
              {currentUser && (
                <div className="btn-group">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setShowNewFolderForm(!showNewFolderForm)}
                    title="New Folder"
                  >
                    <i className="fas fa-folder-plus me-1"></i> New Folder
                  </button>
                  <label className="btn btn-sm btn-outline-secondary" title="Upload File">
                    <i className="fas fa-upload me-1"></i> Upload File
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                  </label>
                  <button
                    className="btn btn-sm btn-outline-info"
                    onClick={() => setShowAddLinkForm(!showAddLinkForm)}
                    title="Add Link"
                  >
                    <i className="fas fa-link me-1"></i> Add Link
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {currentUser && showNewFolderForm && (
            <div className="p-2 border-bottom">
              <form onSubmit={handleCreateFolder} className="d-flex">
                <input
                  type="text"
                  className="form-control form-control-sm me-2"
                  placeholder="New folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-sm btn-primary me-1">Create</button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setShowNewFolderForm(false);
                    setNewFolderName('');
                  }}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
          
          {selectedFile && (
            <div className="p-2 border-bottom bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <span className="small"><i className="fas fa-upload me-1"></i> Uploading: {selectedFile.name}</span>
                <div className="progress" style={{ width: '200px', height: '6px' }}>
                  <div 
                    className="progress-bar" 
                    role="progressbar" 
                    style={{ width: `${uploadProgress}%` }} 
                    aria-valuenow={uploadProgress} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
            </div>
          )}
          

          {currentUser && showAddLinkForm && (
            <div className="p-2 border-bottom">
              <form onSubmit={handleAddLink} className="d-flex">
                <input
                  type="text"
                  className="form-control form-control-sm me-2"
                  placeholder="Link Name"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  required
                />
                <input
                  type="url"
                  className="form-control form-control-sm me-2"
                  placeholder="Link URL (e.g., https://...)"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-sm btn-primary me-1">Add</button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setShowAddLinkForm(false);
                    setNewLinkName('');
                    setNewLinkUrl('');
                  }}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          <div className="explorer-content">
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading documents...</p>
              </div>
            ) : currentFolderContents.length === 0 ? (
              <div className="text-center p-5">
                <i className="fas fa-folder-open fa-3x text-muted mb-3"></i>
                <p>This folder is empty.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-3" style={{ width: '50%' }}>Name</th>
                      <th style={{ width: '15%' }}>Type</th>
                      <th style={{ width: '15%' }}>Size</th>
                      <th style={{ width: '20%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentFolderContents.map((item) => {
                      return (
                        <tr key={item.id} className={item.type === 'folder' ? 'table-row-folder' : ''}>
                          <td className="px-3">
                            <div className="d-flex align-items-center">
                              <span className="me-3">{getFileIcon(item.type, item.name)}</span>
                              {item.type === 'folder' ? (
                                <span
                                  className="folder-link"
                                  style={{ cursor: 'pointer', fontWeight: 'bold' }}
                                  onClick={() => navigateToFolder(item.id, item.name)}
                                >
                                  {item.name}
                                </span>
                              ) : item.type === 'link' ? (
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="document-link">
                                  {item.name}
                                </a>
                              ) : ( // Handle files (including PDFs)
                                <a
                                  href={item.url || '#'} // Ensure fallback href
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="document-link" // Add class for styling consistency
                                >
                                  {item.name}
                                </a>
                              )}
                            </div>
                          </td>
                          <td>
                            {item.type === 'folder' ? 'Folder' :
                             item.type === 'link' ? 'Link' :
                             item.name.split('.').pop().toUpperCase()}
                          </td>
                          <td>
                            {item.type === 'folder' ? '-' :
                             item.size ? `${(item.size / 1024 / 1024).toFixed(2)} MB` : '-'}
                          </td>
                          <td>
                            <div className="btn-group">
                              {item.type !== 'folder' && (
                                <a
                                  href={item.url || '#'} // Use '#' if URL is missing
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary" // Always enabled
                                  title="View/Download" // Consistent title
                                  // onClick removed - default link behavior is sufficient
                                >
                                  <i className="fas fa-eye"></i>
                                </a>
                              )}
                              {currentUser && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  title="Delete"
                                  onClick={() => handleDeleteItem(item)}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              )}
                            </div>
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
  );
}

export default DocumentsPage;