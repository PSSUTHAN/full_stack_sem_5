import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-200 text-gray-600 py-6">
            <div className="container mx-auto text-center px-4 text-sm">
                <p>
                    &copy; 2025 Engineers Veedu. All rights reserved. |
                    <Link to="/support" className="ml-2 text-primary hover:text-accent font-semibold transition-colors">Support</Link>
                </p>
            </div>
        </footer>
    );
};

export default Footer;
