import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Location } from 'react-router-dom';
import {
    getFacilityById,
    updateFacility,
    FullFacilityData,
    FacilityFormData,
    FacilityTimelineEvent,
    FacilityDocument,
    FacilityImage,
    getFilePublicUrl
} from '../services';
import { useAuth } from '../context/AuthContext';

// Import enhanced visual components
import FacilityHero from '../components/facility/FacilityHero';
import FacilityTimelineVisual from '../components/facility/FacilityTimelineVisual';
import FacilityTechnicalVisual from '../components/facility/FacilityTechnicalVisual';
import FacilityImageGallery from '../components/facility/FacilityImageGallery';
import FacilityLocationVisual from '../components/facility/FacilityLocationVisual';
import FacilityBusinessVisual from '../components/facility/FacilityBusinessVisual';

// Note: For full editing functionality, users will be redirected to the dedicated edit page

import './FacilityDetailPage-New.css';

interface LocationState {
    activeTab?: string;
}

const FacilityDetailPageEnhanced: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation() as Location<LocationState | undefined>;
  const { currentUser } = useAuth();

  const [facility, setFacility] = useState<FullFacilityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<FacilityFormData | null>(null);
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

  useEffect(() => {
    if (facility?.facility_images && !isEditing) {
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
    } else if (!isEditing) {
      setImagePublicUrls({});
    }
  }, [facility?.facility_images, isEditing]);

  const prepareFormData = (facilityData: FullFacilityData): FacilityFormData => {
    return {
      id: facilityData.ID,
      company_name: facilityData.Company ?? '',
      facility_name_site: facilityData["Facility Name/Site"] ?? '',
      address: facilityData.Location ?? '',
      status_name: facilityData["Operational Status"] ?? 'Planned',
      technology_name: facilityData["Primary Recycling Technology"] ?? '',
      technology_category: facilityData.technology_category ?? '',
      processing_capacity_mt_year: facilityData.capacity_tonnes_per_year ?? '',
      latitude: facilityData.Latitude ?? '',
      longitude: facilityData.Longitude ?? '',
      details: {
        technology_description: facilityData.facility_details?.technology_description ?? '',
        notes: facilityData.facility_details?.notes ?? '',
        website: facilityData.facility_details?.website ?? '',
        feedstock: facilityData.facility_details?.feedstock ?? '',
        product: facilityData.facility_details?.product ?? '',
        investment_usd: facilityData.facility_details?.investment_usd ?? '',
        jobs: facilityData.facility_details?.jobs ?? '',
        ev_equivalent_per_year: facilityData.facility_details?.ev_equivalent_per_year ?? '',
        environmental_impact_details: facilityData.facility_details?.environmental_impact_details ?? '',
        status_effective_date_text: facilityData.facility_details?.status_effective_date_text ?? '',
      },
      timeline: facilityData.facility_timeline_events?.map(event => ({
        ...event,
        event_date: event.event_date ? String(event.event_date) : null
      })) || [{ event_date: '', event_name: '', description: '' }],
      documents: facilityData.facility_documents?.length > 0
        ? facilityData.facility_documents
        : [{ title: '', url: '' }],
      images: facilityData.facility_images?.length > 0
        ? facilityData.facility_images
        : [{ image_url: '', alt_text: '', order: 0 }],
    };
  };

  const handleEdit = () => {
    if (isAuthenticated && facility) {
      const initialFormData = prepareFormData(facility);
      setEditFormData(initialFormData);
      setIsEditing(true);
    } else if (!isAuthenticated) {
      alert('You must be logged in to edit facilities.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditFormData(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!editFormData || !id) return;

    setIsSaving(true);
    setError(null);
    try {
      await updateFacility(id, editFormData);
      
      // Update local state
      const updatedFacilityState: FullFacilityData = {
        ID: editFormData.id!,
        Company: editFormData.company_name ?? null,
        "Facility Name/Site": editFormData.facility_name_site ?? null,
        Location: editFormData.address ?? null,
        "Operational Status": editFormData.status_name ?? null,
        "Primary Recycling Technology": editFormData.technology_name ?? null,
        technology_category: editFormData.technology_category ?? null,
        capacity_tonnes_per_year: editFormData.processing_capacity_mt_year ? Number(editFormData.processing_capacity_mt_year) : null,
        Latitude: editFormData.latitude ? Number(editFormData.latitude) : null,
        Longitude: editFormData.longitude ? Number(editFormData.longitude) : null,
        created_at: facility?.created_at,
        facility_details: editFormData.details ? {
          facility_id: editFormData.id!,
          technology_description: editFormData.details.technology_description ?? null,
          notes: editFormData.details.notes ?? null,
          website: editFormData.details.website ?? null,
          feedstock: editFormData.details.feedstock ?? null,
          product: editFormData.details.product ?? null,
          investment_usd: editFormData.details.investment_usd !== null && editFormData.details.investment_usd !== undefined ? String(editFormData.details.investment_usd) : null,
          jobs: editFormData.details.jobs ? Number(editFormData.details.jobs) : null,
          ev_equivalent_per_year: editFormData.details.ev_equivalent_per_year ? Number(editFormData.details.ev_equivalent_per_year) : null,
          environmental_impact_details: editFormData.details.environmental_impact_details ?? null,
          status_effective_date_text: editFormData.details.status_effective_date_text ?? null,
        } : null,
        facility_timeline_events: editFormData.timeline || [],
        facility_documents: editFormData.documents || [],
        facility_images: editFormData.images || [],
      };

      setFacility(updatedFacilityState);
      setIsEditing(false);
      setEditFormData(null);
      alert('Facility updated successfully!');
    } catch (err: any) {
      console.error("Error saving facility:", err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to save changes: ${message}`);
      alert(`Error saving: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Form change handlers (complete implementations)
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let processedValue: string | number | boolean | null = type === 'checkbox' ? checked : value;
    const isNumericDetailField = ['details.jobs', 'details.ev_equivalent_per_year'].includes(name);
    const isCoordField = ['latitude', 'longitude'].includes(name);
    const isCapacityField = name === 'processing_capacity_mt_year';

    if (type === 'number' || isNumericDetailField || isCoordField || isCapacityField) {
      processedValue = value === '' ? '' : (isCoordField ? parseFloat(value) : Number(value));
    }

    setEditFormData(prevData => {
      if (!prevData) return null;

      if (name.startsWith('details.')) {
        const detailKey = name.split('.')[1] as keyof NonNullable<FacilityFormData['details']>;
        const newDetails = {
          ...(prevData.details || {}),
          [detailKey]: processedValue,
        };
        return {
          ...prevData,
          details: newDetails,
        };
      }

      const topLevelKey = name as keyof FacilityFormData;
      if (topLevelKey in prevData) {
        return {
          ...prevData,
          [topLevelKey]: processedValue,
        };
      }
      return prevData;
    });
  };

  const handleMediaFormChange = (update: Partial<{ images: string[] }>): void => {
    setEditFormData(prevData => {
      if (!prevData) return null;
      if (update.images !== undefined) {
        const newImages = update.images.map((url, index) => ({
          id: undefined,
          facility_id: id,
          image_url: url,
          alt_text: `Facility Image ${index + 1}`,
          order: index
        }));
        return {
          ...prevData,
          images: newImages,
        };
      }
      return prevData;
    });
  };

  const addTimelineItem = (): void => {
    setEditFormData(prevData => {
      if (!prevData) return null;
      const newTimeline = [...(prevData.timeline || []), { event_date: '', event_name: '', description: '' }];
      return { ...prevData, timeline: newTimeline };
    });
  };

  const removeTimelineItem = (index: number): void => {
    setEditFormData(prevData => {
      if (!prevData || !prevData.timeline) return prevData;
      const updatedTimeline = prevData.timeline.filter((_, i) => i !== index);
      return { ...prevData, timeline: updatedTimeline };
    });
  };

  const addDocumentItem = (): void => {
    setEditFormData(prevData => {
      if (!prevData) return null;
      const newDocuments = [...(prevData.documents || []), { title: '', url: '' }];
      return { ...prevData, documents: newDocuments };
    });
  };

  const removeDocumentItem = (index: number): void => {
    setEditFormData(prevData => {
      if (!prevData || !prevData.documents) return prevData;
      const updatedDocuments = prevData.documents.filter((_, i) => i !== index);
      return { ...prevData, documents: updatedDocuments };
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="text-center">
          <div className="skeleton-loader" style={{ width: '200px', height: '20px', margin: '0 auto 1rem' }}></div>
          <div className="skeleton-loader" style={{ width: '300px', height: '40px', margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  if (error && !facility) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="container mt-4">
        <p>Facility data not available.</p>
      </div>
    );
  }

  const displayData = facility;
  const formDataForEdit = editFormData;

  if (isEditing) {
    // Show simplified editing interface
    return (
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-header">
            <h4>Editing: {displayData.Company} - {displayData["Facility Name/Site"]}</h4>
          </div>
          <div className="card-body">
            <p className="text-info">
              <i className="fas fa-info-circle me-2"></i>
              Editing mode is temporarily simplified. Use the dedicated edit page for full functionality.
            </p>
            <div className="d-flex gap-2">
              <button onClick={handleCancel} className="btn btn-secondary" disabled={isSaving}>
                <i className="fas fa-arrow-left me-1"></i>
                Back to View Mode
              </button>
              <a href={`/facilities/edit/${id}`} className="btn btn-primary">
                <i className="fas fa-edit me-1"></i>
                Go to Full Edit Page
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="facility-detail-enhanced">
      {/* Hero Section */}
      <FacilityHero
        facilityId={id!}
        companyName={displayData.Company}
        facilityName={displayData["Facility Name/Site"]}
        location={displayData.Location}
        operationalStatus={displayData["Operational Status"]}
        technology={displayData["Primary Recycling Technology"]}
        capacity={displayData.capacity_tonnes_per_year}
        investment={displayData.facility_details?.investment_usd}
        jobs={displayData.facility_details?.jobs}
        evEquivalent={displayData.facility_details?.ev_equivalent_per_year}
        isAuthenticated={isAuthenticated}
        isEditing={isEditing}
        isSaving={isSaving}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      {/* Main Content */}
      <div className="container facility-content">
        <div className="row">
          <div className="col-lg-8">
            {/* Technical Details */}
            <FacilityTechnicalVisual
              data={{
                technology: displayData["Primary Recycling Technology"],
                technologyCategory: displayData.technology_category,
                capacity: displayData.capacity_tonnes_per_year,
                description: displayData.facility_details?.technology_description,
                feedstock: displayData.facility_details?.feedstock,
                product: displayData.facility_details?.product,
              }}
            />

            {/* Timeline */}
            <FacilityTimelineVisual
              timeline={displayData.facility_timeline_events || []}
            />

            {/* Image Gallery */}
            <FacilityImageGallery
              images={displayData.facility_images || []}
              imagePublicUrls={imagePublicUrls}
            />
          </div>

          <div className="col-lg-4">
            {/* Location */}
            <FacilityLocationVisual
              data={{
                address: displayData.Location,
                latitude: displayData.Latitude,
                longitude: displayData.Longitude,
              }}
            />

            {/* Business Impact */}
            <FacilityBusinessVisual
              data={{
                investment: displayData.facility_details?.investment_usd,
                jobs: displayData.facility_details?.jobs,
                evEquivalent: displayData.facility_details?.ev_equivalent_per_year,
                website: displayData.facility_details?.website,
                environmentalImpact: displayData.facility_details?.environmental_impact_details,
              }}
            />

            {/* Additional Notes */}
            {displayData.facility_details?.notes && (
              <div className="facility-section">
                <div className="section-header">
                  <div className="section-icon">
                    <i className="fas fa-sticky-note"></i>
                  </div>
                  <h3 className="section-title">Additional Notes</h3>
                </div>
                <div className="section-content">
                  <div className="bg-light rounded p-3">
                    <p className="mb-0">{displayData.facility_details.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityDetailPageEnhanced;