import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';

import Projects from './pages/Projects';
import Contact from './pages/Contact';
import Community from './pages/Community';
import Support from './pages/Support';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import ContractorDashboard from './pages/ContractorDashboard';
import SiteEngineerDashboard from './pages/SiteEngineerDashboard';
import ProjectTrackerPage from './pages/ProjectTrackerPage';

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

    const getRoleDashboard = (u) => {
        if (!u) return '/login';
        if (u.role === 'contractor' || u.role === 'builder') return '/contractor-dashboard';
        if (u.role === 'site_engineer') return '/engineer-dashboard';
        return '/client-dashboard';
    };

    return (
        <Router>
            <div className="flex flex-col min-h-screen bg-white text-gray-800">
                <Header user={user} />

                <main className="flex-grow">
                    <Routes>
                        <Route 
                            path="/" 
                            element={<Navigate to={user ? getRoleDashboard(user) : "/login"} replace />} 
                        />
                        <Route 
                            path="/login" 
                            element={user ? <Navigate to={getRoleDashboard(user)} replace /> : <Login />} 
                        />
                        <Route path="/register" element={<Register />} />

                        {/* Community Page (Central hub after login) */}
                        <Route 
                            path="/community" 
                            element={
                                <ProtectedRoute allowedRoles={['client', 'contractor', 'site_engineer', 'builder']}>
                                    <Community />
                                </ProtectedRoute>
                            } 
                        />

                        <Route path="/projects" element={<Projects />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/support" element={<Support />} />

                        {/* Client Route */}
                        <Route
                            path="/client-dashboard"
                            element={
                                <ProtectedRoute allowedRoles={['client']}>
                                    <ClientDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Contractor Routes */}
                        <Route
                            path="/contractor-dashboard"
                            element={
                                <ProtectedRoute allowedRoles={['contractor', 'builder']}>
                                    <ContractorDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/builder-dashboard"
                            element={
                                <ProtectedRoute allowedRoles={['contractor', 'builder']}>
                                    <ContractorDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Site Engineer Route */}
                        <Route
                            path="/engineer-dashboard"
                            element={
                                <ProtectedRoute allowedRoles={['site_engineer']}>
                                    <SiteEngineerDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Standalone Project Tracking Route (Accessible to all 3 connected roles) */}
                        <Route
                            path="/projects/:id/track"
                            element={
                                <ProtectedRoute allowedRoles={['client', 'contractor', 'site_engineer', 'builder']}>
                                    <ProjectTrackerPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="*"
                            element={<Navigate to={user ? getRoleDashboard(user) : "/login"} replace />}
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
