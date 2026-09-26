import React, { useState, useEffect } from 'react';
import { 
    LayoutList, Users, Hash, Bell, UserCheck, 
    Send, X, Check
} from 'lucide-react';
import { communityService } from '../../services/communityService';
import UserProfileCard from './UserProfileCard';
import CreatePostBox from './CreatePostBox';
import PostCard from './PostCard';
import MemberDirectory from './MemberDirectory';
import MemberProfileModal from './MemberProfileModal';
import NetworkHub from './NetworkHub';
import SpacesHub from './SpacesHub';
import NotificationCenter from './NotificationCenter';
import TrendingSidebar from './TrendingSidebar';
import SiteRequestModal from './SiteRequestModal';

/**
 * Embeddable LinkedIn-Style Community Module
 * 
 * Props:
 * - user: Currently authenticated user object (defaults to mock user if omitted)
 * - theme: 'light' | 'dark' (defaults to 'light')
 * - initialTab: 'feed' | 'network' | 'directory' | 'spaces' | 'notifications'
 * - onConnect: Callback when connection status changes
 * - onPostCreated: Callback when a new post is added
 */
const CommunityModule = ({
    user: propUser = null,
    theme = 'light',
    initialTab = 'feed',
    onConnect: externalOnConnect = null,
    onPostCreated: externalOnPostCreated = null
}) => {
    // Current user fallback
    const currentUser = propUser || {
        id: 'current-user',
        name: 'Er. Suresh Balaji',
        email: 'suresh@engineersveedu.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        headline: 'Lead Site Engineer & Quality Auditor | Engineers Veedu',
        role: 'site_engineer',
        company: 'Engineers Veedu Ecosystem',
        location: 'Coimbatore, Tamil Nadu',
        bio: 'Civil engineer with 10+ years field experience in RCC frame construction, IS 456 compliance, and structural QA/QC.',
        skills: ['RCC Framing', 'IS 456', 'Slump Testing', 'Bar Bending Schedules', 'Site QA/QC'],
        experience: [],
        connectionsCount: 248,
        profileViewsCount: 412,
        postImpressionsCount: 3890
    };

    // Module State
    const [activeTab, setActiveTab] = useState(initialTab);
    const [activeSpaceId, setActiveSpaceId] = useState(null);
    const [posts, setPosts] = useState([]);
    const [members, setMembers] = useState([]);
    const [spaces, setSpaces] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [selectedMember, setSelectedMember] = useState(null);
    const [dmModalPost, setDmModalPost] = useState(null);
    const [dmRecipientId, setDmRecipientId] = useState('');
    const [dmSentToast, setDmSentToast] = useState(false);
    const [requestTargetMember, setRequestTargetMember] = useState(null);
    const [requestSentToast, setRequestSentToast] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const [feedData, membersData, spacesData, notifsData] = await Promise.all([
                    communityService.fetchFeed(activeSpaceId),
                    communityService.fetchMembers(),
                    communityService.fetchSpaces(),
                    communityService.fetchNotifications()
                ]);

                setPosts(feedData);
                setMembers(membersData);
                setSpaces(spacesData);
                setNotifications(notifsData);
            } catch (err) {
                console.error('Failed to load community data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [activeSpaceId]);

    // Handle space filter
    const handleSelectSpace = async (spaceId) => {
        setActiveSpaceId(spaceId);
        setActiveTab('feed');
        setIsLoading(true);
        try {
            const feed = await communityService.fetchFeed(spaceId);
            setPosts(feed);
        } finally {
            setIsLoading(false);
        }
    };

    // Post creation
    const handleCreatePost = async (postData) => {
        const newPost = await communityService.createPost(postData, currentUser);
        setPosts([newPost, ...posts]);
        if (externalOnPostCreated) externalOnPostCreated(newPost);
    };

    // Reactions
    const handleReact = async (postId, reactionType) => {
        const updatedPost = await communityService.toggleReaction(postId, reactionType);
        if (updatedPost) {
            setPosts(posts.map(p => p.id === postId ? updatedPost : p));
        }
    };

    // Comments
    const handleAddComment = async (postId, commentContent) => {
        const result = await communityService.addComment(postId, commentContent, currentUser);
        if (result && result.post) {
            setPosts(posts.map(p => p.id === postId ? result.post : p));
        }
    };

    // Connections
    const handleConnect = async (userId) => {
        const member = members.find(m => m.id === userId);
        if (!member) return;

        let nextStatus = 'pending_sent';
        if (member.connectionStatus === 'pending_sent') nextStatus = 'not_connected';
        else if (member.connectionStatus === 'pending_received') nextStatus = 'connected';
        else if (member.connectionStatus === 'connected') nextStatus = 'not_connected';

        const updated = await communityService.updateConnectionStatus(userId, nextStatus);
        if (updated) {
            setMembers(members.map(m => m.id === userId ? updated : m));
            if (selectedMember && selectedMember.id === userId) {
                setSelectedMember(updated);
            }
            if (externalOnConnect) externalOnConnect(userId, nextStatus);
        }
    };

    const handleAcceptRequest = async (userId) => {
        const updated = await communityService.updateConnectionStatus(userId, 'connected');
        if (updated) {
            setMembers(members.map(m => m.id === userId ? updated : m));
        }
    };

    const handleIgnoreRequest = async (userId) => {
        const updated = await communityService.updateConnectionStatus(userId, 'not_connected');
        if (updated) {
            setMembers(members.map(m => m.id === userId ? updated : m));
        }
    };

    // Spaces Join/Leave
    const handleToggleJoinSpace = async (spaceId) => {
        const updated = await communityService.toggleSpaceJoin(spaceId);
        if (updated) {
            setSpaces(spaces.map(s => s.id === spaceId ? updated : s));
        }
    };

    // Notifications
    const handleMarkNotificationRead = async (notifId) => {
        const updated = await communityService.markNotificationRead(notifId);
        setNotifications(updated);
    };

    const handleMarkAllNotificationsRead = async () => {
        const updated = await communityService.markAllNotificationsRead();
        setNotifications(updated);
    };

    // Send DM simulation
    const handleOpenDmModal = (post) => {
        setDmModalPost(post);
        setDmRecipientId(members.find(m => m.connectionStatus === 'connected')?.id || '');
    };

    const handleSendDm = (e) => {
        e.preventDefault();
        setDmModalPost(null);
        setDmSentToast(true);
        setTimeout(() => setDmSentToast(false), 3000);
    };

    const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
    const pendingRequestsCount = members.filter(m => m.connectionStatus === 'pending_received').length;
    const activeSpace = spaces.find(s => s.id === activeSpaceId);

    // Theme class styling
    const themeBg = theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-[#f4f2ee]/60 text-gray-800';

    return (
        <div className={`w-full ${themeBg} font-sans transition-colors duration-200`}>
            {/* Top Navigation Bar within the Community Module */}
            <div className="bg-white border-b border-gray-200 sticky top-16 z-30 shadow-xs">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        {/* Tabs Bar */}
                        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2">
                            <button
                                onClick={() => { setActiveTab('feed'); setActiveSpaceId(null); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                                    activeTab === 'feed'
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <LayoutList size={15} />
                                <span>Feed</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('network')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all relative ${
                                    activeTab === 'network'
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Users size={15} />
                                <span>Network</span>
                                {pendingRequestsCount > 0 && (
                                    <span className="bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                                        {pendingRequestsCount}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setActiveTab('directory')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                                    activeTab === 'directory'
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <UserCheck size={15} />
                                <span>Directory</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('spaces')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                                    activeTab === 'spaces'
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Hash size={15} />
                                <span>Spaces</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all relative ${
                                    activeTab === 'notifications'
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Bell size={15} />
                                <span>Alerts</span>
                                {unreadNotificationsCount > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                                        {unreadNotificationsCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Right Quick Status Indicator */}
                        <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span>148 Construction Peers Active</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3-Column LinkedIn Layout */}
            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: User Mini-Card & Joined Spaces (3 cols on lg) */}
                    <aside className="lg:col-span-3 space-y-4">
                        <UserProfileCard
                            user={currentUser}
                            activeSpace={activeSpaceId}
                            onSelectSpace={handleSelectSpace}
                            spaces={spaces}
                        />
                    </aside>

                    {/* CENTER COLUMN: Main Feed, Post Creator, Active Tabs (6 cols on lg) */}
                    <main className="lg:col-span-6 space-y-4">
                        {activeTab === 'feed' && (
                            <>
                                {/* Active Space Filter Notice if active */}
                                {activeSpace && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-blue-900 animate-fade-in">
                                        <div className="flex items-center gap-2">
                                            <Hash size={16} className="text-accent" />
                                            <span>Showing posts in <strong>{activeSpace.name}</strong></span>
                                        </div>
                                        <button
                                            onClick={() => handleSelectSpace(null)}
                                            className="font-bold text-primary hover:underline"
                                        >
                                            View All Updates
                                        </button>
                                    </div>
                                )}

                                {/* Post Creator */}
                                <CreatePostBox
                                    user={currentUser}
                                    spaces={spaces}
                                    activeSpace={activeSpaceId}
                                    onPostCreated={handleCreatePost}
                                />

                                {/* Posts Feed */}
                                {isLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2].map((n) => (
                                            <div key={n} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                                                    <div className="space-y-2 flex-grow">
                                                        <div className="w-1/3 h-3 bg-gray-200 rounded" />
                                                        <div className="w-1/2 h-2 bg-gray-200 rounded" />
                                                    </div>
                                                </div>
                                                <div className="w-full h-16 bg-gray-100 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                ) : posts.length > 0 ? (
                                    <div className="space-y-4">
                                        {posts.map((post) => (
                                            <PostCard
                                                key={post.id}
                                                post={post}
                                                currentUser={currentUser}
                                                onReact={handleReact}
                                                onAddComment={handleAddComment}
                                                onOpenProfile={(authorId) => {
                                                    const m = members.find(u => u.id === authorId);
                                                    if (m) setSelectedMember(m);
                                                }}
                                                onSendDM={handleOpenDmModal}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-200">
                                        <p className="text-sm font-medium">No posts in this channel yet.</p>
                                        <p className="text-xs text-gray-400 mt-1">Be the first to share an engineering insight or update!</p>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'network' && (
                            <NetworkHub
                                members={members}
                                onConnect={handleConnect}
                                onAcceptRequest={handleAcceptRequest}
                                onIgnoreRequest={handleIgnoreRequest}
                                onSelectMember={(m) => setSelectedMember(m)}
                            />
                        )}

                        {activeTab === 'directory' && (
                            <MemberDirectory
                                members={members}
                                onConnect={handleConnect}
                                onSelectMember={(m) => setSelectedMember(m)}
                                onRequestEngineer={(m) => setRequestTargetMember(m)}
                            />
                        )}

                        {activeTab === 'spaces' && (
                            <SpacesHub
                                spaces={spaces}
                                onToggleJoin={handleToggleJoinSpace}
                                onSelectSpace={handleSelectSpace}
                            />
                        )}

                        {activeTab === 'notifications' && (
                            <NotificationCenter
                                notifications={notifications}
                                onMarkRead={handleMarkNotificationRead}
                                onMarkAllRead={handleMarkAllNotificationsRead}
                                onSelectNotification={(notif) => {
                                    if (notif.targetType === 'user') {
                                        const m = members.find(u => u.id === notif.targetId);
                                        if (m) setSelectedMember(m);
                                    } else {
                                        setActiveTab('feed');
                                    }
                                }}
                            />
                        )}
                    </main>

                    {/* RIGHT COLUMN: Trending Topics, Guidelines & Quick Connect (3 cols on lg) */}
                    <aside className="lg:col-span-3 space-y-4">
                        <TrendingSidebar
                            members={members}
                            onConnect={handleConnect}
                            onSelectMember={(m) => setSelectedMember(m)}
                        />
                    </aside>
                </div>
            </div>

            {/* Member Profile Modal */}
            {selectedMember && (
                <MemberProfileModal
                    member={selectedMember}
                    onClose={() => setSelectedMember(null)}
                    onConnect={handleConnect}
                    onSendMessage={(m) => {
                        setSelectedMember(null);
                        handleOpenDmModal({
                            author: m,
                            content: `Connecting regarding construction projects.`
                        });
                    }}
                    onRequestEngineer={(m) => {
                        setSelectedMember(null);
                        setRequestTargetMember(m);
                    }}
                />
            )}

            {/* Send Post via Direct Message Modal */}
            {dmModalPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md p-6 relative animate-scale-up">
                        <button
                            onClick={() => setDmModalPost(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>

                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3">
                            <Send size={16} className="text-primary" />
                            Send Post via Direct Message
                        </h3>

                        <form onSubmit={handleSendDm} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Select Connected Peer</label>
                                <select
                                    value={dmRecipientId}
                                    onChange={(e) => setDmRecipientId(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-primary font-medium"
                                    required
                                >
                                    <option value="">Choose a connection...</option>
                                    {members
                                        .filter(m => m.connectionStatus === 'connected')
                                        .map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({m.headline.split('|')[0]})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-600">
                                <span className="font-bold text-gray-800 block">{dmModalPost.author?.name}</span>
                                <p className="line-clamp-2 mt-0.5">{dmModalPost.content}</p>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Add a Note (Optional)</label>
                                <textarea
                                    rows={2}
                                    placeholder="Thought you'd find this interesting regarding our structural inspection..."
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-primary resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDmModalPost(null)}
                                    className="px-4 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg font-bold bg-primary text-white hover:bg-blue-800 flex items-center gap-1.5 shadow-sm"
                                >
                                    <Send size={13} /> Send Message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Direct Message Confirmation Toast */}
            {dmSentToast && (
                <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in border border-gray-700">
                    <Check size={16} className="text-green-400" />
                    <span>Post sent successfully to your connection!</span>
                </div>
            )}

            {/* Site Request Modal (For Contractors & Engineers) */}
            {requestTargetMember && (
                <SiteRequestModal
                    engineer={requestTargetMember}
                    currentUser={currentUser}
                    onClose={() => setRequestTargetMember(null)}
                    onSubmitSuccess={async (formData, targetProfessional) => {
                        await communityService.createSiteRequest(formData, currentUser, targetProfessional);
                        setRequestTargetMember(null);
                        setRequestSentToast(true);
                        setTimeout(() => setRequestSentToast(false), 4000);
                        const updatedNotifs = await communityService.fetchNotifications();
                        setNotifications(updatedNotifs);
                    }}
                />
            )}

            {/* Request Sent Confirmation Toast */}
            {requestSentToast && (
                <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fade-in border border-emerald-600">
                    <Check size={18} className="text-white" />
                    <span>Your construction request has been sent successfully!</span>
                </div>
            )}
        </div>
    );
};

export default CommunityModule;

