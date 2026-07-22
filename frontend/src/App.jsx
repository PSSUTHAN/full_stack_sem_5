import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';

import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import Community from './pages/Community';
import Support from './pages/Support';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import BuilderDashboard from './pages/BuilderDashboard';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
    const [user, setUser] = useState(null);

    // Initial load and listener for changes
    const loadUser = () => {
        try {
            const saved = localStorage.getItem('user');
            if (saved) {
                const parsed = JSON.parse(saved);
                setUser(parsed);
            } else {
                setUser(null);
            }
        } catch (e) {
            console.error("Error parsing user:", e);
            setUser(null);
        }
    };

    useEffect(() => {
        loadUser();
        // Custom event to handle updates from other components (like Login/Logout)
        window.addEventListener('user-state-change', loadUser);
        return () => window.removeEventListener('user-state-change', loadUser);
    }, []);

    return (
        <Router>
            <div className="flex flex-col min-h-screen">
                <Header user={user} />

                <main className="flex-grow">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/community" element={<Community />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route
                            path="/client-dashboard"
                            element={
                                <ProtectedRoute role="client">
                                    <ClientDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/builder-dashboard"
                            element={
                                <ProtectedRoute role="builder">
                                    <BuilderDashboard />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </main>

                <Footer />
                <Chatbot />
            </div>
        </Router>
    );
}

export default App;
