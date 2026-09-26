import React from 'react';
import { X, MapPin, Briefcase, Users, Check, UserPlus, Send, Award, Calendar, ClipboardList } from 'lucide-react';

const MemberProfileModal = ({ member, onClose, onConnect, onSendMessage, onRequestEngineer }) => {
    if (!member) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div 
                className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Banner & Avatar */}
                <div className="h-32 bg-gradient-to-r from-primary via-blue-800 to-indigo-900 relative">
                    <div className="absolute -bottom-12 left-6">
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                            <img
                                src={member.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                alt={member.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons Top Right */}
                <div className="pt-4 px-6 flex flex-wrap justify-end gap-2">
                    {/* Request Button for Engineers / Contractors */}
                    {(member.role === 'site_engineer' || member.role === 'contractor' || member.role === 'architect' || member.role === 'project_manager') && (
                        <button
                            onClick={() => onRequestEngineer && onRequestEngineer(member)}
                            className="px-4 py-2 rounded-full text-xs font-bold bg-accent hover:bg-orange-600 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                            title={`Send Site Request to ${member.name}`}
                        >
                            <ClipboardList size={14} /> Request Site Engineer
                        </button>
                    )}

                    <button
                        onClick={() => onConnect && onConnect(member.id)}
                        className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
                            member.connectionStatus === 'connected'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : member.connectionStatus === 'pending_sent'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-primary text-white hover:bg-blue-800'
                        }`}
                    >
                        {member.connectionStatus === 'connected' ? (
                            <>
                                <Check size={14} /> Connected
                            </>
                        ) : member.connectionStatus === 'pending_sent' ? (
                            <>
                                <Check size={14} /> Pending
                            </>
                        ) : (
                            <>
                                <UserPlus size={14} /> Connect
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => onSendMessage && onSendMessage(member)}
                        className="px-4 py-2 rounded-full text-xs font-bold border border-primary text-primary hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                    >
                        <Send size={13} /> Message
                    </button>
                </div>

                {/* Main Profile Info */}
                <div className="px-6 pt-2 pb-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {member.name}
                        <Award size={18} className="text-accent" />
                    </h2>
                    <p className="text-sm font-medium text-gray-700 mt-1 leading-relaxed">
                        {member.headline}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-3">
                        <span className="flex items-center gap-1">
                            <Briefcase size={14} className="text-gray-400" />
                            {member.company}
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin size={14} className="text-gray-400" />
                            {member.location}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-primary">
                            <Users size={14} />
                            {member.connectionsCount || 200}+ connections
                        </span>
                    </div>
                </div>

                {/* About Section */}
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                        About
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {member.bio || "Active member of Engineers Veedu construction ecosystem. Collaborating across residential, commercial, and structural engineering projects."}
                    </p>
                </div>

                {/* Experience Section */}
                {member.experience && member.experience.length > 0 && (
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                            Experience & Track Record
                        </h3>
                        <div className="space-y-4">
                            {member.experience.map((exp) => (
                                <div key={exp.id} className="flex items-start gap-3 text-xs">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Briefcase size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-900">{exp.title}</h4>
                                        <p className="font-medium text-gray-600">{exp.company}</p>
                                        <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                            <Calendar size={12} />
                                            {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                        </span>
                                        <p className="text-gray-600 mt-1.5 leading-relaxed">{exp.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Skills Section */}
                {member.skills && member.skills.length > 0 && (
                    <div className="p-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                            Skills & Endorsements
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {member.skills.map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-gray-100 hover:bg-blue-50 hover:text-primary hover:border-blue-200 border border-gray-200 rounded-full text-xs font-semibold text-gray-700 transition-colors"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberProfileModal;

