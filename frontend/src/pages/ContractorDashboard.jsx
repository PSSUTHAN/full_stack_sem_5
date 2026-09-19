import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ShieldCheck, LogOut, Plus, Users, HardHat, Briefcase, 
    Calendar, MapPin, DollarSign, Activity, CheckCircle, ArrowRight, X,
    ClipboardList, Building2, Clock, AlertCircle
} from 'lucide-react';
import ProjectTracker from '../components/ProjectTracker';
import { communityService } from '../services/communityService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ContractorDashboard = () => {
    const navigate = useNavigate();

    const [user] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Error parsing user in ContractorDashboard:", e);
            return null;
        }
    });

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    // Create Project Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [clientsList, setClientsList] = useState([]);
    const [engineersList, setEngineersList] = useState([]);
    const [creatingProject, setCreatingProject] = useState(false);
    const [newProjectForm, setNewProjectForm] = useState({
        name: '',
        description: '',
        location: 'Chennai, Tamil Nadu',
        budget: '₹60,00,000',
        target_date: '2027-03-31',
        stage: 'Site Preparation & Excavation',
        client_id: '',
        site_engineer_id: ''
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (user.role !== 'contractor' && user.role !== 'builder') {
            if (user.role === 'site_engineer') {
                navigate('/engineer-dashboard');
            } else {
                navigate('/client-dashboard');
            }
        }
    }, [user, navigate]);

    // Fetch projects for this contractor
    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/projects?user_id=${user?.id}&role=contractor`);
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
            }
        } catch (err) {
            console.error("Error fetching contractor projects:", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch clients and site engineers for assignment dropdowns
    const fetchUsersForAssignment = async () => {
        try {
            const [cRes, eRes] = await Promise.all([
                fetch(`${API_BASE}/api/users/by-role?role=client`),
                fetch(`${API_BASE}/api/users/by-role?role=site_engineer`)
            ]);
            if (cRes.ok) {
                const cData = await cRes.json();
                setClientsList(cData.users || []);
                if (cData.users?.length > 0) {
                    setNewProjectForm(prev => ({ ...prev, client_id: cData.users[0].id }));
                }
            }
            if (eRes.ok) {
                const eData = await eRes.json();
                setEngineersList(eData.users || []);
                if (eData.users?.length > 0) {
                    setNewProjectForm(prev => ({ ...prev, site_engineer_id: eData.users[0].id }));
                }
            }
        } catch (err) {
            console.error("Error fetching users for assignment:", err);
        }
    };

    // Incoming client inquiries state & fetch
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);

    const fetchIncomingRequests = async () => {
        try {
            setLoadingRequests(true);
            const reqs = await communityService.fetchSiteRequests();
            // Show requests addressed to contractor roles or this user
            const filtered = reqs.filter(r => 
                r.engineerRole === 'contractor' || 
                r.engineerRole === 'builder' || 
                r.engineerId === user?.id || 
                (r.engineerName && r.engineerName.toLowerCase().includes('contractor'))
            );
            setIncomingRequests(filtered);
        } catch (err) {
            console.error("Error fetching incoming contractor requests:", err);
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleAcceptRequest = async (reqId) => {
        const updated = await communityService.updateSiteRequestStatus(reqId, 'accepted');
        setIncomingRequests(prev => prev.map(r => r.id === reqId ? updated : r));
    };

    const handleDeclineRequest = async (reqId) => {
        const updated = await communityService.updateSiteRequestStatus(reqId, 'declined');
        setIncomingRequests(prev => prev.map(r => r.id === reqId ? updated : r));
    };

    const handleConvertToProject = (req) => {
        setNewProjectForm({
            name: `${req.buildingType || 'Turnkey Project'} - ${req.name}`,
            description: `Client Inquiry from ${req.name}.\nSite Address: ${req.siteAddress}\nRequired Details: ${req.requiredDetails || req.siteDetails || req.anotherDetails || 'None'}`,
            location: req.siteAddress || 'Chennai, Tamil Nadu',
            budget: req.amount || '₹60,00,000',
            target_date: '2027-03-31',
            stage: 'Site Preparation & Excavation',
            client_id: clientsList[0]?.id || '',
            site_engineer_id: engineersList[0]?.id || ''
        });
        if (req.status !== 'accepted') {
            handleAcceptRequest(req.id);
        }
        setIsCreateModalOpen(true);
    };

    useEffect(() => {
        if (user) {
            fetchProjects();
            fetchUsersForAssignment();
            fetchIncomingRequests();
        }
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('user-state-change'));
        navigate('/login');
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProjectForm.name.trim()) {
            alert("Please enter a project name");
            return;
        }

        try {
            setCreatingProject(true);
            const res = await fetch(`${API_BASE}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newProjectForm,
                    contractor_id: user?.id,
                    progress: 0,
                    status: 'In Progress'
                })
            });

            if (res.ok) {
                setIsCreateModalOpen(false);
                setNewProjectForm({
                    name: '',
                    description: '',
                    location: 'Chennai, Tamil Nadu',
                    budget: '₹60,00,000',
                    target_date: '2027-03-31',
                    stage: 'Site Preparation & Excavation',
                    client_id: clientsList[0]?.id || '',
                    site_engineer_id: engineersList[0]?.id || ''
                });
                await fetchProjects();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to create project");
            }
        } catch (err) {
            console.error("Error creating project:", err);
            alert("Network error creating project");
        } finally {
            setCreatingProject(false);
        }
    };

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 text-gray-900">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-l-8 border-accent border border-gray-100">
                    <div className="flex items-center gap-5">
                        <div className="bg-orange-100 p-4 rounded-2xl text-accent">
                            <ShieldCheck size={36} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Contractor Portal</h1>
                                <span className="bg-orange-100 text-accent text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    General Contractor
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm mt-1">
                                Welcome, {user.email} • Multi-site oversight, client connectivity & engineer coordination
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-accent hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all"
                        >
                            <Plus size={18} /> New Construction Project
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-all font-semibold text-sm border border-red-100"
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </div>

                {/* If a project is selected for deep tracking, render ProjectTracker */}
                {selectedProjectId ? (
                    <div className="bg-white text-gray-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                        <ProjectTracker 
                            projectId={selectedProjectId} 
                            user={user} 
                            onBack={() => setSelectedProjectId(null)} 
                        />
                    </div>
                ) : (
                    <>
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                        <Briefcase size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">Active</span>
                                </div>
                                <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider">Managed Sites</h3>
                                <p className="text-3xl font-black text-gray-900 mt-1">{projects.length}</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                                        <HardHat size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">Field Leads</span>
                                </div>
                                <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider">Site Engineers</h3>
                                <p className="text-3xl font-black text-gray-900 mt-1">{engineersList.length || 1}</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                        <Users size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">Owners</span>
                                </div>
                                <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider">Connected Clients</h3>
                                <p className="text-3xl font-black text-gray-900 mt-1">{clientsList.length || 1}</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                        <Activity size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">AI Audited</span>
                                </div>
                                <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider">Portfolio Health</h3>
                                <p className="text-3xl font-black text-emerald-600 mt-1">94%</p>
                            </div>
                        </div>

                        {/* Incoming Client Inquiries / Turnkey Requests */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <ClipboardList className="text-accent" size={22} /> Incoming Client Project Inquiries
                                        {incomingRequests.filter(r => r.status === 'pending').length > 0 && (
                                            <span className="bg-accent/10 text-accent text-xs font-black px-2.5 py-0.5 rounded-full">
                                                {incomingRequests.filter(r => r.status === 'pending').length} New
                                            </span>
                                        )}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Clients requesting turnkey construction, site bids, and contractor engagements with verified site specs
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    Direct Inquiries: {incomingRequests.length}
                                </span>
                            </div>

                            {loadingRequests ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto mb-2"></div>
                                    Checking for client inquiries...
                                </div>
                            ) : incomingRequests.length === 0 ? (
                                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <ClipboardList className="mx-auto text-gray-400 mb-2" size={32} />
                                    <p className="text-sm font-semibold text-gray-700">No client project inquiries yet</p>
                                    <p className="text-xs text-gray-400 mt-1">When clients submit requests from the Community directory or portal, they will show up here for you to accept or convert into projects.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {incomingRequests.map((req) => (
                                        <div 
                                            key={req.id} 
                                            className="border border-gray-200 rounded-xl p-5 hover:border-accent/40 hover:shadow-md transition-all bg-gradient-to-br from-white to-gray-50/50 flex flex-col justify-between"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-orange-100 text-accent mb-1.5">
                                                            {req.buildingType || 'Building Project'}
                                                        </span>
                                                        <h3 className="text-base font-bold text-gray-900 leading-snug">
                                                            {req.name}
                                                        </h3>
                                                    </div>
                                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                                        req.status === 'accepted' 
                                                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                                            : req.status === 'declined' 
                                                            ? 'bg-red-100 text-red-600 border border-red-200' 
                                                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                    }`}>
                                                        {req.status === 'accepted' ? 'Accepted' : req.status === 'declined' ? 'Declined' : 'Pending Review'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                                    <div className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-2xs">
                                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Proposed Budget</p>
                                                        <p className="font-extrabold text-accent text-sm mt-0.5 flex items-center gap-1">
                                                            <DollarSign size={14} className="text-accent" />
                                                            {req.amount}
                                                        </p>
                                                    </div>
                                                    <div className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-2xs">
                                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Site Location</p>
                                                        <p className="font-semibold text-gray-800 truncate mt-0.5 flex items-center gap-1">
                                                            <MapPin size={12} className="text-gray-400 shrink-0" />
                                                            <span className="truncate">{req.siteAddress}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="bg-white p-3 rounded-lg border border-gray-100 space-y-1 text-xs">
                                                    <div>
                                                        <span className="font-bold text-gray-700">Required Details: </span>
                                                        <span className="text-gray-600">{req.requiredDetails || req.siteDetails || req.anotherDetails}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                                <span className="text-[11px] text-gray-400">
                                                    Received {new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleDeclineRequest(req.id)}
                                                                className="px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                Decline
                                                            </button>
                                                            <button
                                                                onClick={() => handleAcceptRequest(req.id)}
                                                                className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                                                            >
                                                                <CheckCircle size={13} /> Accept
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleConvertToProject(req)}
                                                        className="px-3 py-1.5 text-xs font-bold text-white bg-accent hover:bg-orange-600 rounded-lg shadow-xs transition-all flex items-center gap-1"
                                                    >
                                                        <Building2 size={13} /> Convert to Project
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Projects Grid */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <Briefcase className="text-accent" size={22} /> Active Construction Projects
                                </h2>
                                <span className="text-xs text-gray-500">
                                    Select any project to inspect day-by-day logs and AI efficiency analysis
                                </span>
                            </div>

                            {loading ? (
                                <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-3"></div>
                                    <p>Loading projects...</p>
                                </div>
                            ) : projects.length === 0 ? (
                                <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
                                    <p className="text-lg font-bold text-gray-800">No active projects found.</p>
                                    <p className="text-sm mt-1">Click "New Construction Project" to create and assign one.</p>
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="mt-4 px-5 py-2.5 bg-accent text-white font-bold rounded-xl text-sm"
                                    >
                                        Create First Project
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {projects.map((proj) => (
                                        <div 
                                            key={proj.id} 
                                            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-all shadow-sm flex flex-col justify-between group"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start gap-4 mb-3">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors">
                                                            {proj.name}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                            <MapPin size={14} className="text-accent" /> {proj.location}
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-1 bg-orange-50 text-accent text-xs font-bold rounded-full border border-orange-200">
                                                        {proj.stage}
                                                    </span>
                                                </div>

                                                <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mb-4 leading-relaxed">
                                                    {proj.description}
                                                </p>

                                                {/* Connected parties */}
                                                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 mb-4 text-xs">
                                                    <div>
                                                        <span className="text-gray-500 block text-[10px] uppercase font-bold">Client</span>
                                                        <span className="text-gray-800 font-semibold truncate block">
                                                            {proj.client_email || 'client@demo.com'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block text-[10px] uppercase font-bold">Site Engineer</span>
                                                        <span className="text-amber-700 font-semibold truncate block">
                                                            {proj.site_engineer_email || 'engineer@engineersveedu.com'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="space-y-1.5 mb-4">
                                                    <div className="flex justify-between text-xs font-semibold">
                                                        <span className="text-gray-500">Construction Progress</span>
                                                        <span className="text-accent font-bold">{proj.progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                        <div 
                                                            className="bg-accent h-full rounded-full transition-all duration-500" 
                                                            style={{ width: `${proj.progress}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-xs text-gray-500 pb-4 border-b border-gray-100">
                                                    <span>Budget: <strong className="text-gray-800">{proj.budget}</strong></span>
                                                    <span>Target: <strong className="text-gray-800">{proj.target_date}</strong></span>
                                                </div>
                                            </div>

                                            {/* Action button */}
                                            <div className="pt-4 flex justify-between items-center">
                                                <span className="text-xs text-gray-500">
                                                    {proj.total_logs || 0} Daily Updates Logged
                                                </span>
                                                <button
                                                    onClick={() => setSelectedProjectId(proj.id)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-accent text-accent hover:text-white font-bold text-xs rounded-xl transition-all border border-orange-200"
                                                >
                                                    Open Day-by-Day Tracker & AI Insights <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* CREATE PROJECT MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white text-gray-900 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                <Plus className="text-accent" size={22} /> Create New Construction Project
                            </h3>
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Project Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Greenwood Modern Villa"
                                    value={newProjectForm.name}
                                    onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
                                <textarea
                                    rows={2}
                                    placeholder="Overview of scope, square footage, design details..."
                                    value={newProjectForm.description}
                                    onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={newProjectForm.location}
                                        onChange={(e) => setNewProjectForm({ ...newProjectForm, location: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Completion Date</label>
                                    <input
                                        type="date"
                                        value={newProjectForm.target_date}
                                        onChange={(e) => setNewProjectForm({ ...newProjectForm, target_date: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Budget</label>
                                    <input
                                        type="text"
                                        value={newProjectForm.budget}
                                        onChange={(e) => setNewProjectForm({ ...newProjectForm, budget: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Initial Stage</label>
                                    <select
                                        value={newProjectForm.stage}
                                        onChange={(e) => setNewProjectForm({ ...newProjectForm, stage: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                    >
                                        <option value="Site Preparation & Excavation">Site Preparation & Excavation</option>
                                        <option value="Foundation & Footing">Foundation & Footing</option>
                                        <option value="Plinth & Columns Framing">Plinth & Columns Framing</option>
                                        <option value="Brickwork & Masonry">Brickwork & Masonry</option>
                                        <option value="Plumbing & Electrical MEP">Plumbing & Electrical MEP</option>
                                    </select>
                                </div>
                            </div>

                            {/* Connected Client & Site Engineer Selectors */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Assign Client (Property Owner)</label>
                                    <select
                                        value={newProjectForm.client_id}
                                        onChange={(e) => setNewProjectForm({ ...newProjectForm, client_id: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                    >
                                        {clientsList.map(c => (
                                            <option key={c.id} value={c.id}>{c.email}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Assign Site Engineer</label>
                                    <select
                                        value={newProjectForm.site_engineer_id}
                                        onChange={(e) => setNewProjectForm({ ...newProjectForm, site_engineer_id: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                    >
                                        {engineersList.map(eng => (
                                            <option key={eng.id} value={eng.id}>{eng.email}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingProject}
                                    className="px-6 py-2 bg-accent hover:bg-orange-600 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50"
                                >
                                    {creatingProject ? "Creating..." : "Save & Launch Project"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractorDashboard;

