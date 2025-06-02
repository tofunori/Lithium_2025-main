import React, { useState } from 'react';

interface LocationData {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface FacilityLocationAcademicProps {
  data: LocationData;
}

const FacilityLocationAcademic: React.FC<FacilityLocationAcademicProps> = ({ data }) => {
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

  const formatCoordinate = (coord: number | null) => {
    if (coord === null) return 'N/A';
    return coord.toFixed(6);
  };

  const hasLocationData = address || hasCoordinates;

  if (!hasLocationData) {
    return (
      <div className="section-minimal">
        <div className="section-header-minimal">
          <div className="section-icon-minimal">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <h3 className="section-title-minimal">Location</h3>
        </div>
        <div className="section-content-minimal">
          <p className="text-muted">No location information available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-minimal">
      <div className="section-header-minimal">
        <div className="section-icon-minimal">
          <i className="fas fa-map-marker-alt"></i>
        </div>
        <h3 className="section-title-minimal">Location</h3>
      </div>
      <div className="section-content-minimal">
        {/* Address */}
        {address && (
          <div className="data-row">
            <div className="data-label">Address</div>
            <div className="data-value">{address}</div>
          </div>
        )}

        {/* Coordinates */}
        {hasCoordinates && (
          <>
            <div className="coordinates-academic">
              <div className="coordinate-item-academic">
                <div className="coordinate-label-academic">Latitude</div>
                <div className="coordinate-value-academic">{formatCoordinate(latitude)}</div>
                <button
                  className={`copy-btn-academic ${copiedField === 'lat' ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(latitude!.toString(), 'lat')}
                  title="Copy latitude"
                >
                  {copiedField === 'lat' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="coordinate-item-academic">
                <div className="coordinate-label-academic">Longitude</div>
                <div className="coordinate-value-academic">{formatCoordinate(longitude)}</div>
                <button
                  className={`copy-btn-academic ${copiedField === 'lng' ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(longitude!.toString(), 'lng')}
                  title="Copy longitude"
                >
                  {copiedField === 'lng' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            
            <div className="text-center mt-3">
              <button
                className={`copy-btn-academic ${copiedField === 'both' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(`${latitude}, ${longitude}`, 'both')}
              >
                {copiedField === 'both' ? 'Copied!' : 'Copy Both Coordinates'}
              </button>
            </div>
          </>
        )}

        {/* Map Links */}
        {hasCoordinates && (
          <div className="mt-3">
            <div className="data-row">
              <div className="data-label">External Maps</div>
              <div className="data-value">
                <div className="d-flex gap-2 flex-wrap">
                  <a
                    href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-academic btn-academic-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                  >
                    <i className="fas fa-external-link-alt me-1"></i>
                    Google Maps
                  </a>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-academic btn-academic-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                  >
                    <i className="fas fa-external-link-alt me-1"></i>
                    OpenStreetMap
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {address && !hasCoordinates && (
          <div className="mt-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-academic btn-academic-secondary"
            >
              <i className="fas fa-external-link-alt me-1"></i>
              View on Google Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilityLocationAcademic;