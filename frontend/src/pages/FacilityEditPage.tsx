import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { getFacilityById, updateFacility } from '../services';
import { useFormValidation } from '../hooks/useFormValidation';
import { facilityValidationSchema, facilityFormOptions, getInitialFacilityFormData } from '../utils/facilityValidation';
import { ValidatedInput, ValidatedSelect, FormSection, FormValidationSummary } from '../components/forms';
import LoadingSpinner from '../components/LoadingSpinner';
import FormSkeletonLoader from '../components/FormSkeletonLoader';
import TimelineFormSection from '../components/formSections/TimelineFormSection';
import MediaFormSection from '../components/formSections/MediaFormSection';
import '../components/forms/forms.css';
import './FacilityEditPage.css';

const FacilityEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { facilityId } = useParams<{ facilityId: string }>();
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [facilityNotFound, setFacilityNotFound] = useState(false);

  // Initialize form validation with empty data first
  const {
    formData,
    validation,
    isValid,
    errors,
    updateField,
    validateAllFields,
    markAllFieldsTouched,
    getFieldError,
    isFieldValid,
    isFieldTouched,
    setFormData
  } = useFormValidation({
    validationSchema: facilityValidationSchema,
    initialData: getInitialFacilityFormData(),
    validateOnChange: true,
    validateOnBlur: true
  });

  // Load facility data
  useEffect(() => {
    const loadFacility = async () => {
      if (!facilityId) {
        setFacilityNotFound(true);
        setIsLoading(false);
        return;
      }

      try {
        const facility = await getFacilityById(facilityId);
        if (!facility) {
          setFacilityNotFound(true);
          setIsLoading(false);
          return;
        }

        // Map the facility data to form data structure
        const formattedData = {
          company_name: facility.Company || '',
          facility_name_site: facility["Facility Name/Site"] || '',
          address: facility.Location || '',
          latitude: facility.Latitude !== null && facility.Latitude !== undefined ? facility.Latitude : '',
          longitude: facility.Longitude !== null && facility.Longitude !== undefined ? facility.Longitude : '',
          status_name: facility["Operational Status"] || '',
          technology_name: facility["Primary Recycling Technology"] || '',
          technology_category: facility.technology_category || '',
          processing_capacity_mt_year: facility.capacity_tonnes_per_year !== null && facility.capacity_tonnes_per_year !== undefined ? facility.capacity_tonnes_per_year : '',
          details: {
            status_effective_date_text: facility.facility_details?.status_effective_date_text || '',
            technology_description: facility.facility_details?.technology_description || '',
            feedstock: facility.facility_details?.feedstock || '',
            product: facility.facility_details?.product || '',
            website: facility.facility_details?.website || '',
            investment_usd: facility.facility_details?.investment_usd !== null && facility.facility_details?.investment_usd !== undefined ? facility.facility_details.investment_usd : '',
            jobs: facility.facility_details?.jobs !== null && facility.facility_details?.jobs !== undefined ? facility.facility_details.jobs : '',
            ev_equivalent_per_year: facility.facility_details?.ev_equivalent_per_year !== null && facility.facility_details?.ev_equivalent_per_year !== undefined ? facility.facility_details.ev_equivalent_per_year : '',
            environmental_impact_details: facility.facility_details?.environmental_impact_details || '',
            notes: facility.facility_details?.notes || ''
          },
          timeline: facility.facility_timeline_events || [],
          documents: facility.facility_documents || [],
          images: facility.facility_images?.map(img => img.image_url) || []
        };

        setFormData(formattedData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading facility:', error);
        showError('Loading Failed', 'Failed to load facility data. Please try again.');
        setFacilityNotFound(true);
        setIsLoading(false);
      }
    };

    loadFacility();
  }, [facilityId, setFormData, showError]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!facilityId) {
      showError('Error', 'Facility ID is missing.');
      return;
    }

    // Check only required fields manually
    if (!formData.company_name || formData.company_name.trim() === '') {
      showError('Validation Error', 'Company name is required.');
      // Smooth scroll to the company name field
      const companyField = document.querySelector('[name="company_name"]');
      if (companyField) {
        companyField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (companyField as HTMLInputElement).focus();
      }
      return;
    }
    
    if (!formData.status_name || formData.status_name.trim() === '') {
      showError('Validation Error', 'Operational status is required.');
      // Smooth scroll to the status field
      const statusField = document.querySelector('[name="status_name"]');
      if (statusField) {
        statusField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (statusField as HTMLInputElement).focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[FacilityEditPage] Submitting form data:', JSON.stringify(formData, null, 2));
      console.log('[FacilityEditPage] Facility ID:', facilityId);
      
      await updateFacility(facilityId, formData);
      showSuccess('Facility Updated', 'The facility has been successfully updated.');
      // Stay on the edit page instead of navigating away
      // navigate(`/facilities/${facilityId}`);
    } catch (error: any) {
      console.error('[FacilityEditPage] Error updating facility:', error);
      console.error('[FacilityEditPage] Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
        data: error.data
      });
      showError('Update Failed', error.message || 'Failed to update facility. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, facilityId, showSuccess, showError]);

  // Handle field changes with validation
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    updateField(fieldName, value);
  }, [updateField]);

  // Handle timeline item changes
  const handleTimelineChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Parse the field name to extract array index and property
    const match = name.match(/timeline\[(\d+)\]\.(\w+)/);
    if (!match) return;
    
    const [, index, field] = match;
    const idx = parseInt(index);
    
    // Update the formData.timeline array
    const updatedTimeline = [...(formData.timeline || [])];
    if (!updatedTimeline[idx]) {
      updatedTimeline[idx] = { event_date: '', event_name: '', description: '' };
    }
    
    // Map the form field names to the correct property names
    if (field === 'event_date') {
      updatedTimeline[idx].event_date = value;
    } else if (field === 'event_name') {
      updatedTimeline[idx].event_name = value;
    }
    
    // Use updateField to properly update the timeline array
    updateField('timeline', updatedTimeline);
  }, [formData.timeline, updateField]);

  // Handle adding timeline item
  const handleAddTimelineItem = useCallback(() => {
    const updatedTimeline = [...(formData.timeline || []), { event_date: '', event_name: '', description: '' }];
    updateField('timeline', updatedTimeline);
  }, [formData.timeline, updateField]);

  // Handle removing timeline item
  const handleRemoveTimelineItem = useCallback((index: number) => {
    const updatedTimeline = (formData.timeline || []).filter((_, i) => i !== index);
    updateField('timeline', updatedTimeline);
  }, [formData.timeline, updateField]);

  // Handle media form changes
  const handleMediaChange = useCallback((update: { images?: string[] }) => {
    if (update.images !== undefined) {
      updateField('images', update.images);
    }
  }, [updateField]);

  // Check if user is authenticated
  if (!currentUser) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Authentication Required</h4>
          <p>You must be logged in to edit facilities.</p>
          <Link to="/" className="btn btn-primary">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Show loading state with skeleton loader
  if (isLoading) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <FormSkeletonLoader />
          </div>
        </div>
      </div>
    );
  }

  // Show not found state
  if (facilityNotFound) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Facility Not Found</h4>
          <p>The facility you are trying to edit could not be found.</p>
          <Link to="/facilities" className="btn btn-primary">
            Back to Facilities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>
                <i className="fas fa-edit text-primary me-2"></i>
                Edit Facility
              </h2>
              <p className="text-muted">Update facility information</p>
            </div>
            <Link to={`/facilities/${facilityId}`} className="btn btn-outline-secondary">
              <i className="fas fa-arrow-left me-1"></i>
              Back to Details
            </Link>
          </div>

          {/* Form Validation Summary */}
          <FormValidationSummary 
            errors={errors} 
            isVisible={errors.length > 0}
            className="mb-4"
          />

          {/* Main Form */}
          <form onSubmit={handleSubmit} className={isSubmitting ? 'form-loading' : ''}>
            <div className="accordion" id="facilityFormAccordion">
              
              {/* Basic Information Section */}
              <FormSection
              title="Basic Information"
              description="Core details about the facility"
              icon="fas fa-info-circle"
            >
              <div className="row">
                <div className="col-md-6">
                  <ValidatedInput
                    name="company_name"
                    label="Company Name"
                    type="text"
                    value={formData.company_name}
                    onChange={handleFieldChange}
                    error={getFieldError('company_name')}
                    isValid={isFieldValid('company_name')}
                    isTouched={isFieldTouched('company_name')}
                    required
                    placeholder="e.g., Tesla, Li-Cycle, Redwood Materials"
                    helpText="The company that owns or operates this facility"
                  />
                </div>
                <div className="col-md-6">
                  <ValidatedInput
                    name="facility_name_site"
                    label="Facility Name/Site"
                    type="text"
                    value={formData.facility_name_site}
                    onChange={handleFieldChange}
                    error={getFieldError('facility_name_site')}
                    isValid={isFieldValid('facility_name_site')}
                    isTouched={isFieldTouched('facility_name_site')}
                    placeholder="e.g., Reno Gigafactory, Rochester Plant"
                    helpText="Specific name or identifier for this facility"
                  />
                </div>
              </div>

              <ValidatedInput
                name="address"
                label="Address/Location"
                type="text"
                value={formData.address}
                onChange={handleFieldChange}
                error={getFieldError('address')}
                isValid={isFieldValid('address')}
                isTouched={isFieldTouched('address')}
                placeholder="e.g., 1 Tesla Road, Austin, TX 78725"
                helpText="Full address or general location of the facility"
              />

              <div className="row">
                <div className="col-md-6">
                  <ValidatedSelect
                    name="status_name"
                    label="Operational Status"
                    value={formData.status_name}
                    onChange={handleFieldChange}
                    options={facilityFormOptions.operationalStatus}
                    error={getFieldError('status_name')}
                    isValid={isFieldValid('status_name')}
                    isTouched={isFieldTouched('status_name')}
                    required
                    placeholder="Select operational status"
                    helpText="Current operational state of the facility"
                  />
                </div>
                <div className="col-md-6">
                  <ValidatedInput
                    name="details.status_effective_date_text"
                    label="Status Effective Date"
                    type="text"
                    value={formData.details?.status_effective_date_text}
                    onChange={handleFieldChange}
                    error={getFieldError('details.status_effective_date_text')}
                    isValid={isFieldValid('details.status_effective_date_text')}
                    isTouched={isFieldTouched('details.status_effective_date_text')}
                    placeholder="e.g., Q4 2024, Operational since 2020"
                    helpText="When this status became or will become effective"
                  />
                </div>
              </div>
            </FormSection>

            {/* Technical Information Section */}
            <FormSection
              title="Technical Information"
              description="Technology and capacity details"
              icon="fas fa-cogs"
            >
              <div className="row">
                <div className="col-md-6">
                  <ValidatedSelect
                    name="technology_name"
                    label="Primary Recycling Technology"
                    value={formData.technology_name}
                    onChange={handleFieldChange}
                    options={facilityFormOptions.commonTechnologies}
                    error={getFieldError('technology_name')}
                    isValid={isFieldValid('technology_name')}
                    isTouched={isFieldTouched('technology_name')}
                    placeholder="Select technology type"
                    helpText="Main recycling technology used at this facility"
                  />
                </div>
                <div className="col-md-6">
                  <ValidatedSelect
                    name="technology_category"
                    label="Technology Category"
                    value={formData.technology_category}
                    onChange={handleFieldChange}
                    options={facilityFormOptions.technologyCategory}
                    error={getFieldError('technology_category')}
                    isValid={isFieldValid('technology_category')}
                    isTouched={isFieldTouched('technology_category')}
                    placeholder="Select category"
                    helpText="Broad category of recycling approach"
                  />
                </div>
              </div>

              <ValidatedInput
                name="details.technology_description"
                label="Technology Description"
                as="textarea"
                rows={3}
                value={formData.details?.technology_description}
                onChange={handleFieldChange}
                error={getFieldError('details.technology_description')}
                isValid={isFieldValid('details.technology_description')}
                isTouched={isFieldTouched('details.technology_description')}
                placeholder="Detailed description of the recycling technology and process..."
                helpText="Detailed explanation of the technology and processes used"
              />

              <div className="row">
                <div className="col-md-4">
                  <ValidatedInput
                    name="processing_capacity_mt_year"
                    label="Processing Capacity"
                    type="number"
                    value={formData.processing_capacity_mt_year}
                    onChange={handleFieldChange}
                    error={getFieldError('processing_capacity_mt_year')}
                    isValid={isFieldValid('processing_capacity_mt_year')}
                    isTouched={isFieldTouched('processing_capacity_mt_year')}
                    placeholder="e.g., 25000"
                    helpText="Annual capacity in metric tonnes per year"
                    step="1"
                    min="0"
                  />
                </div>
                <div className="col-md-4">
                  <ValidatedInput
                    name="details.feedstock"
                    label="Feedstock"
                    type="text"
                    value={formData.details?.feedstock}
                    onChange={handleFieldChange}
                    error={getFieldError('details.feedstock')}
                    isValid={isFieldValid('details.feedstock')}
                    isTouched={isFieldTouched('details.feedstock')}
                    placeholder="e.g., Lithium-ion batteries, Black mass"
                    helpText="Input materials processed at this facility"
                  />
                </div>
                <div className="col-md-4">
                  <ValidatedInput
                    name="details.product"
                    label="Output Products"
                    type="text"
                    value={formData.details?.product}
                    onChange={handleFieldChange}
                    error={getFieldError('details.product')}
                    isValid={isFieldValid('details.product')}
                    isTouched={isFieldTouched('details.product')}
                    placeholder="e.g., Lithium carbonate, Cobalt sulfate"
                    helpText="Products produced by this facility"
                  />
                </div>
              </div>
            </FormSection>

            {/* Location Information Section */}
            <FormSection
              title="Location Information"
              description="Geographic coordinates and location details"
              icon="fas fa-map-marker-alt"
            >
              <div className="row">
                <div className="col-md-6">
                  <ValidatedInput
                    name="latitude"
                    label="Latitude"
                    type="number"
                    value={formData.latitude}
                    onChange={handleFieldChange}
                    error={getFieldError('latitude')}
                    isValid={isFieldValid('latitude')}
                    isTouched={isFieldTouched('latitude')}
                    placeholder="e.g., 40.7128"
                    helpText="Latitude coordinate (-90 to 90)"
                    step="any"
                    min="-90"
                    max="90"
                    autoFormat="coordinate"
                  />
                </div>
                <div className="col-md-6">
                  <ValidatedInput
                    name="longitude"
                    label="Longitude"
                    type="number"
                    value={formData.longitude}
                    onChange={handleFieldChange}
                    error={getFieldError('longitude')}
                    isValid={isFieldValid('longitude')}
                    isTouched={isFieldTouched('longitude')}
                    placeholder="e.g., -74.0060"
                    helpText="Longitude coordinate (-180 to 180)"
                    step="any"
                    min="-180"
                    max="180"
                    autoFormat="coordinate"
                  />
                </div>
              </div>
            </FormSection>

            {/* Business Information Section */}
            <FormSection
              title="Business Information"
              description="Investment, employment, and impact data"
              icon="fas fa-chart-line"
              collapsible
              initiallyExpanded={false}
            >
              <div className="row">
                <div className="col-md-6">
                  <ValidatedInput
                    name="details.website"
                    label="Website"
                    type="url"
                    value={formData.details?.website}
                    onChange={handleFieldChange}
                    error={getFieldError('details.website')}
                    isValid={isFieldValid('details.website')}
                    isTouched={isFieldTouched('details.website')}
                    placeholder="https://example.com"
                    helpText="Company or facility website"
                    autoFormat="url"
                  />
                </div>
                <div className="col-md-6">
                  <ValidatedInput
                    name="details.investment_usd"
                    label="Investment Amount (USD)"
                    type="number"
                    value={formData.details?.investment_usd}
                    onChange={handleFieldChange}
                    error={getFieldError('details.investment_usd')}
                    isValid={isFieldValid('details.investment_usd')}
                    isTouched={isFieldTouched('details.investment_usd')}
                    placeholder="e.g., 5000000"
                    helpText="Total investment in USD"
                    step="1"
                    min="0"
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <ValidatedInput
                    name="details.jobs"
                    label="Number of Jobs"
                    type="number"
                    value={formData.details?.jobs}
                    onChange={handleFieldChange}
                    error={getFieldError('details.jobs')}
                    isValid={isFieldValid('details.jobs')}
                    isTouched={isFieldTouched('details.jobs')}
                    placeholder="e.g., 150"
                    helpText="Employment opportunities created"
                    step="1"
                    min="0"
                  />
                </div>
                <div className="col-md-6">
                  <ValidatedInput
                    name="details.ev_equivalent_per_year"
                    label="EV Equivalent per Year"
                    type="number"
                    value={formData.details?.ev_equivalent_per_year}
                    onChange={handleFieldChange}
                    error={getFieldError('details.ev_equivalent_per_year')}
                    isValid={isFieldValid('details.ev_equivalent_per_year')}
                    isTouched={isFieldTouched('details.ev_equivalent_per_year')}
                    placeholder="e.g., 50000"
                    helpText="Electric vehicle batteries processed annually"
                    step="1"
                    min="0"
                  />
                </div>
              </div>

              <ValidatedInput
                name="details.environmental_impact_details"
                label="Environmental Impact Details"
                as="textarea"
                rows={3}
                value={formData.details?.environmental_impact_details}
                onChange={handleFieldChange}
                error={getFieldError('details.environmental_impact_details')}
                isValid={isFieldValid('details.environmental_impact_details')}
                isTouched={isFieldTouched('details.environmental_impact_details')}
                placeholder="Describe the environmental benefits and impact of this facility..."
                helpText="Environmental benefits and sustainability impact"
              />
            </FormSection>

            {/* Additional Notes Section */}
            <FormSection
              title="Additional Information"
              description="Notes and additional details"
              icon="fas fa-sticky-note"
              collapsible
              initiallyExpanded={false}
            >
              <ValidatedInput
                name="details.notes"
                label="Notes"
                as="textarea"
                rows={4}
                value={formData.details?.notes}
                onChange={handleFieldChange}
                error={getFieldError('details.notes')}
                isValid={isFieldValid('details.notes')}
                isTouched={isFieldTouched('details.notes')}
                placeholder="Additional notes, sources, or relevant information..."
                helpText="Any additional information about this facility"
              />
            </FormSection>

            {/* Timeline Section */}
            <FormSection
              title="Timeline & Milestones"
              description="Project timeline and key milestones"
              icon="fas fa-calendar-alt"
              collapsible
              initiallyExpanded={false}
            >
              <TimelineFormSection
                data={{
                  timeline: formData.timeline?.map(item => ({
                    id: item.id,
                    date: String(item.event_date || ''),
                    event: item.event_name || '',
                    description: item.description || ''
                  }))
                }}
                onChange={handleTimelineChange}
                onAddItem={handleAddTimelineItem}
                onRemoveItem={handleRemoveTimelineItem}
                isSaving={isSubmitting}
              />
            </FormSection>

            {/* Media Section */}
            <FormSection
              title="Media"
              description="Facility images and photos"
              icon="fas fa-images"
              collapsible
              initiallyExpanded={false}
            >
              <MediaFormSection
                facilityId={facilityId}
                data={{
                  images: formData.images?.map(img => img.image_url || img) || []
                }}
                onFormDataChange={handleMediaChange}
                isSaving={isSubmitting}
              />
            </FormSection>
            
            </div> {/* End accordion */}

            {/* Form Actions */}
            <div className="d-flex justify-content-between align-items-center mt-4 pt-4 border-top">
              <Link to={`/facilities/${facilityId}`} className="btn btn-outline-secondary">
                <i className="fas fa-times me-1"></i>
                Cancel
              </Link>
              
              <div className="d-flex align-items-center">
                {!isValid && errors.length > 0 && (
                  <span className="text-danger me-3">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Please fix {errors.length} error{errors.length !== 1 ? 's' : ''}
                  </span>
                )}
                
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="me-2" />
                      Updating Facility...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-1"></i>
                      Update Facility
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Enhanced Loading Overlay */}
          {isSubmitting && (
            <div 
              className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
              style={{ 
                zIndex: 1050,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <div 
                className="text-center text-white p-4 rounded-3"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  animationDelay: '0.1s',
                  animationFillMode: 'both'
                }}
              >
                <LoadingSpinner size="lg" variant="light" />
                <div className="mt-3 fw-semibold">Updating facility...</div>
                <div className="mt-2 small opacity-75">Please wait while we save your changes</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacilityEditPage;