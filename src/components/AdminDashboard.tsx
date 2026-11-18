import React, { useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Check,
  Database,
  DollarSign,
  FolderKanban,
  HelpCircle,
  Home,
  Image as ImageIcon,
  LogOut,
  Mail,
  MessageSquareQuote,
  Pencil,
  Plus,
  Radio,
  ShieldAlert,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import {
  Category,
  Creator,
  FaqItem,
  PricingPlan,
  StreamItem,
  StreamProviderType,
  StreamQuality,
  SubmissionStatus,
  Testimonial,
  UserRole,
} from '../types/streaming';
import { SmartImage } from './SmartImage';

type AdminTab =
  | 'overview'
  | 'streams'
  | 'creators'
  | 'users'
  | 'categories'
  | 'homepage'
  | 'pricing'
  | 'testimonials'
  | 'faqs'
  | 'contacts'
  | 'media';

interface AdminDashboardProps {
  onBackHome: () => void;
}

export function AdminDashboard({ onBackHome }: AdminDashboardProps) {
  const {
    user,
    authLoading,
    isAdmin,
    hasFirestoreSeed,
    siteSettings,
    categories,
    creators,
    streams,
    pricingPlans,
    testimonials,
    faqs,
    mediaAssets,
    contactSubmissions,
    allUsers,
    signInWithGoogle,
    signOut,
    seedFirestoreDefaults,
    saveSiteSettings,
    saveCategory,
    deleteCategory,
    saveCreator,
    deleteCreator,
    saveStream,
    deleteStream,
    savePricingPlan,
    deletePricingPlan,
    saveTestimonial,
    deleteTestimonial,
    saveFaq,
    deleteFaq,
    updateContactStatus,
    deleteContactSubmission,
    saveMediaAsset,
    deleteMediaAsset,
    updateUserRole,
  } = usePlatform();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Homepage form state
  const [heroForm, setHeroForm] = useState({
    heroHeadline: siteSettings.heroHeadline,
    heroSubheadline: siteSettings.heroSubheadline,
    primaryCtaLabel: siteSettings.primaryCtaLabel,
    secondaryCtaLabel: siteSettings.secondaryCtaLabel,
    heroMediaUrl: siteSettings.heroMediaUrl,
    activeViewersCount: siteSettings.activeViewersCount,
    liveChannelsCount: siteSettings.liveChannelsCount,
    totalBroadcastsCount: siteSettings.totalBroadcastsCount,
    streamingBannerNotice: siteSettings.streamingBannerNotice || '',
  });

  // Stream Editor State
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const [streamForm, setStreamForm] = useState<{
    title: string;
    description: string;
    creatorId: string;
    creatorName: string;
    creatorAvatarUrl: string;
    category: string;
    tags: string;
    thumbnailUrl: string;
    videoPreviewUrl: string;
    viewerCount: number;
    isLive: boolean;
    isDemo: boolean;
    quality: StreamQuality;
    providerType: StreamProviderType;
  }>({
    title: '',
    description: '',
    creatorId: creators[0]?.id || 'creator-elena',
    creatorName: creators[0]?.name || 'Elena Vance',
    creatorAvatarUrl: creators[0]?.avatarUrl || '',
    category: categories[0]?.name || 'Gaming',
    tags: 'Live, HD',
    thumbnailUrl: mediaAssets[0]?.url || '',
    videoPreviewUrl: '',
    viewerCount: 120,
    isLive: true,
    isDemo: true,
    quality: '1080p60',
    providerType: 'demo',
  });

  // Creator Editor State
  const [editingCreatorId, setEditingCreatorId] = useState<string | null>(null);
  const [creatorForm, setCreatorForm] = useState({
    name: '',
    handle: '',
    bio: '',
    avatarUrl: mediaAssets[0]?.url || '',
    primaryCategory: categories[0]?.name || 'Gaming',
    followersCount: 1000,
    isFeatured: true,
    isVerified: true,
  });

  // Category Editor State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    slug: '',
    description: '',
    sortOrder: categories.length + 1,
  });

  // Pricing Editor State
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    tagline: '',
    priceLabel: '$19',
    billingCycle: 'per month (placeholder)',
    featuresText: 'HD 1080p60 streaming\nReal-time live chat\nChannel branding',
    isPopular: false,
    ctaLabel: 'Select Plan',
    sortOrder: pricingPlans.length + 1,
  });

  // Testimonial Editor State
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [testForm, setTestForm] = useState({
    authorName: '',
    authorRole: '',
    organization: '',
    avatarUrl: '',
    quote: '',
    isSample: true,
    sortOrder: testimonials.length + 1,
  });

  // FAQ Editor State
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    sortOrder: faqs.length + 1,
  });

  // Media Library State
  const [mediaForm, setMediaForm] = useState({
    title: '',
    mediaType: 'image' as 'image' | 'video',
    url: '',
    category: 'General',
  });

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#060913] text-slate-400 text-sm">
        Verifying administrator session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#060913] p-6">
        <div className="max-w-md w-full rounded-2xl bg-[#0C1120] border border-white/10 p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-violet-400 mx-auto mb-4" />
          <h1 className="text-xl font-display font-bold text-white mb-2">
            Admin Dashboard Sign-In
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            Authenticate with an authorized Google administrator account to manage GoToLive Stream content, users, and submissions.
          </p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-sm font-semibold transition-all cursor-pointer"
            >
              Sign in with Google
            </button>
            <button
              type="button"
              onClick={onBackHome}
              className="w-full py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Return to Public Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#060913] p-6">
        <div className="max-w-md w-full rounded-2xl bg-[#0C1120] border border-white/10 p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto mb-4" />
          <h1 className="text-xl font-display font-bold text-white mb-2">
            Administrator Access Required
          </h1>
          <p className="text-sm text-slate-400 mb-4">
            Signed in as <strong className="text-white">{user.email}</strong>. This account does not have administrator privileges.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onBackHome}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
            >
              Back to Streams
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              className="px-4 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview & Stats', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'streams', label: 'Live Streams', icon: <Radio className="w-4 h-4" /> },
    { id: 'creators', label: 'Creators', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'users', label: 'Users & Roles', icon: <Users className="w-4 h-4" /> },
    { id: 'categories', label: 'Categories', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'homepage', label: 'Homepage Content', icon: <Home className="w-4 h-4" /> },
    { id: 'pricing', label: 'Pricing Plans', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'testimonials', label: 'Testimonials', icon: <MessageSquareQuote className="w-4 h-4" /> },
    { id: 'faqs', label: 'FAQs', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'contacts', label: 'Contact Submissions', icon: <Mail className="w-4 h-4" /> },
    { id: 'media', label: 'Media Library', icon: <ImageIcon className="w-4 h-4" /> },
  ];

  const handleSeedClick = async () => {
    setBusy(true);
    try {
      await seedFirestoreDefaults();
      notify('Default platform data synced to Firestore.');
    } finally {
      setBusy(false);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('Direct upload supports image files. For videos, enter a hosted MP4/WebM URL.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 960;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.78);
        setMediaForm((prev) => ({
          ...prev,
          title: prev.title || file.name.replace(/\.[^.]+$/, ''),
          mediaType: 'image',
          url: compressed,
        }));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#060913] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 bg-[#080C17] border-b lg:border-b-0 lg:border-r border-white/10 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between px-2 mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Admin Console
            </span>
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Site
            </button>
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden lg:block pt-4 mt-6 border-t border-white/10 px-2">
          <p className="text-xs font-medium text-white truncate">{user.displayName}</p>
          <p className="text-[11px] text-slate-400 truncate mb-3">{user.email}</p>
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 sm:p-8 overflow-y-auto max-w-6xl">
        {/* Top Breadcrumb + Seed Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
          <div>
            <p className="text-xs text-slate-400">
              Admin Dashboard / <span className="text-slate-200">{navItems.find((n) => n.id === activeTab)?.label}</span>
            </p>
            <h1 className="text-2xl font-display font-bold text-white mt-1">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {!hasFirestoreSeed && (
              <button
                type="button"
                disabled={busy}
                onClick={handleSeedClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                {busy ? 'Syncing...' : 'Seed Default Content to Firestore'}
              </button>
            )}
          </div>
        </div>

        {statusMessage && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-[#0C1120] border border-white/10">
                <p className="text-xs text-slate-400">Active Viewers (Hero)</p>
                <p className="text-2xl font-display font-bold text-white font-mono-tabular mt-1">
                  {siteSettings.activeViewersCount.toLocaleString()}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#0C1120] border border-white/10">
                <p className="text-xs text-slate-400">Live Stream Listings</p>
                <p className="text-2xl font-display font-bold text-white font-mono-tabular mt-1">
                  {streams.filter((s) => s.isLive).length} / {streams.length}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#0C1120] border border-white/10">
                <p className="text-xs text-slate-400">Creators & Categories</p>
                <p className="text-2xl font-display font-bold text-white font-mono-tabular mt-1">
                  {creators.length} · {categories.length}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#0C1120] border border-white/10">
                <p className="text-xs text-slate-400">Contact Inquiries</p>
                <p className="text-2xl font-display font-bold text-white font-mono-tabular mt-1">
                  {contactSubmissions.length}
                </p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#0C1120] border border-white/10">
              <h2 className="text-sm font-display font-semibold text-white mb-2">
                Firestore Persistence Status
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {hasFirestoreSeed
                  ? 'Live Firestore collections are active. Any edits made across streams, creators, categories, pricing, testimonials, FAQs, or homepage copy update visitors in real time.'
                  : 'Default demo data is currently displayed. Click "Seed Default Content to Firestore" above to persist all initial records into Firestore so every card can be customized and saved.'}
              </p>
              {!hasFirestoreSeed && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSeedClick}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Initialize Firestore Collections Now
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB: STREAMS */}
        {activeTab === 'streams' && (
          <div className="space-y-8">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await saveStream(
                    {
                      ...streamForm,
                      tags: streamForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
                    },
                    editingStreamId || undefined
                  );
                  notify(editingStreamId ? 'Stream updated.' : 'Stream added.');
                  setEditingStreamId(null);
                  setStreamForm((p) => ({ ...p, title: '', description: '' }));
                } finally {
                  setBusy(false);
                }
              }}
              className="p-6 rounded-xl bg-[#0C1120] border border-white/10 space-y-4"
            >
              <h2 className="text-sm font-display font-semibold text-white">
                {editingStreamId ? 'Edit Stream Listing' : 'Add Live Stream Listing'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  placeholder="Stream title"
                  value={streamForm.title}
                  onChange={(e) => setStreamForm({ ...streamForm, title: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
                <select
                  value={streamForm.category}
                  onChange={(e) => setStreamForm({ ...streamForm, category: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={streamForm.creatorId}
                  onChange={(e) => {
                    const c = creators.find((cr) => cr.id === e.target.value);
                    setStreamForm({
                      ...streamForm,
                      creatorId: e.target.value,
                      creatorName: c?.name || streamForm.creatorName,
                      creatorAvatarUrl: c?.avatarUrl || streamForm.creatorAvatarUrl,
                    });
                  }}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                >
                  {creators.map((c) => (
                    <option key={c.id} value={c.id}>
                      Creator: {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={streamForm.tags}
                  onChange={(e) => setStreamForm({ ...streamForm, tags: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="Thumbnail URL"
                  value={streamForm.thumbnailUrl}
                  onChange={(e) => setStreamForm({ ...streamForm, thumbnailUrl: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Viewer count"
                  value={streamForm.viewerCount}
                  onChange={(e) =>
                    setStreamForm({ ...streamForm, viewerCount: Number(e.target.value) })
                  }
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
                <select
                  value={streamForm.quality}
                  onChange={(e) =>
                    setStreamForm({ ...streamForm, quality: e.target.value as StreamQuality })
                  }
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                >
                  <option value="1080p60">1080p60</option>
                  <option value="720p60">720p60</option>
                  <option value="480p">480p</option>
                  <option value="Auto">Auto</option>
                </select>
                <div className="flex items-center gap-6 px-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={streamForm.isLive}
                      onChange={(e) => setStreamForm({ ...streamForm, isLive: e.target.checked })}
                    />
                    Live
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={streamForm.isDemo}
                      onChange={(e) => setStreamForm({ ...streamForm, isDemo: e.target.checked })}
                    />
                    Demo Mode Flag
                  </label>
                </div>
              </div>
              <textarea
                rows={2}
                placeholder="Stream description"
                value={streamForm.description}
                onChange={(e) => setStreamForm({ ...streamForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {editingStreamId ? 'Update Stream' : 'Add Stream'}
                </button>
                {editingStreamId && (
                  <button
                    type="button"
                    onClick={() => setEditingStreamId(null)}
                    className="px-3 py-2 rounded-lg bg-white/5 text-xs text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="rounded-xl bg-[#0C1120] border border-white/10 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Creator</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Viewers</th>
                    <th className="py-3 px-4">State</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {streams.map((s: StreamItem) => (
                    <tr key={s.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-medium text-white max-w-xs truncate">
                        {s.title}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{s.creatorName}</td>
                      <td className="py-3 px-4 text-slate-400">{s.category}</td>
                      <td className="py-3 px-4 text-right font-mono-tabular text-slate-200">
                        {s.viewerCount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {s.isLive ? 'LIVE' : 'Offline'} {s.isDemo ? '(Demo)' : ''}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStreamId(s.id);
                              setStreamForm({
                                title: s.title,
                                description: s.description || '',
                                creatorId: s.creatorId,
                                creatorName: s.creatorName,
                                creatorAvatarUrl: s.creatorAvatarUrl || '',
                                category: s.category,
                                tags: s.tags.join(', '),
                                thumbnailUrl: s.thumbnailUrl,
                                videoPreviewUrl: s.videoPreviewUrl || '',
                                viewerCount: s.viewerCount,
                                isLive: s.isLive,
                                isDemo: s.isDemo,
                                quality: s.quality,
                                providerType: s.providerType,
                              });
                            }}
                            aria-label={`Edit ${s.title}`}
                            className="p-1.5 rounded text-slate-400 hover:text-white cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteStream(s.id);
                              notify('Stream deleted.');
                            }}
                            aria-label={`Delete ${s.title}`}
                            className="p-1.5 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: CREATORS */}
        {activeTab === 'creators' && (
          <div className="space-y-8">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await saveCreator(creatorForm, editingCreatorId || undefined);
                  notify(editingCreatorId ? 'Creator updated.' : 'Creator added.');
                  setEditingCreatorId(null);
                  setCreatorForm((p) => ({ ...p, name: '', handle: '', bio: '' }));
                } finally {
                  setBusy(false);
                }
              }}
              className="p-6 rounded-xl bg-[#0C1120] border border-white/10 space-y-4"
            >
              <h2 className="text-sm font-display font-semibold text-white">
                {editingCreatorId ? 'Edit Creator Profile' : 'Add Creator Profile'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  placeholder="Creator name"
                  value={creatorForm.name}
                  onChange={(e) => setCreatorForm({ ...creatorForm, name: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
                <input
                  required
                  type="text"
                  placeholder="Handle (e.g. elenavance)"
                  value={creatorForm.handle}
                  onChange={(e) => setCreatorForm({ ...creatorForm, handle: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
                <select
                  value={creatorForm.primaryCategory}
                  onChange={(e) =>
                    setCreatorForm({ ...creatorForm, primaryCategory: e.target.value })
                  }
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  placeholder="Followers"
                  value={creatorForm.followersCount}
                  onChange={(e) =>
                    setCreatorForm({ ...creatorForm, followersCount: Number(e.target.value) })
                  }
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="Avatar URL"
                  value={creatorForm.avatarUrl}
                  onChange={(e) => setCreatorForm({ ...creatorForm, avatarUrl: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
                <div className="flex items-center gap-6 px-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={creatorForm.isFeatured}
                      onChange={(e) =>
                        setCreatorForm({ ...creatorForm, isFeatured: e.target.checked })
                      }
                    />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={creatorForm.isVerified}
                      onChange={(e) =>
                        setCreatorForm({ ...creatorForm, isVerified: e.target.checked })
                      }
                    />
                    Verified
                  </label>
                </div>
              </div>
              <textarea
                rows={2}
                placeholder="Creator biography"
                value={creatorForm.bio}
                onChange={(e) => setCreatorForm({ ...creatorForm, bio: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
              />
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
              >
                {editingCreatorId ? 'Update Creator' : 'Add Creator'}
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creators.map((c: Creator) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-[#0C1120] border border-white/10 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SmartImage
                      src={c.avatarUrl}
                      alt={c.name}
                      fallbackTitle={c.name}
                      className="w-11 h-11 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 font-mono-tabular">
                        @{c.handle} · {c.primaryCategory} · {c.followersCount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCreatorId(c.id);
                        setCreatorForm({
                          name: c.name,
                          handle: c.handle,
                          bio: c.bio,
                          avatarUrl: c.avatarUrl,
                          primaryCategory: c.primaryCategory,
                          followersCount: c.followersCount,
                          isFeatured: c.isFeatured,
                          isVerified: c.isVerified,
                        });
                      }}
                      className="p-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteCreator(c.id);
                        notify('Creator deleted.');
                      }}
                      className="p-2 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: USERS & ROLES */}
        {activeTab === 'users' && (
          <div className="rounded-xl bg-[#0C1120] border border-white/10 overflow-x-auto">
            {allUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Registered users appear here once users sign in with Google.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Display Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Selected Plan</th>
                    <th className="py-3 px-4">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {allUsers.map((u) => (
                    <tr key={u.uid}>
                      <td className="py-3 px-4 font-medium text-white">{u.displayName}</td>
                      <td className="py-3 px-4 text-slate-300">{u.email}</td>
                      <td className="py-3 px-4 text-slate-400">{u.selectedPlan || 'Free Plan'}</td>
                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          onChange={async (e) => {
                            await updateUserRole(u.uid, e.target.value as UserRole, u.email);
                            notify(`Updated role for ${u.displayName}.`);
                          }}
                          className="bg-[#060913] border border-white/15 rounded px-2.5 py-1 text-xs text-white"
                        >
                          <option value="viewer">viewer</option>
                          <option value="creator">creator</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await saveCategory(catForm, editingCatId || undefined);
                notify('Category saved.');
                setEditingCatId(null);
                setCatForm({ name: '', slug: '', description: '', sortOrder: categories.length + 1 });
              }}
              className="p-6 rounded-xl bg-[#0C1120] border border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-4"
            >
              <input
                required
                type="text"
                placeholder="Category name"
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
              />
              <input
                type="text"
                placeholder="Slug (e.g. gaming)"
                value={catForm.slug}
                onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
              />
              <input
                type="number"
                min={1}
                placeholder="Order"
                value={catForm.sortOrder}
                onChange={(e) => setCatForm({ ...catForm, sortOrder: Number(e.target.value) })}
                className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
              >
                {editingCatId ? 'Update Category' : 'Add Category'}
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat: Category) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-xl bg-[#0C1120] border border-white/10 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{cat.name}</p>
                    <p className="text-xs text-slate-400 font-mono-tabular">
                      /{cat.slug} · Order {cat.sortOrder}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCatId(cat.id);
                        setCatForm({
                          name: cat.name,
                          slug: cat.slug,
                          description: cat.description || '',
                          sortOrder: cat.sortOrder,
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteCategory(cat.id);
                        notify('Category deleted.');
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: HOMEPAGE CONTENT */}
        {activeTab === 'homepage' && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await saveSiteSettings(heroForm);
                notify('Homepage content updated in Firestore.');
              } finally {
                setBusy(false);
              }
            }}
            className="p-6 rounded-xl bg-[#0C1120] border border-white/10 space-y-5 max-w-3xl"
          >
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Hero Headline</label>
              <input
                required
                type="text"
                maxLength={140}
                value={heroForm.heroHeadline}
                onChange={(e) => setHeroForm({ ...heroForm, heroHeadline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Hero Supporting Copy
              </label>
              <textarea
                rows={3}
                required
                maxLength={500}
                value={heroForm.heroSubheadline}
                onChange={(e) => setHeroForm({ ...heroForm, heroSubheadline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Primary CTA Label
                </label>
                <input
                  required
                  type="text"
                  maxLength={40}
                  value={heroForm.primaryCtaLabel}
                  onChange={(e) => setHeroForm({ ...heroForm, primaryCtaLabel: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Secondary CTA Label
                </label>
                <input
                  required
                  type="text"
                  maxLength={40}
                  value={heroForm.secondaryCtaLabel}
                  onChange={(e) => setHeroForm({ ...heroForm, secondaryCtaLabel: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Active Viewers Stat
                </label>
                <input
                  type="number"
                  min={0}
                  value={heroForm.activeViewersCount}
                  onChange={(e) =>
                    setHeroForm({ ...heroForm, activeViewersCount: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Live Channels Stat
                </label>
                <input
                  type="number"
                  min={0}
                  value={heroForm.liveChannelsCount}
                  onChange={(e) =>
                    setHeroForm({ ...heroForm, liveChannelsCount: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Total Broadcasts Stat
                </label>
                <input
                  type="number"
                  min={0}
                  value={heroForm.totalBroadcastsCount}
                  onChange={(e) =>
                    setHeroForm({ ...heroForm, totalBroadcastsCount: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Demo / Streaming Infrastructure Banner Notice
              </label>
              <input
                type="text"
                maxLength={300}
                value={heroForm.streamingBannerNotice}
                onChange={(e) =>
                  setHeroForm({ ...heroForm, streamingBannerNotice: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
            >
              Save Homepage Content
            </button>
          </form>
        )}

        {/* TAB: PRICING PLANS */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await savePricingPlan(
                  {
                    name: planForm.name,
                    tagline: planForm.tagline,
                    priceLabel: planForm.priceLabel,
                    billingCycle: planForm.billingCycle,
                    features: planForm.featuresText.split('\n').map((f) => f.trim()).filter(Boolean),
                    isPopular: planForm.isPopular,
                    ctaLabel: planForm.ctaLabel,
                    sortOrder: planForm.sortOrder,
                  },
                  editingPlanId || undefined
                );
                notify('Pricing plan saved.');
                setEditingPlanId(null);
              }}
              className="p-6 rounded-xl bg-[#0C1120] border border-white/10 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  required
                  type="text"
                  placeholder="Plan name"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
                <input
                  required
                  type="text"
                  placeholder="Price (e.g. $29)"
                  value={planForm.priceLabel}
                  onChange={(e) => setPlanForm({ ...planForm, priceLabel: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="Billing cycle"
                  value={planForm.billingCycle}
                  onChange={(e) => setPlanForm({ ...planForm, billingCycle: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Tagline"
                value={planForm.tagline}
                onChange={(e) => setPlanForm({ ...planForm, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
              />
              <textarea
                rows={3}
                placeholder="Features (one per line)"
                value={planForm.featuresText}
                onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.isPopular}
                    onChange={(e) => setPlanForm({ ...planForm, isPopular: e.target.checked })}
                  />
                  Mark as Recommended
                </label>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                >
                  {editingPlanId ? 'Update Plan' : 'Add Plan'}
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricingPlans.map((p: PricingPlan) => (
                <div key={p.id} className="p-5 rounded-xl bg-[#0C1120] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-white">{p.name}</p>
                    <span className="font-mono-tabular text-sm text-violet-300">{p.priceLabel}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">{p.tagline}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlanId(p.id);
                        setPlanForm({
                          name: p.name,
                          tagline: p.tagline,
                          priceLabel: p.priceLabel,
                          billingCycle: p.billingCycle,
                          featuresText: p.features.join('\n'),
                          isPopular: p.isPopular,
                          ctaLabel: p.ctaLabel,
                          sortOrder: p.sortOrder,
                        });
                      }}
                      className="text-xs text-slate-300 hover:text-white cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deletePricingPlan(p.id);
                        notify('Pricing plan removed.');
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: TESTIMONIALS */}
        {activeTab === 'testimonials' && (
          <div className="space-y-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await saveTestimonial(testForm, editingTestId || undefined);
                notify('Testimonial saved.');
                setEditingTestId(null);
                setTestForm({
                  authorName: '',
                  authorRole: '',
                  organization: '',
                  avatarUrl: '',
                  quote: '',
                  isSample: true,
                  sortOrder: testimonials.length + 1,
                });
              }}
              className="p-6 rounded-xl bg-[#0C1120] border border-white/10 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  required
                  type="text"
                  placeholder="Author name"
                  value={testForm.authorName}
                  onChange={(e) => setTestForm({ ...testForm, authorName: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
                <input
                  required
                  type="text"
                  placeholder="Role"
                  value={testForm.authorRole}
                  onChange={(e) => setTestForm({ ...testForm, authorRole: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
                <input
                  required
                  type="text"
                  placeholder="Organization"
                  value={testForm.organization}
                  onChange={(e) => setTestForm({ ...testForm, organization: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
              </div>
              <textarea
                required
                rows={2}
                placeholder="Testimonial quote (min 10 chars)"
                value={testForm.quote}
                onChange={(e) => setTestForm({ ...testForm, quote: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testForm.isSample}
                    onChange={(e) => setTestForm({ ...testForm, isSample: e.target.checked })}
                  />
                  Mark as Sample Testimonial
                </label>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                >
                  {editingTestId ? 'Update Testimonial' : 'Add Testimonial'}
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {testimonials.map((t: Testimonial) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-[#0C1120] border border-white/10 flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {t.authorName} · <span className="text-slate-400 font-normal">{t.authorRole}</span>
                    </p>
                    <p className="text-xs text-slate-300 mt-1">{t.quote}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTestId(t.id);
                        setTestForm({
                          authorName: t.authorName,
                          authorRole: t.authorRole,
                          organization: t.organization,
                          avatarUrl: t.avatarUrl,
                          quote: t.quote,
                          isSample: t.isSample,
                          sortOrder: t.sortOrder,
                        });
                      }}
                      className="text-xs text-slate-300 hover:text-white cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteTestimonial(t.id);
                        notify('Testimonial deleted.');
                      }}
                      className="text-xs text-rose-400 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: FAQS */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await saveFaq(faqForm, editingFaqId || undefined);
                notify('FAQ saved.');
                setEditingFaqId(null);
                setFaqForm({ question: '', answer: '', sortOrder: faqs.length + 1 });
              }}
              className="p-6 rounded-xl bg-[#0C1120] border border-white/10 space-y-4"
            >
              <input
                required
                type="text"
                placeholder="Question"
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
              />
              <textarea
                required
                rows={3}
                placeholder="Answer"
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
              >
                {editingFaqId ? 'Update FAQ' : 'Add FAQ'}
              </button>
            </form>

            <div className="space-y-3">
              {faqs.map((f: FaqItem) => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl bg-[#0C1120] border border-white/10 flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{f.question}</p>
                    <p className="text-xs text-slate-400 mt-1">{f.answer}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFaqId(f.id);
                        setFaqForm({
                          question: f.question,
                          answer: f.answer,
                          sortOrder: f.sortOrder,
                        });
                      }}
                      className="text-xs text-slate-300 hover:text-white cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteFaq(f.id);
                        notify('FAQ deleted.');
                      }}
                      className="text-xs text-rose-400 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: CONTACT SUBMISSIONS */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            {contactSubmissions.length === 0 ? (
              <div className="p-10 rounded-xl bg-[#0C1120] border border-white/10 text-center text-xs text-slate-400">
                No contact inquiries submitted yet. Inquiries from the Contact section appear here automatically.
              </div>
            ) : (
              contactSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 rounded-xl bg-[#0C1120] border border-white/10 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-white">{sub.subject}</p>
                    <p className="text-xs text-slate-400">
                      {sub.fullName} · {sub.email} {sub.phone ? `· ${sub.phone}` : ''}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">{sub.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={sub.status}
                      onChange={async (e) => {
                        await updateContactStatus(sub.id, e.target.value as SubmissionStatus);
                        notify('Submission status updated.');
                      }}
                      className="bg-[#060913] border border-white/15 rounded px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="new">new</option>
                      <option value="reviewed">reviewed</option>
                      <option value="resolved">resolved</option>
                    </select>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteContactSubmission(sub.id);
                        notify('Submission deleted.');
                      }}
                      className="p-2 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: MEDIA LIBRARY */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!mediaForm.url.trim()) return;
                await saveMediaAsset(mediaForm);
                notify('Media asset saved to Firestore.');
                setMediaForm({ title: '', mediaType: 'image', url: '', category: 'General' });
              }}
              className="p-6 rounded-xl bg-[#0C1120] border border-white/10 space-y-4"
            >
              <h2 className="text-sm font-display font-semibold text-white">
                Upload Image or Register Video URL
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  required
                  type="text"
                  placeholder="Asset title"
                  value={mediaForm.title}
                  onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
                <select
                  value={mediaForm.mediaType}
                  onChange={(e) =>
                    setMediaForm({ ...mediaForm, mediaType: e.target.value as 'image' | 'video' })
                  }
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
                <input
                  type="text"
                  placeholder="Category"
                  value={mediaForm.category}
                  onChange={(e) => setMediaForm({ ...mediaForm, category: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  required
                  type="text"
                  placeholder="Paste image/video URL or upload image file ->"
                  value={mediaForm.url}
                  onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white"
                />
                <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#131B31] border border-white/15 text-xs font-medium text-slate-200 hover:border-violet-400 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Upload Image File
                  <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                </label>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Asset
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="rounded-xl bg-[#0C1120] border border-white/10 overflow-hidden flex flex-col justify-between"
                >
                  <div className="aspect-video bg-black">
                    {asset.mediaType === 'video' ? (
                      <video src={asset.url} controls className="w-full h-full object-cover" />
                    ) : (
                      <SmartImage
                        src={asset.url}
                        alt={asset.title}
                        fallbackTitle={asset.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-3.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{asset.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {asset.mediaType} · {asset.category}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteMediaAsset(asset.id);
                        notify('Media asset deleted.');
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
