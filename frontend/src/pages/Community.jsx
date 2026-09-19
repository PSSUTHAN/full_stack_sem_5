import React, { useState, useEffect } from 'react';
import { CommunityModule } from '../components/community';

const Community = () => {
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Map stored app user to community format
                setCurrentUser({
                    id: parsed.id ? `user-${parsed.id}` : 'current-user',
                    name: parsed.username || parsed.email?.split('@')[0] || 'Er. Construction Peer',
                    email: parsed.email || 'engineer@engineersveedu.com',
                    role: parsed.role === 'builder' ? 'contractor' : parsed.role || 'site_engineer',
                    headline: parsed.role === 'site_engineer'
                        ? 'Site Operations & Structural Quality Auditor | Engineers Veedu'
                        : parsed.role === 'builder' || parsed.role === 'contractor'
                        ? 'General Contractor & Turnkey EPC Specialist | Engineers Veedu'
                        : 'Property Owner & Client | Eco-Home Visionary',
                    company: 'Engineers Veedu Ecosystem',
                    location: 'Coimbatore, Tamil Nadu',
                    avatar: parsed.role === 'client' 
                        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                        : parsed.role === 'contractor' || parsed.role === 'builder'
                        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    connectionsCount: 320,
                    profileViewsCount: 540,
                    postImpressionsCount: 4210
                });
            }
        } catch (err) {
            console.warn('Could not read user from localStorage:', err);
        }
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-[#f4f2ee]/40">
            {/* Embedded Modular Community System */}
            <CommunityModule
                user={currentUser}
                theme="light"
                initialTab="feed"
            />
        </div>
    );
};

export default Community;
