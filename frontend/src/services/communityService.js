/**
 * Asynchronous Simulated API Service & LocalStorage Persistence for Community Module
 * Ready to be swapped with backend REST/GraphQL endpoints without changing component APIs.
 */

const STORAGE_KEY_POSTS = 'engineersveedu_community_posts_v1';
const STORAGE_KEY_MEMBERS = 'engineersveedu_community_members_v1';
const STORAGE_KEY_SPACES = 'engineersveedu_community_spaces_v1';
const STORAGE_KEY_REQUESTS = 'engineersveedu_community_requests_v1';
const STORAGE_KEY_NOTIFICATIONS = 'engineersveedu_community_notifications_v1';
const STORAGE_KEY_SITE_REQUESTS = 'engineersveedu_community_site_requests_v1';

// Seed Site Requests
const SEED_SITE_REQUESTS = [
    {
        id: 'req-1',
        engineerId: 'user-ramesh',
        engineerName: 'Er. Ramesh Kumar, M.E.',
        engineerRole: 'site_engineer',
        engineerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        clientId: 'user-vikram',
        clientName: 'Vikram Chandran',
        clientEmail: 'vikram.c@homeowner.com',
        clientPhone: '+91 98401 23456',
        name: 'Vikram Chandran',
        siteAddress: 'Plot 42, Avinashi Road, Peelamedu, Coimbatore - 641004',
        amount: '₹38,00,000',
        buildingType: 'Residential Villa',
        requiredDetails: 'Plot Size: 2400 sq.ft (40x60), Proposed G+2 Floors with central courtyard, Soil test: Medium hard rock at 6ft. Looking for structural design audit, footing reinforcement schedule, and periodic site inspection.',
        siteDetails: 'Plot Size: 2400 sq.ft (40x60), Proposed G+2 Floors with central courtyard, Soil test: Medium hard rock at 6ft.',
        anotherDetails: 'Looking for structural design audit, footing reinforcement schedule, and periodic site inspection during slab casting phases.',
        status: 'pending',
        createdAt: '2 hours ago'
    },
    {
        id: 'req-2',
        engineerId: 'user-anand',
        engineerName: 'Anand Verma',
        engineerRole: 'contractor',
        engineerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        clientId: 'user-vikram',
        clientName: 'Vikram Chandran',
        clientEmail: 'vikram.c@homeowner.com',
        clientPhone: '+91 98401 23456',
        name: 'Vikram Chandran',
        siteAddress: '12 Palm Meadows, Vadavalli, Coimbatore - 641041',
        amount: '₹65,00,000',
        buildingType: 'Residential Villa / Individual House',
        requiredDetails: 'Plot Size: 3200 sq.ft (50x64), G+2 Luxury Villa with underground water sump and solar PV roofing. Full turnkey EPC contract required covering materials, civil structure, electrical/plumbing rough-ins, and high-end exterior finishing with 12-month completion target.',
        siteDetails: 'Plot Size: 3200 sq.ft (50x64), G+2 Luxury Villa with underground water sump and solar PV roofing.',
        anotherDetails: 'Full turnkey EPC contract required covering materials, civil structure, electrical/plumbing rough-ins, and high-end exterior finishing with 12-month completion target.',
        status: 'pending',
        createdAt: '35m ago'
    }
];

