import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Header = ({ user }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const triggerStateChange = () => {
        window.dispatchEvent(new Event('user-state-change'));
    };

    return (
        <header className="bg-white sticky top-0 z-50 shadow-sm py-4">
            <div className="container mx-auto px-4 flex justify-between items-center">
                <div className="text-2xl font-bold text-primary">
                    Engineers Veedu
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center space-x-6">
                    <Link to="/" className="text-text hover:text-accent font-medium transition-colors">Home</Link>
                    <Link to="/about" className="text-text hover:text-accent font-medium transition-colors">About</Link>
                    <Link to="/services" className="text-text hover:text-accent font-medium transition-colors">Services</Link>
                    <Link to="/projects" className="text-text hover:text-accent font-medium transition-colors">Projects</Link>
                    <Link to="/community" className="text-text hover:text-accent font-medium transition-colors">Community</Link>
                    <Link to="/support" className="text-text hover:text-accent font-medium transition-colors">Support</Link>
                    <Link to="/contact" className="text-text hover:text-accent font-medium transition-colors">Contact</Link>
                    {user ? (
                        <Link to={user.role === 'builder' ? '/builder-dashboard' : '/client-dashboard'} className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-800 transition-colors">
                            Dashboard
                        </Link>
                    ) : (
                        <Link to="/login" className="px-4 py-2 bg-accent text-white rounded hover:bg-orange-600 transition-colors">
                            Login
                        </Link>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-text hover:text-accent"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isMenuOpen && (
                <nav className="md:hidden bg-white border-t p-4 flex flex-col space-y-4 shadow-lg absolute w-full z-40">
                    <Link to="/" className="text-text hover:text-accent font-medium px-2 py-1" onClick={() => setIsMenuOpen(false)}>Home</Link>
                    <Link to="/about" className="text-text hover:text-accent font-medium px-2 py-1" onClick={() => setIsMenuOpen(false)}>About</Link>
                    <Link to="/services" className="text-text hover:text-accent font-medium px-2 py-1" onClick={() => setIsMenuOpen(false)}>Services</Link>
                    <Link to="/projects" className="text-text hover:text-accent font-medium px-2 py-1" onClick={() => setIsMenuOpen(false)}>Projects</Link>
                    <Link to="/community" className="text-text hover:text-accent font-medium px-2 py-1" onClick={() => setIsMenuOpen(false)}>Community</Link>
                    <Link to="/support" className="text-text hover:text-accent font-medium px-2 py-1" onClick={() => setIsMenuOpen(false)}>Support</Link>
                    <Link to="/contact" className="text-text hover:text-accent font-medium px-2 py-1" onClick={() => setIsMenuOpen(false)}>Contact</Link>
                    {user ? (
                        <>
                            <Link to={user.role === 'builder' ? '/builder-dashboard' : '/client-dashboard'} className="bg-primary text-white px-4 py-2 rounded text-center items-center justify-center flex font-bold" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('user');
                                    localStorage.removeItem('token');
                                    triggerStateChange();
                                    setIsMenuOpen(false);
                                    window.location.href = '/login';
                                }}
                                className="bg-red-50 text-red-600 px-4 py-2 rounded text-center items-center justify-center flex font-bold border border-red-100"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="bg-accent text-white px-4 py-2 rounded text-center items-center justify-center flex" onClick={() => setIsMenuOpen(false)}>Login</Link>
                    )}
                </nav>
            )}
        </header>
    );
};

export default Header;
