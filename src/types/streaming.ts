export type AppView = 'home' | 'studio' | 'admin';

export type StreamQuality = '1080p60' | '720p60' | '480p' | 'Auto';
export type StreamProviderType = 'demo' | 'livekit' | 'agora' | 'webrtc';
export type UserRole = 'viewer' | 'creator' | 'admin';
export type SubmissionStatus = 'new' | 'reviewed' | 'resolved';

export interface SiteSettings {
  id: string;
  heroHeadline: string;
  heroSubheadline: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  heroMediaUrl: string;
  activeViewersCount: number;
  liveChannelsCount: number;
  totalBroadcastsCount: number;
  streamingBannerNotice?: string;
  updatedAt?: unknown;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  primaryCategory: string;
  followersCount: number;
  isFeatured: boolean;
  isVerified: boolean;
  ownerUid?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StreamItem {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  creatorName: string;
  creatorAvatarUrl?: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
  videoPreviewUrl?: string;
  viewerCount: number;
  isLive: boolean;
  isDemo: boolean;
  quality: StreamQuality;
  providerType: StreamProviderType;
  ownerUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id: string;
  streamId: string;
  authorUid: string;
  authorName: string;
  text: string;
  createdAt?: unknown;
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  priceLabel: string;
  billingCycle: string;
  features: string[];
  isPopular: boolean;
  ctaLabel: string;
  sortOrder: number;
  updatedAt?: unknown;
}

export interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string;
  organization: string;
  avatarUrl: string;
  quote: string;
  isSample: boolean;
  sortOrder: number;
  updatedAt?: unknown;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  updatedAt?: unknown;
}

export interface ContactSubmission {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: SubmissionStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MediaAsset {
  id: string;
  title: string;
  mediaType: 'image' | 'video';
  url: string;
  category: string;
  uploadedByUid: string;
  createdAt?: unknown;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoUrl?: string;
  role: UserRole;
  selectedPlan?: string;
  notificationsEnabled: boolean;
  followedCreatorIds: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AdminRecord {
  uid: string;
  email: string;
  grantedBy: string;
  createdAt?: unknown;
}