// Seed Spaces
const SEED_SPACES = [
    {
        id: 'space-structural',
        name: 'Structural Engineering & RCC',
        slug: 'structural-engineering',
        description: 'Discussions on reinforced concrete design, IS 456 standards, foundation seismic loads, and structural audits.',
        category: 'Engineering',
        membersCount: 1240,
        isJoined: true,
        recentActivityTime: '12m ago',
        moderators: ['Er. Ramesh Kumar', 'Dr. Priya S.']
    },
    {
        id: 'space-architecture',
        name: 'Sustainable Architecture & BIM',
        slug: 'sustainable-architecture',
        description: 'Green building guidelines, passive ventilation, daylighting, Revit BIM workflows, and LEED certification.',
        category: 'Architecture',
        membersCount: 890,
        isJoined: true,
        recentActivityTime: '35m ago',
        moderators: ['Ar. Sanjay Menon']
    },
    {
        id: 'space-safety',
        name: 'Site Safety & Quality Assurance (QA/QC)',
        slug: 'site-safety-qa-qc',
        description: 'OSHA & Indian safety protocols, non-destructive testing (NDT), concrete slump checks, and hazard prevention.',
        category: 'Operations',
        membersCount: 650,
        isJoined: false,
        recentActivityTime: '2h ago',
        moderators: ['Anand Verma']
    },
    {
        id: 'space-pm',
        name: 'Project Management & Cost Estimation',
        slug: 'pm-cost-estimation',
        description: 'Earned Value Management (EVM), CPM scheduling, material price indices, and tender BOQ drafting.',
        category: 'Management',
        membersCount: 1120,
        isJoined: false,
        recentActivityTime: '4h ago',
        moderators: ['Meera Nair']
    },
    {
        id: 'space-materials',
        name: 'Advanced Construction Materials',
        slug: 'advanced-materials',
        description: 'Self-compacting concrete, geopolymer binders, GGBS mixes, high-tensile rebar, and waterproofing chemistry.',
        category: 'Materials',
        membersCount: 520,
        isJoined: false,
        recentActivityTime: '1d ago',
        moderators: ['Karthik Sundaram']
    }
];

