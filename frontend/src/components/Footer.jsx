import React, { useEffect, useState } from 'react';
import './Footer.css';

const Footer = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  
  useEffect(() => {
    // Update the copyright year when the component mounts
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="container mt-5 py-3 text-center text-muted border-top">
      <p>&copy; <span id="copyright-year">{year}</span> Chaire de recherche du Canada Économie politique de la transition énergétique. All Rights Reserved.</p>
      {/* Optional: Add links like Privacy Policy or Terms of Service here */}
    </footer>
  );
};

export default Footer;