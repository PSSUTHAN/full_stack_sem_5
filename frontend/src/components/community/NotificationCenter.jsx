import React, { useState } from 'react';
import { Bell, CheckCheck, ThumbsUp, MessageSquare, UserPlus, Check, Sparkles } from 'lucide-react';

const NOTIFICATION_ICONS = {
    reaction: { icon: ThumbsUp, color: 'text-blue-500', bg: 'bg-blue-50' },
    comment: { icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    connection_request: { icon: UserPlus, color: 'text-amber-500', bg: 'bg-amber-50' },
    connection_accepted: { icon: Check, color: 'text-green-600', bg: 'bg-green-50' },
    mention: { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-50' }
};

const NotificationCenter = ({ notifications = [], onMarkRead, onMarkAllRead, onSelectNotification }) => {
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'

    const filtered = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell size={18} className="text-primary" />
                    <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
                    {unreadCount > 0 && (
                        <span className="text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
                            {unreadCount} new
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1 rounded-md font-semibold transition-all ${
                                filter === 'all' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-3 py-1 rounded-md font-semibold transition-all ${
                                filter === 'unread' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Unread
                        </button>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={onMarkAllRead}
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                            <CheckCheck size={14} />
                            <span>Mark all as read</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Notification Stream */}
            <div className="divide-y divide-gray-100">
                {filtered.map((notif) => {
                    const iconConfig = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.reaction;
                    const IconComponent = iconConfig.icon;

                    return (
                        <div
                            key={notif.id}
                            onClick={() => {
                                if (!notif.isRead) onMarkRead(notif.id);
                                if (onSelectNotification) onSelectNotification(notif);
                            }}
                            className={`p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                                !notif.isRead ? 'bg-blue-50/40' : ''
                            }`}
                        >
                            {/* Actor Avatar with Type Badge */}
                            <div className="relative flex-shrink-0">
                                <img
                                    src={notif.actor?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                    alt={notif.actor?.name}
                                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                />
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${iconConfig.bg} ${iconConfig.color} border border-white flex items-center justify-center shadow-xs`}>
                                    <IconComponent size={10} />
                                </div>
                            </div>

                            {/* Notification Content */}
                            <div className="flex-grow text-xs">
                                <p className="text-gray-800 leading-snug">
                                    <strong className="font-bold text-gray-900 mr-1">{notif.actor?.name}</strong>
                                    <span>{notif.title}</span>
                                </p>
                                <p className="text-gray-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                                    {notif.description}
                                </p>
                                <span className="text-[11px] text-gray-400 mt-1 block">
                                    {notif.createdAt}
                                </span>
                            </div>

                            {/* Unread Indicator Dot */}
                            {!notif.isRead && (
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                            )}
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-xs font-medium">
                        No notifications to show.
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;