// Seed Members
const SEED_MEMBERS = [
    {
        id: 'user-ramesh',
        name: 'Er. Ramesh Kumar, M.E.',
        email: 'ramesh.kumar@ceg.edu',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        headline: 'Lead Structural Consultant | M25/M40 RCC Specialist | 14+ Yrs Exp',
        role: 'site_engineer',
        company: 'Vanguard Civil Engineering',
        location: 'Coimbatore, Tamil Nadu',
        bio: 'Passionate structural engineer specializing in multi-storey residential RCC framing, deep pile foundations, and quality assurance under IS 456 & IS 1893.',
        skills: ['RCC Design', 'IS 456', 'ETABS', 'Foundation Engineering', 'Site QA/QC', 'Concrete Slump Testing'],
        experience: [
            {
                id: 'exp-1',
                title: 'Principal Structural Engineer',
                company: 'Vanguard Civil Engineering',
                startDate: '2018',
                current: true,
                description: 'Supervising structural design audits and high-rise casting works across South India.'
            },
            {
                id: 'exp-2',
                title: 'Senior Site Engineer',
                company: 'L&T Construction',
                startDate: '2012',
                endDate: '2018',
                current: false,
                description: 'Managed 25+ RCC site managers across commercial development packages.'
            }
        ],
        connectionsCount: 842,
        profileViewsCount: 428,
        postImpressionsCount: 5120,
        connectionStatus: 'connected',
        mutualConnectionsCount: 18,
        joinedSpacesIds: ['space-structural', 'space-safety']
    },
    {
        id: 'user-priya',
        name: 'Ar. Priya Sundaram',
        email: 'priya@sundaramarchitects.in',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        headline: 'Principal Architect | LEED AP | Biophilic Residential Design',
        role: 'architect',
        company: 'Sundaram Design Studio',
        location: 'Bangalore, Karnataka',
        bio: 'Architect driven by sustainable tropical architecture, courtyards, natural cross-ventilation, and cost-efficient vernacular materials.',
        skills: ['Architectural Design', 'BIM / Revit', 'Green Building', 'Interior Spatial Planning', '3D Lumion'],
        experience: [
            {
                id: 'exp-3',
                title: 'Founding Partner',
                company: 'Sundaram Design Studio',
                startDate: '2016',
                current: true,
                description: 'Designed over 60 contemporary homes integrating thermal massing and solar passive designs.'
            }
        ],
        connectionsCount: 1430,
        profileViewsCount: 689,
        postImpressionsCount: 9240,
        connectionStatus: 'not_connected',
        mutualConnectionsCount: 34,
        joinedSpacesIds: ['space-architecture', 'space-materials']
    },
    {
        id: 'user-anand',
        name: 'Anand Verma',
        email: 'anand.verma@apexinfra.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        headline: 'General Contractor | Turnkey Residential & Commercial EPC | Apex Infra',
        role: 'contractor',
        company: 'Apex Infrastructure Group',
        location: 'Chennai, Tamil Nadu',
        bio: 'Managing procurement pipelines, labor deployment, and timeline precision across residential villas and commercial complexes.',
        skills: ['Turnkey Contracting', 'Tendering & BOQ', 'Subcontractor Management', 'Cost Optimization', 'CPM Scheduling'],
        experience: [
            {
                id: 'exp-4',
                title: 'Managing Director',
                company: 'Apex Infrastructure Group',
                startDate: '2014',
                current: true,
                description: 'Delivered 80+ residential turnkey packages with 98% on-schedule completion.'
            }
        ],
        connectionsCount: 950,
        profileViewsCount: 312,
        postImpressionsCount: 3870,
        connectionStatus: 'pending_sent',
        mutualConnectionsCount: 12,
        joinedSpacesIds: ['space-pm', 'space-safety']
    },
    {
        id: 'user-meera',
        name: 'Meera Nair, PMP',
        email: 'meera.nair@buildtech.com',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        headline: 'Senior Project Manager | PMP Certified | Cost Estimation & Primavera P6',
        role: 'project_manager',
        company: 'BuildTech Solutions',
        location: 'Kochi, Kerala',
        bio: 'Civil engineer and certified Project Management Professional (PMP) specializing in project budgeting, resource leveling, and risk register management.',
        skills: ['PMP', 'Primavera P6', 'MS Project', 'Risk Assessment', 'Earned Value Analysis', 'Vendor Management'],
        experience: [
            {
                id: 'exp-5',
                title: 'Senior Construction PM',
                company: 'BuildTech Solutions',
                startDate: '2019',
                current: true,
                description: 'Leading multi-site milestone governance and financial audits.'
            }
        ],
        connectionsCount: 620,
        profileViewsCount: 245,
        postImpressionsCount: 4200,
        connectionStatus: 'pending_received',
        mutualConnectionsCount: 8,
        joinedSpacesIds: ['space-pm', 'space-structural']
    },
    {
        id: 'user-karthik',
        name: 'Karthik Sundaram',
        email: 'karthik.s@buildchem.in',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        headline: 'Quality Assurance & Concrete Technology Lead | NDT Level II',
        role: 'site_engineer',
        company: 'UltraTech Technical Services',
        location: 'Salem, Tamil Nadu',
        bio: 'Concrete technologist focused on mix design optimization, fly ash/GGBS cement replacement, and ultrasonic pulse velocity testing.',
        skills: ['Mix Design (M20-M50)', 'Concrete Curing', 'Non-Destructive Testing', 'Slump & Core Sampling', 'Rebar Detailing'],
        experience: [
            {
                id: 'exp-6',
                title: 'Technical Services Head',
                company: 'UltraTech Concrete',
                startDate: '2017',
                current: true,
                description: 'Standardized mix designs for high durability marine and tropical environments.'
            }
        ],
        connectionsCount: 480,
        profileViewsCount: 190,
        postImpressionsCount: 2980,
        connectionStatus: 'not_connected',
        mutualConnectionsCount: 15,
        joinedSpacesIds: ['space-materials', 'space-safety']
    },
    {
        id: 'user-vikram',
        name: 'Vikram Chandran',
        email: 'vikram.c@homeowner.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        headline: 'Client & Tech Executive | Building Custom Eco-Villa | Tech Lead @ Horizon',
        role: 'client',
        company: 'Horizon Cloud Systems',
        location: 'Coimbatore, Tamil Nadu',
        bio: 'Owner building a net-zero solar home with Engineers Veedu. Tracking day-by-day structural milestones and sustainable plumbing integrations.',
        skills: ['Smart Home Systems', 'Solar Photovoltaics', 'Home Automation', 'Sustainable Living'],
        experience: [
            {
                id: 'exp-7',
                title: 'VP of Engineering',
                company: 'Horizon Cloud Systems',
                startDate: '2016',
                current: true,
                description: 'Leading distributed cloud infrastructure teams.'
            }
        ],
        connectionsCount: 310,
        profileViewsCount: 120,
        postImpressionsCount: 1450,
        connectionStatus: 'connected',
        mutualConnectionsCount: 5,
        joinedSpacesIds: ['space-architecture']
    }
];

