import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role, allowedRoles }) => {
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

    let userRole = user.role || 'client';
    if (userRole === 'builder') {
        userRole = 'contractor';
    }

    // Determine target allowed roles
    const targetRoles = allowedRoles || (role ? [role === 'builder' ? 'contractor' : role] : null);

    if (targetRoles && !targetRoles.includes(userRole)) {
        if (userRole === 'contractor') {
            return <Navigate to="/contractor-dashboard" replace />;
        }
        if (userRole === 'site_engineer') {
            return <Navigate to="/engineer-dashboard" replace />;
        }
        return <Navigate to="/client-dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
