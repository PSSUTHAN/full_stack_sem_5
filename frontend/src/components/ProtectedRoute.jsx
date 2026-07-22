import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
    const user = (() => {
        try {
            const userJson = localStorage.getItem('user');
            return userJson ? JSON.parse(userJson) : null;
        } catch (e) {
            console.error("Error parsing user in ProtectedRoute:", e);
            return null;
        }
    })();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Default to 'client' if role is missing (for old sessions)
    const userRole = user.role || 'client';

    if (role && userRole !== role) {
        // Prevent infinite loop: Only redirect if we're actually switching to the OTHER known role
        if (userRole === 'builder' && role !== 'builder') {
            return <Navigate to="/builder-dashboard" replace />;
        }
        if (userRole === 'client' && role !== 'client') {
            return <Navigate to="/client-dashboard" replace />;
        }
        // If role is unknown or we're already on the "best guess" page, just don't redirect again
    }

    return children;
};

export default ProtectedRoute;
