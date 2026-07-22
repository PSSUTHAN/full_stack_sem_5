import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Plus, Clock, FileText } from 'lucide-react';

const ClientDashboard = () => {
    const navigate = useNavigate();

    // Initialize state from localStorage to prevent blank flicker
    const [user] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Error parsing user in ClientDashboard:", e);
            return null;
        }
    });

    // Sample data for a "complete" feel
    const [projects] = useState([
        { id: 1, title: 'Modular Home Expansion', status: 'In Planning', budget: '₹12,40,000', lastUpdate: '2 days ago' },
        { id: 2, title: 'Kitchen Renovation', status: 'Quote Received', budget: '₹4,50,000', lastUpdate: '1 week ago' }
    ]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('user-state-change'));
        navigate('/login');
    };

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="bg-white p-8 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-center gap-6 border-l-8 border-accent">
                    <div className="flex items-center gap-6">
                        <div className="bg-orange-100 p-4 rounded-full text-accent">
                            <User size={40} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-primary">Welcome, {user.email?.split('@')[0] || 'User'}!</h1>
                            <p className="text-gray-500">Client Dashboard • Manage your dream projects</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-100"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Saved Projects Section */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <FileText className="text-accent" size={22} /> My Projects
                                </h2>
                                <button className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 text-sm font-bold shadow-sm">
                                    <Plus size={18} /> Request New Quote
                                </button>
                            </div>
                            <div className="space-y-4">
                                {projects.map((project) => (
                                    <div key={project.id} className="p-4 border rounded-xl hover:shadow-md transition-shadow flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-primary font-bold">
                                                {project.title.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg group-hover:text-accent transition-colors">{project.title}</h3>
                                                <p className="text-sm text-gray-500">Last updated: {project.lastUpdate}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-primary">{project.budget}</div>
                                            <div className="text-xs bg-orange-100 text-accent px-2 py-1 rounded inline-block font-bold">
                                                {project.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Inquiries */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                <Clock className="text-accent" size={22} /> Inquiry History
                            </h2>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center opacity-60">
                                    <span>Support Inquiry #402 - "Pricing for hillside site"</span>
                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">Pending</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-primary mb-4">Profile Info</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between border-b pb-2 text-sm">
                                    <span className="text-gray-500 font-medium">Email:</span>
                                    <span className="text-gray-800">{user.email}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2 text-sm">
                                    <span className="text-gray-500 font-medium">Member Since:</span>
                                    <span className="text-gray-800">Feb 2026</span>
                                </div>
                                <div className="flex justify-between pb-2 text-sm">
                                    <span className="text-gray-500 font-medium">Status:</span>
                                    <span className="text-green-600 font-bold uppercase text-xs">Verified Client</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="font-bold mb-2">Need Help?</h3>
                                <p className="text-sm opacity-80 mb-4">Our engineers are available for direct consultations.</p>
                                <button className="w-full bg-white text-primary py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                                    Chat with Builder
                                </button>
                            </div>
                            <div className="absolute -right-4 -bottom-4 bg-accent w-20 h-20 rounded-full opacity-20 transform translate-x-4 translate-y-4"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
