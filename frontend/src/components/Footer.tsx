import React, { useEffect, useState } from 'react';
import './Footer.css';

// No props are expected, so we use React.FC or React.FC<{}>
const Footer: React.FC = () => {
  // Explicitly type the state variable 'year' as number
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    // Update the copyright year when the component mounts
    // No specific types needed for this simple effect
    setYear(new Date().getFullYear());
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <footer className="container mt-5 py-3 text-center text-muted border-top">
      <p>&amp;copy; <span id="copyright-year">{year}</span> Chaire de recherche du Canada Économie politique de la transition énergétique. All Rights Reserved.</p>
      {/* Optional: Add links like Privacy Policy or Terms of Service here */}
    </footer>
  );
};

export default Footer;