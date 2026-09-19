import React, { useState } from 'react';
import { Image, FileText, Video, Send, X, Hash, Sparkles } from 'lucide-react';

const CreatePostBox = ({ user, spaces = [], activeSpace, onPostCreated }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [content, setContent] = useState('');
    const [selectedSpaceId, setSelectedSpaceId] = useState(activeSpace || '');
    const [attachmentType, setAttachmentType] = useState(null); // 'image' | 'document' | 'video'
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [attachmentTitle, setAttachmentTitle] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState(['CivilEngineering', 'Construction']);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddTag = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const clean = tagInput.trim().replace(/^#/, '');
            if (clean && !tags.includes(clean)) {
                setTags([...tags, clean]);
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        const selectedSpace = spaces.find(s => s.id === selectedSpaceId);

        const attachments = [];
        if (attachmentType && attachmentUrl.trim()) {
            attachments.push({
                type: attachmentType,
                url: attachmentUrl.trim(),
                title: attachmentTitle.trim() || (attachmentType === 'document' ? 'Engineering_Specification_Document.pdf' : 'Site Attachment'),
                fileType: attachmentType === 'document' ? 'PDF' : attachmentType === 'video' ? 'MP4' : 'JPEG',
                fileSize: attachmentType === 'document' ? '2.8 MB' : undefined
            });
        }

        try {
            await onPostCreated({
                content: content.trim(),
                spaceId: selectedSpaceId || null,
                spaceName: selectedSpace ? selectedSpace.name : null,
                attachments,
                tags
            });

            // Reset form
            setContent('');
            setAttachmentType(null);
            setAttachmentUrl('');
            setAttachmentTitle('');
            setIsExpanded(false);
        } catch (err) {
            console.error('Error creating post:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all">
            {/* Collapsed State */}
            {!isExpanded ? (
                <div className="flex items-center gap-3">
                    <img
                        src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                        alt="Author Avatar"
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="flex-grow text-left px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-xs md:text-sm text-gray-500 font-medium border border-gray-200 transition-colors"
                    >
                        Start a post, share a site update, or ask an engineering question...
                    </button>
                    <button
                        onClick={() => {
                            setIsExpanded(true);
                            setAttachmentType('image');
                        }}
                        className="p-2 text-gray-500 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors hidden sm:flex items-center gap-1.5 text-xs font-semibold"
                    >
                        <Image size={18} className="text-blue-500" />
                        <span>Media</span>
                    </button>
                </div>
            ) : (
                /* Expanded Composer State */
                <form onSubmit={handleSubmit} className="space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2.5">
                            <img
                                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                alt="Author Avatar"
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 leading-none">
                                    {user?.name || user?.email?.split('@')[0] || "You"}
                                </h4>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <select
                                        value={selectedSpaceId}
                                        onChange={(e) => setSelectedSpaceId(e.target.value)}
                                        className="text-xs font-semibold text-primary bg-blue-50 border border-blue-200 rounded-md px-2 py-0.5 outline-none"
                                    >
                                        <option value="">🌐 Post to Public Feed</option>
                                        {spaces.map(s => (
                                            <option key={s.id} value={s.id}>
                                                🏷️ {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsExpanded(false)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What are you working on today? Share concrete test results, architectural blueprints, or site progress..."
                        rows={4}
                        className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none resize-none p-1 border-none focus:ring-0"
                        autoFocus
                    />

                    {/* Tag Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {tags.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 text-[11px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                #{tag}
                                <button type="button" onClick={() => handleRemoveTag(tag)} className="text-gray-400 hover:text-red-500">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                            placeholder="+ Add tag & press Enter"
                            className="text-xs bg-transparent outline-none border-b border-gray-200 focus:border-accent py-0.5 px-1 w-32"
                        />
                    </div>

                    {/* Attachment Inputs */}
                    {attachmentType && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-xs">
                            <div className="flex justify-between items-center font-bold text-gray-700">
                                <span>Add {attachmentType === 'image' ? 'Image' : attachmentType === 'document' ? 'Document / PDF' : 'Video Link'}</span>
                                <button type="button" onClick={() => setAttachmentType(null)} className="text-gray-400 hover:text-gray-600">
                                    <X size={14} />
                                </button>
                            </div>
                            <input
                                type="text"
                                value={attachmentUrl}
                                onChange={(e) => setAttachmentUrl(e.target.value)}
                                placeholder={attachmentType === 'document' ? 'PDF File URL or Document Path' : attachmentType === 'video' ? 'YouTube/MP4 Video URL' : 'Image URL (e.g. /projects/foundation.jpeg)'}
                                className="w-full p-2 bg-white border border-gray-200 rounded outline-none focus:border-primary"
                            />
                            {attachmentType === 'document' && (
                                <input
                                    type="text"
                                    value={attachmentTitle}
                                    onChange={(e) => setAttachmentTitle(e.target.value)}
                                    placeholder="Document Title (e.g. Slab_Load_Calculation_Audit.pdf)"
                                    className="w-full p-2 bg-white border border-gray-200 rounded outline-none focus:border-primary"
                                />
                            )}
                            {attachmentType === 'image' && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAttachmentUrl('/projects/foundation.jpeg')}
                                        className="text-[11px] text-primary hover:underline"
                                    >
                                        Preset: Foundation Work
                                    </button>
                                    <span className="text-gray-300">•</span>
                                    <button
                                        type="button"
                                        onClick={() => setAttachmentUrl('/projects/luxury.jpeg')}
                                        className="text-[11px] text-primary hover:underline"
                                    >
                                        Preset: Residential Villa
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Media Attach Bar & Post Action */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <button
                                type="button"
                                onClick={() => setAttachmentType('image')}
                                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                                    attachmentType === 'image' ? 'bg-blue-100 text-primary' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Image size={17} className="text-blue-500" />
                                <span className="hidden sm:inline">Photo</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setAttachmentType('document')}
                                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                                    attachmentType === 'document' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <FileText size={17} className="text-purple-500" />
                                <span className="hidden sm:inline">Document</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setAttachmentType('video')}
                                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                                    attachmentType === 'video' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Video size={17} className="text-emerald-500" />
                                <span className="hidden sm:inline">Video</span>
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={!content.trim() || isSubmitting}
                            className="bg-primary hover:bg-blue-800 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                            <Send size={14} />
                            {isSubmitting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CreatePostBox;

