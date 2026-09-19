import React, { useState } from 'react';
import { 
    ThumbsUp, MessageSquare, Share2, Send, Bookmark, MoreHorizontal, 
    Heart, Award, Lightbulb, FileText, Download, Check, ExternalLink, Hash
} from 'lucide-react';

const REACTION_CONFIG = {
    like: { label: 'Like', icon: ThumbsUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    celebrate: { label: 'Celebrate', icon: Award, color: 'text-green-600', bg: 'bg-green-50' },
    insightful: { label: 'Insightful', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50' },
    love: { label: 'Love', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' }
};

const PostCard = ({ 
    post, 
    currentUser, 
    onReact, 
    onAddComment, 
    onOpenProfile, 
    onShare,
    onSendDM
}) => {
    const [showReactionsHover, setShowReactionsHover] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);

    const totalReactions = (post.reactions?.like || 0) + 
                           (post.reactions?.celebrate || 0) + 
                           (post.reactions?.insightful || 0) + 
                           (post.reactions?.love || 0);

    const currentReactionConfig = post.userReaction ? REACTION_CONFIG[post.userReaction] : null;

    const handleReactionClick = (type) => {
        onReact(post.id, type);
        setShowReactionsHover(false);
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setIsSubmittingComment(true);
        try {
            await onAddComment(post.id, commentText.trim());
            setCommentText('');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleShareClick = () => {
        setCopied(true);
        if (onShare) onShare(post);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:border-gray-300">
            {/* Space / Channel Header if applicable */}
            {post.spaceName && (
                <div className="bg-gray-50/80 px-4 py-1.5 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1 font-semibold text-primary">
                        <Hash size={12} className="text-accent" />
                        <span>Posted in <strong>{post.spaceName}</strong></span>
                    </span>
                    {post.isPinned && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                            📌 Pinned
                        </span>
                    )}
                </div>
            )}

            {/* Author Meta Header */}
            <div className="p-4 pb-2 flex items-start justify-between">
                <div 
                    onClick={() => onOpenProfile && onOpenProfile(post.author.id)}
                    className="flex items-start gap-3 cursor-pointer group"
                >
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                        <img 
                            src={post.author.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} 
                            alt={post.author.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                                {post.author.name}
                            </h4>
                            <span className="text-[11px] text-gray-400">• 1st</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-snug line-clamp-1">
                            {post.author.headline || `${post.author.company || 'Engineers Veedu Member'}`}
                        </p>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">
                            {post.createdAt} • 🌐 Public
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-gray-400">
                    <button 
                        onClick={() => setSaved(!saved)} 
                        title={saved ? "Saved" : "Save post"}
                        className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${saved ? 'text-accent' : 'hover:text-gray-600'}`}
                    >
                        <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
                    </button>
                    <button className="p-1.5 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors">
                        <MoreHorizontal size={17} />
                    </button>
                </div>
            </div>

            {/* Post Content */}
            <div className="px-4 py-2">
                <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                    {post.content}
                </p>

                {/* Hashtags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {post.tags.map(tag => (
                            <span key={tag} className="text-xs font-semibold text-primary hover:underline cursor-pointer">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Attachments Section */}
            {post.attachments && post.attachments.length > 0 && (
                <div className="mt-2 border-t border-gray-100">
                    {post.attachments.map((att, idx) => {
                        if (att.type === 'image') {
                            return (
                                <div key={idx} className="relative max-h-[420px] bg-gray-100 overflow-hidden flex items-center justify-center">
                                    <img 
                                        src={att.url} 
                                        alt={att.title || "Post attachment"} 
                                        className="w-full object-cover max-h-[420px]"
                                    />
                                    {att.title && (
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white text-xs font-medium">
                                            {att.title}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        if (att.type === 'document') {
                            return (
                                <div key={idx} className="mx-4 my-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-between transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-900 line-clamp-1">{att.title}</h5>
                                            <p className="text-[11px] text-gray-500">{att.fileType || 'PDF'} • {att.fileSize || '2.4 MB'}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => alert(`Downloading specification: ${att.title}`)}
                                        className="p-2 text-primary hover:bg-blue-100/50 rounded-lg transition-colors"
                                        title="Download Document"
                                    >
                                        <Download size={18} />
                                    </button>
                                </div>
                            );
                        }

                        return null;
                    })}
                </div>
            )}

            {/* Reactions & Comments Metric Summary */}
            <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    {totalReactions > 0 && (
                        <div className="flex items-center -space-x-1 mr-1">
                            <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] shadow-sm">👍</span>
                            <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] shadow-sm">👏</span>
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-sm">💡</span>
                        </div>
                    )}
                    <span>{totalReactions > 0 ? `${totalReactions} reactions` : 'Be the first to react'}</span>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setShowComments(!showComments)} className="hover:underline">
                        {post.commentsCount || (post.comments ? post.comments.length : 0)} comments
                    </button>
                    <span>•</span>
                    <span>{post.sharesCount || 0} shares</span>
                </div>
            </div>

            {/* Action Bar */}
            <div className="px-2 py-1 border-t border-gray-100 flex items-center justify-between relative">
                {/* Multi-Reaction Hover Flyout */}
                {showReactionsHover && (
                    <div 
                        onMouseEnter={() => setShowReactionsHover(true)}
                        onMouseLeave={() => setShowReactionsHover(false)}
                        className="absolute -top-12 left-2 bg-white rounded-full shadow-xl border border-gray-200 p-1.5 flex items-center gap-2 z-20 animate-fade-in"
                    >
                        <button 
                            onClick={() => handleReactionClick('like')} 
                            className="p-1 hover:scale-125 transition-transform" 
                            title="Like"
                        >
                            👍
                        </button>
                        <button 
                            onClick={() => handleReactionClick('celebrate')} 
                            className="p-1 hover:scale-125 transition-transform" 
                            title="Celebrate"
                        >
                            👏
                        </button>
                        <button 
                            onClick={() => handleReactionClick('insightful')} 
                            className="p-1 hover:scale-125 transition-transform" 
                            title="Insightful"
                        >
                            💡
                        </button>
                        <button 
                            onClick={() => handleReactionClick('love')} 
                            className="p-1 hover:scale-125 transition-transform" 
                            title="Love"
                        >
                            ❤️
                        </button>
                    </div>
                )}

                {/* Like / React Button */}
                <div 
                    className="relative flex-1"
                    onMouseEnter={() => setShowReactionsHover(true)}
                    onMouseLeave={() => setShowReactionsHover(false)}
                >
                    <button
                        onClick={() => handleReactionClick(post.userReaction || 'like')}
                        className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                            currentReactionConfig 
                                ? `${currentReactionConfig.color} ${currentReactionConfig.bg}` 
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {currentReactionConfig ? (
                            <currentReactionConfig.icon size={16} />
                        ) : (
                            <ThumbsUp size={16} />
                        )}
                        <span>{currentReactionConfig ? currentReactionConfig.label : 'Like'}</span>
                    </button>
                </div>

                {/* Comment Button */}
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex-1 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-colors"
                >
                    <MessageSquare size={16} />
                    <span>Comment</span>
                </button>

                {/* Share Button */}
                <button
                    onClick={handleShareClick}
                    className="flex-1 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-colors"
                >
                    {copied ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />}
                    <span>{copied ? 'Copied!' : 'Share'}</span>
                </button>

                {/* Send via DM Button */}
                <button
                    onClick={() => onSendDM && onSendDM(post)}
                    className="flex-1 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-colors"
                >
                    <Send size={16} />
                    <span>Send</span>
                </button>
            </div>

            {/* Comments Accordion */}
            {showComments && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
                    {/* Add Comment Input */}
                    <form onSubmit={handleCommentSubmit} className="flex items-start gap-2.5">
                        <img 
                            src={currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                            alt="Current user"
                            className="w-8 h-8 rounded-full object-cover border border-gray-200 mt-1"
                        />
                        <div className="flex-grow">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a comment or professional insight..."
                                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!commentText.trim() || isSubmittingComment}
                            className="px-4 py-2 bg-primary hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                            {isSubmittingComment ? '...' : 'Reply'}
                        </button>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-2.5 pt-2">
                        {post.comments && post.comments.length > 0 ? (
                            post.comments.map((comment) => (
                                <div key={comment.id} className="flex items-start gap-2.5 text-xs">
                                    <img 
                                        src={comment.author.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} 
                                        alt={comment.author.name}
                                        className="w-7 h-7 rounded-full object-cover border border-gray-200 mt-1 flex-shrink-0"
                                    />
                                    <div className="flex-grow bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                                        <div className="flex items-center justify-between mb-1">
                                            <div 
                                                onClick={() => onOpenProfile && onOpenProfile(comment.author.id)}
                                                className="font-bold text-gray-900 cursor-pointer hover:text-primary"
                                            >
                                                {comment.author.name}
                                            </div>
                                            <span className="text-[10px] text-gray-400">{comment.createdAt}</span>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">{comment.content}</p>

                                        {/* Nested Replies if present */}
                                        {comment.replies && comment.replies.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                                                {comment.replies.map(reply => (
                                                    <div key={reply.id} className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg">
                                                        <img 
                                                            src={reply.author.avatar} 
                                                            alt={reply.author.name}
                                                            className="w-5 h-5 rounded-full object-cover"
                                                        />
                                                        <div>
                                                            <span className="font-bold text-gray-900 block">{reply.author.name}</span>
                                                            <p className="text-gray-600">{reply.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-2">No comments yet. Start the conversation!</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostCard;

