import React, { useEffect } from 'react'; // Import useEffect
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../context/AuthContext.jsx'; // Import useAuth

function FacilityEditPage() {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user from auth context

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      console.log("No user found, redirecting from FacilityEditPage.");
      navigate('/facilities'); // Redirect to facilities list
    }
  }, [user, navigate]);

  // Render nothing or a loading indicator until user status is confirmed and redirection happens
  if (!user) {
    return <p>Loading or redirecting...</p>; // Or null, or a spinner
  }

  return (
    <div>
      <h1>Edit Facility: {facilityId}</h1>
      {/* Placeholder for the actual edit form */}
    </div>
  );
}

export default FacilityEditPage;