import React, { useState, useRef } from 'react'; // Add useRef
import { useDrop, DropTargetMonitor } from 'react-dnd'; // Import useDrop
import { ItemTypes } from '../dndItemTypes'; // Import item types
import { TreeNode, StorageItem } from '../services'; // Import TreeNode and StorageItem

interface FolderTreeViewProps {
  nodes: TreeNode[];
  selectedPath: string;
  onSelectPath: (path: string) => void;
  onDropItem: (item: StorageItem, targetPath: string) => void; // Add onDropItem here
}

interface TreeNodeItemProps {
  node: TreeNode;
  selectedPath: string;
  onSelectPath: (path: string) => void;
  onDropItem: (item: StorageItem, targetPath: string) => void; // Add drop handler prop
  level: number;
}

// --- Draggable Item Interface (for type safety) ---
interface DragItem {
  type: string;
  item: StorageItem; // The actual StorageItem being dragged
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({ node, selectedPath, onSelectPath, onDropItem, level }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const ref = useRef<HTMLLIElement>(null); // Ref for the drop target element

  // --- Drop Target Logic ---
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.STORAGE_ITEM, // Accept files/folders
    drop: (draggedItem: DragItem) => {
        // Prevent dropping item onto itself or its current parent
        if (draggedItem.item.path === node.path || draggedItem.item.path.startsWith(node.path)) {
             console.warn("Cannot drop item into itself or a child folder.");
             return;
        }
        // Check if the parent path is the same (already in this folder)
        const parentPath = draggedItem.item.path.substring(0, draggedItem.item.path.lastIndexOf('/') + 1);
        if (parentPath === node.path) {
            console.log("Item is already in this folder.");
            return; // Don't trigger move if already in the target folder
        }

        console.log(`Dropped item ${draggedItem.item.name} onto folder ${node.path}`);
        onDropItem(draggedItem.item, node.path); // Call handler passed from parent
    },
    canDrop: (draggedItem: DragItem) => {
        // Prevent dropping item onto itself or its current parent folder in the tree
        const parentPath = draggedItem.item.path.substring(0, draggedItem.item.path.lastIndexOf('/') + 1);
        return draggedItem.item.path !== node.path && parentPath !== node.path;
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [node.path, onDropItem]); // Dependencies for the drop hook

  // Attach drop ref to the list item element
  drop(ref);
  // --- End Drop Target Logic ---


  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent node selection when clicking expander
    setIsExpanded(!isExpanded);
  };

  const handleSelectNode = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelectPath(node.path);
  };

  const isSelected = node.path === selectedPath;
  const hasChildren = node.children && node.children.length > 0;

  // Determine background color based on drop state
  let backgroundColor = 'transparent';
  if (isOver && canDrop) {
    backgroundColor = '#d1e7dd'; // Light green for valid drop target hover
  } else if (isOver && !canDrop) {
    backgroundColor = '#f8d7da'; // Light red if hovering but cannot drop
  } else if (isSelected) {
      backgroundColor = '#cfe2ff'; // Selected background
  }


  return (
    <li ref={ref} className={`tree-node level-${level} ${isSelected ? 'selected' : ''}`} style={{ backgroundColor }}>
      <div className="node-content d-flex align-items-center">
        {/* Indentation */}
        <span style={{ paddingLeft: `${level * 15}px` }}></span>

        {/* Expander Icon */}
        {hasChildren ? (
          <i
            className={`fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} expander-icon me-1`}
            onClick={handleToggleExpand}
            style={{ cursor: 'pointer', width: '12px', textAlign: 'center' }} // Ensure consistent width
          ></i>
        ) : (
          <span className="expander-icon me-1" style={{ display: 'inline-block', width: '12px' }}></span> // Placeholder for alignment
        )}

        {/* Folder Icon and Name */}
        <i className="fas fa-folder me-1 text-warning"></i>
        <a
          href="#"
          onClick={handleSelectNode}
          className={`node-name text-decoration-none ${isSelected ? 'fw-bold text-primary' : 'text-dark'}`}
          title={node.name}
        >
          {node.name}
        </a>
      </div>

      {/* Render Children if Expanded */}
      {hasChildren && isExpanded && (
        <ul className="tree-branch list-unstyled mb-0 ps-0">
          {node.children.map(childNode => (
            <TreeNodeItem
              key={childNode.path}
              node={childNode}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
              onDropItem={onDropItem} // Pass onDropItem down
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const FolderTreeView: React.FC<FolderTreeViewProps> = ({ nodes, selectedPath, onSelectPath, onDropItem }) => {

  // --- Drop Target Logic for Root ---
  const rootRef = useRef<HTMLDivElement>(null); // Ref for the root drop target element
  const [{ canDropRoot, isOverRoot }, dropRoot] = useDrop(() => ({
      accept: ItemTypes.STORAGE_ITEM,
      drop: (draggedItem: DragItem) => {
          // Check if the parent path is the same (already in root)
          const parentPath = draggedItem.item.path.substring(0, draggedItem.item.path.lastIndexOf('/') + 1);
          if (parentPath === '') {
              console.log("Item is already in the root folder.");
              return;
          }
          console.log(`Dropped item ${draggedItem.item.name} onto Root`);
          onDropItem(draggedItem.item, ''); // Target path is empty string for root
      },
      canDrop: (draggedItem: DragItem) => {
          const parentPath = draggedItem.item.path.substring(0, draggedItem.item.path.lastIndexOf('/') + 1);
          return parentPath !== ''; // Can drop if not already in root
      },
      collect: (monitor: DropTargetMonitor) => ({
          isOverRoot: monitor.isOver(),
          canDropRoot: monitor.canDrop(),
      }),
  }), [onDropItem]);

  let rootBgColor = 'transparent';
   if (isOverRoot && canDropRoot) {
     rootBgColor = '#d1e7dd'; // Light green
   } else if (isOverRoot && !canDropRoot) {
     rootBgColor = '#f8d7da'; // Light red
   } else if (selectedPath === '') {
       rootBgColor = '#cfe2ff'; // Selected background
   }
   // --- End Drop Target Logic for Root ---

   // Attach drop ref to the root div element
   dropRoot(rootRef);

  return (
    <div className="folder-tree-view">
       {/* Add Root Node - Make it a drop target */}
       <div
         ref={rootRef} // Attach corrected ref
         className={`node-content d-flex align-items-center root-node ${selectedPath === '' ? 'selected' : ''}`}
         style={{ paddingLeft: '5px', backgroundColor: rootBgColor }} // Apply dynamic background
       >
         <i className="fas fa-folder me-1 text-warning"></i>
         <a
           href="#"
           onClick={(e) => { e.preventDefault(); onSelectPath(''); }}
           className={`node-name text-decoration-none ${selectedPath === '' ? 'fw-bold text-primary' : 'text-dark'}`}
           title="Root"
         >
           Root
         </a>
       </div>
       {/* Render Tree Nodes */}
      <ul className="tree-root list-unstyled mb-0 ps-0">
        {nodes.map(node => (
          <TreeNodeItem
            key={node.path}
            node={node}
            selectedPath={selectedPath}
            onSelectPath={onSelectPath}
            onDropItem={onDropItem} // Pass drop handler down
            level={0} // Start top-level nodes at level 0
          />
         ))}
       </ul>
       {/* Basic Styling removed - move to CSS file later */}
       {/* <style jsx>{\` ... \`}</style> */}
     </div>
   );
 };

export default FolderTreeView; // Add the missing export default
