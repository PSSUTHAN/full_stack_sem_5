import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ShieldCheck, LogOut, Plus, Users, HardHat, Briefcase, 
    MapPin, DollarSign, Activity, CheckCircle, ArrowRight, X,
    ClipboardList, Building2, AlertCircle, XCircle, UserCheck, AlertTriangle,
    UserPlus, Trash2, Phone, Mail, Award, ChevronRight
} from 'lucide-react';
import ProjectTracker from '../components/ProjectTracker';
import { communityService } from '../services/communityService';
import { authFetch } from '../services/apiClient';

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
    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const res = await authFetch(`${API_BASE}/api/projects?user_id=${user?.id}&role=contractor`);
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
            }
        } catch (err) {
            console.error("Error fetching contractor projects:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Fetch clients and site engineers for assignment dropdowns
    const fetchUsersForAssignment = async () => {
        try {
            const [cRes, eRes] = await Promise.all([
                authFetch(`${API_BASE}/api/users/by-role?role=client`),
                authFetch(`${API_BASE}/api/users/by-role?role=site_engineer`)
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

    // Contractor managed site engineers state (roster with full project details)
    const [contractorEngineers, setContractorEngineers] = useState([]);
    const [loadingEngineers, setLoadingEngineers] = useState(false);
    const [isAddEngineerModalOpen, setIsAddEngineerModalOpen] = useState(false);
    const [creatingEngineer, setCreatingEngineer] = useState(false);
    const [newEngineerForm, setNewEngineerForm] = useState({
        name: '',
        email: '',
        password: 'password123',
        phone: '',
        specialization: 'Lead Structural Consultant & RCC Specialist'
    });
    const [removingEngineer, setRemovingEngineer] = useState(null);
    const [deletingEngineer, setDeletingEngineer] = useState(false);

    // Fetch site engineers under this contractor with their assigned projects
    const fetchContractorEngineers = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoadingEngineers(true);
            const res = await authFetch(`${API_BASE}/api/contractors/${user.id}/engineers`);
            if (res.ok) {
                const data = await res.json();
                setContractorEngineers(data.engineers || []);
                if (data.engineers && data.engineers.length > 0) {
                    setEngineersList(data.engineers);
                }
            }
        } catch (err) {
            console.error("Error fetching contractor engineers:", err);
        } finally {
            setLoadingEngineers(false);
        }
    }, [user]);

    // Create a new site engineer under this contractor
    const handleCreateEngineer = async (e) => {
        e.preventDefault();
        if (!newEngineerForm.email.trim()) {
            alert("Please provide the site engineer's email address.");
            return;
        }
        try {
            setCreatingEngineer(true);
            const res = await authFetch(`${API_BASE}/api/contractors/${user.id}/engineers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEngineerForm)
            });
            if (res.ok) {
                setIsAddEngineerModalOpen(false);
                setNewEngineerForm({
                    name: '',
                    email: '',
                    password: 'password123',
                    phone: '',
                    specialization: 'Lead Structural Consultant & RCC Specialist'
                });
                await fetchContractorEngineers();
                await fetchUsersForAssignment();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to create site engineer.");
            }
        } catch (err) {
            console.error("Error creating site engineer:", err);
            alert("Network error creating site engineer.");
        } finally {
            setCreatingEngineer(false);
        }
    };

    // Remove site engineer under this contractor
    const handleConfirmRemoveEngineer = async () => {
        if (!removingEngineer) return;
        try {
            setDeletingEngineer(true);
            const res = await authFetch(`${API_BASE}/api/contractors/${user.id}/engineers/${removingEngineer.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setRemovingEngineer(null);
                await fetchContractorEngineers();
                await fetchUsersForAssignment();
                await fetchProjects();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to remove site engineer.");
            }
        } catch (err) {
            console.error("Error removing site engineer:", err);
            alert("Network error removing site engineer.");
        } finally {
            setDeletingEngineer(false);
        }
    };

    // Incoming client inquiries state & fetch
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);

    const fetchIncomingRequests = useCallback(async () => {
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
    }, [user]);

    // Rejection state
    const [rejectingRequest, setRejectingRequest] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [submittingRejection, setSubmittingRejection] = useState(false);

    // Assign to Site Engineer state
    const [assigningRequest, setAssigningRequest] = useState(null);
    const [submittingAssignment, setSubmittingAssignment] = useState(false);
    const [assignForm, setAssignForm] = useState({
        name: '',
        description: '',
        location: 'Chennai, Tamil Nadu',
        budget: '₹60,00,000',
        target_date: '2027-03-31',
        stage: 'Site Preparation & Excavation',
        client_id: '',
        site_engineer_id: ''
    });

    const REJECTION_PRESETS = [
        "Schedule and crew capacity currently fully booked",
        "Site location is outside our operational service radius",
        "Proposed budget is below structural & material feasibility minimums",
        "Requested building type is outside our firm's primary specialization",
        "Estimated timeline cannot be accommodated with current active commitments"
    ];

    const handleOpenRejectModal = (req) => {
        setRejectingRequest(req);
        setRejectionReason('');
    };

    const handleConfirmReject = async (e) => {
        if (e) e.preventDefault();
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for declining this client request.');
            return;
        }

        try {
            setSubmittingRejection(true);
            const updated = await communityService.updateSiteRequestStatus(rejectingRequest.id, 'rejected', {
                rejectionReason: rejectionReason.trim()
            });
            setIncomingRequests(prev => prev.map(r => r.id === rejectingRequest.id ? (updated || { ...r, status: 'rejected', rejectionReason: rejectionReason.trim() }) : r));
            setRejectingRequest(null);
            setRejectionReason('');
        } catch (err) {
            console.error('Error rejecting request:', err);
            alert('Failed to update request status.');
        } finally {
            setSubmittingRejection(false);
        }
    };

    const handleOpenAssignModal = (req) => {
        setAssigningRequest(req);
        // Pre-fill form from inquiry
        const matchedClient = clientsList.find(c => c.name === req.name || c.email === req.clientEmail);
        setAssignForm({
            name: `${req.buildingType || 'Turnkey Project'} - ${req.name}`,
            description: `Client Inquiry from ${req.name}.\nSite Address: ${req.siteAddress}\nBuilding Type: ${req.buildingType}\nRequired Details: ${req.requiredDetails || req.siteDetails || req.anotherDetails || 'None'}`,
            location: req.siteAddress || 'Chennai, Tamil Nadu',
            budget: req.amount || '₹60,00,000',
            target_date: '2027-03-31',
            stage: 'Site Preparation & Excavation',
            client_id: matchedClient ? matchedClient.id : (clientsList[0]?.id || ''),
            site_engineer_id: engineersList[0]?.id || ''
        });
    };

    const handleConfirmAssign = async (e) => {
        if (e) e.preventDefault();
        if (!assignForm.site_engineer_id) {
            alert('Please select a site engineer to assign to this project.');
            return;
        }

        try {
            setSubmittingAssignment(true);
            const selectedEng = engineersList.find(eng => String(eng.id) === String(assignForm.site_engineer_id));
            const engineerName = selectedEng ? (selectedEng.email || selectedEng.name) : 'Site Engineer';

            // 1. Create the project in backend
            const res = await authFetch(`${API_BASE}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...assignForm,
                    contractor_id: user?.id,
                    progress: 0,
                    status: 'In Progress'
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.warn('Backend project creation response:', errData);
            }

            // 2. Mark request as accepted with assigned site engineer
            const updated = await communityService.updateSiteRequestStatus(assigningRequest.id, 'accepted', {
                assignedEngineerId: assignForm.site_engineer_id,
                assignedEngineerName: engineerName
            });

            setIncomingRequests(prev => prev.map(r => r.id === assigningRequest.id ? (updated || { 
                ...r, 
                status: 'accepted', 
                assignedEngineerId: assignForm.site_engineer_id, 
                assignedEngineerName: engineerName 
            }) : r));

            setAssigningRequest(null);
            await fetchProjects();
        } catch (err) {
            console.error('Error assigning engineer & launching project:', err);
            alert('An error occurred while assigning the engineer.');
        } finally {
            setSubmittingAssignment(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchProjects();
            fetchUsersForAssignment();
            fetchIncomingRequests();
            fetchContractorEngineers();
        }
    }, [user, fetchProjects, fetchIncomingRequests, fetchContractorEngineers]);

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
            const res = await authFetch(`${API_BASE}/api/projects`, {
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
                                <p className="text-3xl font-black text-gray-900 mt-1">{contractorEngineers.length || engineersList.length || 1}</p>
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
                                                            : (req.status === 'declined' || req.status === 'rejected')
                                                            ? 'bg-red-100 text-red-600 border border-red-200' 
                                                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                    }`}>
                                                        {req.status === 'accepted' ? 'Accepted & Assigned' : (req.status === 'declined' || req.status === 'rejected') ? 'Rejected' : 'Pending Review'}
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
                                                        <span className="text-gray-600">{req.requiredDetails || req.siteDetails || req.anotherDetails || 'None specified'}</span>
                                                    </div>
                                                </div>

                                                {/* Rejection Reason Display if Rejected */}
                                                {(req.status === 'rejected' || req.status === 'declined') && (req.rejectionReason || req.rejection_reason) && (
                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 space-y-1">
                                                        <div className="font-bold flex items-center gap-1.5 text-red-900">
                                                            <AlertCircle size={14} className="text-red-600 shrink-0" /> Rejection Reason Given:
                                                        </div>
                                                        <p className="text-red-700 pl-5 leading-relaxed font-medium">
                                                            {req.rejectionReason || req.rejection_reason}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Assigned Site Engineer Display if Accepted */}
                                                {req.status === 'accepted' && (req.assignedEngineerName || req.assigned_engineer_id) && (
                                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <HardHat size={16} className="text-emerald-700 shrink-0" />
                                                            <div>
                                                                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Assigned Field Engineer</span>
                                                                <span className="font-bold text-emerald-950">{req.assignedEngineerName || 'Assigned Site Engineer'}</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-300">
                                                            Tracked
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                                                <span className="text-[11px] text-gray-400">
                                                    Received {new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {req.status === 'pending' ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleOpenRejectModal(req)}
                                                                className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
                                                            >
                                                                <XCircle size={14} /> Reject
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenAssignModal(req)}
                                                                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
                                                            >
                                                                <UserCheck size={14} /> Accept & Assign Engineer
                                                            </button>
                                                        </>
                                                    ) : (req.status === 'rejected' || req.status === 'declined') ? (
                                                        <button
                                                            onClick={() => handleOpenAssignModal(req)}
                                                            className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-accent bg-gray-100 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <HardHat size={13} /> Reconsider & Assign Engineer
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleOpenAssignModal(req)}
                                                            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <HardHat size={13} /> Re-assign Engineer
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SITE ENGINEERS & FIELD TEAM MANAGEMENT SECTION */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                                        <HardHat size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Site Engineers & Field Supervision Team
                                            </h2>
                                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                                                {contractorEngineers.length} {contractorEngineers.length === 1 ? 'Engineer' : 'Engineers'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Manage certified site engineers reporting under your firm, inspect their assigned site projects, or add new field leads.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsAddEngineerModalOpen(true)}
                                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all shrink-0"
                                >
                                    <UserPlus size={16} /> + Add New Site Engineer
                                </button>
                            </div>

                            {loadingEngineers ? (
                                <div className="p-10 text-center text-gray-400 text-sm">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto mb-2"></div>
                                    Loading site engineers team...
                                </div>
                            ) : contractorEngineers.length === 0 ? (
                                <div className="p-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <HardHat className="mx-auto text-gray-400 mb-2" size={32} />
                                    <p className="text-sm font-semibold text-gray-700">No site engineers on your team yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Site engineers work below the general contractor to oversee daily logs, site tasks, and construction milestones.</p>
                                    <button
                                        onClick={() => setIsAddEngineerModalOpen(true)}
                                        className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs"
                                    >
                                        + Onboard First Site Engineer
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    {contractorEngineers.map((eng) => (
                                        <div 
                                            key={eng.id}
                                            className="border border-gray-200 rounded-2xl p-5 hover:border-amber-400/60 hover:shadow-md transition-all bg-gradient-to-br from-white to-amber-50/20 flex flex-col justify-between"
                                        >
                                            <div>
                                                {/* Header: Engineer Identity and Remove Action */}
                                                <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-black text-lg shadow-2xs shrink-0">
                                                            {eng.name ? eng.name.charAt(0) : 'E'}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-base font-bold text-gray-900 leading-snug">
                                                                    {eng.name || eng.email.split('@')[0]}
                                                                </h3>
                                                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                                                    Field Lead
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 flex flex-wrap items-center gap-1.5 mt-1">
                                                                <span className="inline-flex items-center gap-1">
                                                                    <Mail size={12} className="text-gray-400 shrink-0" />
                                                                    <span>{eng.email}</span>
                                                                </span>
                                                                {eng.phone && (
                                                                    <>
                                                                        <span className="text-gray-300">•</span>
                                                                        <span className="inline-flex items-center gap-1">
                                                                            <Phone size={12} className="text-gray-400 shrink-0" />
                                                                            <span>{eng.phone}</span>
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => setRemovingEngineer(eng)}
                                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors shrink-0"
                                                        title="Remove Site Engineer from Team"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                {/* Specialization Badge */}
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80">
                                                        <Award size={13} className="text-amber-600 shrink-0" />
                                                        {eng.specialization || 'Civil Site QA & Field Lead'}
                                                    </span>
                                                </div>

                                                {/* Assigned Projects Detail Area */}
                                                <div className="mt-4 space-y-2">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                                                            Assigned Site Projects
                                                        </span>
                                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                                            eng.projects?.length > 0 
                                                                ? 'bg-orange-100 text-accent' 
                                                                : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                            {eng.projects?.length || 0} Active Sites
                                                        </span>
                                                    </div>

                                                    {eng.projects && eng.projects.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {eng.projects.map((proj) => (
                                                                <div 
                                                                    key={proj.id}
                                                                    className="bg-white p-3.5 rounded-xl border border-gray-200/80 hover:border-accent/40 transition-colors shadow-2xs space-y-2"
                                                                >
                                                                    <div className="flex justify-between items-start gap-2">
                                                                        <div>
                                                                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                                                                <Building2 size={14} className="text-accent shrink-0" />
                                                                                {proj.name}
                                                                            </h4>
                                                                            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                                                <MapPin size={11} className="text-gray-400 shrink-0" />
                                                                                <span>{proj.location}</span>
                                                                            </p>
                                                                        </div>
                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-accent uppercase tracking-wider shrink-0 border border-orange-200/50">
                                                                            {proj.stage}
                                                                        </span>
                                                                    </div>

                                                                    {/* Progress Bar */}
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between text-[11px] font-semibold text-gray-600">
                                                                            <span>Progress</span>
                                                                            <span className="text-accent font-bold">{proj.progress}%</span>
                                                                        </div>
                                                                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                                            <div 
                                                                                className="bg-accent h-full rounded-full transition-all duration-300"
                                                                                style={{ width: `${proj.progress}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* Project Financials, Target Date, Tracker Shortcut */}
                                                                    <div className="flex justify-between items-center pt-1.5 text-[11px] text-gray-500 border-t border-gray-100">
                                                                        <span>Budget: <strong className="text-gray-800">{proj.budget}</strong></span>
                                                                        <span>Target: <strong className="text-gray-800">{proj.target_date}</strong></span>
                                                                        <button
                                                                            onClick={() => setSelectedProjectId(proj.id)}
                                                                            className="text-accent hover:text-orange-700 font-bold inline-flex items-center gap-0.5 hover:underline"
                                                                        >
                                                                            Tracker <ChevronRight size={12} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-gray-50/70 p-3 rounded-xl border border-dashed border-gray-200 text-xs text-gray-500 flex items-center justify-between gap-2">
                                                            <span className="italic">No active project assigned currently. Ready for site assignment.</span>
                                                            <button
                                                                onClick={() => {
                                                                    setNewProjectForm(prev => ({ ...prev, site_engineer_id: eng.id }));
                                                                    setIsCreateModalOpen(true);
                                                                }}
                                                                className="text-xs font-bold text-accent hover:text-orange-700 hover:underline shrink-0"
                                                            >
                                                                + Assign Site
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Card Footer Status */}
                                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400">
                                                <span>Registered Under Contractor #{user?.id}</span>
                                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                                    <CheckCircle size={12} /> Authorized Field Supervisor
                                                </span>
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
                                                            {proj.client_email || 'Not Assigned'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block text-[10px] uppercase font-bold">Site Engineer</span>
                                                        <span className="text-amber-700 font-semibold truncate block">
                                                            {proj.site_engineer_email || 'Not Assigned'}
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

            {/* REJECTION REASON MODAL */}
            {rejectingRequest && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white text-gray-900 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 my-8">
                        <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                                    <AlertTriangle size={20} className="text-red-500" /> Decline Project Request
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Specify the reason for declining this request. The client will be notified with your explanation.
                                </p>
                            </div>
                            <button 
                                onClick={() => setRejectingRequest(null)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Request Brief */}
                        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 mt-4 space-y-1.5 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900 text-sm">{rejectingRequest.name}</span>
                                <span className="px-2 py-0.5 rounded bg-orange-100 text-accent font-bold uppercase text-[10px]">
                                    {rejectingRequest.buildingType || 'Building Project'}
                                </span>
                            </div>
                            <div className="text-gray-600 flex items-center gap-1">
                                <MapPin size={12} className="text-gray-400 shrink-0" />
                                <span>{rejectingRequest.siteAddress}</span>
                            </div>
                            <div className="text-gray-600 flex items-center gap-1">
                                <DollarSign size={12} className="text-accent shrink-0" />
                                <span>Budget: <strong className="text-gray-800">{rejectingRequest.amount}</strong></span>
                            </div>
                        </div>

                        <form onSubmit={handleConfirmReject} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Select Quick Reason or Type Below <span className="text-red-500">*</span>
                                </label>
                                
                                {/* Quick Preset Buttons */}
                                <div className="flex flex-wrap gap-1.5 mb-2.5">
                                    {REJECTION_PRESETS.map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setRejectionReason(preset)}
                                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left ${
                                                rejectionReason === preset
                                                    ? 'bg-red-600 text-white border-red-600 font-semibold shadow-2xs'
                                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700'
                                            }`}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    rows={3}
                                    required
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter detailed reason for rejecting this project request..."
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRejectingRequest(null)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingRejection || !rejectionReason.trim()}
                                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5"
                                >
                                    <XCircle size={16} />
                                    {submittingRejection ? "Declining..." : "Confirm & Send Rejection"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ASSIGN PROJECT TO SITE ENGINEER MODAL */}
            {assigningRequest && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white text-gray-900 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8">
                        <div className="flex justify-between items-start pb-4 border-b border-gray-200">
                            <div>
                                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <HardHat className="text-accent" size={24} /> Accept & Assign Project to Site Engineer
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Initialize this construction project and assign field oversight to a certified Site Engineer.
                                </p>
                            </div>
                            <button 
                                onClick={() => setAssigningRequest(null)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Request Summary Card */}
                        <div className="bg-orange-50/60 p-4 rounded-xl border border-orange-100 mt-4 space-y-1.5 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900 text-sm">{assigningRequest.name}</span>
                                <span className="px-2.5 py-0.5 rounded bg-white text-accent font-bold uppercase text-[10px] border border-orange-200 shadow-2xs">
                                    {assigningRequest.buildingType || 'Building Project'}
                                </span>
                            </div>
                            <div className="text-gray-700 flex items-center gap-1">
                                <MapPin size={13} className="text-gray-400 shrink-0" />
                                <span>{assigningRequest.siteAddress}</span>
                            </div>
                            <div className="text-gray-700 flex items-center gap-1">
                                <DollarSign size={13} className="text-accent shrink-0" />
                                <span>Requested Budget: <strong className="text-gray-900">{assigningRequest.amount}</strong></span>
                            </div>
                            {(assigningRequest.requiredDetails || assigningRequest.siteDetails) && (
                                <p className="text-gray-600 text-[11px] pt-1 border-t border-orange-200/50">
                                    <strong className="text-gray-700">Specs: </strong>{assigningRequest.requiredDetails || assigningRequest.siteDetails}
                                </p>
                            )}
                        </div>

                        <form onSubmit={handleConfirmAssign} className="space-y-4 mt-4">
                            {/* Site Engineer Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                                    Assign Site Engineer (Field Lead) <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={assignForm.site_engineer_id}
                                    onChange={(e) => setAssignForm({ ...assignForm, site_engineer_id: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-white border-2 border-emerald-500 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-2xs"
                                >
                                    <option value="">-- Choose a Site Engineer to Lead Field Works --</option>
                                    {engineersList.map(eng => (
                                        <option key={eng.id} value={eng.id}>
                                            {eng.email} {eng.name ? `(${eng.name})` : ''} - Site QA & Field Lead
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    The selected engineer will immediately gain tracking and daily logging access on their Site Engineer Portal.
                                </p>
                            </div>

                            {/* Project Name */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Project Name</label>
                                <input
                                    type="text"
                                    required
                                    value={assignForm.name}
                                    onChange={(e) => setAssignForm({ ...assignForm, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>

                            {/* Client & Initial Stage */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Link Client Account</label>
                                    <select
                                        value={assignForm.client_id}
                                        onChange={(e) => setAssignForm({ ...assignForm, client_id: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                    >
                                        {clientsList.map(c => (
                                            <option key={c.id} value={c.id}>{c.email}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Initial Construction Stage</label>
                                    <select
                                        value={assignForm.stage}
                                        onChange={(e) => setAssignForm({ ...assignForm, stage: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                    >
                                        <option value="Site Preparation & Excavation">Site Preparation & Excavation</option>
                                        <option value="Foundation & Footing">Foundation & Footing</option>
                                        <option value="Plinth & Columns Framing">Plinth & Columns Framing</option>
                                        <option value="Brickwork & Masonry">Brickwork & Masonry</option>
                                        <option value="Plumbing & Electrical MEP">Plumbing & Electrical MEP</option>
                                        <option value="Finishing & Handover">Finishing & Handover</option>
                                    </select>
                                </div>
                            </div>

                            {/* Budget & Target Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Agreed Project Budget</label>
                                    <input
                                        type="text"
                                        value={assignForm.budget}
                                        onChange={(e) => setAssignForm({ ...assignForm, budget: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Completion Date</label>
                                    <input
                                        type="date"
                                        value={assignForm.target_date}
                                        onChange={(e) => setAssignForm({ ...assignForm, target_date: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAssigningRequest(null)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingAssignment || !assignForm.site_engineer_id}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
                                >
                                    <HardHat size={18} />
                                    {submittingAssignment ? "Assigning..." : "Assign Engineer & Launch Project"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ONBOARD NEW SITE ENGINEER MODAL */}
            {isAddEngineerModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white text-gray-900 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8">
                        <div className="flex justify-between items-start pb-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                                    <HardHat size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-primary">
                                        Onboard New Site Engineer
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Register a field supervisor under your contracting license.
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsAddEngineerModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateEngineer} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Full Name & Credentials <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Er. Karthik Raja, B.E. (Civil)"
                                    value={newEngineerForm.name}
                                    onChange={(e) => setNewEngineerForm({ ...newEngineerForm, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Work Email (Login ID) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="e.g. karthik.engineer@engineersveedu.com"
                                    value={newEngineerForm.email}
                                    onChange={(e) => setNewEngineerForm({ ...newEngineerForm, email: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Initial Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newEngineerForm.password}
                                        onChange={(e) => setNewEngineerForm({ ...newEngineerForm, password: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                    <span className="text-[10px] text-gray-400">Default: password123</span>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Contact Phone
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. +91 98401 23456"
                                        value={newEngineerForm.phone}
                                        onChange={(e) => setNewEngineerForm({ ...newEngineerForm, phone: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Engineering Specialization
                                </label>
                                <select
                                    value={newEngineerForm.specialization}
                                    onChange={(e) => setNewEngineerForm({ ...newEngineerForm, specialization: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="Lead Structural Consultant & RCC Specialist">Lead Structural Consultant & RCC Specialist</option>
                                    <option value="Civil Site QA/QC & Inspection">Civil Site QA/QC & Inspection</option>
                                    <option value="Foundation, Soil QA & Deep Excavation">Foundation, Soil QA & Deep Excavation</option>
                                    <option value="MEP, Electrical & Plumbing Specialist">MEP, Electrical & Plumbing Specialist</option>
                                    <option value="Finishing, Flooring & Architectural Woodwork">Finishing, Flooring & Architectural Woodwork</option>
                                    <option value="General Building Construction Supervisor">General Building Construction Supervisor</option>
                                </select>
                            </div>

                            <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
                                <p className="font-semibold">Subordinate Hierarchy:</p>
                                <p className="text-[11px] text-amber-800">
                                    The site engineer operates directly below your general contractor account. They can log daily site labor, materials, weather, and photos on assigned projects.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddEngineerModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingEngineer}
                                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
                                >
                                    <UserPlus size={16} />
                                    {creatingEngineer ? "Creating..." : "+ Register Site Engineer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* REMOVE SITE ENGINEER CONFIRMATION MODAL */}
            {removingEngineer && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white text-gray-900 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 my-8">
                        <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                                    <Trash2 size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-red-600">
                                        Remove Site Engineer
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        De-register this field supervisor from your firm
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setRemovingEngineer(null)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3">
                            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1">
                                <p className="font-bold text-gray-900 text-sm">{removingEngineer.name}</p>
                                <p className="text-gray-500">{removingEngineer.email}</p>
                                <p className="text-gray-600 font-semibold">{removingEngineer.specialization}</p>
                            </div>

                            {removingEngineer.projects && removingEngineer.projects.length > 0 ? (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 space-y-1.5">
                                    <p className="font-bold flex items-center gap-1.5 text-red-900">
                                        <AlertTriangle size={14} className="text-red-600 shrink-0" />
                                        Assigned to {removingEngineer.projects.length} Active Project(s):
                                    </p>
                                    <ul className="list-disc pl-5 space-y-0.5 text-red-700">
                                        {removingEngineer.projects.map(p => (
                                            <li key={p.id} className="font-semibold">{p.name} ({p.stage})</li>
                                        ))}
                                    </ul>
                                    <p className="text-[11px] text-red-600 pt-1">
                                        Removing this engineer will clear them from these projects. Historical daily logs recorded by them will remain preserved.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500">
                                    This engineer has no active assigned projects. They can be safely removed.
                                </p>
                            )}
                        </div>

                        <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setRemovingEngineer(null)}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deletingEngineer}
                                onClick={handleConfirmRemoveEngineer}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5"
                            >
                                <Trash2 size={16} />
                                {deletingEngineer ? "Removing..." : "Confirm & Remove"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractorDashboard;

