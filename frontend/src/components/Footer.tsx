import React from 'react';
import './Footer.css';

// No props are expected, so we use React.FC or React.FC<{}>
const Footer: React.FC = () => {
  return (
    <footer className="container mt-5 py-3 text-center text-muted border-top">
      <p>2025 Chaire de recherche du Canada Économie politique de la transition énergétique. All Rights Reserved.</p>
    </footer>
  );
};

export default Footer;