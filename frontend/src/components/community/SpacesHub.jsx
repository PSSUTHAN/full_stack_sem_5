import React from 'react';
import { Hash, Users, Check, Clock, Plus, ArrowRight, Shield } from 'lucide-react';

const SpacesHub = ({ spaces = [], onToggleJoin, onSelectSpace }) => {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Banner */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Hash size={20} className="text-accent" />
                            Community Spaces & Professional Sub-Groups
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Join specialized micro-communities to discuss structural codes, green building, and project risk management.
                        </p>
                    </div>

                    <div className="text-xs bg-orange-50 text-orange-800 border border-orange-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
                        <Shield size={14} className="text-accent" />
                        <span>Peer-moderated technical hubs</span>
                    </div>
                </div>
            </div>

            {/* Spaces Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {spaces.map((space) => (
                    <div
                        key={space.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md hover:border-gray-300 transition-all"
                    >
                        <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-primary px-2.5 py-0.5 rounded-full border border-blue-100">
                                    {space.category}
                                </span>
                                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                    <Clock size={12} />
                                    Active {space.recentActivityTime}
                                </span>
                            </div>

                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5 hover:text-primary transition-colors">
                                <Hash size={16} className="text-accent" />
                                {space.name}
                            </h3>

                            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                                {space.description}
                            </p>

                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                                    <Users size={14} className="text-gray-400" />
                                    {space.membersCount.toLocaleString()} members
                                </span>
                                <span className="text-[11px] text-gray-400">
                                    Mod: {space.moderators ? space.moderators[0] : 'Admin'}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                            <button
                                onClick={() => onSelectSpace(space.id)}
                                className="text-xs font-bold text-primary hover:text-blue-800 flex items-center gap-1 transition-colors"
                            >
                                <span>Browse Posts</span>
                                <ArrowRight size={13} />
                            </button>

                            <button
                                onClick={() => onToggleJoin(space.id)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
                                    space.isJoined
                                        ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                        : 'bg-primary text-white hover:bg-blue-800 shadow-xs'
                                }`}
                            >
                                {space.isJoined ? (
                                    <>
                                        <Check size={13} /> Joined
                                    </>
                                ) : (
                                    <>
                                        <Plus size={13} /> Join Space
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SpacesHub;

