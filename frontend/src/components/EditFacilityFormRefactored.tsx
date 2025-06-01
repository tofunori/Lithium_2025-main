// frontend/src/components/EditFacilityFormRefactored.tsx
import React, { useEffect, FC } from 'react';
import { FullFacilityData, updateFacility } from '../services';
import { useComprehensiveFormValidation } from '../hooks/useComprehensiveFormValidation';
import { ComprehensiveFacilityFormData } from '../types/form';
import { useToastContext } from '../context/ToastContext';

// Import form section components
import BasicInfoFormSection from './formSections/BasicInfoFormSection';
import TechnicalFormSection from './formSections/TechnicalFormSection';
import MediaFormSection from './formSections/MediaFormSection';
import TimelineFormSection from './formSections/TimelineFormSection';
import DocumentsFormSection from './formSections/DocumentsFormSection';
import EnvironmentalFormSection from './formSections/EnvironmentalFormSection';
import InvestmentFormSection from './formSections/InvestmentFormSection';
import ContactFormSection from './formSections/ContactFormSection';

import './EditFacilityForm.css';

interface EditFacilityFormRefactoredProps {
  facility: FullFacilityData | null;
  onSaveSuccess: (updatedFacilityData: FullFacilityData) => void;
  onCancel: () => void;
  show: boolean;
}

