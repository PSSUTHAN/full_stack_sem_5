import React from 'react';
import { UserPlus, Check, X, Users, ArrowRight, ShieldCheck } from 'lucide-react';

const NetworkHub = ({ members = [], onConnect, onAcceptRequest, onIgnoreRequest, onSelectMember }) => {
    // Partition members into pending received and recommendations
    const pendingReceived = members.filter(m => m.connectionStatus === 'pending_received');
    const recommendations = members.filter(m => m.connectionStatus === 'not_connected' || m.connectionStatus === 'pending_sent');
    const connectedCount = members.filter(m => m.connectionStatus === 'connected').length;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Top Network Summary Banner */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Users size={20} className="text-primary" />
                        Professional Network & Connections
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Grow your trusted circle of site engineers, structural architects, and building contractors.
                    </p>
                </div>

                <div className="flex items-center gap-6 text-xs">
                    <div className="text-center">
                        <span className="text-lg font-extrabold text-primary block">{connectedCount + 184}</span>
                        <span className="text-gray-500 font-medium">Connections</span>
                    </div>
                    <div className="h-8 w-px bg-gray-200" />
                    <div className="text-center">
                        <span className="text-lg font-extrabold text-amber-600 block">{pendingReceived.length}</span>
                        <span className="text-gray-500 font-medium">Invitations</span>
                    </div>
                </div>
            </div>

            {/* Pending Requests Section */}
            {pendingReceived.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="text-sm font-bold text-gray-900">
                            Invitations ({pendingReceived.length})
                        </h3>
                        <span className="text-xs text-primary font-semibold hover:underline cursor-pointer">
                            Manage All
                        </span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {pendingReceived.map((member) => (
                            <div key={member.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div 
                                    onClick={() => onSelectMember && onSelectMember(member)}
                                    className="flex items-center gap-3 cursor-pointer group"
                                >
                                    <img
                                        src={member.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                        alt={member.name}
                                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                    />
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                                            {member.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 line-clamp-1">{member.headline}</p>
                                        <span className="text-[11px] text-gray-400">
                                            {member.mutualConnectionsCount || 8} mutual connections
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    <button
                                        onClick={() => onIgnoreRequest ? onIgnoreRequest(member.id) : onConnect(member.id)}
                                        className="px-4 py-1.5 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                        Ignore
                                    </button>
                                    <button
                                        onClick={() => onAcceptRequest ? onAcceptRequest(member.id) : onConnect(member.id)}
                                        className="px-4 py-1.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-blue-800 transition-colors flex items-center gap-1 shadow-xs"
                                    >
                                        <Check size={14} /> Accept
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* People You May Know */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">People You May Know</h3>
                        <p className="text-xs text-gray-500">Based on your shared projects and site engineering focus</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.map((member) => (
                        <div
                            key={member.id}
                            className="bg-gray-50/70 rounded-xl border border-gray-200 p-4 flex flex-col justify-between hover:bg-white hover:shadow-sm transition-all"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div 
                                    onClick={() => onSelectMember && onSelectMember(member)}
                                    className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm mb-3 cursor-pointer"
                                >
                                    <img
                                        src={member.avatar}
                                        alt={member.name}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                                    />
                                </div>

                                <h4 
                                    onClick={() => onSelectMember && onSelectMember(member)}
                                    className="text-sm font-bold text-gray-900 hover:text-primary transition-colors cursor-pointer line-clamp-1"
                                >
                                    {member.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-tight">
                                    {member.headline}
                                </p>

                                <span className="text-[11px] text-gray-400 mt-2 block">
                                    👥 {member.mutualConnectionsCount || 12} mutual connections
                                </span>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-200">
                                <button
                                    onClick={() => onConnect(member.id)}
                                    className={`w-full py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                                        member.connectionStatus === 'pending_sent'
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                            : 'border border-primary text-primary hover:bg-blue-50'
                                    }`}
                                >
                                    {member.connectionStatus === 'pending_sent' ? (
                                        <>
                                            <Check size={13} /> Request Sent
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={13} /> Connect
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NetworkHub;

