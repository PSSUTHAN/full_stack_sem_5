import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProjectTracker from '../components/ProjectTracker';

const ProjectTrackerPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [user] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <ProjectTracker 
                    projectId={id} 
                    user={user} 
                    onBack={() => {
                        if (user?.role === 'site_engineer') {
                            navigate('/engineer-dashboard');
                        } else if (user?.role === 'contractor' || user?.role === 'builder') {
                            navigate('/contractor-dashboard');
                        } else {
                            navigate('/client-dashboard');
                        }
                    }} 
                />
            </div>
        </div>
    );
};

export default ProjectTrackerPage;

