import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-text text-white py-6">
            <div className="container mx-auto text-center px-4">
                <p>
                    &copy; 2025 Engineers Veedu. All rights reserved. |
                    <Link to="/support" className="ml-2 text-accent hover:text-white transition-colors">Support</Link>
                </p>
            </div>
        </footer>
    );
};

export default Footer;
