import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, Plus, Users, Layout, Briefcase } from 'lucide-react';

const BuilderDashboard = () => {
    const navigate = useNavigate();

    // Initialize state from localStorage to prevent blank flicker
    const [user] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Error parsing user in BuilderDashboard:", e);
            return null;
        }
    });

    // Sample data for leads and projects
    const [leads] = useState([
        { id: 101, name: 'Suresh Kumar', email: 'suresh@example.com', type: 'Residential', status: 'Quote Sent' },
        { id: 102, name: 'Priya Rajan', email: 'priya@example.com', type: 'Commercial', status: 'New Inquiry' },
        { id: 103, name: 'Vikram Singh', email: 'vikram@example.com', type: 'Renovation', status: 'Site Visit Scheduled' }
    ]);

    const [projects] = useState([
        { id: 501, name: 'Skyview Apartments', location: 'Chennai', progress: 75, deadline: 'May 2026' },
        { id: 502, name: 'Metro Plaza', location: 'Madurai', progress: 30, deadline: 'Dec 2026' }
    ]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (user.role !== 'builder') {
            navigate('/');
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
            <div className="flex h-screen items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 text-gray-100">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="bg-gray-800 p-8 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border-b-4 border-accent">
                    <div className="flex items-center gap-6">
                        <div className="bg-orange-500/20 p-4 rounded-xl text-accent border border-accent/30">
                            <ShieldCheck size={40} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Builder Admin Portal</h1>
                            <p className="text-gray-400">Welcome back, {user.email?.split('@')[0] || 'Builder'} • System Administrator Mode</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-500/10 text-red-500 px-6 py-2 rounded-xl hover:bg-red-500/20 transition-all font-semibold border border-red-500/20 shadow-lg"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* STATS CARDS */}
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg hover:border-accent/40 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                                <Users size={24} />
                            </div>
                            <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">+12%</span>
                        </div>
                        <h3 className="text-gray-400 font-medium">Total Client Leads</h3>
                        <p className="text-3xl font-bold text-white mt-1">24</p>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg hover:border-orange-500/40 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-orange-500/20 rounded-lg text-orange-400 group-hover:bg-orange-500/30 transition-colors">
                                <Plus size={24} />
                            </div>
                            <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded">Action Required</span>
                        </div>
                        <h3 className="text-gray-400 font-medium">New Quote Requests</h3>
                        <p className="text-3xl font-bold text-white mt-1">08</p>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg hover:border-emerald-500/40 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
                                <Layout size={24} />
                            </div>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Active</span>
                        </div>
                        <h3 className="text-gray-400 font-medium">Projects Under Construction</h3>
                        <p className="text-3xl font-bold text-white mt-1">15</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Management Area */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Briefcase className="text-accent" size={24} /> Project Tracking
                                </h2>
                                <button className="bg-accent text-white px-5 py-2 rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg">
                                    <Plus size={20} /> Add New Project
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                {projects.map(proj => (
                                    <div key={proj.id} className="bg-gray-900/30 p-4 rounded-xl border border-gray-700/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold">{proj.name}</h4>
                                            <span className="text-xs text-gray-500">{proj.deadline}</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                                            <div className="bg-accent h-2 rounded-full" style={{ width: `${proj.progress}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                            <span>{proj.location}</span>
                                            <span>{proj.progress}% Complete</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
                            <h2 className="text-xl font-bold mb-6">Recent Customer Leads</h2>
                            <div className="space-y-4">
                                {leads.map((lead) => (
                                    <div key={lead.id} className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 flex items-center justify-between hover:bg-gray-700/30 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-800 rounded-full border border-gray-600 flex items-center justify-center font-bold text-gray-400">
                                                {lead.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-200">{lead.name}</p>
                                                <p className="text-xs text-gray-500">{lead.type} • {lead.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 font-bold uppercase">{lead.status}</span>
                                            <button className="block text-accent text-xs font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">View Case →</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-8">
                        <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20 shadow-lg border-l-4 border-l-emerald-500">
                            <h3 className="font-bold text-emerald-400 mb-2 flex items-center gap-2">
                                <ShieldCheck size={20} /> Professional Verification
                            </h3>
                            <p className="text-xs text-emerald-300 opacity-80 leading-relaxed">
                                Your builder account is verified. You have access to upload brochures, modify project timelines, and respond to quote requests.
                            </p>
                        </div>

                        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                            <h3 className="font-bold mb-4">Quick Tools</h3>
                            <div className="space-y-2">
                                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-700 transition-colors text-sm text-gray-400 hover:text-white flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Download Lead List (CSV)
                                </button>
                                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-700 transition-colors text-sm text-gray-400 hover:text-white flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div> Update Project Status
                                </button>
                                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-700 transition-colors text-sm text-gray-400 hover:text-white flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div> Settings & Permissions
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuilderDashboard;
