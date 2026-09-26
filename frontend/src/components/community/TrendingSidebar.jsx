import React from 'react';
import { TrendingUp, ShieldCheck, UserPlus, Info, Check } from 'lucide-react';

const TRENDING_TOPICS = [
    {
        title: 'NBC 2026 Seismic Code Updates',
        category: 'Structural Engineering',
        readersCount: '1.4k engineers',
        time: '3h ago'
    },
    {
        title: 'Geopolymer Concrete vs OPC in Marine Foundations',
        category: 'Materials Research',
        readersCount: '890 readers',
        time: '5h ago'
    },
    {
        title: 'BIM 5D for Real-Time Cost Variance Tracking',
        category: 'Project Management',
        readersCount: '2.1k readers',
        time: '1d ago'
    },
    {
        title: 'Passive Cooling in Courtyard Architecture',
        category: 'Sustainable Design',
        readersCount: '1.8k readers',
        time: '2d ago'
    }
];

const TrendingSidebar = ({ members = [], onConnect, onSelectMember }) => {
    // Top 3 suggested members
    const suggested = members.filter(m => m.connectionStatus === 'not_connected').slice(0, 3);

    return (
        <div className="space-y-4">
            {/* Trending Construction Topics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                        <TrendingUp size={15} className="text-accent" />
                        <span>Industry Insights</span>
                    </h4>
                    <Info size={13} className="text-gray-400" />
                </div>

                <div className="space-y-3">
                    {TRENDING_TOPICS.map((topic, idx) => (
                        <div key={idx} className="group cursor-pointer">
                            <div className="flex items-center justify-between text-[11px] text-gray-400">
                                <span className="font-semibold text-primary">{topic.category}</span>
                                <span>{topic.time}</span>
                            </div>
                            <h5 className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors mt-0.5 line-clamp-2 leading-snug">
                                {topic.title}
                            </h5>
                            <span className="text-[10px] text-gray-400 mt-0.5 block">
                                {topic.readersCount}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick People You May Know Widget */}
            {suggested.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                            Add to your network
                        </h4>
                    </div>

                    <div className="space-y-3">
                        {suggested.map((member) => (
                            <div key={member.id} className="flex items-start gap-2.5 text-xs">
                                <img
                                    src={member.avatar}
                                    alt={member.name}
                                    className="w-9 h-9 rounded-full object-cover border border-gray-200 cursor-pointer"
                                    onClick={() => onSelectMember && onSelectMember(member)}
                                />
                                <div className="flex-grow">
                                    <h5 
                                        onClick={() => onSelectMember && onSelectMember(member)}
                                        className="font-bold text-gray-900 hover:text-primary transition-colors cursor-pointer line-clamp-1"
                                    >
                                        {member.name}
                                    </h5>
                                    <p className="text-[11px] text-gray-500 line-clamp-1">{member.headline}</p>
                                    <button
                                        onClick={() => onConnect(member.id)}
                                        className={`mt-1.5 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-colors ${
                                            member.connectionStatus === 'pending_sent'
                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                : 'border border-primary text-primary hover:bg-blue-50'
                                        }`}
                                    >
                                        {member.connectionStatus === 'pending_sent' ? (
                                            <>
                                                <Check size={11} /> Sent
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={11} /> Connect
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* High-Trust Community Standards */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-100 p-4 text-xs text-gray-600">
                <div className="flex items-center gap-2 font-bold text-primary mb-1.5">
                    <ShieldCheck size={16} className="text-primary" />
                    <span>Engineers Veedu Verified</span>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-600">
                    A professional network built exclusively for civil engineers, licensed contractors, certified architects, and building owners.
                </p>
                <div className="mt-3 pt-2 border-t border-blue-100 text-[10px] text-gray-400 flex flex-wrap gap-2">
                    <span>© 2026 Engineers Veedu</span>
                    <span>•</span>
                    <span>Privacy</span>
                    <span>•</span>
                    <span>Guidelines</span>
                </div>
            </div>
        </div>
    );
};

export default TrendingSidebar;

