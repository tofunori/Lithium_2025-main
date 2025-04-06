import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Import Firestore instance
// Removed ReactQuill import
import { useAuth } from '../context/AuthContext.jsx';
import { useEditor, EditorContent } from '@tiptap/react'; // Tiptap imports
import StarterKit from '@tiptap/starter-kit'; // Tiptap basic extensions
import TiptapMenuBar from '../components/TiptapMenuBar'; // Import the menu bar
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './AboutPage.css';

function AboutPage() {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  // Refactored state for rich text content
  const [pageContent, setPageContent] = useState({
    projectSectionHTML: `<h2>About This Project</h2><p>This dashboard provides an interactive overview of lithium battery recycling facilities across North America. It aims to consolidate information about facility locations, operational status, processing capacities, and more.</p><p>[Add more detailed project description here...]</p>`,
    dataSourcesSectionHTML: `<h2>Data Sources</h2><p>The data presented in this dashboard is compiled from various public sources, including company press releases, government reports, and industry publications.</p><ul><li>[List specific data sources here, e.g., EPA reports, company websites]</li><li>[Mention data update frequency or limitations if applicable]</li></ul>`,
    teamSectionHTML: `<h2>Development Team</h2><p>This project was developed by:</p><ul><li>[Team Member 1 Name/Role]</li><li>[Team Member 2 Name/Role]</li><li>[Add more team members as needed]</li></ul><p>[Optionally add links to profiles or contact info]</p>`
  });

  // Fetch content from Firestore
  useEffect(() => {
    const fetchContent = async () => {
      const docRef = doc(db, 'content', 'about');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // Ensure fetched data updates the editor content correctly
        const fetchedData = docSnap.data();
        setPageContent(fetchedData);
        // Update editor content after state is set
        // Update editor content directly after fetching and setting state
        // Use timeout to ensure state update has likely occurred before editor update
        setTimeout(() => {
            projectEditor?.commands.setContent(fetchedData.projectSectionHTML || '', false);
            dataSourcesEditor?.commands.setContent(fetchedData.dataSourcesSectionHTML || '', false);
            teamEditor?.commands.setContent(fetchedData.teamSectionHTML || '', false);
        }, 0);
      } else {
        console.log("No 'about' content document found. Using default.");
        // Initialize editors with default content if doc doesn't exist
        // Update editor content directly if doc doesn't exist
         setTimeout(() => {
            projectEditor?.commands.setContent(pageContent.projectSectionHTML, false);
            dataSourcesEditor?.commands.setContent(pageContent.dataSourcesSectionHTML, false);
            teamEditor?.commands.setContent(pageContent.teamSectionHTML, false);
        }, 0);
      }
    };
    fetchContent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Tiptap Editor Instances
  const projectEditor = useEditor({
    extensions: [StarterKit],
    content: pageContent.projectSectionHTML,
    // editable: isEditing, // Managed by useEffect now
    onUpdate: ({ editor }) => {
      setPageContent(prev => ({ ...prev, projectSectionHTML: editor.getHTML() }));
    },
  });

  const dataSourcesEditor = useEditor({
    extensions: [StarterKit],
    content: pageContent.dataSourcesSectionHTML,
    // editable: isEditing, // Managed by useEffect now
    onUpdate: ({ editor }) => {
      setPageContent(prev => ({ ...prev, dataSourcesSectionHTML: editor.getHTML() }));
    },
  });

  const teamEditor = useEditor({
    extensions: [StarterKit],
    content: pageContent.teamSectionHTML,
    // editable: isEditing, // Managed by useEffect now
    onUpdate: ({ editor }) => {
      setPageContent(prev => ({ ...prev, teamSectionHTML: editor.getHTML() }));
    },
  });

  // Effect to ONLY control editability
   useEffect(() => {
    projectEditor?.setEditable(isEditing);
    dataSourcesEditor?.setEditable(isEditing);
    teamEditor?.setEditable(isEditing);
  }, [isEditing, projectEditor, dataSourcesEditor, teamEditor]);


  const handleEdit = () => setIsEditing(true);
  const handleCancel = async () => {
     // Refetch content on cancel to discard changes
     const docRef = doc(db, 'content', 'about');
     const docSnap = await getDoc(docRef);
     if (docSnap.exists()) {
       const fetchedData = docSnap.data();
       setPageContent(fetchedData);
       // Update editor content directly after fetching and setting state on cancel
       // Use timeout to ensure state update has likely occurred before editor update
       setTimeout(() => {
           projectEditor?.commands.setContent(fetchedData.projectSectionHTML || '', false);
           dataSourcesEditor?.commands.setContent(fetchedData.dataSourcesSectionHTML || '', false);
           teamEditor?.commands.setContent(fetchedData.teamSectionHTML || '', false);
        }, 0);
     }
    setIsEditing(false);
  }
  const handleSave = async () => {
    const docRef = doc(db, 'content', 'about');
    try {
      // Get latest HTML from editors before saving
      const contentToSave = {
        projectSectionHTML: projectEditor?.getHTML() || '',
        dataSourcesSectionHTML: dataSourcesEditor?.getHTML() || '',
        teamSectionHTML: teamEditor?.getHTML() || '',
      };
      await setDoc(docRef, contentToSave, { merge: true });
      setPageContent(contentToSave); // Update local state with saved content
      console.log("About page content saved successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving about page content:", error);
      alert("Failed to save changes. Please try again.");
    }
  };

  return (
    <div className="container mt-4 fade-in">
      {/* Edit/Save Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3">About</h1>
        {currentUser && !isEditing && (
          <button className="btn btn-outline-primary btn-sm" onClick={handleEdit}>Edit Page</button>
        )}
        {isEditing && (
          <div>
            <button className="btn btn-success btn-sm me-2" onClick={handleSave}>Save Changes</button>
            <button className="btn btn-secondary btn-sm" onClick={handleCancel}>Cancel</button>
          </div>
        )}
      </div>

      {/* First Card: Project Description */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              {/* Project Description Section */}
              {isEditing ? (
                <>
                  <TiptapMenuBar editor={projectEditor} />
                  <EditorContent editor={projectEditor} className="tiptap-editor mb-3" />
                </>
              ) : (
                // Render HTML content when not editing
                <div dangerouslySetInnerHTML={{ __html: pageContent.projectSectionHTML }} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              {/* Data Sources Section */}
              {isEditing ? (
                <>
                  <TiptapMenuBar editor={dataSourcesEditor} />
                  <EditorContent editor={dataSourcesEditor} className="tiptap-editor mb-3" />
                </>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: pageContent.dataSourcesSectionHTML }} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              {/* Development Team Section */}
              {isEditing ? (
                <>
                  <TiptapMenuBar editor={teamEditor} />
                  <EditorContent editor={teamEditor} className="tiptap-editor mb-3" />
                </>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: pageContent.teamSectionHTML }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;