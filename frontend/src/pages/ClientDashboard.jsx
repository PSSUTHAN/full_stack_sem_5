import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    User, LogOut, FileText, ArrowRight, ShieldCheck, 
    HardHat, Calendar, MapPin, Sparkles, Activity, CheckCircle,
    Plus, ClipboardList, Building2, DollarSign
} from 'lucide-react';
import ProjectTracker from '../components/ProjectTracker';
import { communityService } from '../services/communityService';
import SiteRequestModal from '../components/community/SiteRequestModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ClientDashboard = () => {
    const navigate = useNavigate();

    // Initialize state from localStorage
    const [user] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Error parsing user in ClientDashboard:", e);
            return null;
        }
    });

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    // Contractor Request state
    const [contractorRequests, setContractorRequests] = useState([]);
    const [availableContractors, setAvailableContractors] = useState([]);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedContractor, setSelectedContractor] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (user.role === 'contractor' || user.role === 'builder') {
            navigate('/contractor-dashboard');
        } else if (user.role === 'site_engineer') {
            navigate('/engineer-dashboard');
        }
    }, [user, navigate]);

    // Fetch projects connected to this client
    const fetchClientProjects = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/projects?user_id=${user?.id}&role=client`);
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
            }
        } catch (err) {
            console.error("Error fetching client projects:", err);
        } finally {
            setLoading(false);
        }
    };

    // Load client contractor requests & available contractors
    const loadRequestsAndContractors = async () => {
        try {
            const [reqs, members] = await Promise.all([
                communityService.fetchSiteRequests(),
                communityService.fetchMembers({ role: 'contractor' })
            ]);
            // Requests sent by this client or all general contractor tenders
            setContractorRequests(reqs.filter(r => r.engineerRole === 'contractor' || r.clientId === user?.id || r.clientEmail === user?.email));
            
            const contractors = members.filter(m => m.role === 'contractor');
            const fallbackContractor = {
                id: 'user-anand',
                name: 'Anand Verma',
                role: 'contractor',
                headline: 'General Contractor | Turnkey Residential & Commercial EPC | Apex Infra',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                company: 'Apex Infrastructure Group',
                location: 'Chennai, Tamil Nadu'
            };
            setAvailableContractors(contractors.length > 0 ? contractors : [fallbackContractor]);
        } catch (err) {
            console.error("Error loading contractor requests:", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchClientProjects();
            loadRequestsAndContractors();
        }
    }, [user]);

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
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-l-8 border-accent">
                    <div className="flex items-center gap-5">
                        <div className="bg-orange-100 p-4 rounded-2xl text-accent">
                            <User size={36} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-primary">Welcome, {user.email?.split('@')[0] || 'Client'}!</h1>
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    Property Owner
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm mt-1">
                                Client Dashboard • Day-by-day construction transparency & AI progress audits
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setSelectedContractor(availableContractors[0] || null);
                                setIsRequestModalOpen(true);
                            }}
                            className="flex items-center gap-2 bg-accent hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl transition-colors font-bold text-sm shadow-sm"
                        >
                            <Plus size={16} /> Request a Contractor
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-red-50 text-red-600 px-5 py-2.5 rounded-xl hover:bg-red-100 transition-colors font-medium border border-red-100 text-sm"
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </div>

                {/* If a project is selected for tracking, render ProjectTracker */}
                {selectedProjectId ? (
                    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
                        <ProjectTracker 
                            projectId={selectedProjectId} 
                            user={user} 
                            onBack={() => setSelectedProjectId(null)} 
                        />
                    </div>
                ) : (
                    <>
                        {/* Connected Construction Projects */}
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        <FileText className="text-accent" size={22} /> Connected Building Projects
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Live monitoring of day-by-day work reported by your assigned Site Engineer
                                    </p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="p-12 text-center text-gray-400 bg-white rounded-2xl shadow-sm">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-3"></div>
                                    <p>Loading your projects...</p>
                                </div>
                            ) : projects.length === 0 ? (
                                <div className="p-12 text-center text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">
                                    <p className="text-lg font-bold text-gray-700">No active projects assigned yet.</p>
                                    <p className="text-sm text-gray-500 mt-1">Contact your contractor to link your property construction project.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {projects.map((project) => (
                                        <div 
                                            key={project.id} 
                                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between group"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start gap-4 mb-3">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors">
                                                            {project.name}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                            <MapPin size={14} className="text-accent" /> {project.location}
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-1 bg-orange-50 text-accent border border-orange-200 text-xs font-bold rounded-full">
                                                        {project.stage}
                                                    </span>
                                                </div>

                                                <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mb-4 leading-relaxed">
                                                    {project.description}
                                                </p>

                                                {/* Connected Stakeholders */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 mb-4 text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <ShieldCheck size={18} className="text-purple-600 shrink-0" />
                                                        <div className="truncate">
                                                            <span className="text-[10px] uppercase font-bold text-gray-500 block">General Contractor</span>
                                                            <span className="font-semibold text-gray-800 truncate block">
                                                                {project.contractor_email || 'contractor@engineersveedu.com'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <HardHat size={18} className="text-amber-600 shrink-0" />
                                                        <div className="truncate">
                                                            <span className="text-[10px] uppercase font-bold text-gray-500 block">Site Engineer</span>
                                                            <span className="font-semibold text-amber-700 truncate block">
                                                                {project.site_engineer_email || 'engineer@engineersveedu.com'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="space-y-1.5 mb-4">
                                                    <div className="flex justify-between text-xs font-semibold">
                                                        <span className="text-gray-500">Overall Construction Completed</span>
                                                        <span className="text-primary font-bold">{project.progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                                        <div 
                                                            className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500" 
                                                            style={{ width: `${project.progress}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-xs text-gray-500 pb-4 border-b border-gray-100">
                                                    <span>Budget: <strong className="text-gray-800">{project.budget}</strong></span>
                                                    <span>Target Completion: <strong className="text-gray-800">{project.target_date}</strong></span>
                                                </div>
                                            </div>

                                            {/* Action button */}
                                            <div className="pt-4 flex justify-between items-center">
                                                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                                    <Activity size={14} /> {project.total_logs || 0} Daily Updates Logged
                                                </span>
                                                <button
                                                    onClick={() => setSelectedProjectId(project.id)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                                                >
                                                    View Day-by-Day Diary & AI Audit <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* My Contractor & Site Requests */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        <ClipboardList className="text-accent" size={22} /> My Contractor & Site Requests
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Turnkey construction proposals and site inspection requests sent to contractors & engineers
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedContractor(availableContractors[0] || null);
                                        setIsRequestModalOpen(true);
                                    }}
                                    className="px-4 py-2 bg-primary hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
                                >
                                    <Plus size={14} /> Put Request to Contractor
                                </button>
                            </div>

                            {contractorRequests.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {contractorRequests.map((req) => (
                                        <div 
                                            key={req.id} 
                                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all space-y-3"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start gap-2 mb-2">
                                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-100">
                                                        {req.buildingType}
                                                    </span>
                                                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                                                        req.status === 'accepted' 
                                                            ? 'bg-green-50 text-green-700 border-green-200' 
                                                            : req.status === 'declined'
                                                            ? 'bg-red-50 text-red-700 border-red-200'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                        {req.status === 'accepted' ? '✓ Accepted by Contractor' : '⏳ Pending Review'}
                                                    </span>
                                                </div>

                                                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                                    <HardHat size={16} className="text-accent" />
                                                    {req.engineerName}
                                                    <span className="text-xs text-gray-400 font-normal">({req.engineerRole === 'contractor' ? 'Contractor' : 'Site Engineer'})</span>
                                                </h3>

                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                    <MapPin size={13} className="text-accent" /> {req.siteAddress}
                                                </p>

                                                <div className="mt-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs space-y-1.5 text-gray-700">
                                                    <div><strong>Name:</strong> {req.name || req.clientName}</div>
                                                    <div><strong>Site Address:</strong> {req.siteAddress}</div>
                                                    <div><strong>Amount:</strong> <span className="font-bold text-emerald-700">{req.amount}</span></div>
                                                    <div><strong>Building Type:</strong> <span className="font-semibold text-gray-800">{req.buildingType}</span></div>
                                                    <div><strong>Required Details:</strong> {req.requiredDetails || req.siteDetails || req.anotherDetails}</div>
                                                </div>
                                            </div>

                                            <div className="text-[11px] text-gray-400 pt-2 border-t border-gray-100 flex items-center justify-between">
                                                <span>Submitted {req.createdAt}</span>
                                                <span className="text-primary font-semibold">Tender Ref: #{req.id.slice(-6)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-100 shadow-sm">
                                    <ClipboardList size={32} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm font-medium text-gray-600">No contractor requests submitted yet.</p>
                                    <p className="text-xs text-gray-400 mt-1">Click "Put Request to Contractor" above to request a proposal from certified builders.</p>
                                </div>
                            )}
                        </div>

                        {/* Transparency & AI Feature Highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                                <div className="p-3 bg-orange-50 text-accent rounded-xl shrink-0">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary text-base">Day-by-Day Site Diary</h4>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        Your site engineer posts real-time daily work logs, labor counts, material consumption, and on-site photos.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary text-base">Gemini AI Project Auditing</h4>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        Automated analysis checks pace vs target deadlines, flags weather/supply bottlenecks, and generates efficiency insights.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary text-base">Full Stakeholder Sync</h4>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        Client, General Contractor, and Site Engineer stay 100% aligned with zero communication gaps.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Client to Contractor Request Modal */}
            {isRequestModalOpen && selectedContractor && (
                <SiteRequestModal
                    engineer={selectedContractor}
                    currentUser={user}
                    onClose={() => setIsRequestModalOpen(false)}
                    onSubmitSuccess={async (formData, contractor) => {
                        const newReq = await communityService.createSiteRequest(formData, user, contractor);
                        setContractorRequests(prev => [newReq, ...prev]);
                        setIsRequestModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default ClientDashboard;
