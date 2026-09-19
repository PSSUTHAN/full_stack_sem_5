import React from 'react';
import { Bookmark, Users, Eye, TrendingUp, Hash, Award } from 'lucide-react';

const UserProfileCard = ({ user, activeSpace, onSelectSpace, spaces = [] }) => {
    const joinedSpaces = spaces.filter(s => s.isJoined);

    return (
        <div className="space-y-4">
            {/* Primary Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Profile Cover Banner */}
                <div className="h-16 bg-gradient-to-r from-primary to-blue-700 relative">
                    <div className="absolute -bottom-7 left-4">
                        <div className="w-16 h-16 rounded-full border-2 border-white shadow-md overflow-hidden bg-white">
                            <img
                                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                alt={user?.name || "User Avatar"}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Profile Information */}
                <div className="pt-9 p-4 pb-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 hover:text-primary transition-colors text-base flex items-center gap-1.5">
                        {user?.name || user?.email?.split('@')[0] || "Er. Community Member"}
                        <Award size={15} className="text-accent" />
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {user?.headline || `${user?.role === 'site_engineer' ? 'Site Engineer' : user?.role === 'contractor' ? 'General Contractor' : 'Client'} | Engineers Veedu Network`}
                    </p>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-primary border border-blue-100 capitalize">
                        {user?.role === 'site_engineer' ? 'Site Engineer' : user?.role === 'contractor' ? 'General Contractor' : user?.role || 'Member'}
                    </div>
                </div>

                {/* Profile Analytics */}
                <div className="p-3 text-xs border-b border-gray-100 space-y-2">
                    <div className="flex justify-between items-center text-gray-600 hover:bg-gray-50 p-1 rounded transition-colors cursor-pointer">
                        <span className="flex items-center gap-2">
                            <Eye size={14} className="text-gray-400" />
                            Profile views
                        </span>
                        <span className="font-bold text-primary">{user?.profileViewsCount || 342}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 hover:bg-gray-50 p-1 rounded transition-colors cursor-pointer">
                        <span className="flex items-center gap-2">
                            <TrendingUp size={14} className="text-gray-400" />
                            Post impressions
                        </span>
                        <span className="font-bold text-primary">{user?.postImpressionsCount || '4.2k'}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 hover:bg-gray-50 p-1 rounded transition-colors cursor-pointer">
                        <span className="flex items-center gap-2">
                            <Users size={14} className="text-gray-400" />
                            Connections
                        </span>
                        <span className="font-bold text-primary">{user?.connectionsCount || 184}</span>
                    </div>
                </div>

                {/* Saved Items */}
                <div className="p-3 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <Bookmark size={14} className="text-gray-500" />
                    <span>My Saved Posts & Checklists</span>
                </div>
            </div>

            {/* Joined Spaces / Topic Channels */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Joined Spaces</h4>
                    <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {joinedSpaces.length}
                    </span>
                </div>

                <div className="space-y-1.5">
                    <button
                        onClick={() => onSelectSpace(null)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                            !activeSpace ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <Hash size={13} />
                        <span className="truncate">All Feed Updates</span>
                    </button>

                    {joinedSpaces.map((space) => (
                        <button
                            key={space.id}
                            onClick={() => onSelectSpace(space.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
                                activeSpace === space.id ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span className="flex items-center gap-2 truncate">
                                <Hash size={13} className={activeSpace === space.id ? 'text-white' : 'text-accent'} />
                                <span className="truncate">{space.name}</span>
                            </span>
                            <span className={`text-[10px] ml-2 ${activeSpace === space.id ? 'text-blue-100' : 'text-gray-400'}`}>
                                {space.membersCount}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserProfileCard;

