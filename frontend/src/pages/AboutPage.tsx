import React, { useState, useEffect } from 'react';
// import { db } from '../firebase'; // Import Firestore instance - REMOVED
import { useAuth } from '../context/AuthContext'; // Updated import path if necessary
import { useEditor, EditorContent, Editor } from '@tiptap/react'; // Tiptap imports
import StarterKit from '@tiptap/starter-kit'; // Tiptap basic extensions
import TiptapMenuBar from '../components/TiptapMenuBar'; // Import the menu bar
// import { doc, getDoc, setDoc, DocumentData } from 'firebase/firestore'; - REMOVED
// import { User } from 'firebase/auth'; // Import User type - REMOVED (Assuming User type is no longer needed or comes from context)
import './AboutPage.css';

// Interface for the page content state and Firestore data
interface PageContentState {
  projectSectionHTML: string;
  dataSourcesSectionHTML: string;
  teamSectionHTML: string;
}

const AboutPage: React.FC = () => {
  // Type the currentUser from context - Assuming useAuth provides a non-Firebase User type now or null
  const { currentUser }: { currentUser: any | null } = useAuth(); // Adjusted type placeholder
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // Type the page content state
  const [pageContent, setPageContent] = useState<PageContentState>({
    projectSectionHTML: `<h2>About This Project</h2><p>This dashboard provides an interactive overview of lithium battery recycling facilities across North America. It aims to consolidate information about facility locations, operational status, processing capacities, and more.</p><p>[Add more detailed project description here...]</p>`,
    dataSourcesSectionHTML: `<h2>Data Sources</h2><p>The data presented in this dashboard is compiled from various public sources, including company press releases, government reports, and industry publications.</p><ul><li>[List specific data sources here, e.g., EPA reports, company websites]</li><li>[Mention data update frequency or limitations if applicable]</li></ul>`,
    teamSectionHTML: `<h2>Development Team</h2><p>This project was developed by:</p><ul><li>[Team Member 1 Name/Role]</li><li>[Team Member 2 Name/Role]</li><li>[Add more team members as needed]</li></ul><p>[Optionally add links to profiles or contact info]</p>`
  });

  // Fetch content from Firestore - THIS WILL BE BROKEN
  useEffect(() => {
    const fetchContent = async () => {
      console.log("Attempting to fetch 'about' content (Firebase logic removed)...");
      // const docRef = doc(db, 'content', 'about'); // REMOVED
      // const docSnap = await getDoc(docRef); // REMOVED
      // if (docSnap.exists()) { // REMOVED
      //   const fetchedData = docSnap.data() as PageContentState; // REMOVED
      //   setPageContent(fetchedData); // REMOVED
      //   // Update editor content after state is set
      //   setTimeout(() => {
      //       projectEditor?.commands.setContent(fetchedData.projectSectionHTML || '', false);
      //       dataSourcesEditor?.commands.setContent(fetchedData.dataSourcesSectionHTML || '', false);
      //       teamEditor?.commands.setContent(fetchedData.teamSectionHTML || '', false);
      //   }, 0);
      // } else { // REMOVED
        console.log("No 'about' content document found or fetch logic removed. Using default.");
        // Initialize editors with default content if doc doesn't exist or fetch failed
         setTimeout(() => {
            projectEditor?.commands.setContent(pageContent.projectSectionHTML, false);
            dataSourcesEditor?.commands.setContent(pageContent.dataSourcesSectionHTML, false);
            teamEditor?.commands.setContent(pageContent.teamSectionHTML, false);
        }, 0);
      // } // REMOVED
    };
    fetchContent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Tiptap Editor Instances - Type the editor in onUpdate
  const projectEditor = useEditor({
    extensions: [StarterKit],
    content: pageContent.projectSectionHTML,
    onUpdate: ({ editor }: { editor: Editor }) => {
      setPageContent(prev => ({ ...prev, projectSectionHTML: editor.getHTML() }));
    },
  });

  const dataSourcesEditor = useEditor({
    extensions: [StarterKit],
    content: pageContent.dataSourcesSectionHTML,
    onUpdate: ({ editor }: { editor: Editor }) => {
      setPageContent(prev => ({ ...prev, dataSourcesSectionHTML: editor.getHTML() }));
    },
  });

  const teamEditor = useEditor({
    extensions: [StarterKit],
    content: pageContent.teamSectionHTML,
    onUpdate: ({ editor }: { editor: Editor }) => {
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
     // Refetch content on cancel to discard changes - THIS WILL BE BROKEN
     console.log("Attempting to refetch 'about' content on cancel (Firebase logic removed)...");
     // const docRef = doc(db, 'content', 'about'); // REMOVED
     // const docSnap = await getDoc(docRef); // REMOVED
     // if (docSnap.exists()) { // REMOVED
     //   const fetchedData = docSnap.data() as PageContentState; // REMOVED
     //   setPageContent(fetchedData); // REMOVED
     //   // Update editor content directly after fetching and setting state on cancel
     //   setTimeout(() => {
     //       projectEditor?.commands.setContent(fetchedData.projectSectionHTML || '', false);
     //       dataSourcesEditor?.commands.setContent(fetchedData.dataSourcesSectionHTML || '', false);
     //       teamEditor?.commands.setContent(fetchedData.teamSectionHTML || '', false);
     //    }, 0);
     // } // REMOVED
    setIsEditing(false);
  }
  const handleSave = async () => {
    // const docRef = doc(db, 'content', 'about'); // REMOVED
    try {
      // Type the content to save
      const contentToSave: PageContentState = {
        projectSectionHTML: projectEditor?.getHTML() || '',
        dataSourcesSectionHTML: dataSourcesEditor?.getHTML() || '',
        teamSectionHTML: teamEditor?.getHTML() || '',
      };
      // await setDoc(docRef, contentToSave, { merge: true }); // REMOVED
      console.log("Attempting to save 'about' content (Firebase logic removed)... Data:", contentToSave);
      // setPageContent(contentToSave); // Update local state with saved content - Keep this? Or rely on cancel/refetch? Let's keep it for now.
      console.log("About page content save attempted (Firebase logic removed).");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving about page content (Firebase logic removed):", error);
      alert("Failed to save changes (Firebase logic removed). Please try again.");
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