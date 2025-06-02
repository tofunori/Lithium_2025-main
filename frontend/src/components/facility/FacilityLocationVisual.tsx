import React, { useState } from 'react';

interface LocationData {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface FacilityLocationVisualProps {
  data: LocationData;
}

const FacilityLocationVisual: React.FC<FacilityLocationVisualProps> = ({ data }) => {
  const { address, latitude, longitude } = data;
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const hasCoordinates = latitude !== null && longitude !== null;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatCoordinate = (coord: number | null, type: 'lat' | 'lng') => {
    if (coord === null) return 'N/A';
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(6)}° ${direction}`;
  };

  const getMapUrl = () => {
    if (!hasCoordinates) return null;
    return `https://www.google.com/maps?q=${latitude},${longitude}&zoom=15`;
  };

  const getStreetViewUrl = () => {
    if (!hasCoordinates) return null;
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;
  };

  return (
    <div className="facility-section">
      <div className="section-header">
        <div className="section-icon">
          <i className="fas fa-map-marker-alt"></i>
        </div>
        <h3 className="section-title">Location</h3>
      </div>
      <div className="section-content">
        {/* Address */}
        {address && (
          <div className="mb-4">
            <h6 className="fw-semibold text-primary mb-2">
              <i className="fas fa-map-marker-alt me-2"></i>
              Address
            </h6>
            <p className="mb-2">{address}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm"
            >
              <i className="fas fa-external-link-alt me-1"></i>
              View on Google Maps
            </a>
          </div>
        )}

        {/* Coordinates */}
        {hasCoordinates && (
          <div className="mb-4">
            <h6 className="fw-semibold text-primary mb-3">
              <i className="fas fa-crosshairs me-2"></i>
              Coordinates
            </h6>
            <div className="row">
              <div className="col-md-6 mb-2">
                <div className="d-flex align-items-center justify-content-between bg-light rounded p-2">
                  <div>
                    <small className="text-muted d-block">Latitude</small>
                    <span className="fw-semibold">{formatCoordinate(latitude, 'lat')}</span>
                  </div>
                  <button
                    className={`copy-button ${copiedField === 'lat' ? 'copied' : ''}`}
                    onClick={() => copyToClipboard(latitude!.toString(), 'lat')}
                    title="Copy latitude"
                  >
                    {copiedField === 'lat' ? (
                      <i className="fas fa-check"></i>
                    ) : (
                      <i className="fas fa-copy"></i>
                    )}
                  </button>
                </div>
              </div>
              <div className="col-md-6 mb-2">
                <div className="d-flex align-items-center justify-content-between bg-light rounded p-2">
                  <div>
                    <small className="text-muted d-block">Longitude</small>
                    <span className="fw-semibold">{formatCoordinate(longitude, 'lng')}</span>
                  </div>
                  <button
                    className={`copy-button ${copiedField === 'lng' ? 'copied' : ''}`}
                    onClick={() => copyToClipboard(longitude!.toString(), 'lng')}
                    title="Copy longitude"
                  >
                    {copiedField === 'lng' ? (
                      <i className="fas fa-check"></i>
                    ) : (
                      <i className="fas fa-copy"></i>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2 mt-2">
              <button
                className={`copy-button ${copiedField === 'both' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(`${latitude}, ${longitude}`, 'both')}
              >
                {copiedField === 'both' ? 'Copied!' : 'Copy Both'}
              </button>
            </div>
          </div>
        )}

        {/* Map Embed */}
        {hasCoordinates && (
          <div className="facility-map">
            <iframe
              src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${latitude},${longitude}&zoom=15`}
              width="100%"
              height="400"
              style={{ border: 0, borderRadius: '12px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Facility Location"
            ></iframe>
            
            {/* Map Overlay with Actions */}
            <div className="map-overlay">
              <div className="d-flex flex-column gap-1">
                {getMapUrl() && (
                  <a
                    href={getMapUrl()!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-primary"
                    title="Open in Google Maps"
                  >
                    <i className="fas fa-external-link-alt"></i>
                  </a>
                )}
                {getStreetViewUrl() && (
                  <a
                    href={getStreetViewUrl()!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-success"
                    title="Street View"
                  >
                    <i className="fas fa-street-view"></i>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {!address && !hasCoordinates && (
          <p className="text-muted">No location information available.</p>
        )}
      </div>
    </div>
  );
};

export default FacilityLocationVisual;