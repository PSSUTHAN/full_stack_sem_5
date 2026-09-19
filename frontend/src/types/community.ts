/**
 * Standard TypeScript interfaces for LinkedIn-style Community Module
 * Models: User, Post, Comment, Group (Space), Notification, ConnectionRequest, Attachment
 */

export type UserRole = 'site_engineer' | 'contractor' | 'client' | 'architect' | 'project_manager' | 'estimator';

export interface UserExperience {
    id: string;
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string; // Empty if current
    current: boolean;
    description: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    headline: string;
    role: UserRole;
    company: string;
    location: string;
    bio: string;
    skills: string[];
    experience: UserExperience[];
    connectionsCount: number;
    profileViewsCount: number;
    postImpressionsCount: number;
    connectionStatus?: 'connected' | 'pending_sent' | 'pending_received' | 'not_connected';
    mutualConnectionsCount?: number;
    joinedSpacesIds?: string[];
}

export type AttachmentType = 'image' | 'video' | 'document' | 'link';

export interface Attachment {
    type: AttachmentType;
    url: string;
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    fileSize?: string;
    fileType?: string; // e.g., 'PDF', 'DOCX'
}

export type ReactionType = 'like' | 'celebrate' | 'insightful' | 'love';

export interface ReactionCount {
    like: number;
    celebrate: number;
    insightful: number;
    love: number;
}

export interface Comment {
    id: string;
    postId: string;
    author: Pick<User, 'id' | 'name' | 'avatar' | 'headline' | 'role'>;
    content: string;
    createdAt: string; // ISO 8601 or relative string
    likesCount: number;
    isLikedByMe?: boolean;
    replies?: Comment[];
}

export interface Post {
    id: string;
    author: Pick<User, 'id' | 'name' | 'avatar' | 'headline' | 'role' | 'company'>;
    spaceId?: string;
    spaceName?: string;
    content: string;
    attachments: Attachment[];
    tags: string[];
    createdAt: string;
    reactions: ReactionCount;
    userReaction?: ReactionType | null;
    commentsCount: number;
    sharesCount: number;
    comments?: Comment[];
    isPinned?: boolean;
}

export interface Group {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    icon?: string;
    bannerUrl?: string;
    membersCount: number;
    isJoined: boolean;
    recentActivityTime: string;
    moderators: string[];
}

export type NotificationType = 'reaction' | 'comment' | 'connection_request' | 'connection_accepted' | 'mention' | 'space_activity';

export interface Notification {
    id: string;
    type: NotificationType;
    actor: Pick<User, 'id' | 'name' | 'avatar' | 'headline'>;
    title: string;
    description: string;
    targetId?: string; // postId, commentId, or userId
    targetType?: 'post' | 'user' | 'group';
    isRead: boolean;
    createdAt: string;
}

export interface ConnectionRequest {
    id: string;
    fromUser: User;
    toUserId: string;
    createdAt: string;
    mutualConnectionsCount: number;
    status: 'pending' | 'accepted' | 'ignored';
}

export interface CommunityFilterState {
    searchQuery: string;
    activeRoleFilter?: string;
    activeSkillFilter?: string;
    activeSpaceId?: string;
}

export interface SiteRequest {
    id: string;
    engineerId: string;
    engineerName: string;
    engineerRole?: string;
    engineerAvatar?: string;
    clientId?: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    name: string; // Contact / Client name
    siteDetails: string; // Plot area, floors, stage, soil
    buildingType: string; // Residential, Commercial, etc.
    amount: string; // Budget / allocated amount
    siteAddress: string; // Physical location / address
    anotherDetails: string; // Text area for another details
    status: 'pending' | 'accepted' | 'in_review' | 'declined';
    createdAt: string;
}