const EditFacilityFormRefactored: FC<EditFacilityFormRefactoredProps> = ({ 
  facility, 
  onSaveSuccess, 
  onCancel, 
  show 
}) => {
  const { showSuccess, showError } = useToastContext();

  // Convert FullFacilityData to form structure
  const convertFacilityToFormData = (facilityData: FullFacilityData): ComprehensiveFacilityFormData => {
    return {
      // Core facility information
      id: facilityData.ID,
      company_name: facilityData.Company || '',
      facility_name_site: facilityData['Facility Name/Site'] || '',
      address: facilityData.Location || '',
      
      // Status and operational info
      status_name: facilityData['Operational Status'] || 'Planned',
      status_effective_date_text: facilityData.facility_details?.status_effective_date_text || '',
      
      // Technical specifications
      processing_capacity_mt_year: facilityData.capacity_tonnes_per_year || '',
      technology_name: facilityData['Primary Recycling Technology'] || '',
      technology_description: facilityData.facility_details?.technology_description || '',
      technology_category: facilityData.technology_category || '',
      feedstock: facilityData.facility_details?.feedstock || '',
      product: facilityData.facility_details?.product || '',
      
      // Location coordinates
      latitude: facilityData.Latitude,
      longitude: facilityData.Longitude,
      
      // Economic impact
      ev_equivalent_per_year: facilityData.facility_details?.ev_equivalent_per_year || '',
      jobs: facilityData.facility_details?.jobs || '',
      investment: { 
        total: facilityData.facility_details?.investment_usd || '' 
      },
      
      // Contact and web presence
      website: facilityData.facility_details?.website || '',
      
      // Additional information
      notes: facilityData.facility_details?.notes || '',
      environmental_impact: { 
        details: facilityData.facility_details?.environmental_impact_details || '' 
      },
      
      // Related data arrays
      timeline: facilityData.facility_timeline_events?.map(event => ({
        id: event.id,
        date: event.event_date || '',
        event: event.event_name || '',
        description: event.description || ''
      })) || [{ date: '', event: '', description: '' }],
      
      documents: facilityData.facility_documents?.map(doc => ({
        id: doc.id,
        title: doc.title || '',
        url: doc.url || ''
      })) || [{ title: '', url: '' }],
      
      images: facilityData.facility_images?.map(img => img.image_url || '') || ['']
    };
  };

  // Initialize form with facility data
  const initialFormData = facility ? convertFacilityToFormData(facility) : {};
  
  const {
    formData,
    isDirty,
    isSubmitting,
    errors,
    isValid,
    updateField,
    getFieldError,
    isFieldTouched,
    getFieldValue,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
    handleSubmit,
    resetForm
  } = useComprehensiveFormValidation(initialFormData);

  // Reset form when facility changes
  useEffect(() => {
    if (facility) {
      resetForm(convertFacilityToFormData(facility));
    }
  }, [facility, resetForm]);

  // Handle form submission
  const onSubmit = async (data: ComprehensiveFacilityFormData) => {
    if (!data.id) {
      throw new Error('Facility ID is required for updates');
    }

    // Convert form data back to service format
    const updateData = {
      id: data.id,
      company_name: data.company_name,
      facility_name_site: data.facility_name_site,
      address: data.address,
      status_name: data.status_name,
      technology_name: data.technology_name,
      technology_category: data.technology_category,
      processing_capacity_mt_year: data.processing_capacity_mt_year,
      latitude: data.latitude,
      longitude: data.longitude,
      
      details: {
        technology_description: data.technology_description,
        notes: data.notes,
        website: data.website,
        feedstock: data.feedstock,
        product: data.product,
        investment_usd: typeof data.investment?.total === 'string' ? data.investment.total : String(data.investment?.total || ''),
        jobs: data.jobs,
        ev_equivalent_per_year: data.ev_equivalent_per_year,
        environmental_impact_details: data.environmental_impact?.details,
        status_effective_date_text: data.status_effective_date_text
      },
      
      timeline: data.timeline?.map(item => ({
        event_date: item.date,
        event_name: item.event,
        description: item.description
      })),
      
      documents: data.documents?.map(doc => ({
        title: doc.title,
        url: doc.url
      })),
      
      images: data.images?.map((url, index) => ({
        image_url: url,
        alt_text: `Facility Image ${index + 1}`,
        order: index
      }))
    };

    await updateFacility(data.id, updateData);
    
    // Create updated facility data for callback
    const updatedFacility: FullFacilityData = {
      ...facility!,
      Company: data.company_name || null,
      'Facility Name/Site': data.facility_name_site || null,
      Location: data.address || null,
      'Operational Status': data.status_name || null,
      'Primary Recycling Technology': data.technology_name || null,
      technology_category: data.technology_category || null,
      capacity_tonnes_per_year: data.processing_capacity_mt_year ? Number(data.processing_capacity_mt_year) : null,
      Latitude: data.latitude ? Number(data.latitude) : null,
      Longitude: data.longitude ? Number(data.longitude) : null,
      facility_details: {
        facility_id: data.id,
        ...updateData.details
      }
    };
    
    onSaveSuccess(updatedFacility);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await handleSubmit(onSubmit);
    
    if (result.success) {
      showSuccess('Facility updated successfully!');
    } else {
      showError('Failed to update facility', Object.values(result.errors || {}).join(', '));
    }
  };

  // Timeline handlers
  const addTimelineItem = () => {
    addArrayItem('timeline', { date: '', event: '', description: '' });
  };

  const removeTimelineItem = (index: number) => {
    removeArrayItem('timeline', index);
  };

  // Document handlers
  const addDocumentItem = () => {
    addArrayItem('documents', { title: '', url: '' });
  };

  const removeDocumentItem = (index: number) => {
    removeArrayItem('documents', index);
  };

  // Image upload handler
  const handleImageUploadComplete = (updatedImageUrls: string[]) => {
    updateField('images', updatedImageUrls);
  };

  // Generic change handler for form fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    updateField(name, fieldValue);
  };

  if (!show) return null;

  return (
    <div className="edit-facility-form">
      <form onSubmit={handleFormSubmit}>
        <div className="form-sections">
          {/* Basic Information Section */}
          <BasicInfoFormSection
            data={{
              company: getFieldValue('company_name') || '',
              location: getFieldValue('address') || '',
              status: getFieldValue('status_name') || ''
            }}
            onChange={handleChange}
            isSaving={isSubmitting}
          />

          {/* Technical Details Section */}
          <TechnicalFormSection
            data={{
              processing_capacity_mt_year: getFieldValue('processing_capacity_mt_year'),
              technology_name: getFieldValue('technology_name'),
              feedstock: getFieldValue('feedstock'),
              product: getFieldValue('product'),
              technology_description: getFieldValue('technology_description')
            }}
            onChange={handleChange}
            isSaving={isSubmitting}
          />

          {/* Investment Section */}
          <InvestmentFormSection
            value={getFieldValue('investment.total')}
            onChange={handleChange}
            isSaving={isSubmitting}
          />

          {/* Contact Section */}
          <ContactFormSection
            data={{
              website: getFieldValue('website') || '',
              contactPerson: getFieldValue('contact.person') || '',
              contactEmail: getFieldValue('contact.email') || '',
              contactPhone: getFieldValue('contact.phone') || ''
            }}
            onChange={handleChange}
            isSaving={isSubmitting}
          />

          {/* Timeline Section */}
          <TimelineFormSection
            data={{ timeline: formData.timeline || [] }}
            onChange={handleChange}
            onAddItem={addTimelineItem}
            onRemoveItem={removeTimelineItem}
            isSaving={isSubmitting}
          />

          {/* Documents Section */}
          <DocumentsFormSection
            data={{ documents: formData.documents || [] }}
            onChange={handleChange}
            onAddItem={addDocumentItem}
            onRemoveItem={removeDocumentItem}
            isSaving={isSubmitting}
          />

          {/* Media Section */}
          <MediaFormSection
            facilityId={formData.id || ''}
            data={{ images: formData.images || [] }}
            onFormDataChange={({ images }) => {
              if (images) handleImageUploadComplete(images);
            }}
            isSaving={isSubmitting}
          />

          {/* Environmental Impact Section */}
          <EnvironmentalFormSection
            value={getFieldValue('environmental_impact.details')}
            onChange={handleChange}
            isSaving={isSubmitting}
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions mt-4">
          <button
            type="submit"
            className="btn btn-primary me-2"
            disabled={isSubmitting || !isValid || !isDirty}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin me-1"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save me-1"></i>
                Save Changes
              </>
            )}
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <i className="fas fa-times me-1"></i>
            Cancel
          </button>
        </div>

        {/* Error Display */}
        {Object.keys(errors).length > 0 && (
          <div className="alert alert-danger mt-3">
            <h6>Please fix the following errors:</h6>
            <ul className="mb-0">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
};

export default EditFacilityFormRefactored;