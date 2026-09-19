import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    HardHat, LogOut, Plus, Calendar, MapPin, CheckCircle, 
    ArrowRight, Activity, CloudSun, AlertTriangle, Users, ShieldCheck, X,
    UploadCloud, Trash2
} from 'lucide-react';
import ProjectTracker from '../components/ProjectTracker';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STANDARD_STAGES = [
    "Site Preparation & Excavation",
    "Foundation & Footing",
    "Plinth & Columns Framing",
    "Brickwork & Masonry",
    "Plumbing & Electrical MEP",
    "Plastering & Tiling",
    "Painting, Fixtures & Handover"
];

const SiteEngineerDashboard = () => {
    const navigate = useNavigate();

    const [user] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Error parsing user in SiteEngineerDashboard:", e);
            return null;
        }
    });

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    // Quick Log Modal
    const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
    const [quickLogProjectId, setQuickLogProjectId] = useState('');
    const [submittingQuickLog, setSubmittingQuickLog] = useState(false);
    const [quickLogImageFile, setQuickLogImageFile] = useState(null);
    const [quickLogImagePreview, setQuickLogImagePreview] = useState(null);
    const [quickLogForm, setQuickLogForm] = useState({
        date: new Date().toISOString().split('T')[0],
        stage: 'Brickwork & Masonry',
        work_completed: '',
        progress_added: 2,
        labor_count: 14,
        materials_used: '40 bags cement, screened sand',
        weather: 'Clear / Sunny (31°C)',
        issues_delay: 'None',
        site_photos: ''
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (user.role !== 'site_engineer') {
            if (user.role === 'contractor' || user.role === 'builder') {
                navigate('/contractor-dashboard');
            } else {
                navigate('/client-dashboard');
            }
        }
    }, [user, navigate]);

    const fetchAssignedProjects = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/projects?user_id=${user?.id}&role=site_engineer`);
            if (res.ok) {
                const data = await res.json();
                const projs = data.projects || [];
                setProjects(projs);
                if (projs.length > 0 && !quickLogProjectId) {
                    setQuickLogProjectId(projs[0].id);
                    setQuickLogForm(prev => ({ ...prev, stage: projs[0].stage || 'Brickwork & Masonry' }));
                }
            }
        } catch (err) {
            console.error("Error fetching site engineer projects:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchAssignedProjects();
        }
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('user-state-change'));
        navigate('/login');
    };

    const handleQuickLogSubmit = async (e) => {
        e.preventDefault();
        if (!quickLogProjectId) {
            alert("Please select a project");
            return;
        }
        if (!quickLogForm.work_completed.trim()) {
            alert("Please enter work completed description");
            return;
        }

        try {
            setSubmittingQuickLog(true);
            let finalPhotoUrl = quickLogForm.site_photos;

            if (quickLogImageFile) {
                const formData = new FormData();
                formData.append('file', quickLogImageFile);
                const uploadRes = await fetch(`${API_BASE}/api/upload`, {
                    method: 'POST',
                    body: formData
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    finalPhotoUrl = uploadData.url;
                } else {
                    const uploadErr = await uploadRes.json().catch(() => ({}));
                    alert(uploadErr.error || "Failed to upload image file");
                    setSubmittingQuickLog(false);
                    return;
                }
            }

            const res = await fetch(`${API_BASE}/api/projects/${quickLogProjectId}/daily-logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...quickLogForm,
                    site_photos: finalPhotoUrl,
                    progress_added: Number(quickLogForm.progress_added) || 0,
                    labor_count: Number(quickLogForm.labor_count) || 0,
                    logged_by: user?.id
                })
            });

            if (res.ok) {
                setIsQuickLogOpen(false);
                setQuickLogImageFile(null);
                setQuickLogImagePreview(null);
                setQuickLogForm({
                    date: new Date().toISOString().split('T')[0],
                    stage: 'Brickwork & Masonry',
                    work_completed: '',
                    progress_added: 2,
                    labor_count: 14,
                    materials_used: '40 bags cement, screened sand',
                    weather: 'Clear / Sunny (31°C)',
                    issues_delay: 'None',
                    site_photos: ''
                });
                await fetchAssignedProjects();
                setSelectedProjectId(quickLogProjectId); // immediately open project tracker
            } else {
                const err = await res.json();
                alert(err.error || "Failed to submit log");
            }
        } catch (err) {
            console.error("Error submitting log:", err);
            alert("Network error submitting log");
        } finally {
            setSubmittingQuickLog(false);
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
                {/* Header Section */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-l-8 border-amber-500 border border-gray-100">
                    <div className="flex items-center gap-5">
                        <div className="bg-amber-50 p-4 rounded-2xl text-amber-600">
                            <HardHat size={36} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Site Engineer Field Portal</h1>
                                <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
                                    Field Operations
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm mt-1">
                                Welcome, {user.email} • Daily progress updates, materials consumption & site inspections
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsQuickLogOpen(true)}
                            className="flex items-center gap-2 bg-accent hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all"
                        >
                            <Plus size={18} /> Post Today's Site Update
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
                                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                                        <HardHat size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">Assigned</span>
                                </div>
                                <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider">Active Field Sites</h3>
                                <p className="text-3xl font-black text-gray-900 mt-1">{projects.length}</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                        <Calendar size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">Consecutive</span>
                                </div>
                                <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider">Site Updates Logged</h3>
                                <p className="text-3xl font-black text-gray-900 mt-1">
                                    {projects.reduce((acc, p) => acc + (p.total_logs || 0), 0)}
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                        <Users size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Active</span>
                                </div>
                                <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider">Average Daily Labor</h3>
                                <p className="text-3xl font-black text-emerald-600 mt-1">15 Artisans</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                        <CloudSun size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">Tamil Nadu</span>
                                </div>
                                <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider">Site Weather</h3>
                                <p className="text-2xl font-bold text-gray-900 mt-1">31°C Clear</p>
                            </div>
                        </div>

                        {/* Assigned Projects Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <HardHat className="text-amber-500" size={22} /> Assigned Construction Sites
                                </h2>
                                <span className="text-xs text-gray-500">
                                    Submit daily logs or view deep AI project analysis
                                </span>
                            </div>

                            {loading ? (
                                <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-3"></div>
                                    <p>Loading assigned sites...</p>
                                </div>
                            ) : projects.length === 0 ? (
                                <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
                                    <p className="text-lg font-bold text-gray-800">No sites assigned yet.</p>
                                    <p className="text-sm mt-1">Your contractor will assign you to active projects.</p>
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
                                                        <h3 className="text-xl font-bold text-primary group-hover:text-amber-600 transition-colors">
                                                            {proj.name}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                            <MapPin size={14} className="text-amber-500" /> {proj.location}
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                                                        {proj.stage}
                                                    </span>
                                                </div>

                                                <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mb-4 leading-relaxed">
                                                    {proj.description}
                                                </p>

                                                {/* Connected parties */}
                                                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 mb-4 text-xs">
                                                    <div>
                                                        <span className="text-gray-500 block text-[10px] uppercase font-bold">Client (Owner)</span>
                                                        <span className="text-gray-800 font-semibold truncate block">
                                                            {proj.client_email || 'client@demo.com'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block text-[10px] uppercase font-bold">Contractor Lead</span>
                                                        <span className="text-purple-700 font-semibold truncate block">
                                                            {proj.contractor_email || 'contractor@engineersveedu.com'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="space-y-1.5 mb-4">
                                                    <div className="flex justify-between text-xs font-semibold">
                                                        <span className="text-gray-500">Current Progress</span>
                                                        <span className="text-amber-600 font-bold">{proj.progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                        <div 
                                                            className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500" 
                                                            style={{ width: `${proj.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2 justify-between items-center">
                                                <button
                                                    onClick={() => {
                                                        setQuickLogProjectId(proj.id);
                                                        setQuickLogForm(prev => ({ ...prev, stage: proj.stage }));
                                                        setIsQuickLogOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-accent hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                                                >
                                                    <Plus size={14} /> Add Today's Log
                                                </button>
                                                <button
                                                    onClick={() => setSelectedProjectId(proj.id)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors border border-gray-200"
                                                >
                                                    Open Tracker & AI <ArrowRight size={14} />
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

            {/* QUICK DAILY LOG MODAL */}
            {isQuickLogOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white text-gray-900 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                <HardHat className="text-amber-500" size={22} /> Site Engineer Daily Update
                            </h3>
                            <button 
                                onClick={() => setIsQuickLogOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleQuickLogSubmit} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Construction Site</label>
                                <select
                                    value={quickLogProjectId}
                                    onChange={(e) => {
                                        setQuickLogProjectId(e.target.value);
                                        const p = projects.find(x => x.id === Number(e.target.value));
                                        if (p?.stage) {
                                            setQuickLogForm(prev => ({ ...prev, stage: p.stage }));
                                        }
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                >
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={quickLogForm.date}
                                        onChange={(e) => setQuickLogForm({ ...quickLogForm, date: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Construction Stage</label>
                                    <select
                                        value={quickLogForm.stage}
                                        onChange={(e) => setQuickLogForm({ ...quickLogForm, stage: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                    >
                                        {STANDARD_STAGES.map((st, i) => (
                                            <option key={i} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Work Accomplished Today</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="e.g. Masonry brick laying for first-floor outer wall up to lintel beam level..."
                                    value={quickLogForm.work_completed}
                                    onChange={(e) => setQuickLogForm({ ...quickLogForm, work_completed: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Labor (Workers)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={quickLogForm.labor_count}
                                        onChange={(e) => setQuickLogForm({ ...quickLogForm, labor_count: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Progress Added (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={quickLogForm.progress_added}
                                        onChange={(e) => setQuickLogForm({ ...quickLogForm, progress_added: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Weather</label>
                                    <select
                                        value={quickLogForm.weather}
                                        onChange={(e) => setQuickLogForm({ ...quickLogForm, weather: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                    >
                                        <option value="Clear / Sunny (31°C)">Clear / Sunny (31°C)</option>
                                        <option value="Overcast (28°C)">Overcast (28°C)</option>
                                        <option value="Scattered Rain">Scattered Rain</option>
                                        <option value="Heavy Rain">Heavy Rain</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Materials Used</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 35 bags cement, 1 truck sand, 2000 bricks"
                                    value={quickLogForm.materials_used}
                                    onChange={(e) => setQuickLogForm({ ...quickLogForm, materials_used: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Issues / Delays (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. None, or 'Cement delivery delayed 1 hr'"
                                    value={quickLogForm.issues_delay}
                                    onChange={(e) => setQuickLogForm({ ...quickLogForm, issues_delay: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>

                            {/* Site Inspection Photo Upload */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Site Inspection Photo (Image File)
                                </label>
                                {quickLogImagePreview ? (
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src={quickLogImagePreview}
                                                alt="Preview"
                                                className="w-16 h-12 object-cover rounded-lg border border-gray-300 shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <span className="text-xs font-bold text-gray-800 truncate block">
                                                    {quickLogImageFile?.name}
                                                </span>
                                                <span className="text-[11px] text-emerald-600 font-semibold block">
                                                    ✓ File ready ({Math.round((quickLogImageFile?.size || 0) / 1024)} KB)
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQuickLogImageFile(null);
                                                setQuickLogImagePreview(null);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                            title="Remove image"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="border-2 border-dashed border-gray-300 hover:border-accent rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-gray-50 hover:bg-orange-50/40 transition-colors text-center">
                                        <UploadCloud size={22} className="text-gray-400" />
                                        <span className="text-xs text-gray-700 font-semibold">
                                            Click to browse image or take a photo
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            JPG, PNG, WebP supported
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    if (!file.type.startsWith('image/')) {
                                                        alert("Please select a valid image file");
                                                        return;
                                                    }
                                                    setQuickLogImageFile(file);
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setQuickLogImagePreview(reader.result);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsQuickLogOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingQuickLog}
                                    className="px-6 py-2 bg-accent hover:bg-orange-600 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50"
                                >
                                    {submittingQuickLog ? "Recording..." : "Save Today's Update"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiteEngineerDashboard;

