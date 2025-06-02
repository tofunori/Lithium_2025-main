import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFacilityById, FullFacilityData, getFilePublicUrl } from '../services';
import { useAuth } from '../context/AuthContext';

// Import academic components
import FacilityHeaderAcademic from '../components/facility/FacilityHeaderAcademic';
import FacilityTechnicalAcademic from '../components/facility/FacilityTechnicalAcademic';
import FacilityTimelineAcademic from '../components/facility/FacilityTimelineAcademic';
import FacilityLocationAcademic from '../components/facility/FacilityLocationAcademic';
import FacilityBusinessAcademic from '../components/facility/FacilityBusinessAcademic';

import './FacilityDetailPage-Academic.css';

const FacilityDetailPageAcademic: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [facility, setFacility] = useState<FullFacilityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imagePublicUrls, setImagePublicUrls] = useState<Record<string, string>>({});

  const isAuthenticated = !!currentUser;

  useEffect(() => {
    const fetchFacility = async () => {
      if (!id) {
        setError('No facility ID provided.');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const facilityData = await getFacilityById(id);
        if (facilityData) {
          setFacility(facilityData);
        } else {
          setError('Facility not found.');
          setFacility(null);
        }
      } catch (err: any) {
        console.error("Error fetching facility details:", err);
        setError(`Failed to load facility details: ${err.message}`);
        setFacility(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [id]);

  // Effect to generate public URLs for images
  useEffect(() => {
    if (facility?.facility_images) {
      const generateUrls = async () => {
        const urls: Record<string, string> = {};
        for (const img of facility.facility_images) {
          if (img.image_url) {
            const publicUrl = await getFilePublicUrl('facility-images', img.image_url);
            if (publicUrl) {
              urls[img.image_url] = publicUrl;
            }
          }
        }
        setImagePublicUrls(urls);
      };
      generateUrls();
    } else {
      setImagePublicUrls({});
    }
  }, [facility?.facility_images]);

  const handleEdit = () => {
    if (isAuthenticated && id) {
      navigate(`/facilities/${id}/edit`);
    } else if (!isAuthenticated) {
      alert('You must be logged in to edit facilities.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container-academic">
        <div className="loading-spinner-academic">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <p className="loading-text-academic">Loading facility details...</p>
      </div>
    );
  }

  if (error && !facility) {
    return (
      <div className="error-container-academic">
        <div className="error-icon-academic">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h3>Error Loading Facility</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="error-container-academic">
        <div className="error-icon-academic">
          <i className="fas fa-question-circle"></i>
        </div>
        <h3>Facility Not Found</h3>
        <p>The requested facility could not be found.</p>
      </div>
    );
  }

  // Prepare data for academic components
  const headerData = {
    facilityId: id!,
    companyName: facility.Company,
    facilityName: facility["Facility Name/Site"],
    location: facility.Location,
    operationalStatus: facility["Operational Status"],
    capacity: facility.capacity_tonnes_per_year,
    investment: facility.facility_details?.investment_usd || null,
    jobs: facility.facility_details?.jobs || null,
    evEquivalent: facility.facility_details?.ev_equivalent_per_year || null,
    isAuthenticated,
    onEdit: handleEdit
  };

  const technicalData = {
    technology: facility["Primary Recycling Technology"],
    technologyCategory: facility.technology_category,
    capacity: facility.capacity_tonnes_per_year,
    description: facility.facility_details?.technology_description || null,
    feedstock: facility.facility_details?.feedstock || null,
    product: facility.facility_details?.product || null
  };

  const businessData = {
    investment: facility.facility_details?.investment_usd || null,
    jobs: facility.facility_details?.jobs || null,
    evEquivalent: facility.facility_details?.ev_equivalent_per_year || null,
    website: facility.facility_details?.website || null,
    environmentalImpact: facility.facility_details?.environmental_impact_details || null
  };

  const locationData = {
    address: facility.Location,
    latitude: facility.Latitude,
    longitude: facility.Longitude
  };

  const timelineEvents = facility.facility_timeline_events || [];

  return (
    <div className="facility-detail-academic">
      <FacilityHeaderAcademic {...headerData} />
      
      <div className="facility-body-academic">
        <div className="container">
          <div className="row">
            {/* Main Content */}
            <div className="col-lg-8">
              <FacilityTechnicalAcademic data={technicalData} />
              
              {facility.facility_details?.notes && (
                <div className="section-minimal">
                  <div className="section-header-minimal">
                    <div className="section-icon-minimal">
                      <i className="fas fa-sticky-note"></i>
                    </div>
                    <h3 className="section-title-minimal">Notes</h3>
                  </div>
                  <div className="section-content-minimal">
                    <div className="notes-content-academic">
                      {facility.facility_details.notes}
                    </div>
                  </div>
                </div>
              )}

              <FacilityTimelineAcademic timeline={timelineEvents} />
            </div>
            
            {/* Sidebar */}
            <div className="col-lg-4">
              <FacilityLocationAcademic data={locationData} />
              <FacilityBusinessAcademic data={businessData} />
              
              {/* Documents Section */}
              {facility.facility_documents && facility.facility_documents.length > 0 && (
                <div className="section-minimal">
                  <div className="section-header-minimal">
                    <div className="section-icon-minimal">
                      <i className="fas fa-file-alt"></i>
                    </div>
                    <h3 className="section-title-minimal">Documents</h3>
                  </div>
                  <div className="section-content-minimal">
                    <div className="documents-academic">
                      {facility.facility_documents.map((doc, index) => (
                        <div key={index} className="document-item-academic">
                          <div className="document-title-academic">{doc.title}</div>
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-academic btn-academic-secondary"
                              style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                            >
                              <i className="fas fa-external-link-alt me-1"></i>
                              View Document
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Images Section */}
              {facility.facility_images && facility.facility_images.length > 0 && (
                <div className="section-minimal">
                  <div className="section-header-minimal">
                    <div className="section-icon-minimal">
                      <i className="fas fa-images"></i>
                    </div>
                    <h3 className="section-title-minimal">Images</h3>
                  </div>
                  <div className="section-content-minimal">
                    <div className="images-academic">
                      {facility.facility_images.map((img, index) => (
                        <div key={index} className="image-item-academic">
                          {img.image_url && (
                            <img
                              src={imagePublicUrls[img.image_url] || img.image_url}
                              alt={img.alt_text || `Facility Image ${index + 1}`}
                              className="image-academic"
                              loading="lazy"
                            />
                          )}
                          {img.alt_text && (
                            <div className="image-caption-academic">{img.alt_text}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityDetailPageAcademic;