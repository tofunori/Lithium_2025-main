import React from 'react';
import { Editor } from '@tiptap/react'; // Import the Editor type

// Define the props interface
interface TiptapMenuBarProps {
  editor: Editor | null;
}

const TiptapMenuBar: React.FC<TiptapMenuBarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-menu-bar mb-2 p-2 border rounded">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`btn btn-sm me-1 ${editor.isActive('bold') ? 'btn-primary' : 'btn-outline-secondary'}`}
        type="button" // Prevent form submission if nested
        title="Bold"
      >
        <i className="bi bi-type-bold"></i> {/* Using Bootstrap Icons */}
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`btn btn-sm me-1 ${editor.isActive('italic') ? 'btn-primary' : 'btn-outline-secondary'}`}
        type="button"
        title="Italic"
      >
        <i className="bi bi-type-italic"></i>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={!editor.can().chain().focus().toggleBulletList().run()}
        className={`btn btn-sm me-1 ${editor.isActive('bulletList') ? 'btn-primary' : 'btn-outline-secondary'}`}
        type="button"
        title="Bullet List"
      >
        <i className="bi bi-list-ul"></i>
      </button>
       <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={!editor.can().chain().focus().toggleOrderedList().run()}
        className={`btn btn-sm me-1 ${editor.isActive('orderedList') ? 'btn-primary' : 'btn-outline-secondary'}`}
        type="button"
        title="Numbered List"
      >
        <i className="bi bi-list-ol"></i>
      </button>
       <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()}
        className={`btn btn-sm me-1 ${editor.isActive('heading', { level: 2 }) ? 'btn-primary' : 'btn-outline-secondary'}`}
        type="button"
        title="Heading 2"
      >
        H2
      </button>
       <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        disabled={!editor.can().chain().focus().toggleHeading({ level: 3 }).run()}
        className={`btn btn-sm me-1 ${editor.isActive('heading', { level: 3 }) ? 'btn-primary' : 'btn-outline-secondary'}`}
        type="button"
        title="Heading 3"
      >
        H3
      </button>
      {/* Add more buttons as needed */}
    </div>
  );
};

export default TiptapMenuBar;