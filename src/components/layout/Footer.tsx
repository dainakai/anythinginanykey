import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 text-gray-600 py-4 mt-auto">
      <div className="container mx-auto px-4 text-center text-sm">
        <p>&copy; {currentYear} Anything in Anykeys. All rights reserved.</p>
        {/* Add other footer links or info if needed */}
      </div>
    </footer>
  );
};

export default Footer;