// Seed Posts
const SEED_POSTS = [
    {
        id: 'post-1',
        author: {
            id: 'user-ramesh',
            name: 'Er. Ramesh Kumar, M.E.',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            headline: 'Lead Structural Consultant | Vanguard Civil Engineering',
            role: 'site_engineer',
            company: 'Vanguard Civil Engineering'
        },
        spaceId: 'space-structural',
        spaceName: 'Structural Engineering & RCC',
        content: `Excited to share the successful casting of our 3rd-floor RCC cantilever slab today! 🏗️\n\nKey QA/QC Highlights:\n1. Mix Grade: M25 Design Mix with 120mm controlled slump at point of discharge.\n2. Curing Protocol: Minimum 14-day ponding with jute burlap coverings scheduled.\n3. Cover Block Inspection: 25mm PVC cover blocks verified on bottom reinforcement prior to concrete pour.\n\nAlways ensure bar benders maintain proper development length (Ld = 48d) at column beam junctions. Never compromise on reinforcement anchorage!`,
        attachments: [
            {
                type: 'image',
                url: '/projects/foundation.jpeg',
                title: '3rd Floor Cantilever Slab Casting Inspection',
                fileType: 'JPEG'
            }
        ],
        tags: ['RCCDesign', 'CivilEngineering', 'ConcreteQAQC', 'IS456', 'SiteSafety'],
        createdAt: '2 hours ago',
        reactions: {
            like: 34,
            celebrate: 18,
            insightful: 27,
            love: 9
        },
        userReaction: 'insightful',
        commentsCount: 6,
        sharesCount: 8,
        isPinned: true,
        comments: [
            {
                id: 'comment-1',
                postId: 'post-1',
                author: {
                    id: 'user-karthik',
                    name: 'Karthik Sundaram',
                    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                    headline: 'Quality Assurance Lead | UltraTech Concrete',
                    role: 'site_engineer'
                },
                content: 'Great attention to cover blocks, Ramesh! Did you also run a 7-day compressive strength cube test, or are you waiting for the 28-day batch?',
                createdAt: '1 hour ago',
                likesCount: 5,
                isLikedByMe: true,
                replies: [
                    {
                        id: 'reply-1-1',
                        postId: 'post-1',
                        author: {
                            id: 'user-ramesh',
                            name: 'Er. Ramesh Kumar, M.E.',
                            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                            headline: 'Lead Structural Consultant',
                            role: 'site_engineer'
                        },
                        content: 'Yes Karthik! 3 cubes cast for 7-day break (aiming for 17.5 MPa min) and 3 cubes for the 28-day compliance report.',
                        createdAt: '45m ago',
                        likesCount: 3
                    }
                ]
            },
            {
                id: 'comment-2',
                postId: 'post-1',
                author: {
                    id: 'user-anand',
                    name: 'Anand Verma',
                    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                    headline: 'General Contractor | Apex Infra',
                    role: 'contractor'
                },
                content: 'Clean execution on the staging and props. Keeping the deflection in check during de-shuttering is going to be effortless with this setup.',
                createdAt: '30m ago',
                likesCount: 2
            }
        ]
    },
    {
        id: 'post-2',
        author: {
            id: 'user-priya',
            name: 'Ar. Priya Sundaram',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
            headline: 'Principal Architect | LEED AP | Sundaram Design Studio',
            role: 'architect',
            company: 'Sundaram Design Studio'
        },
        spaceId: 'space-architecture',
        spaceName: 'Sustainable Architecture & BIM',
        content: `How do you tackle thermal comfort in tropical climates without skyrocketing air conditioning expenses? 🌿☀️\n\nIn our latest villa project with Engineers Veedu, we combined 3 passive techniques:\n• Central double-height light court acting as a solar thermal chimney.\n• Double-layer cavity masonry walls on the West-facing facade with AAC insulation blocks.\n• Terracotta louver panels to break direct 2:00 PM solar radiation while admitting 80% natural breeze.\n\nTake a look at the concept render and BIM section diagram below!`,
        attachments: [
            {
                type: 'image',
                url: '/projects/luxury.jpeg',
                title: 'Passive Tropical Courtyard Residence - Section Render',
                fileType: 'JPEG'
            }
        ],
        tags: ['GreenBuilding', 'BIM', 'SustainableDesign', 'Architecture', 'PassiveSolar'],
        createdAt: '5 hours ago',
        reactions: {
            like: 52,
            celebrate: 29,
            insightful: 44,
            love: 31
        },
        userReaction: 'love',
        commentsCount: 4,
        sharesCount: 14,
        comments: [
            {
                id: 'comment-3',
                postId: 'post-2',
                author: {
                    id: 'user-vikram',
                    name: 'Vikram Chandran',
                    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                    headline: 'Client | Eco-Villa Homeowner',
                    role: 'client'
                },
                content: 'As the homeowner living this design, I can confirm the indoor temperature is 4°C cooler than the ambient outdoor temperature even at noon!',
                createdAt: '3 hours ago',
                likesCount: 11
            }
        ]
    },
    {
        id: 'post-3',
        author: {
            id: 'user-meera',
            name: 'Meera Nair, PMP',
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
            headline: 'Senior Project Manager | BuildTech Solutions',
            role: 'project_manager',
            company: 'BuildTech Solutions'
        },
        spaceId: 'space-pm',
        spaceName: 'Project Management & Cost Estimation',
        content: `I've uploaded our updated 2026 Construction Material Price Escalation Guide & Schedule Risk Checklist 📄📊.\n\nCovers:\n- Steel TMT 500D per ton indices vs cement price swings\n- Critical path buffer allocation strategies for monsoon season\n- Subcontractor retention release milestones\n\nFree download for all Engineers Veedu community members below!`,
        attachments: [
            {
                type: 'document',
                url: '#',
                title: 'Construction_Risk_Schedule_Index_2026.pdf',
                description: '18-page comprehensive guide on BOQ contingency modeling & price volatility hedges.',
                fileSize: '3.4 MB',
                fileType: 'PDF'
            }
        ],
        tags: ['ProjectManagement', 'CostEstimation', 'BOQ', 'PMP', 'RiskManagement'],
        createdAt: '1 day ago',
        reactions: {
            like: 68,
            celebrate: 21,
            insightful: 58,
            love: 12
        },
        userReaction: null,
        commentsCount: 9,
        sharesCount: 32,
        comments: []
    }
];

