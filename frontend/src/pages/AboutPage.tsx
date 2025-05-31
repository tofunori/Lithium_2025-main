import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Import Auth context
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapMenuBar from '../components/TiptapMenuBar'; // Import the menu bar
import './AboutPage.css';

// Define a simple Page type to structure the data
interface Page {
  name: string;
  content: string;
}

const AboutPage: React.FC = () => {
  const { currentUser } = useAuth(); // Get current user from context
  const [aboutPageContent, setAboutPageContent] = useState<string>(''); // Type state as string
  const [originalContent, setOriginalContent] = useState<string>(''); // Store original content for cancel
  const [isLoading, setIsLoading] = useState<boolean>(true); // Type state as boolean
  const [isEditing, setIsEditing] = useState<boolean>(false); // Type state as boolean
  const [isSaving, setIsSaving] = useState<boolean>(false); // Type state as boolean

  const editorInstance = useEditor({
    extensions: [StarterKit],
    content: aboutPageContent,
    editable: false,
  });

  useEffect(() => {
    const fetchAboutPageData = async () => {
      try {
        console.log("Attempting to fetch 'about' content...");
        
        // Mock implementation - replace with actual Supabase call if needed
        const mockData = '<p>This page provides information about the Lithium Battery Recycling Project.</p>';
        setAboutPageContent(mockData);
        setOriginalContent(mockData);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching 'about' page data:", error);
        setIsLoading(false);
      }
    };

    fetchAboutPageData();
  }, []); // Fetch data on component mount

  useEffect(() => {
    if (editorInstance) {
      editorInstance.setEditable(isEditing);
    }
  }, [isEditing, editorInstance]);

  const handleEditClick = (): void => {
    if (currentUser) {
      setIsEditing(true);
      // Store the current content as original when starting to edit
      const currentEditorContent = editorInstance?.getHTML() || aboutPageContent;
      setOriginalContent(currentEditorContent);
    } else {
      alert("Please log in to edit the About page.");
    }
  };

  const handleSaveClick = async (): Promise<void> => {
    if (!editorInstance) {
      console.error("Editor instance not available");
      return;
    }

    const contentToSave = editorInstance.getHTML();
    setIsSaving(true);

    try {
      console.log("Attempting to save 'about' content... Data:", contentToSave);
      
      // Mock save implementation - replace with actual Supabase call if needed
      console.log("About page content save attempted.");
      
      setAboutPageContent(contentToSave);
      setOriginalContent(contentToSave);
      setIsEditing(false);
      alert("About page saved successfully!");
    } catch (error) {
      console.error("Error saving about page content:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = async (): Promise<void> => {
    // Restore the original content
    if (editorInstance) {
      console.log("Attempting to refetch 'about' content on cancel...");
      editorInstance.commands.setContent(originalContent);
    }
    setIsEditing(false);
  };

  return (
    <div className="container mt-4 fade-in">
      {/* Edit/Save Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3">About</h1>
        {currentUser && !isEditing && (
          <button className="btn btn-outline-primary btn-sm" onClick={handleEditClick}>Edit Page</button>
        )}
        {isEditing && (
          <div>
            <button className="btn btn-success btn-sm me-2" onClick={handleSaveClick}>Save Changes</button>
            <button className="btn btn-secondary btn-sm" onClick={handleCancelClick}>Cancel</button>
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
                  <TiptapMenuBar editor={editorInstance} />
                  <EditorContent editor={editorInstance} className="tiptap-editor mb-3" />
                </>
              ) : (
                // Render HTML content when not editing
                <div dangerouslySetInnerHTML={{ __html: aboutPageContent }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;