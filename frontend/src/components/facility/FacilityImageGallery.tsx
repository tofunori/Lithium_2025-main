import React, { useState } from 'react';

interface FacilityImage {
  id?: string;
  image_url?: string | null;
  alt_text?: string | null;
  order?: number | null;
}

interface FacilityImageGalleryProps {
  images: FacilityImage[];
  imagePublicUrls: Record<string, string>;
  title?: string;
}

const FacilityImageGallery: React.FC<FacilityImageGalleryProps> = ({
  images,
  imagePublicUrls,
  title = 'Facility Images'
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const validImages = images.filter(img => 
    img.image_url && imagePublicUrls[img.image_url]
  );

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;
    
    if (direction === 'prev') {
      setSelectedImageIndex(
        selectedImageIndex > 0 ? selectedImageIndex - 1 : validImages.length - 1
      );
    } else {
      setSelectedImageIndex(
        selectedImageIndex < validImages.length - 1 ? selectedImageIndex + 1 : 0
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateImage('prev');
    if (e.key === 'ArrowRight') navigateImage('next');
  };

  if (validImages.length === 0) {
    return (
      <div className="facility-section">
        <div className="section-header">
          <div className="section-icon">
            <i className="fas fa-images"></i>
          </div>
          <h3 className="section-title">{title}</h3>
        </div>
        <div className="section-content">
          <p className="text-muted">No images available for this facility.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="facility-section">
        <div className="section-header">
          <div className="section-icon">
            <i className="fas fa-images"></i>
          </div>
          <h3 className="section-title">{title}</h3>
          <span className="badge bg-primary ms-auto">{validImages.length}</span>
        </div>
        <div className="section-content">
          <div className="image-gallery">
            {validImages.map((image, index) => (
              <div
                key={image.id || index}
                className="gallery-item"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={imagePublicUrls[image.image_url!]}
                  alt={image.alt_text || `Facility image ${index + 1}`}
                  loading="lazy"
                />
                <div className="gallery-overlay">
                  <i className="fas fa-search-plus view-icon"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImageIndex !== null && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content bg-transparent border-0">
              <div className="modal-header border-0 position-absolute top-0 end-0 z-index-1">
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeLightbox}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body p-0 text-center">
                <img
                  src={imagePublicUrls[validImages[selectedImageIndex].image_url!]}
                  alt={validImages[selectedImageIndex].alt_text || `Facility image ${selectedImageIndex + 1}`}
                  className="img-fluid"
                  style={{ maxHeight: '90vh', width: 'auto' }}
                />
                
                {/* Navigation Arrows */}
                {validImages.length > 1 && (
                  <>
                    <button
                      className="btn btn-light position-absolute top-50 start-0 translate-middle-y ms-3 rounded-circle"
                      style={{ width: '50px', height: '50px' }}
                      onClick={() => navigateImage('prev')}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <button
                      className="btn btn-light position-absolute top-50 end-0 translate-middle-y me-3 rounded-circle"
                      style={{ width: '50px', height: '50px' }}
                      onClick={() => navigateImage('next')}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </>
                )}
                
                {/* Image Counter */}
                <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3">
                  <span className="badge bg-dark bg-opacity-75 px-3 py-2">
                    {selectedImageIndex + 1} of {validImages.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FacilityImageGallery;