// Seed Notifications
const SEED_NOTIFICATIONS = [
    {
        id: 'notif-1',
        type: 'reaction',
        actor: {
            id: 'user-priya',
            name: 'Ar. Priya Sundaram',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
            headline: 'Principal Architect | LEED AP'
        },
        title: 'reacted to your post',
        description: 'Priya celebrated your update on RCC Cantilever slab casting inspection.',
        targetId: 'post-1',
        targetType: 'post',
        isRead: false,
        createdAt: '25m ago'
    },
    {
        id: 'notif-2',
        type: 'connection_request',
        actor: {
            id: 'user-meera',
            name: 'Meera Nair, PMP',
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
            headline: 'Senior Project Manager | PMP Certified'
        },
        title: 'sent you a connection request',
        description: 'Meera wants to connect with you on Engineers Veedu Community.',
        targetId: 'user-meera',
        targetType: 'user',
        isRead: false,
        createdAt: '1h ago'
    },
    {
        id: 'notif-3',
        type: 'comment',
        actor: {
            id: 'user-karthik',
            name: 'Karthik Sundaram',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
            headline: 'Quality Assurance & Concrete Technology Lead'
        },
        title: 'commented on your post',
        description: '"Great attention to cover blocks, Ramesh! Did you also run a 7-day compressive strength..."',
        targetId: 'post-1',
        targetType: 'post',
        isRead: true,
        createdAt: '2h ago'
    },
    {
        id: 'notif-4',
        type: 'connection_accepted',
        actor: {
            id: 'user-ramesh',
            name: 'Er. Ramesh Kumar',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            headline: 'Lead Structural Consultant'
        },
        title: 'accepted your connection request',
        description: 'You are now connected with Ramesh Kumar. Say hello!',
        targetId: 'user-ramesh',
        targetType: 'user',
        isRead: true,
        createdAt: '1d ago'
    }
];

