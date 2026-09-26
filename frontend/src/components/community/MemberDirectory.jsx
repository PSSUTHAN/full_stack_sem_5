import React, { useState } from 'react';
import { Search, UserPlus, Check, Users, MapPin, ClipboardList } from 'lucide-react';

const ROLE_FILTERS = [
    { label: 'All Members', value: 'all' },
    { label: 'Site Engineers', value: 'site_engineer' },
    { label: 'Contractors', value: 'contractor' },
    { label: 'Architects', value: 'architect' },
    { label: 'Project Managers', value: 'project_manager' },
    { label: 'Clients & Owners', value: 'client' }
];

const MemberDirectory = ({ members = [], onConnect, onSelectMember, onRequestEngineer }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');

    const filteredMembers = members.filter(m => {
        const matchesSearch = 
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesRole = selectedRole === 'all' || m.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header & Search Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Users size={18} className="text-primary" />
                            Engineers Veedu Professional Directory
                        </h2>
                        <p className="text-xs text-gray-500">
                            Discover licensed site engineers, certified contractors, architects, and verified project owners.
                        </p>
                    </div>

                    <div className="relative min-w-[240px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, skill, company..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:bg-white focus:border-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
                    {ROLE_FILTERS.map(filter => (
                        <button
                            key={filter.value}
                            onClick={() => setSelectedRole(filter.value)}
                            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
                                selectedRole === filter.value
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((member) => (
                    <div
                        key={member.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-gray-300 transition-all group"
                    >
                        {/* Member Card Header Banner */}
                        <div className="h-14 bg-gradient-to-r from-blue-100 to-indigo-50 relative">
                            <div className="absolute -bottom-6 left-4">
                                <div 
                                    onClick={() => onSelectMember(member)}
                                    className="w-14 h-14 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white cursor-pointer"
                                >
                                    <img
                                        src={member.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                        alt={member.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="pt-8 px-4 pb-3 flex-grow">
                            <h3 
                                onClick={() => onSelectMember(member)}
                                className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors cursor-pointer line-clamp-1"
                            >
                                {member.name}
                            </h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                                {member.headline}
                            </p>

                            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-gray-400">
                                <MapPin size={12} />
                                <span className="truncate">{member.location}</span>
                            </div>

                            {/* Skills snippet */}
                            <div className="mt-3 flex flex-wrap gap-1">
                                {member.skills.slice(0, 3).map((skill, idx) => (
                                    <span key={idx} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                        {skill}
                                    </span>
                                ))}
                                {member.skills.length > 3 && (
                                    <span className="text-[10px] text-gray-400">+{member.skills.length - 3}</span>
                                )}
                            </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-1.5 flex-wrap">
                            <button
                                onClick={() => onSelectMember(member)}
                                className="text-xs font-bold text-gray-600 hover:text-primary transition-colors"
                            >
                                Profile
                            </button>

                            <div className="flex items-center gap-1.5">
                                {(member.role === 'site_engineer' || member.role === 'contractor' || member.role === 'architect' || member.role === 'project_manager') && (
                                    <button
                                        onClick={() => onRequestEngineer && onRequestEngineer(member)}
                                        className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent hover:bg-orange-600 text-white flex items-center gap-1 transition-colors shadow-2xs"
                                        title={`Send Site Request to ${member.name}`}
                                    >
                                        <ClipboardList size={12} />
                                        <span>Request</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => onConnect(member.id)}
                                    className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-colors ${
                                        member.connectionStatus === 'connected'
                                            ? 'bg-green-100 text-green-700'
                                            : member.connectionStatus === 'pending_sent'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-primary text-white hover:bg-blue-800'
                                    }`}
                                >
                                    {member.connectionStatus === 'connected' ? (
                                        <>
                                            <Check size={12} /> Connected
                                        </>
                                    ) : member.connectionStatus === 'pending_sent' ? (
                                        <>
                                            <Check size={12} /> Pending
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={12} /> Connect
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredMembers.length === 0 && (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-200">
                    <p className="text-sm font-medium">No members found matching your search.</p>
                    <button
                        onClick={() => { setSearchQuery(''); setSelectedRole('all'); }}
                        className="mt-2 text-xs text-primary font-bold hover:underline"
                    >
                        Reset filters
                    </button>
                </div>
            )}
        </div>
    );
};

export default MemberDirectory;

