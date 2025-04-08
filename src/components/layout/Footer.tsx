import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-6 mt-12">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; {currentYear} Anything in AnyKey. All rights reserved.</p>
        {/* Add other footer links or info if needed */}
      </div>
    </footer>
  );
};

export default Footer;