// Helper to get / set from storage with fallbacks
function getStorageItem(key, fallback) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
}

function setStorageItem(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
        console.warn('Could not write to localStorage:', err);
    }
}

/**
 * Community Service API
 */
export const communityService = {
    // ------------------------------------
    // FEED & POSTS
    // ------------------------------------
    async fetchFeed(spaceId = null) {
        // Simulate network latency (150ms)
        await new Promise(r => setTimeout(r, 150));
        let posts = getStorageItem(STORAGE_KEY_POSTS, SEED_POSTS);
        if (spaceId) {
            posts = posts.filter(p => p.spaceId === spaceId);
        }
        return posts;
    },

    async createPost(postInput, currentUser) {
        await new Promise(r => setTimeout(r, 200));
        const posts = getStorageItem(STORAGE_KEY_POSTS, SEED_POSTS);

        const newPost = {
            id: `post-${Date.now()}`,
            author: {
                id: currentUser?.id || 'current-user',
                name: currentUser?.name || currentUser?.email?.split('@')[0] || 'Community Member',
                avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                headline: currentUser?.headline || `${currentUser?.role === 'site_engineer' ? 'Site Engineer' : currentUser?.role === 'contractor' ? 'General Contractor' : 'Client & Property Owner'} | Engineers Veedu`,
                role: currentUser?.role || 'site_engineer',
                company: currentUser?.company || 'Engineers Veedu Network'
            },
            spaceId: postInput.spaceId || null,
            spaceName: postInput.spaceName || null,
            content: postInput.content,
            attachments: postInput.attachments || [],
            tags: postInput.tags || [],
            createdAt: 'Just now',
            reactions: { like: 0, celebrate: 0, insightful: 0, love: 0 },
            userReaction: null,
            commentsCount: 0,
            sharesCount: 0,
            comments: []
        };

        const updated = [newPost, ...posts];
        setStorageItem(STORAGE_KEY_POSTS, updated);
        return newPost;
    },

    async toggleReaction(postId, reactionType = 'like') {
        await new Promise(r => setTimeout(r, 100));
        const posts = getStorageItem(STORAGE_KEY_POSTS, SEED_POSTS);
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return null;

        const post = { ...posts[postIndex] };
        const reactions = { ...post.reactions };
        const currentReaction = post.userReaction;

        if (currentReaction === reactionType) {
            // Remove reaction
            reactions[reactionType] = Math.max(0, (reactions[reactionType] || 1) - 1);
            post.userReaction = null;
        } else {
            // Swap or add
            if (currentReaction && reactions[currentReaction] > 0) {
                reactions[currentReaction]--;
            }
            reactions[reactionType] = (reactions[reactionType] || 0) + 1;
            post.userReaction = reactionType;
        }

        post.reactions = reactions;
        posts[postIndex] = post;
        setStorageItem(STORAGE_KEY_POSTS, posts);
        return post;
    },

    async addComment(postId, commentContent, currentUser) {
        await new Promise(r => setTimeout(r, 150));
        const posts = getStorageItem(STORAGE_KEY_POSTS, SEED_POSTS);
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return null;

        const post = { ...posts[postIndex] };
        const newComment = {
            id: `comment-${Date.now()}`,
            postId,
            author: {
                id: currentUser?.id || 'current-user',
                name: currentUser?.name || currentUser?.email?.split('@')[0] || 'Community Member',
                avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                headline: currentUser?.headline || 'Engineers Veedu Community Member',
                role: currentUser?.role || 'site_engineer'
            },
            content: commentContent,
            createdAt: 'Just now',
            likesCount: 0,
            isLikedByMe: false,
            replies: []
        };

        post.comments = [...(post.comments || []), newComment];
        post.commentsCount = (post.commentsCount || 0) + 1;
        posts[postIndex] = post;
        setStorageItem(STORAGE_KEY_POSTS, posts);
        return { post, newComment };
    },

    // ------------------------------------
    // MEMBERS DIRECTORY & NETWORKING
    // ------------------------------------
    async fetchMembers(filters = {}) {
        await new Promise(r => setTimeout(r, 120));
        let members = getStorageItem(STORAGE_KEY_MEMBERS, SEED_MEMBERS);

        if (filters.search) {
            const q = filters.search.toLowerCase();
            members = members.filter(m =>
                m.name.toLowerCase().includes(q) ||
                m.headline.toLowerCase().includes(q) ||
                m.company.toLowerCase().includes(q) ||
                m.skills.some(s => s.toLowerCase().includes(q))
            );
        }

        if (filters.role && filters.role !== 'all') {
            members = members.filter(m => m.role === filters.role);
        }

        if (filters.skill && filters.skill !== 'all') {
            members = members.filter(m => m.skills.includes(filters.skill));
        }

        return members;
    },

    async updateConnectionStatus(userId, newStatus) {
        await new Promise(r => setTimeout(r, 120));
        const members = getStorageItem(STORAGE_KEY_MEMBERS, SEED_MEMBERS);
        const index = members.findIndex(m => m.id === userId);
        if (index !== -1) {
            members[index].connectionStatus = newStatus;
            if (newStatus === 'connected') {
                members[index].connectionsCount = (members[index].connectionsCount || 0) + 1;
            }
            setStorageItem(STORAGE_KEY_MEMBERS, members);
            return members[index];
        }
        return null;
    },

    // ------------------------------------
    // SPACES & SUB-COMMUNITIES
    // ------------------------------------
    async fetchSpaces() {
        await new Promise(r => setTimeout(r, 100));
        return getStorageItem(STORAGE_KEY_SPACES, SEED_SPACES);
    },

    async toggleSpaceJoin(spaceId) {
        await new Promise(r => setTimeout(r, 120));
        const spaces = getStorageItem(STORAGE_KEY_SPACES, SEED_SPACES);
        const index = spaces.findIndex(s => s.id === spaceId);
        if (index !== -1) {
            const isCurrentlyJoined = spaces[index].isJoined;
            spaces[index].isJoined = !isCurrentlyJoined;
            spaces[index].membersCount += isCurrentlyJoined ? -1 : 1;
            setStorageItem(STORAGE_KEY_SPACES, spaces);
            return spaces[index];
        }
        return null;
    },

    // ------------------------------------
    // NOTIFICATIONS
    // ------------------------------------
    async fetchNotifications() {
        await new Promise(r => setTimeout(r, 100));
        return getStorageItem(STORAGE_KEY_NOTIFICATIONS, SEED_NOTIFICATIONS);
    },

    async markNotificationRead(notifId) {
        const notifs = getStorageItem(STORAGE_KEY_NOTIFICATIONS, SEED_NOTIFICATIONS);
        const updated = notifs.map(n => n.id === notifId ? { ...n, isRead: true } : n);
        setStorageItem(STORAGE_KEY_NOTIFICATIONS, updated);
        return updated;
    },

    async markAllNotificationsRead() {
        const notifs = getStorageItem(STORAGE_KEY_NOTIFICATIONS, SEED_NOTIFICATIONS);
        const updated = notifs.map(n => ({ ...n, isRead: true }));
        setStorageItem(STORAGE_KEY_NOTIFICATIONS, updated);
        return updated;
    },

    // ------------------------------------
    // CLIENT SITE REQUESTS
    // ------------------------------------
    async fetchSiteRequests(userId = null) {
        await new Promise(r => setTimeout(r, 120));
        let requests = getStorageItem(STORAGE_KEY_SITE_REQUESTS, SEED_SITE_REQUESTS);
        if (userId) {
            requests = requests.filter(r => r.engineerId === userId || r.clientId === userId);
        }
        return requests;
    },

    async createSiteRequest(requestInput, currentUser, targetEngineer) {
        await new Promise(r => setTimeout(r, 200));
        const requests = getStorageItem(STORAGE_KEY_SITE_REQUESTS, SEED_SITE_REQUESTS);

        const newRequest = {
            id: `req-${Date.now()}`,
            engineerId: targetEngineer.id,
            engineerName: targetEngineer.name,
            engineerRole: targetEngineer.role || 'site_engineer',
            engineerAvatar: targetEngineer.avatar,
            clientId: currentUser?.id || 'client-user',
            clientName: requestInput.name || currentUser?.name || 'Client',
            clientEmail: currentUser?.email || 'client@demo.com',
            name: requestInput.name,
            siteAddress: requestInput.siteAddress,
            amount: requestInput.amount,
            buildingType: requestInput.buildingType,
            requiredDetails: requestInput.requiredDetails || requestInput.siteDetails || requestInput.anotherDetails || '',
            // Backwards compatibility aliases
            siteDetails: requestInput.requiredDetails || requestInput.siteDetails || '',
            anotherDetails: requestInput.requiredDetails || requestInput.anotherDetails || '',
            status: 'pending',
            createdAt: 'Just now'
        };

        const updated = [newRequest, ...requests];
        setStorageItem(STORAGE_KEY_SITE_REQUESTS, updated);

        // Also generate a notification for the engineer
        const notifs = getStorageItem(STORAGE_KEY_NOTIFICATIONS, SEED_NOTIFICATIONS);
        const newNotif = {
            id: `notif-${Date.now()}`,
            type: 'connection_request',
            actor: {
                id: currentUser?.id || 'client-user',
                name: requestInput.name || currentUser?.name || 'Client',
                avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                headline: 'Client & Property Owner'
            },
            title: `sent you a Construction Request for a ${requestInput.buildingType}`,
            description: `Site: ${requestInput.siteAddress} • Budget: ${requestInput.amount} • Required Details: ${requestInput.requiredDetails || requestInput.siteDetails}`,
            targetId: newRequest.id,
            targetType: 'user',
            isRead: false,
            createdAt: 'Just now'
        };
        setStorageItem(STORAGE_KEY_NOTIFICATIONS, [newNotif, ...notifs]);

        // Also sync to backend SQLite database if available
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            fetch(`${API_BASE}/api/client-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newRequest.name,
                    site_address: newRequest.siteAddress,
                    amount: newRequest.amount,
                    building_type: newRequest.buildingType,
                    required_details: newRequest.requiredDetails,
                    client_id: currentUser?.id,
                    target_user_id: targetEngineer.id,
                    target_role: targetEngineer.role || 'contractor'
                })
            }).catch(() => {});
        } catch {
            // non-blocking fallback
        }

        return newRequest;
    },

    async updateSiteRequestStatus(requestId, status) {
        await new Promise(r => setTimeout(r, 120));
        const requests = getStorageItem(STORAGE_KEY_SITE_REQUESTS, SEED_SITE_REQUESTS);
        const index = requests.findIndex(r => r.id === requestId);
        if (index !== -1) {
            requests[index].status = status;
            setStorageItem(STORAGE_KEY_SITE_REQUESTS, requests);

            // Also sync to backend
            try {
                const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const numId = parseInt(String(requestId).replace('req-', ''), 10);
                if (!isNaN(numId)) {
                    fetch(`${API_BASE}/api/client-requests/${numId}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status })
                    }).catch(() => {});
                }
            } catch {
                // non-blocking
            }

            return requests[index];
        }
        return null;
    }
};

