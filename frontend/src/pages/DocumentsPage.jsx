import React, { useState, useEffect } from 'react';
import { getFolderStructure, getFolderContents } from '../firebase';
import './DocumentsPage.css';

function DocumentsPage() {
  const [currentFolder, setCurrentFolder] = useState('root');
  const [folderHistory, setFolderHistory] = useState(['root']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [folderStructure, setFolderStructure] = useState([]);
  const [currentFolderContents, setCurrentFolderContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [selectedFacility, setSelectedFacility] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch folder structure
        const folderStructureData = await getFolderStructure();
        setFolderStructure(folderStructureData);
        
        // Set a default facility name (this would come from context or props in a real app)
        setSelectedFacility('Li-Cycle Rochester');
        
        // Fetch root folder contents
        await updateCurrentFolderContents('root');
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching document data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const updateCurrentFolderContents = async (folderId) => {
    try {
      // Fetch folder contents from Firebase
      const contents = await getFolderContents(folderId);
      
      // Apply filter if needed
      const filteredContents = filterType === 'all'
        ? contents
        : contents.filter(item => item.type === filterType);
      
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

  const handleFilterChange = async (e) => {
    const newFilter = e.target.value;
    setFilterType(newFilter);
    
    // Re-apply filter to current folder contents
    await updateCurrentFolderContents(currentFolder);
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

  // Function to render the folder tree
  const renderFolderTree = (nodes) => {
    return nodes.map((node) => (
      <div key={node.id} className="tree-node">
        <div 
          className={`tree-link ${currentFolder === node.id ? 'active' : ''}`}
          onClick={() => navigateToFolder(node.id, node.name)}
        >
          <i className="fas fa-folder me-2"></i> {node.name}
        </div>
        {node.children && node.children.length > 0 && (
          <div className="ps-3">
            {renderFolderTree(node.children)}
          </div>
        )}
      </div>
    ));
  };

  // Function to render the appropriate icon for each item type
  const renderItemIcon = (type) => {
    switch (type) {
      case 'folder':
        return <i className="fas fa-folder text-warning"></i>;
      case 'file':
        return <i className="fas fa-file-pdf text-danger"></i>;
      case 'link':
        return <i className="fas fa-link text-primary"></i>;
      default:
        return <i className="fas fa-file text-secondary"></i>;
    }
  };

  return (
    <div className="mt-4">
      <div className="row">
        {/* Tree View Column */}
        <div className="col-md-3 border-end" id="folderTreeViewContainer">
          <h5>Folder Structure</h5>
          <hr />
          <div id="folderTreeView">
            {loading ? (
              <p className="text-muted small">Loading folders...</p>
            ) : (
              renderFolderTree(folderStructure)
            )}
          </div>
        </div>

        {/* Main Content Column */}
        <div className="col-md-9" id="mainDocumentArea">
          <h4 id="selectedFacilityName">Files for: {selectedFacility}</h4>
          <hr />
          
          {/* Back/Forward Navigation */}
          <div className="btn-group btn-group-sm mb-2" role="group" aria-label="Folder navigation">
            <button 
              type="button" 
              className="btn btn-outline-secondary" 
              id="folderNavBackButton" 
              title="Back" 
              disabled={historyIndex <= 0}
              onClick={handleNavBack}
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <button 
              type="button" 
              className="btn btn-outline-secondary" 
              id="folderNavForwardButton" 
              title="Forward" 
              disabled={historyIndex >= folderHistory.length - 1}
              onClick={handleNavForward}
            >
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>

          {/* File Explorer Card */}
          <div className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Current Folder Contents</span>
              
              {/* Filter Controls */}
              <div className="row mb-2 g-2 align-items-center">
                <div className="col-md-auto">
                  <label htmlFor="filterTypeSelect" className="col-form-label col-form-label-sm">Type:</label>
                </div>
                <div className="col-md-3">
                  <select 
                    className="form-select form-select-sm" 
                    id="filterTypeSelect"
                    value={filterType}
                    onChange={handleFilterChange}
                  >
                    <option value="all">All Types</option>
                    <option value="folder">Folder</option>
                    <option value="file">File</option>
                    <option value="link">Link</option>
                  </select>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="btn-group" role="group" aria-label="File actions">
                <button type="button" className="btn btn-sm btn-outline-primary" title="New Folder">
                  <i className="fas fa-folder-plus"></i> New Folder
                </button>
                <button type="button" className="btn btn-sm btn-outline-secondary" title="Upload File">
                  <i className="fas fa-upload"></i> Upload File
                </button>
                <button type="button" className="btn btn-sm btn-outline-info" title="Add Link">
                  <i className="fas fa-link"></i> Add Link
                </button>
              </div>
            </div>
            
            <div className="card-body p-0">
              {/* File Explorer View Area */}
              <div id="fileExplorerView" className="table-responsive">
                {loading ? (
                  <p className="text-muted p-3">Loading...</p>
                ) : currentFolderContents.length === 0 ? (
                  <p className="text-muted p-3">This folder is empty.</p>
                ) : (
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>Name</th>
                        <th style={{ width: '15%' }}>Type</th>
                        <th style={{ width: '15%' }}>Size</th>
                        <th style={{ width: '20%' }}>Last Modified</th>
                        <th style={{ width: '10%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentFolderContents.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">{renderItemIcon(item.type)}</span>
                              {item.type === 'folder' ? (
                                <span 
                                  className="folder-link"
                                  onClick={() => navigateToFolder(item.id, item.name)}
                                >
                                  {item.name}
                                </span>
                              ) : item.type === 'link' ? (
                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                  {item.name}
                                </a>
                              ) : (
                                <span>{item.name}</span>
                              )}
                            </div>
                          </td>
                          <td>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</td>
                          <td>{item.size || '-'}</td>
                          <td>{item.lastModified}</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              {item.type !== 'folder' && (
                                <button className="btn btn-sm btn-outline-secondary" title="Download">
                                  <i className="fas fa-download"></i>
                                </button>
                              )}
                              <button className="btn btn-sm btn-outline-danger" title="Delete">
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentsPage;