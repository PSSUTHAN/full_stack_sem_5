import React, { useState, useEffect, useCallback } from 'react';
import { 
    Calendar, CheckCircle2, AlertTriangle, Users, HardHat, 
    Layers, Sparkles, Plus, Trash2, ArrowLeft, RefreshCw, 
    MapPin, DollarSign, CloudSun, ShieldCheck, 
    FileText, X, Image as ImageIcon, Printer, 
    ClipboardCheck, Hammer, Wrench, Check, Filter,
    UploadCloud
} from 'lucide-react';

import { authFetch } from '../services/apiClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
    }
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const STANDARD_STAGES = [
    "Site Preparation & Excavation",
    "Foundation & Footing",
    "Plinth & Columns Framing",
    "Brickwork & Masonry",
    "Plumbing & Electrical MEP",
    "Plastering & Tiling",
    "Painting, Fixtures & Handover"
];

const SAMPLE_PHOTO_PRESETS = [
    { label: "Footing Excavation", url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800" },
    { label: "RCC Reinforcement", url: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&q=80&w=800" },
    { label: "Concrete Pouring", url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800" },
    { label: "Brick Masonry", url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800" }
];

const ProjectTracker = ({ projectId, user, onBack }) => {
    const [activeTab, setActiveTab] = useState('timeline'); // 'timeline', 'components', 'roadmap', 'analysis'
    const [project, setProject] = useState(null);
    const [dailyLogs, setDailyLogs] = useState([]);
    const [componentsData, setComponentsData] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Detailed Log Dossier Modal
    const [selectedDossierLog, setSelectedDossierLog] = useState(null);

    // Component filter
    const [componentStatusFilter, setComponentStatusFilter] = useState('All');

    // Modal state for adding daily update
    const [isAddLogOpen, setIsAddLogOpen] = useState(false);
    const [submittingLog, setSubmittingLog] = useState(false);
    const [showDetailedInputs, setShowDetailedInputs] = useState(false);

    // Image file upload state
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [photoInputMode, setPhotoInputMode] = useState('file'); // 'file' or 'url'

    const [logForm, setLogForm] = useState({
        date: new Date().toISOString().split('T')[0],
        stage: 'Brickwork & Masonry',
        work_completed: '',
        progress_added: 2,
        labor_count: 14,
        materials_used: '',
        weather: 'Clear / Sunny (31°C)',
        issues_delay: 'None',
        site_photos: '',
        // Detailed breakdowns
        masons: 4,
        helpers: 7,
        bar_benders: 2,
        carpenters: 1,
        cement_bags: 35,
        steel_tons: 0,
        bricks_count: 3000,
        concrete_grade: 'M25',
        curing_day: 'Day 3 of 14',
        slump_test: '110 mm',
        sub_tasks_input: 'Brick alignment checked, Mortar ratio 1:6 verified, Scaffolding safe'
    });

    const isSiteEngineer = user?.role === 'site_engineer';
    const isContractor = user?.role === 'contractor' || user?.role === 'builder';
    const canPostUpdates = isSiteEngineer || isContractor;

    // Fetch project details, daily logs, and components WBS
    const fetchProjectData = useCallback(async () => {
        try {
            setLoading(true);
            const [pRes, logsRes, compRes] = await Promise.all([
                authFetch(`${API_BASE}/api/projects/${projectId}`),
                authFetch(`${API_BASE}/api/projects/${projectId}/daily-logs`),
                authFetch(`${API_BASE}/api/projects/${projectId}/components`)
            ]);

            if (pRes.ok) {
                const pData = await pRes.json();
                setProject(pData.project);
                if (pData.project.stage) {
                    setLogForm(prev => ({ ...prev, stage: pData.project.stage }));
                }
            }

            if (logsRes.ok) {
                const logsData = await logsRes.json();
                setDailyLogs(logsData.logs || []);
            }

            if (compRes.ok) {
                const compData = await compRes.json();
                setComponentsData(compData);
            }
        } catch (err) {
            console.error("Error fetching project tracking data:", err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    // Fetch AI efficiency analysis
    const fetchAnalysis = useCallback(async () => {
        try {
            setAnalysisLoading(true);
            const res = await authFetch(`${API_BASE}/api/projects/${projectId}/analysis`);
            if (res.ok) {
                const data = await res.json();
                setAnalysis(data);
            }
        } catch (err) {
            console.error("Error fetching AI analysis:", err);
        } finally {
            setAnalysisLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (projectId) {
            fetchProjectData();
            fetchAnalysis();
        }
    }, [projectId, fetchProjectData, fetchAnalysis]);

    const handleCreateDailyLog = async (e) => {
        e.preventDefault();
        if (!logForm.work_completed.trim()) {
            alert("Please enter the work completed description");
            return;
        }

        // Build structured sub-tasks
        const subTasksList = logForm.sub_tasks_input
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)
            .map(t => ({ task: t, status: "Completed", verified: true }));

        const laborBreakdown = {
            masons: Number(logForm.masons) || 0,
            helpers: Number(logForm.helpers) || 0,
            bar_benders: Number(logForm.bar_benders) || 0,
            carpenters: Number(logForm.carpenters) || 0
        };

        const totalCalculatedLabor = (laborBreakdown.masons + laborBreakdown.helpers + laborBreakdown.bar_benders + laborBreakdown.carpenters) || Number(logForm.labor_count) || 10;

        const materialsBreakdown = {
            cement_bags: Number(logForm.cement_bags) || 0,
            steel_tons: Number(logForm.steel_tons) || 0,
            bricks_count: Number(logForm.bricks_count) || 0,
            description: logForm.materials_used
        };

        const qualityChecks = {
            concrete_grade: logForm.concrete_grade,
            curing_day: logForm.curing_day,
            slump_test: logForm.slump_test,
            inspection_status: "Certified by Site Engineer"
        };

        try {
            setSubmittingLog(true);
            let finalPhotoUrl = logForm.site_photos;

            // If an image file was selected by the engineer, upload it to the server
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);
                const uploadRes = await authFetch(`${API_BASE}/api/upload`, {
                    method: 'POST',
                    body: formData
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    finalPhotoUrl = uploadData.url;
                } else {
                    const uploadErr = await uploadRes.json().catch(() => ({}));
                    alert(uploadErr.error || "Failed to upload image file");
                    setSubmittingLog(false);
                    return;
                }
            }

            const res = await authFetch(`${API_BASE}/api/projects/${projectId}/daily-logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: logForm.date,
                    stage: logForm.stage,
                    work_completed: logForm.work_completed,
                    progress_added: Number(logForm.progress_added) || 0,
                    labor_count: totalCalculatedLabor,
                    materials_used: logForm.materials_used || `${logForm.cement_bags || 35} bags cement, ${logForm.bricks_count ? logForm.bricks_count + ' bricks' : 'screened sand'}`,
                    weather: logForm.weather,
                    issues_delay: logForm.issues_delay,
                    site_photos: finalPhotoUrl,
                    sub_tasks: subTasksList,
                    labor_breakdown: laborBreakdown,
                    materials_breakdown: materialsBreakdown,
                    quality_checks: qualityChecks,
                    inspection_status: "Verified",
                    logged_by: user?.id
                })
            });

            if (res.ok) {
                setIsAddLogOpen(false);
                setImageFile(null);
                setImagePreview(null);
                setLogForm({
                    date: new Date().toISOString().split('T')[0],
                    stage: project?.stage || 'Brickwork & Masonry',
                    work_completed: '',
                    progress_added: 2,
                    labor_count: 14,
                    materials_used: '',
                    weather: 'Clear / Sunny (31°C)',
                    issues_delay: 'None',
                    site_photos: '',
                    masons: 4,
                    helpers: 7,
                    bar_benders: 2,
                    carpenters: 1,
                    cement_bags: 35,
                    steel_tons: 0,
                    bricks_count: 3000,
                    concrete_grade: 'M25',
                    curing_day: 'Day 3 of 14',
                    slump_test: '110 mm',
                    sub_tasks_input: 'Brick alignment checked, Mortar ratio 1:6 verified, Scaffolding safe'
                });
                await fetchProjectData();
                fetchAnalysis();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to submit daily log");
            }
        } catch (err) {
            console.error("Error submitting log:", err);
            alert("Network error submitting daily log");
        } finally {
            setSubmittingLog(false);
        }
    };

    const handleDeleteLog = async (logId) => {
        if (!window.confirm("Are you sure you want to delete this daily update?")) return;
        try {
            const res = await authFetch(`${API_BASE}/api/projects/${projectId}/daily-logs/${logId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchProjectData();
                fetchAnalysis();
            }
        } catch (err) {
            console.error("Error deleting log:", err);
        }
    };

    const filteredLogs = dailyLogs.filter(l => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            l.work_completed?.toLowerCase().includes(q) ||
            l.stage?.toLowerCase().includes(q) ||
            l.materials_used?.toLowerCase().includes(q) ||
            l.date?.includes(q)
        );
    });

    if (loading && !project) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-gray-500 min-h-[400px]">
                <RefreshCw className="animate-spin text-accent mb-4" size={36} />
                <p className="text-lg font-medium">Loading Detailed Building Process Tracker...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="p-10 text-center text-gray-600">
                <p className="text-xl font-bold">Project not found.</p>
                {onBack && (
                    <button onClick={onBack} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
                        Back to Dashboard
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Navigation & Header */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
                {onBack && (
                    <button 
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-accent font-medium mb-4 transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{project.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                project.status === 'Delayed' ? 'bg-amber-100 text-amber-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>
                                {project.status}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-accent border border-orange-200">
                                Current Stage: {project.stage}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm max-w-3xl leading-relaxed">{project.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-6 mt-4 text-xs sm:text-sm text-gray-500">
                            <span className="flex items-center gap-1.5 font-medium">
                                <MapPin size={16} className="text-accent" /> {project.location}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium">
                                <DollarSign size={16} className="text-emerald-600" /> Budget: {project.budget}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium">
                                <Calendar size={16} className="text-blue-600" /> Target: {project.target_date}
                            </span>
                        </div>
                    </div>

                    {/* Progress Gauge */}
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 min-w-[240px] text-center lg:text-right">
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="text-xs font-bold uppercase text-gray-500">Overall Progress</span>
                            <span className="text-2xl font-black text-primary">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, project.progress)}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-gray-500 mt-2">
                            {dailyLogs.length} Day-by-Day Detailed Logs Recorded
                        </p>
                    </div>
                </div>

                {/* Connected Stakeholders Card */}
                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Client */}
                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            <Users size={18} />
                        </div>
                        <div className="truncate">
                            <p className="text-[11px] font-bold uppercase text-blue-700">Client / Property Owner</p>
                            <p className="text-sm font-semibold text-gray-800 truncate">{project.client_email || 'Assigned Client'}</p>
                        </div>
                    </div>

                    {/* Contractor */}
                    <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                            <ShieldCheck size={18} />
                        </div>
                        <div className="truncate">
                            <p className="text-[11px] font-bold uppercase text-purple-700">General Contractor</p>
                            <p className="text-sm font-semibold text-gray-800 truncate">{project.contractor_email || 'Contractor Management'}</p>
                        </div>
                    </div>

                    {/* Site Engineer */}
                    <div className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                            <HardHat size={18} />
                        </div>
                        <div className="truncate">
                            <p className="text-[11px] font-bold uppercase text-amber-700">On-Site Field Engineer</p>
                            <p className="text-sm font-semibold text-gray-800 truncate">{project.site_engineer_email || 'Field Operations Lead'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200">
                <div className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-1">
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                            activeTab === 'timeline'
                                ? 'border-accent text-accent'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <Calendar size={18} /> Day-by-Day Timeline ({dailyLogs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('components')}
                        className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                            activeTab === 'components'
                                ? 'border-accent text-accent'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <ClipboardCheck size={18} /> Detail Component WBS ({componentsData?.summary?.total_tasks || 40})
                    </button>
                    <button
                        onClick={() => setActiveTab('roadmap')}
                        className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                            activeTab === 'roadmap'
                                ? 'border-accent text-accent'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <Layers size={18} /> Milestones Roadmap
                    </button>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                            activeTab === 'analysis'
                                ? 'border-accent text-accent'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <Sparkles size={18} className="text-amber-500" /> AI Efficiency & Analytics
                    </button>
                </div>

                {/* Engineer Action */}
                {canPostUpdates && (
                    <button
                        onClick={() => setIsAddLogOpen(true)}
                        className="mb-2 inline-flex items-center gap-2 bg-accent hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md transition-all transform active:scale-95"
                    >
                        <Plus size={18} /> Post Today's Detailed Update
                    </button>
                )}
            </div>

            {/* TAB 1: DAY-BY-DAY TIMELINE */}
            {activeTab === 'timeline' && (
                <div className="space-y-6">
                    {/* Search and Filters */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                        <div className="w-full sm:w-96">
                            <input
                                type="text"
                                placeholder="Search logs (e.g., concrete, steel, curing, bricks)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 self-end sm:self-center">
                            <span>Showing {filteredLogs.length} updates</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-blue-600 font-semibold">Click any day for Full Engineering Dossier</span>
                        </div>
                    </div>

                    {/* Timeline Feed */}
                    {filteredLogs.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl text-center border border-gray-200 text-gray-500">
                            <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
                            <h3 className="text-lg font-bold text-gray-700">No daily logs found</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {searchQuery ? "Try a different search term." : "Site engineer has not recorded logs yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-accent before:to-gray-200">
                            {filteredLogs.map((log, idx) => (
                                <div 
                                    key={log.id || idx} 
                                    className="relative bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
                                >
                                    {/* Timeline node */}
                                    <div className="absolute -left-[31px] sm:-left-[39px] top-6 w-5 h-5 rounded-full bg-accent border-4 border-white shadow-sm flex items-center justify-center"></div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-base font-bold text-primary flex items-center gap-1.5">
                                                <Calendar size={16} className="text-accent" /> {log.date}
                                            </span>
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-accent border border-orange-200">
                                                {log.stage}
                                            </span>
                                            {log.progress_added > 0 && (
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    +{log.progress_added}% Progress
                                                </span>
                                            )}
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                                QA: {log.inspection_status || 'Verified'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <CloudSun size={14} className="text-amber-500" /> {log.weather}
                                            </span>
                                            {canPostUpdates && (
                                                <button
                                                    onClick={() => handleDeleteLog(log.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                                                    title="Delete this log"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Work description */}
                                    <div className="py-4 text-gray-800 text-sm sm:text-base leading-relaxed">
                                        {log.work_completed}
                                    </div>

                                    {/* Sub-tasks checklist tags if available */}
                                    {log.sub_tasks && Array.isArray(log.sub_tasks) && log.sub_tasks.length > 0 && (
                                        <div className="mb-4">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                                                Verified Tasks Completed Today:
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {log.sub_tasks.map((st, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                                                        <Check size={12} className="text-emerald-600" /> {typeof st === 'string' ? st : st.task}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Delay factor alert */}
                                    {log.issues_delay && log.issues_delay.toLowerCase() !== 'none' && log.issues_delay.toLowerCase() !== 'nil' && (
                                        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2.5 text-xs sm:text-sm">
                                            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-bold">Site Notice / Delay Factor: </span>
                                                {log.issues_delay}
                                            </div>
                                        </div>
                                    )}

                                    {/* Granular metrics footer */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 bg-gray-50 -mx-6 -mb-6 p-4 rounded-b-2xl border-t border-gray-100 text-xs text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <HardHat size={16} className="text-gray-500" />
                                            <span className="font-semibold text-gray-700">Labor Deployed:</span>
                                            <span>{log.labor_count} on-site workers</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-gray-500" />
                                            <span className="font-semibold text-gray-700">Materials:</span>
                                            <span className="truncate">{log.materials_used || 'Standard mix'}</span>
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => setSelectedDossierLog(log)}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-sm transition-colors"
                                            >
                                                <FileText size={13} /> View Full Engineering Dossier →
                                            </button>
                                        </div>
                                    </div>

                                    {/* Photos if attached */}
                                    {log.site_photos && (
                                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ImageIcon size={14} className="text-gray-400" />
                                                <span className="text-xs text-gray-500 font-medium">Site Photo Attached</span>
                                            </div>
                                            <img
                                                src={formatImageUrl(log.site_photos)}
                                                alt={`Site photo for ${log.date}`}
                                                onClick={() => setSelectedPhoto(log.site_photos)}
                                                className="w-24 h-16 object-cover rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: GRANULAR COMPONENT & SUB-TASK WBS TRACKER */}
            {activeTab === 'components' && (
                <div className="space-y-6">
                    {/* WBS Overview Summary */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Work Breakdown Structure (WBS)</span>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">Granular Building Component Tracking</h2>
                            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                                Real-time verification of individual structural, masonry, MEP, and finishing trades inspected by on-site civil engineers.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                            <div className="text-center px-2">
                                <span className="block text-xl font-bold text-gray-900">{componentsData?.summary?.total_tasks || 41}</span>
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Total Tasks</span>
                            </div>
                            <div className="w-px h-8 bg-gray-300"></div>
                            <div className="text-center px-2">
                                <span className="block text-xl font-bold text-emerald-600">{componentsData?.summary?.completed_tasks || 15}</span>
                                <span className="text-[10px] text-emerald-700 uppercase font-bold">Completed</span>
                            </div>
                            <div className="w-px h-8 bg-gray-300"></div>
                            <div className="text-center px-2">
                                <span className="block text-xl font-bold text-amber-600">{componentsData?.summary?.in_progress_tasks || 5}</span>
                                <span className="text-[10px] text-amber-700 uppercase font-bold">In Progress</span>
                            </div>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase mr-2 flex items-center gap-1">
                            <Filter size={14} /> Filter:
                        </span>
                        {['All', 'Completed', 'In Progress', 'Upcoming'].map(status => (
                            <button
                                key={status}
                                onClick={() => setComponentStatusFilter(status)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                                    componentStatusFilter === status
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {/* Component Phases */}
                    <div className="space-y-6">
                        {componentsData?.components?.map((comp) => {
                            const matchingTasks = comp.tasks.filter(t => {
                                if (componentStatusFilter === 'All') return true;
                                return t.status === componentStatusFilter;
                            });

                            if (matchingTasks.length === 0 && componentStatusFilter !== 'All') return null;

                            return (
                                <div key={comp.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                    <div className="p-5 bg-gray-50/80 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs">
                                                <Layers size={16} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-base">{comp.phase}</h3>
                                                <span className="text-xs text-gray-500">
                                                    {comp.tasks.filter(t => t.status === 'Completed').length} of {comp.tasks.length} sub-tasks completed
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                <div 
                                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                                    style={{ width: `${comp.completion}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-gray-700 min-w-[35px] text-right">{comp.completion}%</span>
                                        </div>
                                    </div>

                                    {/* Sub-tasks Table */}
                                    <div className="divide-y divide-gray-100">
                                        {matchingTasks.map((task, tidx) => (
                                            <div key={tidx} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                                                        task.status === 'Completed'
                                                            ? 'bg-emerald-100 text-emerald-700 font-bold'
                                                            : task.status === 'In Progress'
                                                            ? 'bg-amber-100 text-amber-700 animate-pulse'
                                                            : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                        {task.status === 'Completed' ? <Check size={12} /> : tidx + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-800">{task.name}</h4>
                                                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                                                            <Wrench size={12} className="text-gray-400" />
                                                            Specs: {task.specs}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 self-end sm:self-center">
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                                                        task.qa === 'Passed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        task.qa === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-gray-100 text-gray-500 border-gray-200'
                                                    }`}>
                                                        QA: {task.qa}
                                                    </span>
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                                        task.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                                        task.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 3: MILESTONES ROADMAP */}
            {activeTab === 'roadmap' && (
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 space-y-6 shadow-sm">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Sequential Building Milestones</h2>
                        <p className="text-sm text-gray-500">
                            High-level milestones verified by Site Engineer and approved by Contractor.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {(analysis?.stage_breakdown || STANDARD_STAGES.map((st, i) => ({
                            name: st,
                            order: i + 1,
                            status: i < 3 ? 'Completed' : i === 3 ? 'In Progress' : 'Upcoming',
                            stage_pct: i < 3 ? 100 : i === 3 ? 48 : 0
                        }))).map((stage, idx) => {
                            const isCompleted = stage.status === 'Completed';
                            const isInProgress = stage.status === 'In Progress';

                            return (
                                <div 
                                    key={idx}
                                    className={`p-5 rounded-xl border transition-all ${
                                        isInProgress 
                                            ? 'bg-orange-50/60 border-accent shadow-sm' 
                                            : isCompleted 
                                            ? 'bg-emerald-50/40 border-emerald-200' 
                                            : 'bg-gray-50 border-gray-200 opacity-60'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                                isCompleted 
                                                    ? 'bg-emerald-600 text-white' 
                                                    : isInProgress 
                                                    ? 'bg-accent text-white animate-pulse' 
                                                    : 'bg-gray-300 text-gray-700'
                                            }`}>
                                                {isCompleted ? <CheckCircle2 size={18} /> : stage.order || idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-base">{stage.name}</h4>
                                                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                                    isCompleted ? 'text-emerald-700' : isInProgress ? 'text-accent' : 'text-gray-500'
                                                }`}>
                                                    {stage.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-700">{stage.stage_pct || 0}% Complete</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${
                                                isCompleted ? 'bg-emerald-500' : 'bg-accent'
                                            }`}
                                            style={{ width: `${stage.stage_pct || 0}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 4: AI PROJECT EFFICIENCY & ANALYTICS */}
            {activeTab === 'analysis' && (
                <div className="space-y-6">
                    {/* Header with refresh */}
                    <div className="bg-gradient-to-r from-gray-900 via-primary to-blue-950 p-6 sm:p-8 rounded-2xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-amber-400">
                                <Sparkles size={22} />
                                <span className="text-xs font-black uppercase tracking-widest">AI Construction Auditor</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold">Project Efficiency & Velocity Hub</h2>
                            <p className="text-sm text-gray-300 max-w-2xl mt-1">
                                Real-time algorithmic schedule variance, manpower analytics, and Gemini AI-powered recommendations to minimize cost and time overheads.
                            </p>
                        </div>
                        <button
                            onClick={fetchAnalysis}
                            disabled={analysisLoading}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shrink-0 disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={analysisLoading ? "animate-spin" : ""} />
                            {analysisLoading ? "Auditing..." : "Re-Analyze Project"}
                        </button>
                    </div>

                    {/* Score Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Efficiency Score */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <span className="text-xs font-bold uppercase text-gray-400">Efficiency Index</span>
                            <div className="flex items-baseline gap-2 mt-2">
                                <span className="text-4xl font-black text-accent">{analysis?.efficiency_score || 90}</span>
                                <span className="text-sm font-semibold text-gray-500">/ 100</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">High contractor-engineer coordination</p>
                        </div>

                        {/* Schedule Variance */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <span className="text-xs font-bold uppercase text-gray-400">Schedule Health</span>
                            <div className="mt-2">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                    analysis?.schedule_status === 'Ahead of Schedule' ? 'bg-emerald-100 text-emerald-700' :
                                    analysis?.schedule_status === 'On Track' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {analysis?.schedule_status || 'On Track'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                Projected Finish: <strong className="text-gray-800">{analysis?.metrics?.projected_completion_date}</strong>
                            </p>
                        </div>

                        {/* Velocity Pace */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <span className="text-xs font-bold uppercase text-gray-400">Daily Velocity</span>
                            <div className="flex items-baseline gap-2 mt-2">
                                <span className="text-3xl font-black text-gray-900">{analysis?.metrics?.actual_pace_pct_per_day || '2.8'}%</span>
                                <span className="text-xs font-semibold text-gray-500">per day</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Required: {analysis?.metrics?.required_pace_pct_per_day || '1.1'}% / day
                            </p>
                        </div>

                        {/* Workforce Stats */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <span className="text-xs font-bold uppercase text-gray-400">Average Manpower</span>
                            <div className="flex items-baseline gap-2 mt-2">
                                <span className="text-3xl font-black text-primary">{analysis?.metrics?.avg_labor || '15'}</span>
                                <span className="text-xs font-semibold text-gray-500">workers / day</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Total: {analysis?.metrics?.total_labor_days || '105'} worker-days
                            </p>
                        </div>
                    </div>

                    {/* AI Insights & Recommendations */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="p-6 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-b border-orange-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-accent text-white rounded-xl shadow-sm">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">AI Construction Analysis & Recommendations</h3>
                                    <p className="text-xs text-gray-500">
                                        Source: {analysis?.ai_source === 'gemini' ? 'Google Gemini 2.5 Flash' : 'Engineers Veedu Heuristic Engine'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 space-y-6">
                            {/* Executive Summary */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Executive Overview</h4>
                                <p className="text-base text-gray-800 leading-relaxed font-medium bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    {analysis?.ai_insights?.executive_summary}
                                </p>
                            </div>

                            {/* Client Reassuring Note */}
                            {analysis?.ai_insights?.client_note && (
                                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-900 text-sm">
                                    <span className="font-bold text-blue-800 block mb-1">Notice for Client / Property Owner:</span>
                                    {analysis?.ai_insights?.client_note}
                                </div>
                            )}

                            {/* Actionable Recommendations */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                                    Actionable Recommendations to Maximize Efficiency
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {analysis?.ai_insights?.actionable_recommendations?.map((rec, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-accent/40 transition-colors">
                                            <div className="w-6 h-6 rounded-full bg-accent/20 text-accent font-bold text-xs flex items-center justify-center mb-2">
                                                {i + 1}
                                            </div>
                                            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{rec}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Key Risks */}
                            {analysis?.ai_insights?.key_risks?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Identified Risks & Vigilance Points</h4>
                                    <ul className="space-y-2">
                                        {analysis.ai_insights.key_risks.map((risk, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                                                <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                                                <span>{risk}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* FULL DAILY ENGINEERING DOSSIER MODAL */}
            {selectedDossierLog && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 my-8">
                        <div className="flex justify-between items-start pb-4 border-b border-gray-200">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                                        Daily Progress Report (DPR)
                                    </span>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500 font-semibold">{project.name}</span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                    Site Inspection Report: {selectedDossierLog.date}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Stage: <strong className="text-gray-800">{selectedDossierLog.stage}</strong> | Weather: {selectedDossierLog.weather}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                                    title="Print or Save PDF"
                                >
                                    <Printer size={15} /> Print DPR
                                </button>
                                <button 
                                    onClick={() => setSelectedDossierLog(null)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X size={22} />
                                </button>
                            </div>
                        </div>

                        <div className="py-5 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                            {/* Work Narrative */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Work Accomplished</h4>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-800 text-sm leading-relaxed">
                                    {selectedDossierLog.work_completed}
                                </div>
                            </div>

                            {/* Detailed Manpower Breakdown */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                                    <HardHat size={14} className="text-amber-500" /> Manpower & Labor Breakdown (Total: {selectedDossierLog.labor_count} Artisans)
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                                        <span className="text-[11px] text-gray-500 font-bold uppercase block">Masons</span>
                                        <span className="text-xl font-bold text-gray-900">
                                            {selectedDossierLog.labor_breakdown?.masons ?? Math.round(selectedDossierLog.labor_count * 0.3)}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                                        <span className="text-[11px] text-gray-500 font-bold uppercase block">Bar Benders</span>
                                        <span className="text-xl font-bold text-gray-900">
                                            {selectedDossierLog.labor_breakdown?.bar_benders ?? Math.round(selectedDossierLog.labor_count * 0.2)}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                                        <span className="text-[11px] text-gray-500 font-bold uppercase block">Carpenters</span>
                                        <span className="text-xl font-bold text-gray-900">
                                            {selectedDossierLog.labor_breakdown?.carpenters ?? Math.round(selectedDossierLog.labor_count * 0.15)}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                                        <span className="text-[11px] text-gray-500 font-bold uppercase block">Helpers</span>
                                        <span className="text-xl font-bold text-gray-900">
                                            {selectedDossierLog.labor_breakdown?.helpers ?? Math.round(selectedDossierLog.labor_count * 0.35)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Itemized Materials Consumed */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                                    <Hammer size={14} className="text-blue-500" /> Materials Consumed Today
                                </h4>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <p className="text-sm font-semibold text-gray-800 mb-2">
                                        {selectedDossierLog.materials_used}
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600 pt-2 border-t border-gray-200">
                                        <span>Cement: <strong>{selectedDossierLog.materials_breakdown?.cement_bags || '45'} Bags</strong></span>
                                        <span>Rebar / Steel: <strong>{selectedDossierLog.materials_breakdown?.steel_tons || '1.5'} Tons</strong></span>
                                        <span>Masonry Bricks: <strong>{selectedDossierLog.materials_breakdown?.bricks_count || '2500'} Units</strong></span>
                                    </div>
                                </div>
                            </div>

                            {/* QA/QC & Engineering Checks */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                                    <ShieldCheck size={14} className="text-emerald-500" /> Engineering QA/QC & Inspection Certification
                                </h4>
                                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-emerald-900">
                                    <div>
                                        <span className="font-bold block">Concrete Mix / Grade:</span>
                                        <span>{selectedDossierLog.quality_checks?.concrete_grade || 'M25 Design Mix (1:1:2)'}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold block">Curing Protocol:</span>
                                        <span>{selectedDossierLog.quality_checks?.curing_day || 'Continuous wet curing active'}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold block">Slump / Workability:</span>
                                        <span>{selectedDossierLog.quality_checks?.slump_test || '110 mm (Tolerance ±15mm)'}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold block">Inspector Certification:</span>
                                        <span className="font-semibold text-emerald-700">✓ Verified & Approved on Site</span>
                                    </div>
                                </div>
                            </div>

                            {/* Photo if available */}
                            {selectedDossierLog.site_photos && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                                        <ImageIcon size={14} /> On-Site Inspection Evidence Photo
                                    </h4>
                                    <img
                                        src={formatImageUrl(selectedDossierLog.site_photos)}
                                        alt="Site inspection photo"
                                        className="w-full max-h-72 object-cover rounded-xl border border-gray-200 shadow-sm"
                                    />
                                </div>
                            )}

                            {/* Delay or Issue */}
                            {selectedDossierLog.issues_delay && selectedDossierLog.issues_delay.toLowerCase() !== 'none' && (
                                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                                    <span className="font-bold block mb-0.5">Logged Site Constraint / Delay Factor:</span>
                                    {selectedDossierLog.issues_delay}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                            <span>Logged by: {selectedDossierLog.logged_by_email || 'Site Engineer'}</span>
                            <button
                                onClick={() => setSelectedDossierLog(null)}
                                className="px-5 py-2 bg-primary text-white font-bold rounded-xl text-sm"
                            >
                                Close Dossier
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: POST DETAILED DAILY LOG (Site Engineer / Contractor) */}
            {isAddLogOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-orange-100 text-accent rounded-xl">
                                    <HardHat size={22} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Post Detailed Daily Site Update</h3>
                                    <p className="text-xs text-gray-500">Record work done, granular labor, materials, and QA checks</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsAddLogOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDailyLog} className="space-y-4 mt-4 max-h-[75vh] overflow-y-auto pr-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date of Work</label>
                                    <input
                                        type="date"
                                        required
                                        value={logForm.date}
                                        onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Construction Stage</label>
                                    <select
                                        value={logForm.stage}
                                        onChange={(e) => setLogForm({ ...logForm, stage: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
                                    >
                                        {STANDARD_STAGES.map((s, i) => (
                                            <option key={i} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Work Accomplished Today</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Describe rebar tied, brickwork completed, concrete poured, plumbing conduits laid..."
                                    value={logForm.work_completed}
                                    onChange={(e) => setLogForm({ ...logForm, work_completed: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>

                            {/* Sub-tasks checklist */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Micro-Tasks Completed (Comma Separated)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Column rebar tied, Plumb line checked, Mortar ratio 1:6 mixed"
                                    value={logForm.sub_tasks_input}
                                    onChange={(e) => setLogForm({ ...logForm, sub_tasks_input: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>

                            {/* Toggle Detailed Breakdown Fields */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDetailedInputs(!showDetailedInputs)}
                                    className="text-xs font-bold text-accent hover:text-orange-700 flex items-center gap-1 transition-colors"
                                >
                                    {showDetailedInputs ? '− Hide Granular Labor & Material Fields' : '+ Add Granular Manpower, Materials & QA Test Breakdown'}
                                </button>
                            </div>

                            {showDetailedInputs && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    {/* Labor breakdown */}
                                    <div>
                                        <span className="text-xs font-bold uppercase text-gray-600 block mb-2">Manpower Breakdown</span>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div>
                                                <label className="block text-[11px] text-gray-500 font-bold">Masons</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={logForm.masons}
                                                    onChange={(e) => setLogForm({ ...logForm, masons: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-gray-500 font-bold">Bar Benders</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={logForm.bar_benders}
                                                    onChange={(e) => setLogForm({ ...logForm, bar_benders: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-gray-500 font-bold">Carpenters</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={logForm.carpenters}
                                                    onChange={(e) => setLogForm({ ...logForm, carpenters: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-gray-500 font-bold">Helpers</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={logForm.helpers}
                                                    onChange={(e) => setLogForm({ ...logForm, helpers: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Materials breakdown */}
                                    <div>
                                        <span className="text-xs font-bold uppercase text-gray-600 block mb-2">Itemized Materials Consumed</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[11px] text-gray-500 font-bold">Cement (Bags)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={logForm.cement_bags}
                                                    onChange={(e) => setLogForm({ ...logForm, cement_bags: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-gray-500 font-bold">Steel / Rebar (Tons)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    value={logForm.steel_tons}
                                                    onChange={(e) => setLogForm({ ...logForm, steel_tons: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-gray-500 font-bold">Bricks (Count)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={logForm.bricks_count}
                                                    onChange={(e) => setLogForm({ ...logForm, bricks_count: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* QA / QC engineering */}
                                    <div>
                                        <span className="text-xs font-bold uppercase text-gray-600 block mb-2">Engineering QA & Quality Checks</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[11px] text-gray-500 font-bold">Concrete Mix</label>
                                                <input
                                                    type="text"
                                                    value={logForm.concrete_grade}
                                                    onChange={(e) => setLogForm({ ...logForm, concrete_grade: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-gray-500 font-bold">Curing Day</label>
                                                <input
                                                    type="text"
                                                    value={logForm.curing_day}
                                                    onChange={(e) => setLogForm({ ...logForm, curing_day: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-gray-500 font-bold">Slump Test</label>
                                                <input
                                                    type="text"
                                                    value={logForm.slump_test}
                                                    onChange={(e) => setLogForm({ ...logForm, slump_test: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Progress Added (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={logForm.progress_added}
                                        onChange={(e) => setLogForm({ ...logForm, progress_added: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Weather Condition</label>
                                    <input
                                        type="text"
                                        value={logForm.weather}
                                        onChange={(e) => setLogForm({ ...logForm, weather: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Site Issues / Delays (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. None, or 'Power outage delayed mixer by 1 hr'"
                                    value={logForm.issues_delay}
                                    onChange={(e) => setLogForm({ ...logForm, issues_delay: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-gray-700 uppercase">
                                        Site Inspection Photo
                                    </label>
                                    <div className="flex items-center gap-1.5 text-xs bg-gray-100 p-0.5 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setPhotoInputMode('file')}
                                            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                                                photoInputMode === 'file' 
                                                    ? 'bg-white text-primary shadow-xs' 
                                                    : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            Upload File
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPhotoInputMode('url')}
                                            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                                                photoInputMode === 'url' 
                                                    ? 'bg-white text-primary shadow-xs' 
                                                    : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            Preset / URL
                                        </button>
                                    </div>
                                </div>

                                {photoInputMode === 'file' ? (
                                    <div className="space-y-3">
                                        {imagePreview ? (
                                            <div className="relative rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-center justify-between gap-3 shadow-xs">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <img 
                                                        src={imagePreview} 
                                                        alt="Upload preview" 
                                                        className="w-16 h-14 object-cover rounded-lg border border-gray-300 shadow-xs shrink-0" 
                                                    />
                                                    <div className="min-w-0">
                                                        <span className="text-xs font-bold text-gray-800 truncate block">
                                                            {imageFile?.name || 'Selected Inspection Photo'}
                                                        </span>
                                                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                                                            ✓ File ready for upload {imageFile ? `(${Math.round(imageFile.size / 1024)} KB)` : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setImageFile(null);
                                                        setImagePreview(null);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                                                    title="Remove image"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="border-2 border-dashed border-gray-300 hover:border-accent hover:bg-orange-50/40 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-gray-50 group text-center">
                                                <div className="p-3 bg-white group-hover:bg-orange-100 rounded-full shadow-xs text-gray-400 group-hover:text-accent transition-colors">
                                                    <UploadCloud size={24} />
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-gray-700 block">
                                                        Click to browse or drop an image file
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 block mt-0.5">
                                                        Supports JPG, PNG, WebP, GIF or Mobile Camera
                                                    </span>
                                                </div>
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
                                                            setImageFile(file);
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setImagePreview(reader.result);
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex gap-2 mb-2 flex-wrap">
                                            {SAMPLE_PHOTO_PRESETS.map((p, i) => (
                                                <button
                                                    type="button"
                                                    key={i}
                                                    onClick={() => {
                                                        setLogForm({ ...logForm, site_photos: p.url });
                                                        setImageFile(null);
                                                        setImagePreview(null);
                                                    }}
                                                    className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                                                        logForm.site_photos === p.url && !imageFile ? 'bg-accent text-white border-accent' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="url"
                                            placeholder="https://..."
                                            value={logForm.site_photos}
                                            onChange={(e) => {
                                                setLogForm({ ...logForm, site_photos: e.target.value });
                                                setImageFile(null);
                                                setImagePreview(null);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddLogOpen(false)}
                                    className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingLog}
                                    className="px-6 py-2.5 bg-accent hover:bg-orange-600 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submittingLog ? "Recording..." : "Save Detailed Daily Log"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LIGHTBOX FOR SITE PHOTO PREVIEW */}
            {selectedPhoto && (
                <div 
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button 
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 p-1"
                        >
                            <X size={28} />
                        </button>
                        <img 
                            src={formatImageUrl(selectedPhoto)} 
                            alt="Expanded site photo" 
                            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectTracker;
