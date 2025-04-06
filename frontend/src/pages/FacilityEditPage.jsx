import React from 'react';
import { useParams } from 'react-router-dom';

function FacilityEditPage() {
  const { facilityId } = useParams();

  return (
    <div>
      <h1>Edit Facility: {facilityId}</h1>
      {/* Placeholder for the actual edit form */}
    </div>
  );
}

export default FacilityEditPage;