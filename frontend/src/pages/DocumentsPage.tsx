// frontend/src/pages/DocumentsPage.tsx
import React, { useState, useEffect, ChangeEvent, useCallback, useMemo, useRef, JSX } from 'react'; // Explicitly import JSX
import { Modal, Button } from 'react-bootstrap';
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd'; // Import useDrag
import { ItemTypes } from '../dndItemTypes'; // Import item types
import {
    listStorageItems,
    createFolder,
    uploadFile,
    deleteFile,
    moveFile, // Import moveFile
    getAllStorageItems,
    buildFolderTree,
    StorageItem,
    TreeNode,
    // renameFolder, // REMOVE old renameFolder
    deleteFolder, // Import deleteFolder
} from '../services';
import { renameSupabaseFolder } from '../utils/renameSupabaseFolder';
import { supabase } from '../supabaseClient';
import FolderTreeView from '../components/FolderTreeView';
import './DocumentsPage.css';

// Helper function to format file size
const formatBytes = (bytes: number | undefined | null, decimals: number = 2): string => {
    if (bytes === undefined || bytes === null || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Helper function to format date string (assuming ISO format from Supabase)
const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        // Use toLocaleDateString for user-friendly format
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return '-';
    }
};

// Function to get appropriate item icon based on type and name
const getItemIcon = (item: StorageItem): JSX.Element => {
    if (item.type === 'folder') {
        return <i className="fas fa-folder me-2 text-warning"></i>; // Folder icon
    }
    // File icon logic
    const ext = item.name.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
        case 'pdf': return <i className="fas fa-file-pdf me-2 text-danger"></i>;
        case 'doc':
        case 'docx': return <i className="fas fa-file-word me-2 text-primary"></i>;
        case 'xls':
        case 'xlsx': return <i className="fas fa-file-excel me-2 text-success"></i>;
        case 'ppt':
        case 'pptx': return <i className="fas fa-file-powerpoint me-2 text-warning"></i>;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'webp': return <i className="fas fa-file-image me-2 text-info"></i>;
        case 'zip':
        case 'rar':
        case '7z': return <i className="fas fa-file-archive me-2 text-secondary"></i>;
        case 'txt': return <i className="fas fa-file-alt me-2 text-muted"></i>;
        default: return <i className="fas fa-file me-2 text-secondary"></i>; // Default file icon
    }
};

// --- Breadcrumb Component ---
interface BreadcrumbProps {
    path: string;
    onNavigate: (newPath: string) => void;
}

const Breadcrumbs: React.FC<BreadcrumbProps> = ({ path, onNavigate }) => {
    const segments = path.split('/').filter(Boolean); // Remove empty strings
    const breadcrumbItems = [{ name: 'Root', path: '' }];

    let currentPath = '';
    segments.forEach(segment => {
        currentPath += `${segment}/`;
        breadcrumbItems.push({ name: segment, path: currentPath });
    });

    return (
        <nav aria-label="breadcrumb" className="mb-3">
            <ol className="breadcrumb breadcrumb-custom">
                {breadcrumbItems.map((item, index) => (
                    <li key={item.path} className={`breadcrumb-item ${index === breadcrumbItems.length - 1 ? 'active' : ''}`}>
                        {index === breadcrumbItems.length - 1 ? (
                            item.name
                        ) : (
                            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate(item.path); }}>
                                {item.name}
                            </a>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};


const DocumentsPage: React.FC = () => {
  const [currentItems, setCurrentItems] = useState<StorageItem[]>([]); // Items for the *current* path view
  const [folderTree, setFolderTree] = useState<TreeNode[]>([]); // State for the folder tree structure
  const [currentPath, setCurrentPath] = useState<string>(''); // State for current path (selected in tree or breadcrumbs)
  const currentPathRef = useRef<string>(''); // Ref to track current path reliably
  const [loadingItems, setLoadingItems] = useState<boolean>(true); // Loading state for the item list (right pane)
  const [loadingTree, setLoadingTree] = useState<boolean>(true); // Loading state for the folder tree (left pane)
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null); // Renamed state for generic success messages

  // State for File Delete Modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<StorageItem | null>(null);

  // State for Folder Rename Modal
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
  const [folderToRename, setFolderToRename] = useState<StorageItem | null>(null);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isRenaming, setIsRenaming] = useState<boolean>(false); // Loading state for rename/delete folder operation

  // State for Folder Delete Modal
  const [showDeleteFolderConfirm, setShowDeleteFolderConfirm] = useState<boolean>(false);
  const [folderToDelete, setFolderToDelete] = useState<StorageItem | null>(null);


  const documentsBucket = 'documents'; // Define the bucket

  // Fetch items for the currently selected path (for the right pane list/table)
  const fetchCurrentItems = useCallback(async (path: string): Promise<void> => {
    setLoadingItems(true);
    setError(null);
    console.log(`Fetching items for path: '${path}'`);
    try {
      const fetchedItems = await listStorageItems(documentsBucket, path);
      // Sort: folders first, then files, alphabetically
      fetchedItems.sort((a, b) => {
          if (a.type === 'folder' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name); // Alphabetical sort within type
      });
      setCurrentItems(fetchedItems); // Update state for the list view
      console.log(`Storage items fetched for path '${path}':`, fetchedItems);
    } catch (err) {
      console.error(`Error fetching storage items for path '${path}':`, err);
      setError(err instanceof Error ? err.message : "An unknown error occurred while fetching items.");
      setCurrentItems([]); // Set to empty on error
    } finally {
      setLoadingItems(false);
    }
  }, [documentsBucket]); // Dependency: bucket name

  // Fetch the entire folder structure for the tree view ONCE on mount
  const fetchFolderTree = useCallback(async (): Promise<void> => {
      setLoadingTree(true);
      setError(null);
      console.log("Fetching all items to build folder tree...");
      try {
          const allItems = await getAllStorageItems(documentsBucket);
          const tree = buildFolderTree(allItems);
          setFolderTree(tree);
          console.log("Folder tree built:", tree);
      } catch (err) {
          console.error("Error building folder tree:", err);
          setError(err instanceof Error ? err.message : "An unknown error occurred while building the folder tree.");
          setFolderTree([]);
      } finally {
          setLoadingTree(false);
      }
  }, [documentsBucket]);

  // Effect to fetch the tree structure on initial mount
  useEffect(() => {
      fetchFolderTree();
  }, [fetchFolderTree]);

  // Effect to fetch items for the list view when currentPath changes
  useEffect(() => {
    fetchCurrentItems(currentPath);
    // Update the ref whenever the state changes
    currentPathRef.current = currentPath;
  }, [currentPath, fetchCurrentItems]); // Re-run when path changes or fetchItems changes

  // --- Drag and Drop Handlers ---
  const handleDropItem = useCallback(async (draggedItem: StorageItem, targetFolderPath: string) => {
      console.log(`Attempting move: ${draggedItem.name} to ${targetFolderPath}`);
      setActionSuccessMessage(null); // Clear previous messages
      setError(null);

      // Basic validation
      if (draggedItem.type === 'folder') {
          alert("Moving folders is not yet supported.");
          return;
      }
      if (!draggedItem.path) {
          setError("Dragged item has no path.");
          return;
      }

      const sourcePath = draggedItem.path;
      // Ensure targetFolderPath ends with '/' if it's not root
      const effectiveTargetPath = targetFolderPath && !targetFolderPath.endsWith('/') ? `${targetFolderPath}/` : targetFolderPath;
      // Extract filename from source path
      const filename = sourcePath.substring(sourcePath.lastIndexOf('/') + 1);
      const destinationPath = `${effectiveTargetPath}${filename}`; // Construct new path using only filename

      // Prevent moving to the same location
      if (sourcePath === destinationPath) {
          console.log("Source and destination are the same.");
          return;
      }
      // Prevent moving into self (already handled by drop target, but good backup)
       if (destinationPath.startsWith(sourcePath + '/')) {
           alert("Cannot move an item into itself.");
           return;
       }

      setLoadingItems(true); // Indicate loading during move
      setLoadingTree(true); // Tree might need refresh

      try {
          await moveFile(documentsBucket, sourcePath, destinationPath);

          // Optimistic UI update (remove from old list, potentially add to new if visible)
          // Or just refetch both lists for simplicity
          await fetchCurrentItems(currentPathRef.current); // Use ref for current path
          await fetchFolderTree(); // Refetch tree structure

          setActionSuccessMessage(`Moved "${filename}" successfully.`);
          setTimeout(() => setActionSuccessMessage(null), 5000);

      } catch (moveError) {
          console.error("Error moving item:", moveError);
          setError(`Failed to move ${filename}: ${moveError instanceof Error ? moveError.message : 'Unknown error'}`);
          // Optionally refetch to revert optimistic updates if they were implemented
          await fetchCurrentItems(currentPathRef.current); // Use ref
          await fetchFolderTree();
      } finally {
          setLoadingItems(false);
          setLoadingTree(false);
      }

  }, [documentsBucket, fetchCurrentItems, fetchFolderTree]); // Remove currentPath from deps, use ref

  // Handle search input changes
  const handleSearch = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  // Filter items for the *current view* based on search term (client-side)
  const filteredCurrentItems = useMemo(() => {
      const filtered = currentItems.filter(item =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      // Debug: Log the full path of each item shown in the current folder
      console.log("[DocumentsPage][DEBUG] Current folder:", currentPath);
      filtered.forEach(item => {
          console.log("[DocumentsPage][DEBUG] Item in current folder:", { name: item.name, path: item.path, type: item.type });
      });
      return filtered;
  }, [currentItems, searchTerm, currentPath]);

  // Handle navigation (clicking breadcrumbs or folders)
  const handleNavigate = (newPath: string): void => {
      console.log("Navigating to:", newPath);
      // Ensure path ends with '/' for non-root folders, otherwise use the provided path (handles root '')
      const pathWithSlashIfNeeded = newPath && !newPath.endsWith('/') ? `${newPath}/` : newPath;
      setCurrentPath(pathWithSlashIfNeeded);
      // Update the ref immediately after setting state
      currentPathRef.current = pathWithSlashIfNeeded;
      setSearchTerm(''); // Clear search on navigation
  };

  // Handle clicking on a folder item in the table
  const handleFolderClick = (folder: StorageItem): void => {
      if (folder.type === 'folder') {
          // Ensure path ends with '/' for folder navigation
          const newPath = folder.path.endsWith('/') ? folder.path : `${folder.path}/`;
          handleNavigate(newPath);
      }
  };

  // Implement Upload functionality using Supabase uploadFile, respecting currentPath
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    // Use the ref's current value for the check
    const currentUploadPath = currentPathRef.current;

    // Prevent uploads to the root (no folder selected)
    if (!currentUploadPath || currentUploadPath.trim() === '') {
      setError("Please select or create a folder before uploading files. Uploads to the root are not allowed.");
      e.target.value = '';
      return;
    }

    const file = e.target.files[0];
    setUploadProgress(0); // Start progress
    setError(null);

    try {
        setLoadingItems(true); // Use setLoadingItems
        // Create a path within the current folder
        const timestamp = new Date().getTime();
        // --- Use the ref's value directly ---
        const prefix = currentUploadPath; // Already guaranteed to have trailing slash by handleNavigate
        // ------------------------------------
        const path = `${prefix}${timestamp}_${file.name}`; // Use the prefix from the ref
        console.log(`[handleFileUpload] Uploading to constructed path: ${path}`);

        // Upload the file to Supabase Storage
        const result = await uploadFile(documentsBucket, path, file);
        console.log(`File uploaded successfully to path: ${result.path}`);

        setUploadProgress(100); // Complete progress

        // Refetch items for the current path after successful upload (use ref value)
        await fetchCurrentItems(currentUploadPath);
        // OPTIONAL: Consider refetching the tree if uploads might create new implicit folders
        // await fetchFolderTree(); // Uncomment if needed, but might be slow

        // Show success message using state
        const successMsg = `File "${file.name}" uploaded successfully to ${currentUploadPath || 'root'}.`;
        setActionSuccessMessage(successMsg); // Use renamed state setter
        // Clear the message after 5 seconds
        setTimeout(() => setActionSuccessMessage(null), 5000); // Use renamed state setter

    } catch (uploadError) {
        console.error("Error uploading file:", uploadError);
        setError(`Failed to upload ${file.name}: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        setUploadProgress(null);
    } finally {
        setLoadingItems(false); // Use setLoadingItems
        e.target.value = ''; // Clear input
        // Reset progress after a short delay to show completion
        setTimeout(() => setUploadProgress(null), 1500);
        }
    };

  // --- File Delete Confirmation Logic ---
  const openDeleteConfirm = (item: StorageItem) => {
      if (item.type === 'folder') {
          // This should ideally not be called for folders now
          console.warn("Attempted to open file delete confirm for a folder.");
          return;
      }
      setItemToDelete(item);
      setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
      setItemToDelete(null);
      setShowDeleteConfirm(false);
  };

  const executeDelete = async () => {
      if (!itemToDelete || itemToDelete.type === 'folder') return;

      setError(null);
      setActionSuccessMessage(null);
      setLoadingItems(true); // Set loading state

      try {
          if (!itemToDelete.path) {
              throw new Error("Item path is undefined");
          }

          // Delete the file from Supabase Storage
          await deleteFile(documentsBucket, itemToDelete.path);
          console.log(`File deleted successfully: ${itemToDelete.name}`);

          // Update state by removing the deleted file from the current view
          setCurrentItems(prevItems => prevItems.filter(i => i.path !== itemToDelete.path));
          // OPTIONAL: Consider updating the tree state if a deleted file was the last in a folder? More complex.

          // Show success message using state
          const successMsg = `File "${itemToDelete.name}" deleted successfully.`;
          setActionSuccessMessage(successMsg);
          // Clear the message after 5 seconds
          setTimeout(() => setActionSuccessMessage(null), 5000);

      } catch (deleteError) {
          console.error("Error deleting file:", deleteError);
          setError(`Failed to delete ${itemToDelete.name}: ${deleteError instanceof Error ? deleteError.message : 'Unknown error'}`);
      } finally {
          setLoadingItems(false); // Clear loading state
          closeDeleteConfirm(); // Close the modal regardless of success/failure
      }
  };
  // --- End File Delete Confirmation Logic ---

  // --- Create Folder functionality ---
  const handleCreateFolder = async () => {
      const folderName = prompt("Enter new folder name:");
      if (!folderName || folderName.trim() === '') {
          alert("Folder name cannot be empty.");
          return;
      }
      // Basic validation: prevent slashes in folder names
      if (folderName.includes('/')) {
          alert("Folder name cannot contain slashes.");
          return;
      }

      // Construct the full path for the new folder using the ref
      const newFolderPath = `${currentPathRef.current}${folderName.trim()}/`; // Ensure trailing slash

      setError(null);
      setActionSuccessMessage(null); // Clear success message on new action
      // Use setLoadingItems for the list and setLoadingTree for the tree
      setLoadingItems(true);
      setLoadingTree(true); // Also set tree loading as it will refetch

      try {
          console.log(`Creating folder: ${newFolderPath}`);
          await createFolder(documentsBucket, newFolderPath);
          console.log(`Folder "${folderName}" created successfully.`);

          // Refetch items for the current path to show the new folder (use ref)
          await fetchCurrentItems(currentPathRef.current);
          // Refetch the tree to include the new folder
          await fetchFolderTree();

          setActionSuccessMessage(`Folder "${folderName}" created successfully.`);
          setTimeout(() => setActionSuccessMessage(null), 5000);

      } catch (createError) {
          console.error("Error creating folder:", createError);
          setError(`Failed to create folder "${folderName}": ${createError instanceof Error ? createError.message : 'Unknown error'}`);
      } finally {
          // Reset both loading states
          setLoadingItems(false);
          setLoadingTree(false);
      }
  };
  // --- End Create Folder functionality ---


  // --- Rename Folder Logic ---
  const openRenameModal = (folder: StorageItem) => {
    if (folder.type !== 'folder') return;
    setFolderToRename(folder);
    setNewFolderName(folder.name); // Pre-fill with current name
    setShowRenameModal(true);
    setError(null); // Clear previous errors
  };

  const closeRenameModal = () => {
    setShowRenameModal(false);
    setFolderToRename(null);
    setNewFolderName('');
    setError(null);
  };

  const handleRenameSubmit = async () => {
    if (!folderToRename || !newFolderName || newFolderName.trim() === '' || folderToRename.type !== 'folder') {
      setError("Invalid folder or name for renaming.");
      return;
    }

    const trimmedNewName = newFolderName.trim();
    if (trimmedNewName.includes('/')) {
        setError("Folder name cannot contain slashes.");
        return;
    }
    if (trimmedNewName === folderToRename.name) {
        closeRenameModal(); // Name hasn't changed
        return;
    }

    // Construct the new path prefix
    const pathSegments = folderToRename.path.split('/').filter(Boolean);
    pathSegments.pop(); // Remove old name
    const parentPath = pathSegments.length > 0 ? `${pathSegments.join('/')}/` : '';
    const newPathPrefix = `${parentPath}${trimmedNewName}/`;
    const oldPathPrefix = folderToRename.path; // Path already includes trailing slash for folders

    setIsRenaming(true); // Use specific renaming state
    setError(null);
    setActionSuccessMessage(null);

    try {
      await renameSupabaseFolder(supabase, documentsBucket, oldPathPrefix, newPathPrefix);
      setActionSuccessMessage(`Folder renamed to \"${trimmedNewName}\" successfully.`);
      closeRenameModal();

      // Refresh data
      await fetchFolderTree(); // Essential to update the tree view
      // Also refresh current items if the renamed folder was in the current view's parent
      // Or simply refresh current items always for simplicity, though less efficient
      await fetchCurrentItems(currentPathRef.current); // Use ref

      // Clear success message after a delay
      setTimeout(() => setActionSuccessMessage(null), 5000);

    } catch (renameError: any) {
      console.error("Error renaming folder:", renameError);
      setError(`Failed to rename folder: ${renameError.message}`);
      // Keep modal open on error to show the message
    } finally {
      setIsRenaming(false); // Clear specific renaming state
    }
  };
  // --- End Rename Folder Logic ---


  // --- Delete Folder Logic ---
  const openDeleteFolderConfirm = (folder: StorageItem) => {
    if (folder.type !== 'folder') return;
    setFolderToDelete(folder);
    setShowDeleteFolderConfirm(true);
    setError(null);
  };

  const closeDeleteFolderConfirm = () => {
    setShowDeleteFolderConfirm(false);
    setFolderToDelete(null);
    setError(null);
  };

  const executeDeleteFolder = async () => {
    if (!folderToDelete || folderToDelete.type !== 'folder') return;

    // Use a more specific loading state if needed, or reuse isRenaming/isLoading
    setIsRenaming(true); // Reusing isRenaming for general loading state for now
    setError(null);
    setActionSuccessMessage(null);

    try {
      await deleteFolder(documentsBucket, folderToDelete.path);
      setActionSuccessMessage(`Folder \"${folderToDelete.name}\" and its contents deleted successfully.`);
      closeDeleteFolderConfirm();

      // Refresh data
      await fetchFolderTree();
      // Navigate to parent folder if current folder was deleted
      if (currentPathRef.current === folderToDelete.path) { // Use ref
          const pathSegments = folderToDelete.path.split('/').filter(Boolean);
          pathSegments.pop(); // Remove deleted folder name
          const parentPath = pathSegments.length > 0 ? `${pathSegments.join('/')}/` : '';
          handleNavigate(parentPath); // Navigate up (this will update state and ref)
      } else {
          await fetchCurrentItems(currentPathRef.current); // Refresh current view if not inside deleted folder (use ref)
      }


      // Clear success message after delay
      setTimeout(() => setActionSuccessMessage(null), 5000);

    } catch (deleteFolderError: any) {
      console.error("Error deleting folder:", deleteFolderError);
      setError(`Failed to delete folder: ${deleteFolderError.message}`);
      // Keep modal open on error
    } finally {
      setIsRenaming(false); // Clear loading state
    }
  };
  // --- End Delete Folder Logic ---


  // Combine loading states
  const isLoading = loadingItems || loadingTree || isRenaming; // Include isRenaming in general loading

  return (
    <div className="documents-container">
      <div className="row">
        {/* Left Column: Folder Tree */}
        <div className="col-md-3" style={{ minHeight: 'calc(100vh - 200px)', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          <div id="folderTreeViewContainer">
            <h5 className="mb-3">
              <i className="fas fa-folder-tree me-2"></i>
              Folders
            </h5>
           {loadingTree ? (
               <div className="text-center p-3"><i className="fas fa-spinner fa-spin"></i> Loading tree...</div>
           ) : error && folderTree.length === 0 ? ( // Show tree-specific error only if tree failed
               <div className="alert alert-warning small p-2">Error loading folder tree.</div>
           ) : (
               <FolderTreeView
                   nodes={folderTree}
                   selectedPath={currentPath}
                   onSelectPath={handleNavigate}
                   onDropItem={handleDropItem} // Pass the drop handler
               />
           )}
          </div>
        </div>

        {/* Right Column: Content Area */}
        <div className="col-md-9">
          <h3>Documents</h3>
          {/* Breadcrumbs */}
          <Breadcrumbs path={currentPath} onNavigate={handleNavigate} />

          {/* Search and Actions */}
          <div className="row mb-3 align-items-center">
            <div className="col-md-5">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search files..."
                value={searchTerm}
                onChange={handleSearch}
                disabled={isLoading} // Use combined loading state
              />
            </div>
            <div className="col-md-7 text-end">
               {/* Add Create Folder Button */}
               <button
                 className="btn btn-sm btn-outline-secondary me-2"
                 onClick={handleCreateFolder}
                 disabled={isLoading} // Use combined loading state
                 title="Create New Folder"
               >
                 <i className="fas fa-folder-plus me-1"></i> New Folder
               </button>
               {/* Upload Button */}
               <label className="btn btn-sm btn-outline-primary" title="Upload File">
                 <i className="fas fa-upload me-1"></i> Upload File
                 <input type="file" hidden onChange={handleFileUpload} disabled={isLoading} />
               </label>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploadProgress !== null && (
            <div className="mb-3">
              <div className="progress">
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style={{ width: `${uploadProgress}%` }}
                  aria-valuenow={uploadProgress ?? 0} // Provide default value for aria-valuenow
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {uploadProgress === 100 ? 'Upload Complete!' : `${uploadProgress}%`}
                </div>
              </div>
            </div>
          )}


      {/* Rename Folder Modal */}
      <Modal show={showRenameModal} onHide={closeRenameModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Rename Folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Renaming folder: <strong>{folderToRename?.name}</strong></p>
          <input
            type="text"
            className="form-control"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Enter new folder name"
            disabled={isRenaming}
          />
          {error && <div className="text-danger mt-2 small">{error}</div>} {/* Display error inside modal */}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeRenameModal} disabled={isRenaming}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleRenameSubmit} disabled={isRenaming || !newFolderName.trim() || newFolderName.trim() === folderToRename?.name}>
            {isRenaming ? (<><i className="fas fa-spinner fa-spin me-1"></i> Renaming...</>) : 'Rename'}
          </Button>
        </Modal.Footer>
      </Modal>


      {/* Delete Folder Confirmation Modal */}
      <Modal show={showDeleteFolderConfirm} onHide={closeDeleteFolderConfirm} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Folder Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Simplified confirmation message */}
          <p>Delete folder <strong>{folderToDelete?.name}</strong> and all its contents?</p>
          {error && <div className="text-danger mt-2 small">{error}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDeleteFolderConfirm} disabled={isRenaming}>
            Cancel
          </Button>
          <Button variant="danger" onClick={executeDeleteFolder} disabled={isRenaming}>
            {isRenaming ? 'Deleting...' : 'Delete Folder & Contents'}
          </Button>
        </Modal.Footer>
      </Modal>


          {/* Action Success Alert */}
          {actionSuccessMessage && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                  {actionSuccessMessage}
                  <button type="button" className="btn-close" onClick={() => setActionSuccessMessage(null)} aria-label="Close"></button>
              </div>
          )}

          {/* File List Table */}
          <div className="card shadow-sm">
            <div className="card-body p-0">
              {loadingItems ? ( // Use loading state specific to the item list
                <div className="text-center p-5"><i className="fas fa-spinner fa-spin fa-2x"></i> Loading items...</div>
              ) : error ? ( // Show general error if item loading failed
                <div className="alert alert-danger m-3">{error}</div>
              ) : filteredCurrentItems.length === 0 ? ( // Use filtered items for the current path
                <div className="text-center p-5 text-muted">
                  {searchTerm ? `No items found matching "${searchTerm}".` : `Folder '${currentPath || 'Root'}' is empty.`}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 document-table">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" className="px-3">Name</th>
                        <th scope="col">Size</th>
                        <th scope="col">Date Modified</th>
                        <th scope="col" className="text-end pe-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Use DraggableStorageItemRow */}
                      {filteredCurrentItems.map((item) => (
                        <DraggableStorageItemRow
                          key={item.path}
                          item={item}
                          onFolderClick={handleFolderClick}
                          onDeleteClick={openDeleteConfirm} // For files
                          onRenameClick={openRenameModal}
                          onDeleteFolderClick={openDeleteFolderConfirm} // Pass the folder delete handler
                          isLoading={isLoading}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div> {/* End Right Column */}
      </div> {/* End Row */}

      {/* Delete Confirmation Modal (File) */}
      <Modal show={showDeleteConfirm} onHide={closeDeleteConfirm} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to permanently delete the file: <br />
          <strong>{itemToDelete?.name}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDeleteConfirm}>
            Cancel
          </Button>
          <Button variant="danger" onClick={executeDelete} disabled={loadingItems}>
            {loadingItems ? 'Deleting...' : 'Delete File'}
          </Button>
        </Modal.Footer>
      </Modal>

    </div> // End Container
  );
};
// --- Draggable Table Row Component ---
interface DraggableStorageItemRowProps {
    item: StorageItem;
    onFolderClick: (item: StorageItem) => void;
    onDeleteClick: (item: StorageItem) => void; // For files
    onRenameClick: (item: StorageItem) => void;
    onDeleteFolderClick: (item: StorageItem) => void; // Add delete handler prop for folders
    isLoading: boolean;
}

const DraggableStorageItemRow: React.FC<DraggableStorageItemRowProps> = ({
    item,
    onFolderClick,
    onDeleteClick, // For files
    onRenameClick,
    onDeleteFolderClick, // Destructure delete handler for folders
    isLoading
}) => {
    const ref = useRef<HTMLTableRowElement>(null); // Ref for drag source and drop target (for potential reordering later)

    // --- Drag Source Logic ---
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.STORAGE_ITEM,
        item: { item }, // Pass the whole StorageItem as payload
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
        // Enable dragging only for files initially
        canDrag: () => item.type === 'file',
    }), [item]);

    // Attach drag ref to the table row element
    drag(ref);
    // --- End Drag Source Logic ---

    // Apply opacity style when dragging
    const opacity = isDragging ? 0.5 : 1;

    return (
        <tr ref={ref} style={{ opacity }} className={item.type === 'folder' ? 'folder-row' : 'file-row'}>
            <td className="px-3">
                <div className="d-flex align-items-center">
                    {getItemIcon(item)}
                    {item.type === 'folder' ? (
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); onFolderClick(item); }}
                            className="text-decoration-none text-dark fw-medium text-truncate"
                            title={`Open folder: ${item.name}`}
                            style={{ maxWidth: '450px', display: 'inline-block' }}
                        >
                            {item.name}
                        </a>
                    ) : item.url ? (
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-decoration-none text-dark text-truncate"
                            title={item.name}
                            style={{ maxWidth: '450px', display: 'inline-block' }}
                        >
                            {item.name}
                        </a>
                    ) : (
                        <span className="text-truncate" title={item.name} style={{ maxWidth: '450px', display: 'inline-block' }}>
                            {item.name}
                        </span>
                    )}
                </div>
            </td>
            <td>{item.type === 'file' ? formatBytes(item.metadata?.size) : '-'}</td>
            <td>{formatDate(item.updated_at || item.created_at)}</td>
            <td className="text-end pe-3">
                {item.type === 'file' && item.url && (
                    <a
                        href={item.url}
                        download={item.name}
                        className="btn btn-sm btn-link text-primary p-0 me-2 action-btn"
                        title={`Download ${item.name}`}
                    >
                        <i className="fas fa-download fa-sm"></i>
                    </a>
                )}
                {item.type === 'file' && (
                    <button
                        className="btn btn-sm btn-link text-danger p-0 action-btn"
                        onClick={() => onDeleteClick(item)}
                        title={`Delete ${item.name}`}
                        disabled={isLoading}
                    >
                        <i className="fas fa-trash-alt fa-sm"></i>
                    </button>
                )}
                {item.type === 'folder' && (
                    <> {/* Use Fragment to group buttons */}
                        {/* Rename button for folders */}
                        <button
                            className="btn btn-sm btn-link text-secondary p-0 me-2 action-btn"
                            onClick={() => onRenameClick(item)}
                            title={`Rename ${item.name}`}
                            disabled={isLoading}
                        >
                            <i className="fas fa-pencil-alt fa-sm"></i>
                        </button>
                        {/* Delete button for folders */}
                        <button
                            className="btn btn-sm btn-link text-danger p-0 action-btn"
                            onClick={() => onDeleteFolderClick(item)}
                            title={`Delete Folder ${item.name}`}
                            disabled={isLoading}
                        >
                            <i className="fas fa-trash-alt fa-sm"></i>
                        </button>
                    </>
                )}
            </td>
        </tr>
    );
};
// --- End Draggable Table Row Component ---


export default DocumentsPage;
