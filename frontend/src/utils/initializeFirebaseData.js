import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { mockFacilities } from '../mockData/facilityData';

/**
 * Initializes or updates facility data in Firebase with required fields
 * This function checks if facilities are missing required fields and adds them
 */
export const initializeFacilityData = async () => {
  try {
    console.log('Checking and initializing facility data...');
    
    // Get all facilities from Firebase
    const facilitiesCollection = collection(db, 'facilities');
    const facilitiesSnapshot = await getDocs(facilitiesCollection);
    const facilities = facilitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      docRef: doc.ref,
      ...doc.data()
    }));
    
    console.log(`Found ${facilities.length} facilities in Firebase`);
    
    // Check if any facilities are missing required fields
    const facilitiesNeedingUpdate = facilities.filter(
      facility => !facility.status || (!facility.volume && facility.volume !== 0)
    );
    
    if (facilitiesNeedingUpdate.length === 0) {
      console.log('All facilities have required fields. No updates needed.');
      return { updated: 0 };
    }
    
    console.log(`${facilitiesNeedingUpdate.length} facilities need updates`);
    
    // Create a mapping of mock facility data by ID for reference
    const mockFacilityMap = {};
    mockFacilities.forEach(mockFacility => {
      mockFacilityMap[mockFacility.id] = mockFacility;
    });
    
    // Update each facility with missing fields
    const updatePromises = facilitiesNeedingUpdate.map(async facility => {
      const updates = {};
      
      // If status is missing, add it
      if (!facility.status) {
        // Try to find a matching mock facility or default to 'operating'
        const mockMatch = mockFacilityMap[facility.id];
        updates.status = mockMatch ? mockMatch.status : 'operating';
      }
      
      // If volume is missing, add it
      if (!facility.volume && facility.volume !== 0) {
        // Try to find a matching mock facility or default to a random value
        const mockMatch = mockFacilityMap[facility.id];
        updates.volume = mockMatch ? mockMatch.volume : Math.floor(Math.random() * 50000) + 5000;
      }
      
      // If method is missing, add it
      if (!facility.method) {
        const mockMatch = mockFacilityMap[facility.id];
        updates.method = mockMatch ? mockMatch.method : getRandomMethod();
      }
      
      // If region is missing, add it
      if (!facility.region) {
        const mockMatch = mockFacilityMap[facility.id];
        updates.region = mockMatch ? mockMatch.region : getRandomRegion();
      }
      
      console.log(`Updating facility ${facility.id} with:`, updates);
      
      // Update the facility in Firebase
      await updateDoc(facility.docRef, updates);
      return facility.id;
    });
    
    // Wait for all updates to complete
    const updatedIds = await Promise.all(updatePromises);
    console.log(`Successfully updated ${updatedIds.length} facilities`);
    
    return { updated: updatedIds.length, ids: updatedIds };
  } catch (error) {
    console.error('Error initializing facility data:', error);
    throw error;
  }
};

// Helper function to get a random recycling method
function getRandomMethod() {
  const methods = [
    'Hydrometallurgical',
    'Pyrometallurgical',
    'Mechanical Processing',
    'Submerged Shredding',
    'Black Mass Production',
    'Battery Recycling'
  ];
  return methods[Math.floor(Math.random() * methods.length)];
}

// Helper function to get a random region
function getRandomRegion() {
  const regions = [
    'Northeast',
    'Southeast',
    'Midwest',
    'Southwest',
    'West',
    'Canada'
  ];
  return regions[Math.floor(Math.random() * regions.length)];
}