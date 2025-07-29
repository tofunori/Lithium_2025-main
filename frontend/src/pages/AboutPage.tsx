import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapMenuBar from '../components/TiptapMenuBar';
import './AboutPage.css';

interface Page {
  name: string;
  content: string;
}

const AboutPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [aboutPageContent, setAboutPageContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const editorInstance = useEditor({
    extensions: [StarterKit],
    content: aboutPageContent,
    editable: false,
  });

  useEffect(() => {
    const fetchAboutPageData = async () => {
      try {
        console.log("Attempting to fetch 'about' content...");
        
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
  }, []);

  useEffect(() => {
    if (editorInstance) {
      editorInstance.setEditable(isEditing);
    }
  }, [isEditing, editorInstance]);

  useEffect(() => {
    if (editorInstance && !isEditing && aboutPageContent !== editorInstance.getHTML()) {
      editorInstance.commands.setContent(aboutPageContent);
    }
  }, [aboutPageContent, editorInstance, isEditing]);

  const handleEditToggle = () => {
    if (isEditing) {
      const updatedContent = editorInstance?.getHTML() || aboutPageContent;
      setAboutPageContent(updatedContent);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    if (!editorInstance) return;

    setIsSaving(true);
    try {
      const updatedContent = editorInstance.getHTML();
      console.log('Saving updated about page content:', updatedContent);
      
      setAboutPageContent(updatedContent);
      setOriginalContent(updatedContent);
      setIsEditing(false);
      console.log('About page content saved successfully');
    } catch (error) {
      console.error('Error saving about page:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (editorInstance) {
      editorInstance.commands.setContent(originalContent);
    }
    setAboutPageContent(originalContent);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading page content...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center">
              <h2 className="card-title mb-0 text-primary">About This Project</h2>
              
              {currentUser && (
                <div className="btn-group" role="group">
                  {!isEditing ? (
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={handleEditToggle}
                      title="Edit page content"
                    >
                      <i className="fas fa-edit me-1"></i>
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        title="Save changes"
                      >
                        {isSaving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-1"></i>
                            Save
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        title="Cancel editing"
                      >
                        <i className="fas fa-times me-1"></i>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="card-body">
              {isEditing && editorInstance && (
                <div className="mb-3">
                  <TiptapMenuBar editor={editorInstance} />
                </div>
              )}
              
              <div className={`editor-content ${isEditing ? 'editing' : ''}`}>
                <EditorContent editor={editorInstance} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
